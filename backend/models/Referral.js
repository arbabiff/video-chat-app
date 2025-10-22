const mongoose = require('mongoose');

const referralNotificationSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['registered', 'subscription'],
    required: true
  },
  title: { type: String, required: true },
  message: { type: String, required: true },
  imageUrl: { type: String, default: null },
  createdAt: { type: Date, default: Date.now },
  isRead: { type: Boolean, default: false }
}, { _id: false });

const referralSchema = new mongoose.Schema({
  referrer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  referred: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  referrerPhone: { type: String, default: null },
  status: {
    type: String,
    enum: ['registered', 'subscribed'],
    default: 'registered'
  },
  subscriptionType: { type: String, enum: ['free', 'premium', 'vip', null], default: null },
  subscriptionActivatedAt: { type: Date, default: null },
  notifications: [referralNotificationSchema]
}, {
  timestamps: true
});

// Prevent duplicate (referrer, referred)
referralSchema.index({ referrer: 1, referred: 1 }, { unique: true });

module.exports = mongoose.model('Referral', referralSchema);
