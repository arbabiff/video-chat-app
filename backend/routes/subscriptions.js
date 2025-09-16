const express = require('express');
const router = express.Router();

// Placeholder routes for subscriptions
// Replace with real implementation later
router.get('/_health', (req, res) => {
  res.json({ success: true, service: 'subscriptions', status: 'ok' });
});

module.exports = router;

