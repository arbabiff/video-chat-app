const express = require('express');
const { body } = require('express-validator');
const {
  getChatStats,
  reportUser,
  rateChat,
  getOnlineCount,
  blockUserInChat
} = require('../controllers/chatController');
const { validate } = require('../middleware/validate');

const router = express.Router();

// Validation rules
const reportUserValidation = [
  body('reportedUserId')
    .isMongoId()
    .withMessage('شناسه کاربر گزارش شده نامعتبر است'),
  
  body('reason')
    .isIn(['inappropriate_content', 'harassment', 'spam', 'fake_profile', 'other'])
    .withMessage('دلیل گزارش نامعتبر است'),
  
  body('description')
    .optional()
    .isLength({ max: 500 })
    .withMessage('توضیحات نباید بیش از ۵۰۰ کاراکتر باشد')
    .trim(),
  
  body('chatRoomId')
    .optional()
    .isString()
    .withMessage('شناسه اتاق چت نامعتبر است')
];

const rateChatValidation = [
  body('partnerUserId')
    .isMongoId()
    .withMessage('شناسه کاربر شریک نامعتبر است'),
  
  body('rating')
    .isInt({ min: 1, max: 5 })
    .withMessage('امتیاز باید بین ۱ تا ۵ باشد'),
  
  body('chatRoomId')
    .optional()
    .isString()
    .withMessage('شناسه اتاق چت نامعتبر است')
];

const blockUserValidation = [
  body('userId')
    .isMongoId()
    .withMessage('شناسه کاربر نامعتبر است')
];

// Routes

// @route   GET /api/chat/stats
// @desc    Get user's chat statistics
// @access  Private
router.get('/stats', getChatStats);

// @route   GET /api/chat/online-count
// @desc    Get count of online users
// @access  Private
router.get('/online-count', getOnlineCount);

// @route   POST /api/chat/report
// @desc    Report a user during chat
// @access  Private
router.post('/report', reportUserValidation, validate, reportUser);

// @route   POST /api/chat/rate
// @desc    Rate a chat session
// @access  Private
router.post('/rate', rateChatValidation, validate, rateChat);

// @route   POST /api/chat/block
// @desc    Block user during chat
// @access  Private
router.post('/block', blockUserValidation, validate, blockUserInChat);

module.exports = router;
