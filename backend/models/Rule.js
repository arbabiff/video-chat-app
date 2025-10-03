const mongoose = require('mongoose');

const ruleSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'عنوان قانون الزامی است'],
    trim: true,
    maxlength: [100, 'عنوان قانون نمی‌تواند بیشتر از 100 کاراکتر باشد']
  },
  description: {
    type: String,
    required: [true, 'توضیحات قانون الزامی است'],
    trim: true,
    maxlength: [500, 'توضیحات قانون نمی‌تواند بیشتر از 500 کاراکتر باشد']
  },
  violationType: {
    type: String,
    enum: ['inappropriate_content', 'harassment', 'spam', 'fake_profile', 'other'],
    required: [true, 'نوع تخلف الزامی است']
  },
  punishmentType: {
    type: String,
    enum: ['temporary', 'permanent'],
    required: [true, 'نوع مجازات الزامی است']
  },
  punishmentDuration: {
    type: Number, // Hours for temporary punishment
    default: 24,
    min: [1, 'مدت مجازات نمی‌تواند کمتر از 1 ساعت باشد'],
    max: [8760, 'مدت مجازات نمی‌تواند بیشتر از 1 سال باشد']
  },
  maxViolationsForPermanentBan: {
    type: Number,
    default: 3,
    min: [1, 'حداقل تعداد تخلفات 1 است'],
    max: [10, 'حداکثر تعداد تخلفات 10 است']
  },
  isActive: {
    type: Boolean,
    default: true
  },
  notificationMessage: {
    type: String,
    required: [true, 'پیام نوتیفیکیشن الزامی است'],
    trim: true,
    maxlength: [300, 'پیام نوتیفیکیشن نمی‌تواند بیشتر از 300 کاراکتر باشد'],
    default: 'شما به دلیل نقض قوانین مسدود شده‌اید.'
  },
  autoSendNotification: {
    type: Boolean,
    default: true
  },
  // Warning system configuration
  sendWarningBeforeAction: {
    type: Boolean,
    default: false // Can be toggled by admin based on violation severity
  },
  warningMessage: {
    type: String,
    maxlength: [500, 'پیام تذکر نمی‌تواند بیشتر از 500 کاراکتر باشد'],
    default: 'گزارشی بر علیه شما با موضوع {violationType} ثبت گردید و حالا اگر یک کاربر دیگر بر علیه شما چنین گزارشی ثبت کند شما مسدود خواهید شد پس اگر این گزارش درست است لطفا رفتار خود را برای گفتگوهای بعدی اصلاح نمایید تا گزارشی دریافت ننمایید',
    trim: true
  },
  warningExpiryHours: {
    type: Number,
    default: 168, // 7 days default warning period
    min: [1, 'مدت اعتبار تذکر نمی‌تواند کمتر از 1 ساعت باشد'],
    max: [8760, 'مدت اعتبار تذکر نمی‌تواند بیشتر از 1 سال باشد']
  },
  escalationThreshold: {
    type: Number,
    default: 1, // Number of similar violations that trigger this rule
    min: [1, 'حداقل آستانه تکرار 1 است'],
    max: [10, 'حداکثر آستانه تکرار 10 است']
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for punishment duration in Persian
ruleSchema.virtual('punishmentDurationPersian').get(function() {
  if (this.punishmentType === 'permanent') {
    return 'دائم';
  }
  return `${this.punishmentDuration} ساعت`;
});

// Indexes
ruleSchema.index({ violationType: 1 });
ruleSchema.index({ isActive: 1 });
ruleSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Rule', ruleSchema);