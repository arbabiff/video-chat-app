const Report = require('../models/Report');
const Rule = require('../models/Rule');
const User = require('../models/User');
const notificationService = require('../services/notificationService');
const logger = require('../utils/logger');
const snapshotService = require('../services/snapshotService');

// @desc    Submit a new report
// @route   POST /api/reports
// @access  Private
const submitReport = async (req, res, next) => {
  try {
    const { reportedUserId, violationType, description, evidence } = req.body;
    const reporterId = req.user.id;

    // Validate reported user exists
    const reportedUser = await User.findById(reportedUserId);
    if (!reportedUser) {
      return res.status(404).json({
        success: false,
        error: {
          message: 'کاربر گزارش شده یافت نشد',
          englishMessage: 'Reported user not found'
        }
      });
    }

    // Prevent self-reporting
    if (reporterId === reportedUserId) {
      return res.status(400).json({
        success: false,
        error: {
          message: 'نمی‌توانید خودتان را گزارش کنید',
          englishMessage: 'Cannot report yourself'
        }
      });
    }

    // Check if user has already reported this user for same violation recently
    const existingReport = await Report.findOne({
      reporterId,
      reportedUserId,
      violationType,
      createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } // Within last 24 hours
    });

    if (existingReport) {
      return res.status(400).json({
        success: false,
        error: {
          message: 'شما قبلاً این کاربر را برای همین تخلف گزارش کرده‌اید',
          englishMessage: 'You have already reported this user for the same violation recently'
        }
      });
    }

    // Create new report
    const report = new Report({
      reporterId,
      reportedUserId,
      violationType,
      description,
      evidence: evidence || []
    });

    await report.save();

    // Auto-process the report
    await processReport(report._id);

    // Notify admins
    const reporterInfo = `گزارش‌دهنده: ${req.user.username}`;
    await notificationService.notifyAdminsAboutReport(report, reporterInfo);

    res.status(201).json({
      success: true,
      message: {
        message: 'گزارش شما با موفقیت ثبت شد و در حال بررسی است',
        englishMessage: 'Your report has been submitted successfully and is under review'
      },
      report: {
        id: report._id,
        violationType: report.violationTypePersian,
        status: report.statusPersian,
        createdAt: report.createdAt
      }
    });

  } catch (error) {
    logger.error('Submit report error:', error);
    next(error);
  }
};

// @desc    Upload a snapshot image for a report
// @route   POST /api/reports/snapshots
// @access  Private
const uploadSnapshot = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: {
          message: 'فایلی ارسال نشده است',
          englishMessage: 'No file uploaded'
        }
      });
    }

    // Save snapshot via service
    const result = await snapshotService.saveSnapshot(req.file, req.user?._id?.toString());

    // Build absolute URL for client convenience
    const baseUrl = `${req.protocol}://${req.get('host')}`;
    const absoluteUrl = result.relativeUrl.startsWith('http')
      ? result.relativeUrl
      : `${baseUrl}${result.relativeUrl}`;

    return res.status(201).json({
      success: true,
      message: {
        message: 'تصویر با موفقیت بارگذاری شد',
        englishMessage: 'Snapshot uploaded successfully'
      },
      snapshot: {
        url: absoluteUrl,
        expiresAt: result.expiresAt
      }
    });
  } catch (error) {
    logger.error('Upload snapshot error:', error);
    next(error);
  }
};

// @desc    Process a report automatically
// @route   Internal function
// @access  Private
const processReport = async (reportId) => {
  try {
    const report = await Report.findById(reportId).populate('reportedUserId');
    if (!report) {
      logger.error('Report not found for processing:', reportId);
      return false;
    }

    // Find applicable rule
    const rule = await Rule.findOne({
      violationType: report.violationType,
      isActive: true
    });

    if (!rule) {
      logger.warn('No active rule found for violation type:', report.violationType);
      return false;
    }

    // Check if user should receive warning first
    const shouldWarn = await Report.shouldReceiveWarning(report.reportedUserId, report.violationType);
    
    if (rule.sendWarningBeforeAction && shouldWarn) {
      // Send warning instead of immediate punishment
      await sendWarning(report, rule);
    } else {
      // Apply punishment directly
      await applyPunishment(report, rule);
    }

    return true;
  } catch (error) {
    logger.error('Error processing report:', error);
    return false;
  }
};

