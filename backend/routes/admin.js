const express = require('express');
const { body, query, param } = require('express-validator');
const {
  getDashboardStats,
  getUsers,
  getUserDetails,
  updateUserStatus,
  updateUserRole,
  deleteUser,
  sendMessageToUser,
  getSystemHealth,
  getSystemLogs
} = require('../controllers/adminController');
const { adminAuth } = require('../middleware/auth');
const { validate } = require('../middleware/validate');

const router = express.Router();

// All admin routes require admin authentication
router.use(adminAuth);

// Validation rules
const getUsersValidation = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('صفحه باید عدد مثبت باشد'),
  
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('تعداد نتایج باید بین ۱ تا ۱۰۰ باشد'),
  
  query('status')
    .optional()
    .isIn(['active', 'inactive', 'banned', 'pending'])
    .withMessage('وضعیت نامعتبر است'),
  
  query('role')
    .optional()
    .isIn(['user', 'moderator', 'admin'])
    .withMessage('نقش نامعتبر است'),
  
  query('subscription')
    .optional()
    .isIn(['free', 'premium', 'vip'])
    .withMessage('نوع اشتراک نامعتبر است'),
  
  query('search')
    .optional()
    .isLength({ min: 1, max: 50 })
    .withMessage('جستجو باید بین ۱ تا ۵۰ کاراکتر باشد'),
  
  query('sortBy')
    .optional()
    .isIn(['createdAt', 'lastActive', 'username', 'email'])
    .withMessage('فیلد مرتب‌سازی نامعتبر است'),
  
  query('sortOrder')
    .optional()
    .isIn(['asc', 'desc'])
    .withMessage('نحوه مرتب‌سازی باید صعودی یا نزولی باشد')
];

const mongoIdValidation = [
  param('id')
    .isMongoId()
    .withMessage('شناسه نامعتبر است')
];

const updateStatusValidation = [
  ...mongoIdValidation,
  body('status')
    .isIn(['active', 'inactive', 'banned', 'pending'])
    .withMessage('وضعیت نامعتبر است')
];

const updateRoleValidation = [
  ...mongoIdValidation,
  body('role')
    .isIn(['user', 'moderator', 'admin'])
    .withMessage('نقش نامعتبر است')
];

const sendMessageValidation = [
  ...mongoIdValidation,
  body('message')
    .notEmpty()
    .isLength({ min: 1, max: 1000 })
    .withMessage('پیام باید بین ۱ تا ۱۰۰۰ کاراکتر باشد')
    .trim(),
  
  body('type')
    .optional()
    .isIn(['info', 'warning', 'error', 'success'])
    .withMessage('نوع پیام نامعتبر است')
];

const getLogsValidation = [
  query('level')
    .optional()
    .isIn(['error', 'warn', 'info', 'debug'])
    .withMessage('سطح لاگ نامعتبر است'),
  
  query('limit')
    .optional()
    .isInt({ min: 1, max: 1000 })
    .withMessage('تعداد لاگ‌ها باید بین ۱ تا ۱۰۰۰ باشد')
];

// Routes

// Dashboard and Statistics
// @route   GET /api/admin/dashboard
// @desc    Get dashboard statistics
// @access  Private (Admin)
router.get('/dashboard', getDashboardStats);

// User Management
// @route   GET /api/admin/users
// @desc    Get all users with pagination and filters
// @access  Private (Admin)
router.get('/users', getUsersValidation, validate, getUsers);

// @route   GET /api/admin/users/:id
// @desc    Get user details by ID
// @access  Private (Admin)
router.get('/users/:id', mongoIdValidation, validate, getUserDetails);

// @route   PUT /api/admin/users/:id/status
// @desc    Update user status
// @access  Private (Admin)
router.put('/users/:id/status', updateStatusValidation, validate, updateUserStatus);

// @route   PUT /api/admin/users/:id/role
// @desc    Update user role
// @access  Private (Admin)
router.put('/users/:id/role', updateRoleValidation, validate, updateUserRole);

// @route   DELETE /api/admin/users/:id
// @desc    Delete user account
// @access  Private (Admin)
router.delete('/users/:id', mongoIdValidation, validate, deleteUser);

// @route   POST /api/admin/users/:id/message
// @desc    Send message to user
// @access  Private (Admin)
router.post('/users/:id/message', sendMessageValidation, validate, sendMessageToUser);

// System Management
// @route   GET /api/admin/system/health
// @desc    Get system health information
// @access  Private (Admin)
router.get('/system/health', getSystemHealth);

// @route   GET /api/admin/system/logs
// @desc    Get system logs
// @access  Private (Admin)
router.get('/system/logs', getLogsValidation, validate, getSystemLogs);

module.exports = router;
