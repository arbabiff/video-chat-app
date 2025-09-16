const express = require('express');
const router = express.Router();

// Placeholder routes for payments
// Replace with real implementation later
router.get('/_health', (req, res) => {
  res.json({ success: true, service: 'payments', status: 'ok' });
});

module.exports = router;

