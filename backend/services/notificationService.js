const User = require('../models/User');
const logger = require('../utils/logger');

class NotificationService {
  
  /**
   * Send warning notification to user before applying punishment
   * @param {string} userId - ID of the user to notify
   * @param {Object} rule - Rule object containing notification details
   * @param {Object} report - Report object
   * @returns {Promise<boolean>} - Success status
   */
  async sendWarningNotification(userId, rule, report) {
    try {
      const user = await User.findById(userId);
      if (!user) {
        logger.error('User not found for warning notification:', userId);
        return false;
      }

      // Replace template variables in warning message
      let warningMessage = rule.warningMessage || rule.notificationMessage;
      
      // Template replacements
      const replacements = {
        '{violationType}': this.getViolationTypeInPersian(report.violationType),
        '{username}': user.username || user.displayName,
        '{date}': new Date().toLocaleDateString('fa-IR'),
        '{time}': new Date().toLocaleTimeString('fa-IR'),
        '{reportReason}': report.description || 'نامشخص'
      };

      // Apply replacements
      Object.keys(replacements).forEach(placeholder => {
        warningMessage = warningMessage.replace(new RegExp(placeholder, 'g'), replacements[placeholder]);
      });

      // In a real application, you would send this via:
      // 1. Push notification service (FCM, APNS)
      // 2. In-app notification system
      // 3. SMS service
      // 4. Email service
      
      // For now, we'll store it as a notification record
      const notification = {
        type: 'warning',
        title: 'تذکر قوانین اپلیکیشن',
        message: warningMessage,
        userId: userId,
        reportId: report._id,
        ruleId: rule._id,
        createdAt: new Date(),
        isRead: false,
        priority: 'high'
      };

      // Store notification (you would typically have a Notification model)
      logger.info('Warning notification prepared for user:', {
        userId,
        violationType: report.violationType,
        message: warningMessage,
        notification
      });

      // Send push notification if user has device tokens
      if (user.deviceTokens && user.deviceTokens.length > 0) {
        await this.sendPushNotification(user.deviceTokens, notification);
      }

      return true;
    } catch (error) {
      logger.error('Error sending warning notification:', error);
      return false;
    }
  }

  /**
   * Send punishment notification to user
   * @param {string} userId - ID of the user to notify
   * @param {Object} rule - Rule object
   * @param {Object} report - Report object
   * @param {string} actionType - Type of action taken
   * @param {Date} expiresAt - When the punishment expires (if applicable)
   * @returns {Promise<boolean>} - Success status
   */
  async sendPunishmentNotification(userId, rule, report, actionType, expiresAt = null) {
    try {
      const user = await User.findById(userId);
      if (!user) {
        logger.error('User not found for punishment notification:', userId);
        return false;
      }

      let punishmentMessage = rule.notificationMessage;
      
      // Calculate time left for temporary bans
      let timeLeft = '';
      if (expiresAt && actionType === 'temporary_ban') {
        const now = new Date();
        const diffMs = expiresAt.getTime() - now.getTime();
        const diffHours = Math.ceil(diffMs / (1000 * 60 * 60));
        const diffDays = Math.ceil(diffHours / 24);
        
        if (diffDays > 1) {
          timeLeft = `${diffDays} روز`;
        } else {
          timeLeft = `${diffHours} ساعت`;
        }
      }

      // Template replacements for punishment
      const replacements = {
        '{violationType}': this.getViolationTypeInPersian(report.violationType),
        '{reason}': this.getViolationTypeInPersian(report.violationType),
        '{username}': user.username || user.displayName,
        '{date}': expiresAt ? expiresAt.toLocaleDateString('fa-IR') : 'نامحدود',
        '{time_left}': timeLeft || 'نامحدود',
        '{punishment_type}': this.getActionTypeInPersian(actionType)
      };

      // Apply replacements
      Object.keys(replacements).forEach(placeholder => {
        punishmentMessage = punishmentMessage.replace(new RegExp(placeholder, 'g'), replacements[placeholder]);
      });

      const notification = {
        type: 'punishment',
        title: 'اطلاع مسدودی حساب کاربری',
        message: punishmentMessage,
        userId: userId,
        reportId: report._id,
        ruleId: rule._id,
        actionType: actionType,
        expiresAt: expiresAt,
        createdAt: new Date(),
        isRead: false,
        priority: 'critical'
      };

      logger.info('Punishment notification prepared for user:', {
        userId,
        actionType,
        violationType: report.violationType,
        message: punishmentMessage,
        notification
      });

      // Update user status if needed
      if (actionType === 'permanent_ban' || actionType === 'temporary_ban') {
        await User.findByIdAndUpdate(userId, { 
          status: 'banned',
          banExpiresAt: expiresAt
        });
      }

      // Send push notification
      if (user.deviceTokens && user.deviceTokens.length > 0) {
        await this.sendPushNotification(user.deviceTokens, notification);
      }

      return true;
    } catch (error) {
      logger.error('Error sending punishment notification:', error);
      return false;
    }
  }

