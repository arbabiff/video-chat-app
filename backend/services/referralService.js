const Referral = require('../models/Referral');
const User = require('../models/User');
const notificationService = require('./notificationService');
const logger = require('../utils/logger');

function normalizePhone(input) {
  if (!input || typeof input !== 'string') return null;
  let p = input.trim();
  // Remove spaces and non-digits except leading +
  p = p.replace(/[^\d+]/g, '');
  // Convert leading 00 to +
  if (p.startsWith('00')) p = '+' + p.substring(2);
  // Iran local to international
  if (p.startsWith('0') && p.length >= 10) p = '+98' + p.substring(1);
  return p;
}

async function createReferralByPhone(referrerPhone, newUser) {
  try {
    const phone = normalizePhone(referrerPhone);
    if (!phone) return null;

    const referrer = await User.findOne({ phone });
    if (!referrer) {
      logger.warn('Referrer not found by phone for referral creation', { phone });
      return null;
    }

    // Avoid self-referral
    if (referrer._id.toString() === newUser._id.toString()) {
      return null;
    }

    // Create or upsert referral
    let referral = await Referral.findOne({ referrer: referrer._id, referred: newUser._id });
    if (!referral) {
      referral = await Referral.create({
        referrer: referrer._id,
        referred: newUser._id,
        referrerPhone: phone,
        status: 'registered',
        notifications: [{
          type: 'registered',
          title: 'کاربر جدید با معرفی شما ثبت شد',
          message: `${newUser.displayName || newUser.username} با شماره شما ثبت‌نام کرد`,
          imageUrl: newUser.avatar || null
        }]
      });
    }

    // Link user.referredBy
    if (!newUser.referredBy) {
      newUser.referredBy = referrer._id;
      await newUser.save({ validateBeforeSave: false });
    }

    logger.info('Referral created', { referrer: referrer._id.toString(), referred: newUser._id.toString() });
    return referral;
  } catch (e) {
    logger.error('Error creating referral by phone', e);
    return null;
  }
}

async function onReferredUserSubscribed(referredUser) {
  try {
    const referral = await Referral.findOne({ referred: referredUser._id });
    if (!referral) return false;

    referral.status = 'subscribed';
    referral.subscriptionActivatedAt = new Date();
    referral.subscriptionType = referredUser.subscription?.type || 'premium';

    const message = `${referredUser.displayName || referredUser.username} اشتراک ${referral.subscriptionType === 'vip' ? 'VIP' : 'پریمیوم'} را فعال کرد.`;
    referral.notifications.push({
      type: 'subscription',
      title: 'اشتراک معرفی‌شده فعال شد',
      message,
      imageUrl: referredUser.avatar || null
    });

    await referral.save();

    // Notify referrer via push if possible
    const referrer = await User.findById(referral.referrer);
    if (referrer && Array.isArray(referrer.deviceTokens) && referrer.deviceTokens.length > 0) {
      await notificationService.sendPushNotification(referrer.deviceTokens, {
        type: 'referral_subscription',
        title: 'فعال شدن اشتراک معرفی‌شده',
        message,
        userId: referrer._id,
        priority: 'normal'
      });
    }

    return true;
  } catch (e) {
    logger.error('Error handling referred user subscription', e);
    return false;
  }
}

module.exports = {
  normalizePhone,
  createReferralByPhone,
  onReferredUserSubscribed
};
