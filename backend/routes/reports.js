const express = require('express');
const multer = require('multer');
const {
  submitReport,
  getReports,
  getReportById,
  updateReport,
  escalateWarning,
  getReportingStats,
  cleanupExpiredActions,
  uploadSnapshot
} = require('../controllers/reportController');
const { auth, moderatorAuth } = require('../middleware/auth');
const router = express.Router();

// Multer configuration for snapshot uploads (in-memory)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: parseInt(process.env.MAX_FILE_SIZE || '5242880') }, // default 5MB
  fileFilter: (req, file, cb) => {
    if (file.mimetype && file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image uploads are allowed'));
    }
  }
});

// Health check endpoint
router.get('/_health', (req, res) => {
  res.json({ success: true, service: 'reports', status: 'ok' });
});

// Public user routes (require authentication)
router.use(auth); // Apply authentication to all routes below

// @desc    Upload snapshot image for a report
// @route   POST /api/reports/snapshots
// @access  Private
router.post('/snapshots', upload.single('snapshot'), uploadSnapshot);

// @desc    Submit a new report
// @route   POST /api/reports
// @access  Private
router.post('/', submitReport);

// Admin routes (require admin/moderator role)
router.use('/admin', moderatorAuth); // Apply admin/moderator authorization

// @desc    Get all reports with filtering and pagination
// @route   GET /api/reports/admin
// @access  Private (Admin)
router.get('/admin', getReports);

// @desc    Get reporting statistics
// @route   GET /api/reports/admin/stats
// @access  Private (Admin)
router.get('/admin/stats', getReportingStats);

// @desc    Clean up expired actions
// @route   POST /api/reports/admin/cleanup
// @access  Private (Admin)
router.post('/admin/cleanup', cleanupExpiredActions);

// @desc    Get specific report details
// @route   GET /api/reports/admin/:id
// @access  Private (Admin)
router.get('/admin/:id', getReportById);

// @desc    Update report status and add notes
// @route   PUT /api/reports/admin/:id
// @access  Private (Admin)
router.put('/admin/:id', updateReport);

// @desc    Escalate warning to punishment
// @route   POST /api/reports/admin/:id/escalate
// @access  Private (Admin)
router.post('/admin/:id/escalate', escalateWarning);

module.exports = router;