// @desc    Send warning to user
// @route   Internal function
// @access  Private
const sendWarning = async (report, rule) => {
  try {
    // Create warning record
    const warningExpiry = new Date();
    warningExpiry.setHours(warningExpiry.getHours() + rule.warningExpiryHours);

    report.isWarning = true;
    report.status = 'warning_sent';
    report.actionTaken = 'warning';
    report.warningExpiry = warningExpiry;
    report.isAutoProcessed = true;
    report.autoProcessedAt = new Date();

    await report.save();

    // Send warning notification
    await notificationService.sendWarningNotification(
      report.reportedUserId,
      rule,
      report
    );

    report.notificationSent = true;
    report.notificationSentAt = new Date();
    await report.save();

    logger.info('Warning sent for report:', {
      reportId: report._id,
      userId: report.reportedUserId,
      violationType: report.violationType,
      expiresAt: warningExpiry
    });

    return true;
  } catch (error) {
    logger.error('Error sending warning:', error);
    return false;
  }
};

// @desc    Apply punishment to user
// @route   Internal function
// @access  Private
const applyPunishment = async (report, rule) => {
  try {
    // Count similar violations
    const violationCount = await Report.countSimilarViolations(
      report.reportedUserId,
      report.violationType
    );

    // Determine punishment type
    let actionType = 'temporary_ban';
    let duration = rule.punishmentDuration;
    let expiresAt = null;

    if (rule.punishmentType === 'permanent' || 
        violationCount >= rule.maxViolationsForPermanentBan) {
      actionType = 'permanent_ban';
      duration = 0;
      expiresAt = null;
    } else {
      expiresAt = new Date(Date.now() + duration * 60 * 60 * 1000);
    }

    // Update report
    report.status = 'resolved';
    report.actionTaken = actionType;
    report.actionDuration = duration;
    report.actionExpiresAt = expiresAt;
    report.isAutoProcessed = true;
    report.autoProcessedAt = new Date();

    await report.save();

    // Send punishment notification
    await notificationService.sendPunishmentNotification(
      report.reportedUserId,
      rule,
      report,
      actionType,
      expiresAt
    );

    report.notificationSent = true;
    report.notificationSentAt = new Date();
    await report.save();

    // Update user's violation count
    await User.findByIdAndUpdate(report.reportedUserId, {
      $inc: { 'stats.reportCount': 1 }
    });

    logger.info('Punishment applied for report:', {
      reportId: report._id,
      userId: report.reportedUserId,
      violationType: report.violationType,
      actionType,
      duration,
      expiresAt
    });

    return true;
  } catch (error) {
    logger.error('Error applying punishment:', error);
    return false;
  }
};

// @desc    Get all reports with filtering
// @route   GET /api/admin/reports
// @access  Private (Admin)
const getReports = async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 20,
      status,
      violationType,
      actionTaken,
      isWarning,
      reportedUserId,
      reporterId,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    // Build query
    const query = {};
    
    if (status) query.status = status;
    if (violationType) query.violationType = violationType;
    if (actionTaken) query.actionTaken = actionTaken;
    if (isWarning !== undefined) query.isWarning = isWarning === 'true';
    if (reportedUserId) query.reportedUserId = reportedUserId;
    if (reporterId) query.reporterId = reporterId;

    // Pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const limitNum = parseInt(limit) > 100 ? 100 : parseInt(limit);

    // Sort
    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    const [reports, totalCount] = await Promise.all([
      Report.find(query)
        .populate('reporterId', 'username displayName')
        .populate('reportedUserId', 'username displayName')
        .populate('handledBy', 'username')
        .skip(skip)
        .limit(limitNum)
        .sort(sort),
      Report.countDocuments(query)
    ]);

    res.status(200).json({
      success: true,
      reports: reports.map(report => ({
        id: report._id,
        reporter: {
          id: report.reporterId?._id,
          username: report.reporterId?.username,
          displayName: report.reporterId?.displayName
        },
        reportedUser: {
          id: report.reportedUserId?._id,
          username: report.reportedUserId?.username,
          displayName: report.reportedUserId?.displayName
        },
        violationType: report.violationTypePersian,
        description: report.description,
        status: report.statusPersian,
        isWarning: report.isWarning,
        actionTaken: report.actionTakenPersian,
        actionDuration: report.actionDuration,
        actionExpiresAt: report.actionExpiresAt,
        warningExpiry: report.warningExpiry,
        evidence: report.evidence,
        handledBy: report.handledBy?.username,
        handledAt: report.handledAt,
        adminNotes: report.adminNotes,
        isAutoProcessed: report.isAutoProcessed,
        notificationSent: report.notificationSent,
        createdAt: report.createdAt,
        updatedAt: report.updatedAt
      })),
      pagination: {
        page: parseInt(page),
        limit: limitNum,
        totalPages: Math.ceil(totalCount / limitNum),
        totalCount,
        hasNext: skip + reports.length < totalCount,
        hasPrev: page > 1
      }
    });

  } catch (error) {
    logger.error('Get reports error:', error);
    next(error);
  }
};

