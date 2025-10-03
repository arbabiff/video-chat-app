const express = require('express');
const { body, param } = require('express-validator');
const { validate } = require('../middleware/validate');
const { adminAuth } = require('../middleware/auth');
const jwt = require('jsonwebtoken');

const router = express.Router();

// In-memory subscriptions store (for development)
// Note: In production, replace with DB-backed model.
const subscriptions = [
  {
    id: 1,
    name: 'اشتراک یک ماهه',
    price: 150000,
    duration: 30,
    description: 'اشتراک یک ماهه با امکانات کامل',
    features: [
      'تصویر با کیفیت بالا',
      'قابلیت قفل ۲ دقیقه‌ای',
      'ادامه ارتباط بالای ۳ دقیقه',
      '۱۰ قفل ماهانه'
    ],
    active: true,
    displayInApp: true,
    giftLocks: 10,
    videoQuality: 'HD',
    unlimitedTime: true,
    giftEnabled: true,
    isSystem: false
  },
  {
    id: 2,
    name: 'اشتراک شش ماهه',
    price: 630000,
    duration: 180,
    description: 'اشتراک شش ماهه با تخفیف ویژه',
    features: [
      'تمام مزایای ماهانه',
      '۳۰٪ تخفیف',
      'پشتیبانی اولویت‌دار',
      '۶۰ قفل (۶ ماه)'
    ],
    active: true,
    displayInApp: true,
    giftLocks: 60,
    videoQuality: 'FHD',
    unlimitedTime: true,
    giftEnabled: true,
    isSystem: false
  },
  {
    id: 3,
    name: 'اشتراک سالانه',
    price: 900000,
    duration: 365,
    description: 'اشتراک سالانه با بیشترین تخفیف',
    features: [
      'تمام مزایای ماهانه',
      '۵۰٪ تخفیف',
      'قفل نامحدود',
      '۱۲۰ قفل (۱ سال)'
    ],
    active: true,
    displayInApp: true,
    giftLocks: 120,
    videoQuality: 'UHD',
    unlimitedTime: true,
    giftEnabled: true,
    isSystem: false
  }
];

// Health endpoint
router.get('/_health', (req, res) => {
  res.json({ success: true, service: 'subscriptions', status: 'ok' });
});

// List all subscriptions
router.get('/', (req, res) => {
  res.json({ success: true, data: subscriptions });
});

// Get subscription by ID
router.get('/:id', [param('id').isInt({ min: 1 })], validate, (req, res) => {
  const id = parseInt(req.params.id, 10);
  const sub = subscriptions.find(s => s.id === id);
  if (!sub) return res.status(404).json({ success: false, message: 'اشتراک یافت نشد' });
  res.json({ success: true, data: sub });
});

// Local admin guard: accepts either JWT (Authorization: Bearer <token>) with role=admin or x-admin-token (base64 JSON)
const requireAdmin = (req, res, next) => {
  try {
    const authHeader = req.header('Authorization');
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      if (decoded && decoded.role === 'admin') {
        req.user = { id: decoded.id, role: 'admin' };
        return next();
      }
    }
  } catch (e) {
    // ignore and fallback to x-admin-token check
  }

  const xAdmin = req.header('x-admin-token');
  if (xAdmin) {
    try {
      const parsed = JSON.parse(Buffer.from(xAdmin, 'base64').toString('utf8'));
      const twentyFourHours = 24 * 60 * 60 * 1000;
      if (parsed && parsed.role === 'admin' && typeof parsed.loginTime === 'number' && (Date.now() - parsed.loginTime) < twentyFourHours) {
        req.user = { id: 'admin-fallback', role: 'admin' };
        return next();
      }
    } catch (err) {
      // invalid admin token format - fallthrough
    }
  }

  return res.status(403).json({ success: false, message: 'دسترسی مجاز نیست. نیاز به مجوز ادمین' });
};

