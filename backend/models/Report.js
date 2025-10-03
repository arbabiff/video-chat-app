const mongoose = require('mongoose');

const reportSchema = new mongoose.Schema({
  reporterId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'شناسه گزارش‌دهنده الزامی است']
  },
  reportedUserId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'شناسه کاربر گزارش‌شده الزامی است']
  },
  violationType: {
    type: String,
    enum: ['inappropriate_content', 'harassment', 'spam', 'fake_profile', 'inappropriate_language', 'immoral_behavior', 'other'],
    required: [true, 'نوع تخلف الزامی است']
  },
  description: {
    type: String,
    maxlength: [500, 'توضیحات نمی‌تواند بیشتر از 500 کاراکتر باشد'],
    trim: true
  },
  status: {
    type: String,
    enum: ['pending', 'warning_sent', 'resolved', 'dismissed'],
    default: 'pending'
  },
  // Warning system fields
  isWarning: {
    type: Boolean,
    default: false // true if this is a warning, false if it's the actual punishment
  },
  warningId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Report' // Reference to the warning report if this is the follow-up
  },
  hasBeenWarned: {
    type: Boolean,
    default: false // true if user was warned for similar violation before
  },
  warningExpiry: {
    type: Date // When the warning period expires
  },
  // Action taken
  actionTaken: {
    type: String,
    enum: ['none', 'warning', 'temporary_ban', 'permanent_ban'],
    default: 'none'
  },
  actionDuration: {
    type: Number, // Duration in hours for temporary bans
    default: 0
  },
  actionExpiresAt: {
    type: Date // When the action expires (for temporary bans)
  },
  // Admin handling
  handledBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  handledAt: {
    type: Date
  },
  adminNotes: {
    type: String,
    maxlength: [1000, 'یادداشت ادمین نمی‌تواند بیشتر از 1000 کاراکتر باشد']
  },
  // Automatic processing
  isAutoProcessed: {
    type: Boolean,
    default: false
  },
  autoProcessedAt: {
    type: Date
  },
  // Evidence
  evidence: [{
    type: String, // URLs to screenshots or other evidence
    maxlength: 500
  }],
  // Notification tracking
  notificationSent: {
    type: Boolean,
    default: false
  },
  notificationSentAt: {
    type: Date
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for violation type in Persian
reportSchema.virtual('violationTypePersian').get(function() {
  const types = {
    'inappropriate_content': 'محتوای نامناسب',
    'harassment': 'آزار و اذیت',
    'spam': 'هرزنامه',
    'fake_profile': 'پروفایل جعلی',
    'inappropriate_language': 'زبان نامناسب',
    'immoral_behavior': 'رفتار غیراخلاقی',
    'other': 'سایر'
  };
  return types[this.violationType] || this.violationType;
});

// Virtual for status in Persian
reportSchema.virtual('statusPersian').get(function() {
  const statuses = {
    'pending': 'در انتظار بررسی',
    'warning_sent': 'تذکر ارسال شده',
    'resolved': 'حل شده',
    'dismissed': 'رد شده'
  };
  return statuses[this.status] || this.status;
});

// Virtual for action taken in Persian
reportSchema.virtual('actionTakenPersian').get(function() {
  const actions = {
    'none': 'هیچ اقدامی',
    'warning': 'تذکر',
    'temporary_ban': 'مسدودی موقت',
    'permanent_ban': 'مسدودی دائم'
  };
  return actions[this.actionTaken] || this.actionTaken;
});

// Virtual to check if action is expired
reportSchema.virtual('isActionExpired').get(function() {
  if (!this.actionExpiresAt) return false;
  return new Date() > this.actionExpiresAt;
});

// Indexes for better performance
reportSchema.index({ reportedUserId: 1, createdAt: -1 });
reportSchema.index({ reporterId: 1 });
reportSchema.index({ violationType: 1 });
reportSchema.index({ status: 1 });
reportSchema.index({ actionTaken: 1 });
reportSchema.index({ hasBeenWarned: 1 });
reportSchema.index({ actionExpiresAt: 1 });

// Static method to check if user should receive warning
reportSchema.statics.shouldReceiveWarning = async function(userId, violationType) {
  // Check if user has active warning for same violation type
  const activeWarning = await this.findOne({
    reportedUserId: userId,
    violationType: violationType,
    isWarning: true,
    warningExpiry: { $gt: new Date() }
  });

  return !activeWarning;
};

// Static method to count similar violations
reportSchema.statics.countSimilarViolations = async function(userId, violationType, timeframe = 30) {
  const since = new Date();
  since.setDate(since.getDate() - timeframe);

  return await this.countDocuments({
    reportedUserId: userId,
    violationType: violationType,
    status: { $in: ['resolved', 'warning_sent'] },
    createdAt: { $gte: since }
  });
};

// Static method to get user's violation history
reportSchema.statics.getUserViolationHistory = async function(userId) {
  return await this.find({
    reportedUserId: userId,
    status: { $in: ['resolved', 'warning_sent'] }
  })
  .populate('reporterId', 'username')
  .populate('handledBy', 'username')
  .sort({ createdAt: -1 });
};

// Instance method to expire warning
reportSchema.methods.expireWarning = function() {
  this.warningExpiry = new Date();
  return this.save();
};

// Instance method to escalate to punishment
reportSchema.methods.escalateToPunishment = async function(rule) {
  const Report = this.constructor;
  
  // Create punishment record
  const punishment = new Report({
    reporterId: this.reporterId,
    reportedUserId: this.reportedUserId,
    violationType: this.violationType,
    description: `تکرار تخلف پس از تذکر: ${this.description}`,
    status: 'resolved',
    isWarning: false,
    warningId: this._id,
    hasBeenWarned: true,
    actionTaken: rule.punishmentType === 'permanent' ? 'permanent_ban' : 'temporary_ban',
    actionDuration: rule.punishmentDuration || 0,
    actionExpiresAt: rule.punishmentType === 'permanent' ? null : 
      new Date(Date.now() + (rule.punishmentDuration || 24) * 60 * 60 * 1000),
    isAutoProcessed: true,
    autoProcessedAt: new Date()
  });

  await punishment.save();
  
  // Update original warning status
  this.status = 'resolved';
  await this.save();

  return punishment;
};

module.exports = mongoose.model('Report', reportSchema);