// @desc    Get report details by ID
// @route   GET /api/admin/reports/:id
// @access  Private (Admin)
const getReportById = async (req, res, next) => {
  try {
    const report = await Report.findById(req.params.id)
      .populate('reporterId', 'username displayName email')
      .populate('reportedUserId', 'username displayName email stats')
      .populate('handledBy', 'username displayName')
      .populate('warningId');

    if (!report) {
      return res.status(404).json({
        success: false,
        error: {
          message: 'گزارش یافت نشد',
          englishMessage: 'Report not found'
        }
      });
    }

    // Get user's violation history
    const violationHistory = await Report.getUserViolationHistory(report.reportedUserId);

    res.status(200).json({
      success: true,
      report: {
        id: report._id,
        reporter: report.reporterId,
        reportedUser: report.reportedUserId,
        violationType: report.violationTypePersian,
        violationTypeKey: report.violationType,
        description: report.description,
        status: report.statusPersian,
        statusKey: report.status,
        isWarning: report.isWarning,
        warningId: report.warningId,
        hasBeenWarned: report.hasBeenWarned,
        warningExpiry: report.warningExpiry,
        actionTaken: report.actionTakenPersian,
        actionTakenKey: report.actionTaken,
        actionDuration: report.actionDuration,
        actionExpiresAt: report.actionExpiresAt,
        isActionExpired: report.isActionExpired,
        evidence: report.evidence,
        handledBy: report.handledBy,
        handledAt: report.handledAt,
        adminNotes: report.adminNotes,
        isAutoProcessed: report.isAutoProcessed,
        autoProcessedAt: report.autoProcessedAt,
        notificationSent: report.notificationSent,
        notificationSentAt: report.notificationSentAt,
        createdAt: report.createdAt,
        updatedAt: report.updatedAt
      },
      violationHistory: violationHistory.slice(0, 10) // Last 10 violations
    });

  } catch (error) {
    logger.error('Get report by ID error:', error);
    next(error);
  }
};

// @desc    Update report status manually
// @route   PUT /api/admin/reports/:id
// @access  Private (Admin)
const updateReport = async (req, res, next) => {
  try {
    const { status, adminNotes, actionTaken } = req.body;
    const reportId = req.params.id;

    const report = await Report.findById(reportId);
    if (!report) {
      return res.status(404).json({
        success: false,
        error: {
          message: 'گزارش یافت نشد',
          englishMessage: 'Report not found'
        }
      });
    }

    // Update fields
    if (status) report.status = status;
    if (adminNotes) report.adminNotes = adminNotes;
    if (actionTaken) report.actionTaken = actionTaken;

    report.handledBy = req.user.id;
    report.handledAt = new Date();

    await report.save();

    logger.info('Report updated manually:', {
      reportId,
      adminId: req.user.id,
      adminUsername: req.user.username,
      changes: { status, adminNotes, actionTaken }
    });

    res.status(200).json({
      success: true,
      message: {
        message: 'گزارش به‌روزرسانی شد',
        englishMessage: 'Report updated successfully'
      },
      report: {
        id: report._id,
        status: report.statusPersian,
        actionTaken: report.actionTakenPersian,
        adminNotes: report.adminNotes,
        handledBy: req.user.username,
        handledAt: report.handledAt
      }
    });

  } catch (error) {
    logger.error('Update report error:', error);
    next(error);
  }
};