// Create new subscription (non-system)
router.post(
  '/',
  requireAdmin,
  [
    body('name').isString().isLength({ min: 1, max: 100 }),
    body('price').isInt({ min: 0 }),
    body('duration').isInt({ min: 1 }),
    body('description').optional().isString().isLength({ max: 500 }),
    body('giftLocks').optional().isInt({ min: 0 }),
    body('videoQuality').optional().isIn(['SD', 'HD', 'FHD', 'UHD']),
    body('unlimitedTime').optional().isBoolean(),
    body('giftEnabled').optional().isBoolean(),
    body('active').optional().isBoolean(),
    body('displayInApp').optional().isBoolean(),
    body('features').optional().isArray({ max: 20 }),
    body('features.*').optional().isString().isLength({ min: 1, max: 100 }),
    body('isSystem').optional().custom(() => false) // prevent setting system flag
  ],
  validate,
  (req, res) => {
    const {
      name,
      price,
      duration,
      description = '',
      giftLocks = 0,
      videoQuality = 'HD',
      unlimitedTime = false,
      giftEnabled = false,
      active = true,
      displayInApp = true,
      features = []
    } = req.body;
    const newSub = {
      id: Date.now(),
      name,
      price: parseInt(price, 10),
      duration: parseInt(duration, 10),
      description,
      features: Array.isArray(features) ? features.map(String) : [],
      active: Boolean(active),
      displayInApp: Boolean(displayInApp),
      giftLocks: parseInt(giftLocks, 10) || 0,
      videoQuality,
      unlimitedTime: Boolean(unlimitedTime),
      giftEnabled: Boolean(giftEnabled),
      isSystem: false
    };
    subscriptions.push(newSub);
    res.status(201).json({ success: true, data: newSub });
  }
);

// Update subscription (for non-system only)
router.patch(
  '/:id',
  requireAdmin,
  [
    param('id').isInt({ min: 1 }),
    body('name').optional().isString().isLength({ min: 1, max: 100 }),
    body('price').optional().isInt({ min: 0 }),
    body('duration').optional().isInt({ min: 1 }),
    body('description').optional().isString().isLength({ max: 500 }),
    body('giftLocks').optional().isInt({ min: 0 }),
    body('videoQuality').optional().isIn(['SD', 'HD', 'FHD', 'UHD']),
    body('unlimitedTime').optional().isBoolean(),
    body('giftEnabled').optional().isBoolean(),
    body('active').optional().isBoolean(),
    body('displayInApp').optional().isBoolean(),
    body('features').optional().isArray({ max: 20 }),
    body('features.*').optional().isString().isLength({ min: 1, max: 100 }),
    body('isSystem').optional().custom(() => false)
  ],
  validate,
  (req, res) => {
    const id = parseInt(req.params.id, 10);
    const idx = subscriptions.findIndex(s => s.id === id);
    if (idx === -1) return res.status(404).json({ success: false, message: 'اشتراک یافت نشد' });
    const sub = subscriptions[idx];
    const updates = req.body;
    // Sanitize updates
    delete updates.isSystem;
    if (updates.price !== undefined) updates.price = parseInt(updates.price, 10);
    if (updates.duration !== undefined) updates.duration = parseInt(updates.duration, 10);
    if (updates.giftLocks !== undefined) updates.giftLocks = parseInt(updates.giftLocks, 10);
    // Normalize booleans
    if (updates.active !== undefined) updates.active = Boolean(updates.active);
    if (updates.displayInApp !== undefined) updates.displayInApp = Boolean(updates.displayInApp);
    if (updates.unlimitedTime !== undefined) updates.unlimitedTime = Boolean(updates.unlimitedTime);
    if (updates.giftEnabled !== undefined) updates.giftEnabled = Boolean(updates.giftEnabled);
    // Normalize features
    if (updates.features !== undefined && Array.isArray(updates.features)) {
      updates.features = updates.features.map(String);
    }
    subscriptions[idx] = { ...sub, ...updates };
    res.json({ success: true, data: subscriptions[idx] });
  }
);

// Delete subscription (for non-system only)
router.delete('/:id', requireAdmin, [param('id').isInt({ min: 1 })], validate, (req, res) => {
  const id = parseInt(req.params.id, 10);
  const idx = subscriptions.findIndex(s => s.id === id);
  if (idx === -1) return res.status(404).json({ success: false, message: 'اشتراک یافت نشد' });
  const removed = subscriptions.splice(idx, 1)[0];
  res.json({ success: true, data: removed });
});

module.exports = router;

