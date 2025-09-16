const express = require('express');
const { body } = require('express-validator');
const {
  register,
  login,
  getMe,
  updateProfile,
  changePassword,
  forgotPassword,
  resetPassword,
  verifyEmail,
  resendVerification
} = require('../controllers/authController');
const { auth } = require('../middleware/auth');
const { validate } = require('../middleware/validate');

const router = express.Router();

// Validation rules
const registerValidation = [
  body('username')
    .isLength({ min: 3, max: 30 })
    .withMessage('نام کاربری باید بین ۳ تا ۳۰ کاراکتر باشد')
    .matches(/^[a-zA-Z0-9_.-]+$/)
    .withMessage('نام کاربری فقط می‌تواند شامل حروف انگلیسی، اعداد و علائم _ . - باشد'),
  
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('لطفاً یک ایمیل معتبر وارد کنید'),
  
  body('password')
    .isLength({ min: 6 })
    .withMessage('رمز عبور باید حداقل ۶ کاراکتر باشد')
    .matches(/^(?=.*[a-zA-Z])(?=.*\d)/)
    .withMessage('رمز عبور باید شامل حداقل یک حرف و یک عدد باشد'),
  
  body('displayName')
    .isLength({ min: 2, max: 50 })
    .withMessage('نام نمایشی باید بین ۲ تا ۵۰ کاراکتر باشد')
    .trim(),
  
  body('gender')
    .isIn(['male', 'female', 'other'])
    .withMessage('جنسیت باید یکی از مقادیر مرد، زن یا سایر باشد'),
  
  body('birthDate')
    .isISO8601()
    .toDate()
    .withMessage('تاریخ تولد معتبر نیست')
    .custom((value) => {
      const age = Math.floor((Date.now() - value.getTime()) / (365.25 * 24 * 60 * 60 * 1000));
      if (age < 13) {
        throw new Error('حداقل سن مجاز ۱۳ سال است');
      }
      return true;
    }),
  
  body('country')
    .optional()
    .isLength({ min: 2, max: 2 })
    .withMessage('کد کشور باید ۲ کاراکتر باشد')
];

const loginValidation = [
  body('login')
    .notEmpty()
    .withMessage('ایمیل یا نام کاربری الزامی است'),
  
  body('password')
    .notEmpty()
    .withMessage('رمز عبور الزامی است')
];

const changePasswordValidation = [
  body('currentPassword')
    .notEmpty()
    .withMessage('رمز عبور فعلی الزامی است'),
  
  body('newPassword')
    .isLength({ min: 6 })
    .withMessage('رمز عبور جدید باید حداقل ۶ کاراکتر باشد')
    .matches(/^(?=.*[a-zA-Z])(?=.*\d)/)
    .withMessage('رمز عبور باید شامل حداقل یک حرف و یک عدد باشد')
];

const emailValidation = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('لطفاً یک ایمیل معتبر وارد کنید')
];

const resetPasswordValidation = [
  body('password')
    .isLength({ min: 6 })
    .withMessage('رمز عبور جدید باید حداقل ۶ کاراکتر باشد')
    .matches(/^(?=.*[a-zA-Z])(?=.*\d)/)
    .withMessage('رمز عبور باید شامل حداقل یک حرف و یک عدد باشد')
];

const updateProfileValidation = [
  body('displayName')
    .optional()
    .isLength({ min: 2, max: 50 })
    .withMessage('نام نمایشی باید بین ۲ تا ۵۰ کاراکتر باشد')
    .trim(),
  
  body('country')
    .optional()
    .isLength({ min: 2, max: 2 })
    .withMessage('کد کشور باید ۲ کاراکتر باشد'),
  
  body('language')
    .optional()
    .isIn(['fa', 'en'])
    .withMessage('زبان باید فارسی یا انگلیسی باشد'),
  
  body('preferences.ageRange.min')
    .optional()
    .isInt({ min: 13, max: 100 })
    .withMessage('حداقل سن باید بین ۱۳ تا ۱۰۰ باشد'),
  
  body('preferences.ageRange.max')
    .optional()
    .isInt({ min: 18, max: 120 })
    .withMessage('حداکثر سن باید بین ۱۸ تا ۱۲۰ باشد'),
  
  body('preferences.genderPreference')
    .optional()
    .isIn(['male', 'female', 'both'])
    .withMessage('ترجیح جنسیت باید یکی از مقادیر مرد، زن یا هردو باشد'),
  
  body('privacy.showOnline')
    .optional()
    .isBoolean()
    .withMessage('نمایش آنلاین بودن باید true یا false باشد'),
  
  body('privacy.allowMessages')
    .optional()
    .isBoolean()
    .withMessage('اجازه پیام باید true یا false باشد'),
  
  body('privacy.profileVisibility')
    .optional()
    .isIn(['public', 'friends', 'private'])
    .withMessage('نمایش پروفایل باید عمومی، دوستان یا خصوصی باشد')
];

// Routes

// @route   POST /api/auth/register
// @desc    Register a new user
// @access  Public
router.post('/register', registerValidation, validate, register);

// @route   POST /api/auth/login
// @desc    Login user
// @access  Public
router.post('/login', loginValidation, validate, login);

// @route   GET /api/auth/me
// @desc    Get current user profile
// @access  Private
router.get('/me', auth, getMe);

// @route   PUT /api/auth/profile
// @desc    Update user profile
// @access  Private
router.put('/profile', auth, updateProfileValidation, validate, updateProfile);

// @route   PUT /api/auth/password
// @desc    Change user password
// @access  Private
router.put('/password', auth, changePasswordValidation, validate, changePassword);

// @route   POST /api/auth/forgot-password
// @desc    Send password reset email
// @access  Public
router.post('/forgot-password', emailValidation, validate, forgotPassword);

// @route   POST /api/auth/reset-password/:resettoken
// @desc    Reset password with token
// @access  Public
router.post('/reset-password/:resettoken', resetPasswordValidation, validate, resetPassword);

// @route   GET /api/auth/verify-email/:token
// @desc    Verify email address
// @access  Public
router.get('/verify-email/:token', verifyEmail);

// @route   POST /api/auth/resend-verification
// @desc    Resend email verification
// @access  Private
router.post('/resend-verification', auth, resendVerification);

module.exports = router;
