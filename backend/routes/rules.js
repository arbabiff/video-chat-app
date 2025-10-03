const express = require('express');
const Rule = require('../models/Rule');
const { protect, authorize } = require('../middleware/auth');
const logger = require('../utils/logger');
const router = express.Router();

// Health check endpoint
router.get('/_health', (req, res) => {
  res.json({ success: true, service: 'rules', status: 'ok' });
});

// Apply authentication and admin authorization to all routes
router.use(protect);
router.use(authorize('admin', 'moderator'));

// @desc    Get all rules
// @route   GET /api/rules
// @access  Private (Admin)
const getRules = async (req, res, next) => {
  try {
    const { isActive, violationType } = req.query;
    
    const query = {};
    if (isActive !== undefined) query.isActive = isActive === 'true';
    if (violationType) query.violationType = violationType;

    const rules = await Rule.find(query)
      .populate('createdBy', 'username displayName')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      rules: rules.map(rule => ({
        id: rule._id,
        title: rule.title,
        description: rule.description,
        violationType: rule.violationType,
        punishmentType: rule.punishmentType,
        punishmentDuration: rule.punishmentDuration,
        punishmentDurationPersian: rule.punishmentDurationPersian,
        maxViolationsForPermanentBan: rule.maxViolationsForPermanentBan,
        isActive: rule.isActive,
        notificationMessage: rule.notificationMessage,
        autoSendNotification: rule.autoSendNotification,
        // Warning system fields
        sendWarningBeforeAction: rule.sendWarningBeforeAction,
        warningMessage: rule.warningMessage,
        warningExpiryHours: rule.warningExpiryHours,
        escalationThreshold: rule.escalationThreshold,
        createdBy: rule.createdBy,
        createdAt: rule.createdAt,
        updatedAt: rule.updatedAt
      }))
    });
  } catch (error) {
    logger.error('Get rules error:', error);
    next(error);
  }
};

// @desc    Get rule by ID
// @route   GET /api/rules/:id
// @access  Private (Admin)
const getRuleById = async (req, res, next) => {
  try {
    const rule = await Rule.findById(req.params.id)
      .populate('createdBy', 'username displayName email');

    if (!rule) {
      return res.status(404).json({
        success: false,
        error: {
          message: 'قانون یافت نشد',
          englishMessage: 'Rule not found'
        }
      });
    }

    res.status(200).json({
      success: true,
      rule: {
        id: rule._id,
        title: rule.title,
        description: rule.description,
        violationType: rule.violationType,
        punishmentType: rule.punishmentType,
        punishmentDuration: rule.punishmentDuration,
        punishmentDurationPersian: rule.punishmentDurationPersian,
        maxViolationsForPermanentBan: rule.maxViolationsForPermanentBan,
        isActive: rule.isActive,
        notificationMessage: rule.notificationMessage,
        autoSendNotification: rule.autoSendNotification,
        // Warning system fields
        sendWarningBeforeAction: rule.sendWarningBeforeAction,
        warningMessage: rule.warningMessage,
        warningExpiryHours: rule.warningExpiryHours,
        escalationThreshold: rule.escalationThreshold,
        createdBy: rule.createdBy,
        createdAt: rule.createdAt,
        updatedAt: rule.updatedAt
      }
    });
  } catch (error) {
    logger.error('Get rule by ID error:', error);
    next(error);
  }
};

// @desc    Create new rule
// @route   POST /api/rules
// @access  Private (Admin)
const createRule = async (req, res, next) => {
  try {
    const {
      title,
      description,
      violationType,
      punishmentType,
      punishmentDuration,
      maxViolationsForPermanentBan,
      isActive,
      notificationMessage,
      autoSendNotification,
      sendWarningBeforeAction,
      warningMessage,
      warningExpiryHours,
      escalationThreshold
    } = req.body;

    // Check if rule already exists for this violation type
    const existingRule = await Rule.findOne({ violationType, isActive: true });
    if (existingRule) {
      return res.status(400).json({
        success: false,
        error: {
          message: 'برای این نوع تخلف قبلاً قانون فعالی وجود دارد',
          englishMessage: 'An active rule already exists for this violation type'
        }
      });
    }

    const rule = new Rule({
      title,
      description,
      violationType,
      punishmentType,
      punishmentDuration: punishmentDuration || 24,
      maxViolationsForPermanentBan: maxViolationsForPermanentBan || 3,
      isActive: isActive !== false,
      notificationMessage: notificationMessage || 'شما به دلیل نقض قوانین مسدود شده‌اید.',
      autoSendNotification: autoSendNotification !== false,
      sendWarningBeforeAction: sendWarningBeforeAction || false,
      warningMessage: warningMessage || 'گزارشی بر علیه شما با موضوع {violationType} ثبت گردید و حالا اگر یک کاربر دیگر بر علیه شما چنین گزارشی ثبت کند شما مسدود خواهید شد پس اگر این گزارش درست است لطفا رفتار خود را برای گفتگوهای بعدی اصلاح نمایید تا گزارشی دریافت ننمایید',
      warningExpiryHours: warningExpiryHours || 168,
      escalationThreshold: escalationThreshold || 1,
      createdBy: req.user.id
    });

    await rule.save();

    logger.info('Rule created:', {
      ruleId: rule._id,
      title: rule.title,
      violationType: rule.violationType,
      createdBy: req.user.username,
      sendWarningBeforeAction: rule.sendWarningBeforeAction
    });

    res.status(201).json({
      success: true,
      message: {
        message: 'قانون جدید با موفقیت ایجاد شد',
        englishMessage: 'New rule created successfully'
      },
      rule: {
        id: rule._id,
        title: rule.title,
        violationType: rule.violationType,
        sendWarningBeforeAction: rule.sendWarningBeforeAction,
        warningExpiryHours: rule.warningExpiryHours,
        createdAt: rule.createdAt
      }
    });
  } catch (error) {
    logger.error('Create rule error:', error);
    next(error);
  }
};

