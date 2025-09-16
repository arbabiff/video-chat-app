const logger = require('../utils/logger');
const User = require('../models/User');

// In a real application, you would want to store chat messages in database
// For this demo, we'll create some basic endpoints

// @desc    Get chat statistics
// @route   GET /api/chat/stats
// @access  Private
const getChatStats = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id)
      .select('stats');

    if (!user) {
      return res.status(404).json({
        success: false,
        error: {
          message: 'کاربر یافت نشد',
          englishMessage: 'User not found'
        }
      });
    }

    res.status(200).json({
      success: true,
      stats: {
        totalChats: user.stats.totalChats,
        totalMinutes: user.stats.totalMinutes,
        averageRating: user.stats.averageRating
      }
    });

  } catch (error) {
    logger.error('Get chat stats error:', error);
    next(error);
  }
};

// @desc    Report a user during chat
// @route   POST /api/chat/report
// @access  Private
const reportUser = async (req, res, next) => {
  try {
    const { reportedUserId, reason, description, chatRoomId } = req.body;

    if (!reportedUserId || !reason) {
      return res.status(400).json({
        success: false,
        error: {
          message: 'شناسه کاربر و دلیل گزارش الزامی است',
          englishMessage: 'User ID and reason are required'
        }
      });
    }

    if (reportedUserId === req.user.id) {
      return res.status(400).json({
        success: false,
        error: {
          message: 'نمی‌توانید خودتان را گزارش کنید',
          englishMessage: 'Cannot report yourself'
        }
      });
    }

    // Check if reported user exists
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

    // Increment report count for the reported user
    await User.findByIdAndUpdate(reportedUserId, {
      $inc: { 'stats.reportCount': 1 }
    });

    // In a real application, you would save the report to a Report model
    // For now, we'll just log it
    logger.warn(`User report: ${req.user.username} reported ${reportedUser.username} for ${reason}`, {
      reporterId: req.user.id,
      reportedUserId,
      reason,
      description,
      chatRoomId
    });

    // Auto-block user if they receive too many reports
    if (reportedUser.stats.reportCount + 1 >= 10) {
      await User.findByIdAndUpdate(reportedUserId, {
        status: 'banned'
      });
      logger.warn(`User ${reportedUser.username} auto-banned due to excessive reports`);
    }

    res.status(200).json({
      success: true,
      message: {
        message: 'گزارش شما ثبت شد و بررسی خواهد شد',
        englishMessage: 'Your report has been submitted and will be reviewed'
      }
    });

  } catch (error) {
    logger.error('Report user error:', error);
    next(error);
  }
};

// @desc    Rate a chat session
// @route   POST /api/chat/rate
// @access  Private
const rateChat = async (req, res, next) => {
  try {
    const { partnerUserId, rating, chatRoomId } = req.body;

    if (!partnerUserId || !rating) {
      return res.status(400).json({
        success: false,
        error: {
          message: 'شناسه کاربر و امتیاز الزامی است',
          englishMessage: 'User ID and rating are required'
        }
      });
    }

    if (rating < 1 || rating > 5) {
      return res.status(400).json({
        success: false,
        error: {
          message: 'امتیاز باید بین ۱ تا ۵ باشد',
          englishMessage: 'Rating must be between 1 and 5'
        }
      });
    }

    if (partnerUserId === req.user.id) {
      return res.status(400).json({
        success: false,
        error: {
          message: 'نمی‌توانید به خودتان امتیاز دهید',
          englishMessage: 'Cannot rate yourself'
        }
      });
    }

    // Check if partner user exists
    const partnerUser = await User.findById(partnerUserId);
    if (!partnerUser) {
      return res.status(404).json({
        success: false,
        error: {
          message: 'کاربر یافت نشد',
          englishMessage: 'User not found'
        }
      });
    }

    // Calculate new average rating
    const currentAverage = partnerUser.stats.averageRating || 0;
    const totalRatings = partnerUser.stats.totalChats || 1;
    const newAverage = ((currentAverage * (totalRatings - 1)) + rating) / totalRatings;

    // Update partner's average rating
    await User.findByIdAndUpdate(partnerUserId, {
      'stats.averageRating': Math.round(newAverage * 100) / 100 // Round to 2 decimal places
    });

    logger.info(`Chat rated: ${req.user.username} gave ${rating} stars to ${partnerUser.username}`);

    res.status(200).json({
      success: true,
      message: {
        message: 'امتیاز شما ثبت شد',
        englishMessage: 'Your rating has been recorded'
      }
    });

  } catch (error) {
    logger.error('Rate chat error:', error);
    next(error);
  }
};

// @desc    Get online users count
// @route   GET /api/chat/online-count
// @access  Private
const getOnlineCount = async (req, res, next) => {
  try {
    // Count users who were active in the last 5 minutes
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    
    const onlineCount = await User.countDocuments({
      lastActive: { $gte: fiveMinutesAgo },
      status: 'active',
      'privacy.showOnline': true
    });

    res.status(200).json({
      success: true,
      onlineCount
    });

  } catch (error) {
    logger.error('Get online count error:', error);
    next(error);
  }
};

// @desc    Block user during chat
// @route   POST /api/chat/block
// @access  Private
const blockUserInChat = async (req, res, next) => {
  try {
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({
        success: false,
        error: {
          message: 'شناسه کاربر الزامی است',
          englishMessage: 'User ID is required'
        }
      });
    }

    if (userId === req.user.id) {
      return res.status(400).json({
        success: false,
        error: {
          message: 'نمی‌توانید خودتان را مسدود کنید',
          englishMessage: 'Cannot block yourself'
        }
      });
    }

    // Check if user exists
    const targetUser = await User.findById(userId);
    if (!targetUser) {
      return res.status(404).json({
        success: false,
        error: {
          message: 'کاربر یافت نشد',
          englishMessage: 'User not found'
        }
      });
    }

    // Check if already blocked
    if (req.user.blockedUsers.includes(userId)) {
      return res.status(400).json({
        success: false,
        error: {
          message: 'این کاربر قبلاً مسدود شده است',
          englishMessage: 'User is already blocked'
        }
      });
    }

    // Add to blocked users list
    await User.findByIdAndUpdate(req.user.id, {
      $addToSet: { blockedUsers: userId }
    });

    logger.info(`User ${req.user.username} blocked ${targetUser.username} during chat`);

    res.status(200).json({
      success: true,
      message: {
        message: 'کاربر مسدود شد',
        englishMessage: 'User has been blocked'
      }
    });

  } catch (error) {
    logger.error('Block user in chat error:', error);
    next(error);
  }
};

module.exports = {
  getChatStats,
  reportUser,
  rateChat,
  getOnlineCount,
  blockUserInChat
};
