const express = require('express');
const { query, param } = require('express-validator');
const {
  getUserProfile,
  searchUsers,
  findMatch,
  blockUser,
  unblockUser,
  getBlockedUsers,
  sendFriendRequest,
  acceptFriendRequest,
  rejectFriendRequest,
  getFriendRequests,
  getFriends,
  removeFriend
} = require('../controllers/userController');
const { validate } = require('../middleware/validate');

const router = express.Router();

// Validation rules
const searchValidation = [
  query('query')
    .optional()
    .isLength({ min: 1, max: 50 })
    .withMessage('جستجو باید بین ۱ تا ۵۰ کاراکتر باشد')
    .trim(),
  
  query('gender')
    .optional()
    .isIn(['male', 'female', 'other'])
    .withMessage('جنسیت باید یکی از مقادیر مرد، زن یا سایر باشد'),
  
  query('country')
    .optional()
    .isLength({ min: 2, max: 2 })
    .withMessage('کد کشور باید ۲ کاراکتر باشد'),
  
  query('minAge')
    .optional()
    .isInt({ min: 13, max: 100 })
    .withMessage('حداقل سن باید بین ۱۳ تا ۱۰۰ باشد'),
  
  query('maxAge')
    .optional()
    .isInt({ min: 18, max: 120 })
    .withMessage('حداکثر سن باید بین ۱۸ تا ۱۲۰ باشد'),
  
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('صفحه باید عدد مثبت باشد'),
  
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('تعداد نتایج باید بین ۱ تا ۱۰۰ باشد')
];

const mongoIdValidation = [
  param('id')
    .isMongoId()
    .withMessage('شناسه نامعتبر است')
];

// Routes

// @route   GET /api/users/search
// @desc    Search users with filters
// @access  Private
router.get('/search', searchValidation, validate, searchUsers);

// @route   GET /api/users/find-match
// @desc    Find matching users for video chat
// @access  Private
router.get('/find-match', findMatch);

// @route   GET /api/users/blocked
// @desc    Get blocked users list
// @access  Private
router.get('/blocked', getBlockedUsers);

// @route   GET /api/users/friend-requests
// @desc    Get pending friend requests
// @access  Private
router.get('/friend-requests', getFriendRequests);

// @route   GET /api/users/friends
// @desc    Get friends list
// @access  Private
router.get('/friends', getFriends);

// @route   GET /api/users/:id
// @desc    Get user profile by ID
// @access  Private
router.get('/:id', mongoIdValidation, validate, getUserProfile);

// @route   POST /api/users/:id/block
// @desc    Block a user
// @access  Private
router.post('/:id/block', mongoIdValidation, validate, blockUser);

// @route   DELETE /api/users/:id/block
// @desc    Unblock a user
// @access  Private
router.delete('/:id/block', mongoIdValidation, validate, unblockUser);

// @route   POST /api/users/:id/friend-request
// @desc    Send friend request
// @access  Private
router.post('/:id/friend-request', mongoIdValidation, validate, sendFriendRequest);

// @route   POST /api/users/:id/accept-friend
// @desc    Accept friend request
// @access  Private
router.post('/:id/accept-friend', mongoIdValidation, validate, acceptFriendRequest);

// @route   DELETE /api/users/:id/friend-request
// @desc    Reject friend request
// @access  Private
router.delete('/:id/friend-request', mongoIdValidation, validate, rejectFriendRequest);

// @route   DELETE /api/users/:id/friend
// @desc    Remove friend
// @access  Private
router.delete('/:id/friend', mongoIdValidation, validate, removeFriend);

module.exports = router;