// @desc    Update rule
// @route   PUT /api/rules/:id
// @access  Private (Admin)
const updateRule = async (req, res, next) => {
  try {
    const {
      title,
      description,
      punishmentType,
      punishmentDuration,
      maxViolationsForPermanentBan,
      isActive,
      notificationMessage,
      autoSendNotification,
      sendWarningBeforeAction,
      warningMessage,
      warningExpiryHours,
      escalationThreshold
    } = req.body;

    const rule = await Rule.findById(req.params.id);
    if (!rule) {
      return res.status(404).json({
        success: false,
        error: {
          message: 'قانون یافت نشد',
          englishMessage: 'Rule not found'
        }
      });
    }

    // Update fields
    if (title) rule.title = title;
    if (description) rule.description = description;
    if (punishmentType) rule.punishmentType = punishmentType;
    if (punishmentDuration !== undefined) rule.punishmentDuration = punishmentDuration;
    if (maxViolationsForPermanentBan !== undefined) rule.maxViolationsForPermanentBan = maxViolationsForPermanentBan;
    if (isActive !== undefined) rule.isActive = isActive;
    if (notificationMessage) rule.notificationMessage = notificationMessage;
    if (autoSendNotification !== undefined) rule.autoSendNotification = autoSendNotification;
    
    // Warning system updates
    if (sendWarningBeforeAction !== undefined) rule.sendWarningBeforeAction = sendWarningBeforeAction;
    if (warningMessage) rule.warningMessage = warningMessage;
    if (warningExpiryHours !== undefined) rule.warningExpiryHours = warningExpiryHours;
    if (escalationThreshold !== undefined) rule.escalationThreshold = escalationThreshold;

    await rule.save();

    logger.info('Rule updated:', {
      ruleId: rule._id,
      updatedBy: req.user.username,
      changes: {
        sendWarningBeforeAction,
        warningExpiryHours,
        escalationThreshold
      }
    });

    res.status(200).json({
      success: true,
      message: {
        message: 'قانون به‌روزرسانی شد',
        englishMessage: 'Rule updated successfully'
      },
      rule: {
        id: rule._id,
        title: rule.title,
        sendWarningBeforeAction: rule.sendWarningBeforeAction,
        warningExpiryHours: rule.warningExpiryHours,
        escalationThreshold: rule.escalationThreshold,
        updatedAt: rule.updatedAt
      }
    });
  } catch (error) {
    logger.error('Update rule error:', error);
    next(error);
  }
};

// @desc    Toggle rule warning system
// @route   PATCH /api/rules/:id/toggle-warning
// @access  Private (Admin)
const toggleWarningSystem = async (req, res, next) => {
  try {
    const { sendWarningBeforeAction } = req.body;

    const rule = await Rule.findById(req.params.id);
    if (!rule) {
      return res.status(404).json({
        success: false,
        error: {
          message: 'قانون یافت نشد',
          englishMessage: 'Rule not found'
        }
      });
    }

    rule.sendWarningBeforeAction = sendWarningBeforeAction;
    await rule.save();

    logger.info('Rule warning system toggled:', {
      ruleId: rule._id,
      violationType: rule.violationType,
      sendWarningBeforeAction,
      toggledBy: req.user.username
    });

    res.status(200).json({
      success: true,
      message: {
        message: `سیستم تذکر ${sendWarningBeforeAction ? 'فعال' : 'غیرفعال'} شد`,
        englishMessage: `Warning system ${sendWarningBeforeAction ? 'enabled' : 'disabled'}`
      },
      rule: {
        id: rule._id,
        title: rule.title,
        violationType: rule.violationType,
        sendWarningBeforeAction: rule.sendWarningBeforeAction,
        updatedAt: rule.updatedAt
      }
    });
  } catch (error) {
    logger.error('Toggle warning system error:', error);
    next(error);
  }
};

// @desc    Delete rule
// @route   DELETE /api/rules/:id
// @access  Private (Admin)
const deleteRule = async (req, res, next) => {
  try {
    const rule = await Rule.findById(req.params.id);
    if (!rule) {
      return res.status(404).json({
        success: false,
        error: {
          message: 'قانون یافت نشد',
          englishMessage: 'Rule not found'
        }
      });
    }

    await Rule.findByIdAndDelete(req.params.id);

    logger.warn('Rule deleted:', {
      ruleId: req.params.id,
      title: rule.title,
      violationType: rule.violationType,
      deletedBy: req.user.username
    });

    res.status(200).json({
      success: true,
      message: {
        message: 'قانون حذف شد',
        englishMessage: 'Rule deleted successfully'
      }
    });
  } catch (error) {
    logger.error('Delete rule error:', error);
    next(error);
  }
};

// Apply routes
router.get('/', getRules);
router.get('/:id', getRuleById);
router.post('/', createRule);
router.put('/:id', updateRule);
router.patch('/:id/toggle-warning', toggleWarningSystem);
router.delete('/:id', deleteRule);

module.exports = router;
