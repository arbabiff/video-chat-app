const express = require('express');
const Rule = require('../models/Rule');

const router = express.Router();

// Public: list active rules only
router.get('/', async (req, res) => {
  try {
    const rules = await Rule.find({ isActive: true })
      .sort({ createdAt: -1 })
      .select('title description isActive');

    const data = rules.map((r) => ({
      id: r._id,
      title: r.title,
      description: r.description,
      isActive: r.isActive,
    }));

    res.status(200).json({ success: true, rules: data });
  } catch (e) {
    res.status(500).json({ success: false, message: 'خطا در دریافت قوانین', error: String(e?.message || e) });
  }
});

module.exports = router;
