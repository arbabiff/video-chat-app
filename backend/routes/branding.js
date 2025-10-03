const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const sharp = require('sharp');

const router = express.Router();

// Multer setup - store in memory then process via sharp
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    const allowed = ['image/png', 'image/jpeg', 'image/webp'];
    if (!allowed.includes(file.mimetype)) {
      return cb(new Error('فرمت تصویر باید PNG یا JPEG باشد'));
    }
    cb(null, true);
  }
});

const ICON_DIR = path.join(process.cwd(), 'backend', 'uploads', 'app-icon');
const ICON_PATH = path.join(ICON_DIR, 'icon.png');

// Ensure directory exists
function ensureDir() {
  if (!fs.existsSync(ICON_DIR)) {
    fs.mkdirSync(ICON_DIR, { recursive: true });
  }
}

// POST /api/branding/icon - upload app icon
router.post('/icon', upload.single('icon'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'فایل آیکون ارسال نشده است' });
    }
    ensureDir();

    // Normalize to 1024x1024 PNG with transparent background
    const buffer = await sharp(req.file.buffer)
      .resize(1024, 1024, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .png()
      .toBuffer();

    fs.writeFileSync(ICON_PATH, buffer);

    return res.status(200).json({ success: true, url: '/api/branding/icon', message: 'آیکون با موفقیت ذخیره شد' });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'خطا در پردازش آیکون', error: String(err?.message || err) });
  }
});

// GET /api/branding/icon - serve current icon
router.get('/icon', async (req, res) => {
  try {
    if (!fs.existsSync(ICON_PATH)) {
      return res.status(404).json({ success: false, message: 'آیکون تنظیم نشده است' });
    }
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    return res.sendFile(ICON_PATH);
  } catch (err) {
    return res.status(500).json({ success: false, message: 'خطای سرور', error: String(err?.message || err) });
  }
});

module.exports = router;
