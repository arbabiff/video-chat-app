const express = require('express');
const router = express.Router();

// Placeholder routes for reports
// Replace with real implementation later
router.get('/_health', (req, res) => {
  res.json({ success: true, service: 'reports', status: 'ok' });
});

module.exports = router;

