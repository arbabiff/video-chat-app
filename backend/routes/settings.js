const express = require('express');
const fs = require('fs');
const path = require('path');

const router = express.Router();

const SETTINGS_DIR = path.join(process.cwd(), 'backend', 'uploads', 'settings');
const SETTINGS_PATH = path.join(SETTINGS_DIR, 'app-settings.json');

const DEFAULT_SETTINGS = {
  branding: {
    siteName: 'چت تصویری تصادفی',
    loginTitle: 'چت تصویری تصادفی',
    loginSubtitle: 'با افراد جدید آشنا شوید',
    loginDisclaimer: 'با ورود، قوانین استفاده را می‌پذیرید',
    logoUrl: '/api/branding/icon'
  },
  legal: {
    requireRulesAcceptance: false,
    rulesText: 'با استفاده از این اپلیکیشن، شما موظف به رعایت احترام به سایر کاربران هستید. استفاده از زبان نامناسب، ارسال محتوای غیراخلاقی، تبلیغات و هرگونه آزار و اذیت ممنوع است. در صورت گزارش تخلف، دسترسی شما موقت یا دائم محدود می‌شود.'
  }
};

function ensureDir() {
  if (!fs.existsSync(SETTINGS_DIR)) {
    fs.mkdirSync(SETTINGS_DIR, { recursive: true });
  }
}

function readSettings() {
  try {
    ensureDir();
    if (!fs.existsSync(SETTINGS_PATH)) {
      fs.writeFileSync(SETTINGS_PATH, JSON.stringify(DEFAULT_SETTINGS, null, 2), 'utf-8');
      return DEFAULT_SETTINGS;
    }
    const raw = fs.readFileSync(SETTINGS_PATH, 'utf-8');
    const parsed = JSON.parse(raw);
    // Merge with defaults to ensure missing fields get defaults
    return {
      branding: { ...DEFAULT_SETTINGS.branding, ...(parsed.branding || {}) },
      legal: { ...DEFAULT_SETTINGS.legal, ...(parsed.legal || {}) }
    };
  } catch (e) {
    return DEFAULT_SETTINGS;
  }
}

function writeSettings(settings) {
  ensureDir();
  const merged = {
    branding: { ...DEFAULT_SETTINGS.branding, ...(settings.branding || {}) },
    legal: { ...DEFAULT_SETTINGS.legal, ...(settings.legal || {}) }
  };
  fs.writeFileSync(SETTINGS_PATH, JSON.stringify(merged, null, 2), 'utf-8');
  return merged;
}

// Public: get settings used by client
router.get('/public', (req, res) => {
  const settings = readSettings();
  res.status(200).json({ success: true, settings });
});

// Admin: get full settings (for now same as public)
router.get('/', (req, res) => {
  const settings = readSettings();
  res.status(200).json({ success: true, settings });
});

// Admin: update settings
router.put('/', (req, res) => {
  try {
    const payload = req.body || {};

    // sanitize strings - simple trim and length limits
    const sanitizeText = (v, max = 200) =>
      typeof v === 'string' ? String(v).trim().slice(0, max) : undefined;

    const next = readSettings();

    if (payload.branding) {
      next.branding.siteName = sanitizeText(payload.branding.siteName, 100) || next.branding.siteName;
      next.branding.loginTitle = sanitizeText(payload.branding.loginTitle, 100) || next.branding.loginTitle;
      next.branding.loginSubtitle = sanitizeText(payload.branding.loginSubtitle, 200) || next.branding.loginSubtitle;
      next.branding.loginDisclaimer = sanitizeText(payload.branding.loginDisclaimer, 200) || next.branding.loginDisclaimer;
      // logoUrl is derived from branding route; allow override only if provided as a safe path
      if (typeof payload.branding.logoUrl === 'string' && payload.branding.logoUrl.startsWith('/')) {
        next.branding.logoUrl = payload.branding.logoUrl;
      }
    }

    if (payload.legal) {
      if (typeof payload.legal.requireRulesAcceptance === 'boolean') {
        next.legal.requireRulesAcceptance = payload.legal.requireRulesAcceptance;
      }
      if (typeof payload.legal.rulesText === 'string') {
        const txt = payload.legal.rulesText.trim();
        // Limit to 5000 chars for safety
        next.legal.rulesText = txt.slice(0, 5000);
      }
    }

    const saved = writeSettings(next);
    res.status(200).json({ success: true, settings: saved, message: 'تنظیمات ذخیره شد' });
  } catch (e) {
    res.status(500).json({ success: false, message: 'خطا در ذخیره تنظیمات', error: String(e?.message || e) });
  }
});

module.exports = router;
