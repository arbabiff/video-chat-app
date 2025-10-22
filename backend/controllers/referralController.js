const Referral = require('../models/Referral');
const logger = require('../utils/logger');

// GET /api/referrals/mine
// List referrals for current user (as referrer)
const getMyReferrals = async (req, res, next) => {
  try {
    const referrals = await Referral.find({ referrer: req.user.id })
      .populate('referred', 'username displayName avatar subscription createdAt lastActive');

    const items = referrals.map(r => ({
      id: r._id,
      status: r.status,
      createdAt: r.createdAt,
      referrerPhone: r.referrerPhone,
      subscriptionType: r.subscriptionType,
      subscriptionActivatedAt: r.subscriptionActivatedAt,
      referred: r.referred ? {
        id: r.referred._id,
        username: r.referred.username,
        displayName: r.referred.displayName,
        avatar: r.referred.avatar,
        subscription: r.referred.subscription,
        createdAt: r.referred.createdAt,
        lastActive: r.referred.lastActive
      } : null,
      notifications: r.notifications
    }));

    res.status(200).json({ success: true, referrals: items });
  } catch (error) {
    logger.error('Error getting my referrals', error);
    next(error);
  }
};

// GET /api/referrals/referred/:userId
// Ensure the requested user is referred by current user; return basic profile and subscription
const getReferredDetails = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const referral = await Referral.findOne({ referrer: req.user.id, referred: userId })
      .populate('referred', 'username displayName avatar subscription createdAt lastActive');

    if (!referral || !referral.referred) {
      return res.status(404).json({ success: false, message: 'ارجاع یافت نشد' });
    }

    const u = referral.referred;
    res.status(200).json({
      success: true,
      referred: {
        id: u._id,
        username: u.username,
        displayName: u.displayName,
        avatar: u.avatar,
        subscription: u.subscription,
        createdAt: u.createdAt,
        lastActive: u.lastActive
      },
      referral: {
        id: referral._id,
        status: referral.status,
        subscriptionType: referral.subscriptionType,
        subscriptionActivatedAt: referral.subscriptionActivatedAt,
        notifications: referral.notifications
      }
    });
  } catch (error) {
    logger.error('Error getting referred details', error);
    next(error);
  }
};

module.exports = {
  getMyReferrals,
  getReferredDetails
};