  /**
   * Send push notification to user devices
   * @param {Array} deviceTokens - Array of device tokens
   * @param {Object} notification - Notification object
   * @returns {Promise<boolean>} - Success status
   */
  async sendPushNotification(deviceTokens, notification) {
    try {
      // In a real application, you would use Firebase FCM or similar service
      // Example with FCM:
      /*
      const admin = require('firebase-admin');
      const message = {
        notification: {
          title: notification.title,
          body: notification.message
        },
        data: {
          type: notification.type,
          reportId: notification.reportId?.toString(),
          ruleId: notification.ruleId?.toString(),
          priority: notification.priority
        },
        tokens: deviceTokens.map(dt => dt.token)
      };
      
      const response = await admin.messaging().sendMulticast(message);
      logger.info('Push notifications sent:', {
        successCount: response.successCount,
        failureCount: response.failureCount
      });
      */

      // For demo purposes, just log
      logger.info('Push notification would be sent:', {
        deviceCount: deviceTokens.length,
        notification: {
          title: notification.title,
          message: notification.message,
          type: notification.type
        }
      });

      return true;
    } catch (error) {
      logger.error('Error sending push notification:', error);
      return false;
    }
  }

  /**
   * Send notification to admin about new reports
   * @param {Object} report - Report object
   * @param {string} reporterInfo - Information about reporter
   * @returns {Promise<boolean>} - Success status
   */
  async notifyAdminsAboutReport(report, reporterInfo = '') {
    try {
      const admins = await User.find({ 
        role: { $in: ['admin', 'moderator'] },
        status: 'active'
      });

      const adminNotification = {
        type: 'new_report',
        title: 'گزارش جدید دریافت شد',
        message: `گزارش جدیدی با موضوع "${this.getViolationTypeInPersian(report.violationType)}" دریافت شد. ${reporterInfo}`,
        reportId: report._id,
        priority: 'normal',
        createdAt: new Date()
      };

      for (const admin of admins) {
        if (admin.deviceTokens && admin.deviceTokens.length > 0) {
          await this.sendPushNotification(admin.deviceTokens, {
            ...adminNotification,
            userId: admin._id
          });
        }
      }

      logger.info('Admin notification sent for new report:', {
        reportId: report._id,
        violationType: report.violationType,
        adminCount: admins.length
      });

      return true;
    } catch (error) {
      logger.error('Error notifying admins about report:', error);
      return false;
    }
  }

  /**
   * Get violation type in Persian
   * @param {string} violationType - Violation type key
   * @returns {string} - Persian translation
   */
  getViolationTypeInPersian(violationType) {
    const types = {
      'inappropriate_content': 'محتوای نامناسب',
      'harassment': 'آزار و اذیت',
      'spam': 'هرزنامه',
      'fake_profile': 'پروفایل جعلی',
      'inappropriate_language': 'زبان نامناسب',
      'immoral_behavior': 'رفتار غیراخلاقی',
      'other': 'سایر'
    };
    return types[violationType] || violationType;
  }

  /**
   * Get action type in Persian
   * @param {string} actionType - Action type key
   * @returns {string} - Persian translation
   */
  getActionTypeInPersian(actionType) {
    const actions = {
      'warning': 'تذکر',
      'temporary_ban': 'مسدودی موقت',
      'permanent_ban': 'مسدودی دائم',
      'none': 'هیچ اقدامی'
    };
    return actions[actionType] || actionType;
  }

  /**
   * Clean up expired warnings and temporary bans
   * This should be run as a scheduled job
   * @returns {Promise<Object>} - Cleanup results
   */
  async cleanupExpiredActions() {
    try {
      const now = new Date();
      
      // Find users with expired temporary bans
      const expiredBans = await User.find({
        status: 'banned',
        banExpiresAt: { $lt: now }
      });

      // Reactivate users with expired bans
      for (const user of expiredBans) {
        user.status = 'active';
        user.banExpiresAt = undefined;
        await user.save();
        
        logger.info('User ban expired and status restored:', {
          userId: user._id,
          username: user.username
        });
      }

      const Report = require('../models/Report');
      
      // Find and expire old warnings
      const expiredWarnings = await Report.find({
        isWarning: true,
        warningExpiry: { $lt: now },
        status: 'warning_sent'
      });

      for (const warning of expiredWarnings) {
        warning.status = 'resolved';
        await warning.save();
      }

      logger.info('Cleanup completed:', {
        expiredBansCount: expiredBans.length,
        expiredWarningsCount: expiredWarnings.length
      });

      return {
        success: true,
        expiredBans: expiredBans.length,
        expiredWarnings: expiredWarnings.length
      };
    } catch (error) {
      logger.error('Error in cleanup expired actions:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
}

module.exports = new NotificationService();