// @desc    Escalate warning to punishment
// @route   POST /api/admin/reports/:id/escalate
// @access  Private (Admin)
const escalateWarning = async (req, res, next) => {
  try {
    const reportId = req.params.id;

    const report = await Report.findById(reportId);
    if (!report) {
      return res.status(404).json({
        success: false,
        error: {
          message: 'گزارش یافت نشد',
          englishMessage: 'Report not found'
        }
      });
    }

    if (!report.isWarning) {
      return res.status(400).json({
        success: false,
        error: {
          message: 'این گزارش یک تذکر نیست',
          englishMessage: 'This report is not a warning'
        }
      });
    }

    // Find applicable rule
    const rule = await Rule.findOne({
      violationType: report.violationType,
      isActive: true
    });

    if (!rule) {
      return res.status(404).json({
        success: false,
        error: {
          message: 'قانون مربوطه یافت نشد',
          englishMessage: 'Related rule not found'
        }
      });
    }

    // Escalate to punishment
    const punishment = await report.escalateToPunishment(rule);

    // Send punishment notification
    const actionType = punishment.actionTaken;
    const expiresAt = punishment.actionExpiresAt;

    await notificationService.sendPunishmentNotification(
      punishment.reportedUserId,
      rule,
      punishment,
      actionType,
      expiresAt
    );

    logger.info('Warning escalated to punishment:', {
      warningId: reportId,
      punishmentId: punishment._id,
      userId: punishment.reportedUserId,
      actionType,
      adminId: req.user.id
    });

    res.status(200).json({
      success: true,
      message: {
        message: 'تذکر به مجازات تبدیل شد',
        englishMessage: 'Warning escalated to punishment successfully'
      },
      punishment: {
        id: punishment._id,
        actionTaken: punishment.actionTakenPersian,
        actionDuration: punishment.actionDuration,
        actionExpiresAt: punishment.actionExpiresAt
      }
    });

  } catch (error) {
    logger.error('Escalate warning error:', error);
    next(error);
  }
};

// @desc    Get reporting statistics
// @route   GET /api/admin/reports/stats
// @access  Private (Admin)
const getReportingStats = async (req, res, next) => {
  try {
    const { timeframe = 30 } = req.query;
    const since = new Date();
    since.setDate(since.getDate() - parseInt(timeframe));

    const [
      totalReports,
      pendingReports,
      resolvedReports,
      warningsSent,
      punishmentsApplied,
      topViolationTypes,
      recentActivity
    ] = await Promise.all([
      Report.countDocuments({ createdAt: { $gte: since } }),
      Report.countDocuments({ status: 'pending', createdAt: { $gte: since } }),
      Report.countDocuments({ status: 'resolved', createdAt: { $gte: since } }),
      Report.countDocuments({ isWarning: true, createdAt: { $gte: since } }),
      Report.countDocuments({ 
        actionTaken: { $in: ['temporary_ban', 'permanent_ban'] },
        createdAt: { $gte: since }
      }),
      Report.aggregate([
        { $match: { createdAt: { $gte: since } } },
        { $group: { _id: '$violationType', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 5 }
      ]),
      Report.find({ createdAt: { $gte: since } })
        .populate('reportedUserId', 'username')
        .sort({ createdAt: -1 })
        .limit(10)
        .select('violationType actionTaken createdAt reportedUserId')
    ]);

    res.status(200).json({
      success: true,
      stats: {
        overview: {
          totalReports,
          pendingReports,
          resolvedReports,
          warningsSent,
          punishmentsApplied,
          autoResolutionRate: totalReports > 0 ? 
            Math.round(((resolvedReports + warningsSent) / totalReports) * 100) : 0
        },
        topViolationTypes: topViolationTypes.map(item => ({
          type: item._id,
          typePersian: notificationService.getViolationTypeInPersian(item._id),
          count: item.count
        })),
        recentActivity: recentActivity.map(report => ({
          id: report._id,
          violationType: notificationService.getViolationTypeInPersian(report.violationType),
          actionTaken: notificationService.getActionTypeInPersian(report.actionTaken),
          reportedUser: report.reportedUserId?.username || 'نامشخص',
          createdAt: report.createdAt
        }))
      }
    });

  } catch (error) {
    logger.error('Get reporting stats error:', error);
    next(error);
  }
};

// @desc    Clean up expired actions (should be run as scheduled job)
// @route   POST /api/admin/reports/cleanup
// @access  Private (Admin)
const cleanupExpiredActions = async (req, res, next) => {
  try {
    const result = await notificationService.cleanupExpiredActions();

    res.status(200).json({
      success: true,
      message: {
        message: 'پاکسازی انجام شد',
        englishMessage: 'Cleanup completed successfully'
      },
      result
    });

  } catch (error) {
    logger.error('Cleanup expired actions error:', error);
    next(error);
  }
};

module.exports = {
  submitReport,
  getReports,
  getReportById,
  updateReport,
  escalateWarning,
  getReportingStats,
  cleanupExpiredActions,
  processReport, // For internal use
  uploadSnapshot
};
