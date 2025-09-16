const User = require('../models/User');
const logger = require('../utils/logger');
const crypto = require('crypto');

// Helper function to send response
const sendTokenResponse = (user, statusCode, res) => {
  const token = user.getSignedJwtToken();
  
  res.status(statusCode).json({
    success: true,
    token,
    user: {
      id: user._id,
      username: user.username,
      email: user.email,
      displayName: user.displayName,
      avatar: user.avatar,
      role: user.role,
      status: user.status,
      subscription: user.subscription,
      preferences: user.preferences,
      emailVerified: user.emailVerification.isVerified
    }
  });
};

// @desc    Register user
// @route   POST /api/auth/register
// @access  Public
const register = async (req, res, next) => {
  try {
    const {
      username,
      email,
      password,
      displayName,
      gender,
      birthDate,
      country
    } = req.body;

    // Validate required fields
    if (!username || !email || !password || !displayName || !gender || !birthDate) {
      return res.status(400).json({
        success: false,
        error: {
          message: 'لطفاً تمام فیلدهای اجباری را پر کنید',
          englishMessage: 'Please fill in all required fields'
        }
      });
    }

    // Check if user already exists
    const existingUser = await User.findOne({
      $or: [{ email }, { username }]
    });

    if (existingUser) {
      const field = existingUser.email === email ? 'ایمیل' : 'نام کاربری';
      const fieldEn = existingUser.email === email ? 'email' : 'username';
      
      return res.status(400).json({
        success: false,
        error: {
          message: `این ${field} قبلاً ثبت شده است`,
          englishMessage: `This ${fieldEn} is already registered`
        }
      });
    }

    // Validate age
    const birthDateObj = new Date(birthDate);
    const age = Math.floor((Date.now() - birthDateObj.getTime()) / (365.25 * 24 * 60 * 60 * 1000));
    
    if (age < 13) {
      return res.status(400).json({
        success: false,
        error: {
          message: 'حداقل سن مجاز ۱۳ سال است',
          englishMessage: 'Minimum age requirement is 13 years'
        }
      });
    }

    // Create user
    const user = await User.create({
      username,
      email,
      password,
      displayName,
      gender,
      birthDate: birthDateObj,
      country: country || 'IR',
      registrationIP: req.ip
    });

    // Generate email verification token
    const verificationToken = user.getEmailVerificationToken();
    await user.save({ validateBeforeSave: false });

    // Log registration
    logger.info(`New user registered: ${user.username} (${user.email})`);

    // TODO: Send verification email
    
    sendTokenResponse(user, 201, res);
    
  } catch (error) {
    logger.error('Registration error:', error);
    next(error);
  }
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
const login = async (req, res, next) => {
  try {
    const { login, password } = req.body;

    // Validate input
    if (!login || !password) {
      return res.status(400).json({
        success: false,
        error: {
          message: 'لطفاً ایمیل/نام کاربری و رمز عبور را وارد کنید',
          englishMessage: 'Please provide email/username and password'
        }
      });
    }

    // Find user by email or username (include password for comparison)
    const user = await User.findOne({
      $or: [
        { email: login.toLowerCase() },
        { username: login }
      ]
    }).select('+password');

    if (!user) {
      return res.status(401).json({
        success: false,
        error: {
          message: 'اطلاعات ورود نامعتبر است',
          englishMessage: 'Invalid login credentials'
        }
      });
    }

    // Check if account is locked
    if (user.isLocked) {
      return res.status(423).json({
        success: false,
        error: {
          message: 'حساب شما به دلیل تلاش‌های ناموفق زیاد قفل شده است',
          englishMessage: 'Account locked due to too many failed login attempts'
        }
      });
    }

    // Check password
    const isMatch = await user.matchPassword(password);

    if (!isMatch) {
      await user.incLoginAttempts();
      
      return res.status(401).json({
        success: false,
        error: {
          message: 'اطلاعات ورود نامعتبر است',
          englishMessage: 'Invalid login credentials'
        }
      });
    }

    // Check if user is banned
    if (user.status === 'banned') {
      return res.status(403).json({
        success: false,
        error: {
          message: 'حساب شما مسدود شده است',
          englishMessage: 'Your account has been banned'
        }
      });
    }

    // Reset login attempts on successful login
    await user.resetLoginAttempts();

    // Update last login info
    user.lastLoginIP = req.ip;
    user.lastActive = new Date();
    await user.save({ validateBeforeSave: false });

    // Log successful login
    logger.info(`User login: ${user.username} from IP ${req.ip}`);

    sendTokenResponse(user, 200, res);
    
  } catch (error) {
    logger.error('Login error:', error);
    next(error);
  }
};

// @desc    Get current logged in user
// @route   GET /api/auth/me
// @access  Private
const getMe = async (req, res, next) => {
  try {
    const user = req.user;
    
    res.status(200).json({
      success: true,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        displayName: user.displayName,
        avatar: user.avatar,
        role: user.role,
        status: user.status,
        gender: user.gender,
        age: user.age,
        country: user.country,
        language: user.language,
        subscription: user.subscription,
        preferences: user.preferences,
        stats: user.stats,
        privacy: user.privacy,
        emailVerified: user.emailVerification.isVerified,
        twoFactorEnabled: user.twoFactor.enabled,
        createdAt: user.createdAt,
        lastActive: user.lastActive
      }
    });
    
  } catch (error) {
    logger.error('Get me error:', error);
    next(error);
  }
};

// @desc    Update user profile
// @route   PUT /api/auth/profile
// @access  Private
const updateProfile = async (req, res, next) => {
  try {
    const allowedUpdates = [
      'displayName', 'avatar', 'country', 'language', 'preferences', 'privacy'
    ];
    
    const updates = {};
    
    // Only include allowed updates
    Object.keys(req.body).forEach(key => {
      if (allowedUpdates.includes(key)) {
        updates[key] = req.body[key];
      }
    });

    const user = await User.findByIdAndUpdate(
      req.user.id,
      updates,
      {
        new: true,
        runValidators: true
      }
    );

    logger.info(`User profile updated: ${user.username}`);

    res.status(200).json({
      success: true,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        displayName: user.displayName,
        avatar: user.avatar,
        role: user.role,
        status: user.status,
        subscription: user.subscription,
        preferences: user.preferences,
        privacy: user.privacy
      }
    });
    
  } catch (error) {
    logger.error('Update profile error:', error);
    next(error);
  }
};

// @desc    Change password
// @route   PUT /api/auth/password
// @access  Private
const changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        error: {
          message: 'لطفاً رمز عبور فعلی و جدید را وارد کنید',
          englishMessage: 'Please provide current and new password'
        }
      });
    }

    // Get user with password
    const user = await User.findById(req.user.id).select('+password');

    // Check current password
    const isMatch = await user.matchPassword(currentPassword);
    
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        error: {
          message: 'رمز عبور فعلی اشتباه است',
          englishMessage: 'Current password is incorrect'
        }
      });
    }

    // Update password
    user.password = newPassword;
    await user.save();

    logger.info(`Password changed for user: ${user.username}`);

    res.status(200).json({
      success: true,
      message: {
        message: 'رمز عبور با موفقیت تغییر یافت',
        englishMessage: 'Password changed successfully'
      }
    });
    
  } catch (error) {
    logger.error('Change password error:', error);
    next(error);
  }
};

// @desc    Forgot password
// @route   POST /api/auth/forgot-password
// @access  Public
const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        error: {
          message: 'لطفاً ایمیل خود را وارد کنید',
          englishMessage: 'Please provide your email'
        }
      });
    }

    const user = await User.findOne({ email: email.toLowerCase() });

    if (!user) {
      return res.status(404).json({
        success: false,
        error: {
          message: 'کاربری با این ایمیل یافت نشد',
          englishMessage: 'User not found with this email'
        }
      });
    }

    // Generate reset token
    const resetToken = user.getResetPasswordToken();
    await user.save({ validateBeforeSave: false });

    // TODO: Send reset email
    
    logger.info(`Password reset requested for: ${user.email}`);

    res.status(200).json({
      success: true,
      message: {
        message: 'ایمیل بازیابی رمز عبور ارسال شد',
        englishMessage: 'Password reset email sent'
      }
    });
    
  } catch (error) {
    logger.error('Forgot password error:', error);
    next(error);
  }
};

// @desc    Reset password
// @route   POST /api/auth/reset-password/:resettoken
// @access  Public
const resetPassword = async (req, res, next) => {
  try {
    const { password } = req.body;
    
    if (!password) {
      return res.status(400).json({
        success: false,
        error: {
          message: 'لطفاً رمز عبور جدید را وارد کنید',
          englishMessage: 'Please provide new password'
        }
      });
    }

    // Get hashed token
    const resetPasswordToken = crypto
      .createHash('sha256')
      .update(req.params.resettoken)
      .digest('hex');

    const user = await User.findOne({
      'passwordReset.resetToken': resetPasswordToken,
      'passwordReset.resetExpires': { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        error: {
          message: 'توکن بازیابی نامعتبر یا منقضی شده است',
          englishMessage: 'Invalid or expired reset token'
        }
      });
    }

    // Set new password
    user.password = password;
    user.passwordReset.resetToken = undefined;
    user.passwordReset.resetExpires = undefined;
    await user.save();

    logger.info(`Password reset completed for: ${user.email}`);

    sendTokenResponse(user, 200, res);
    
  } catch (error) {
    logger.error('Reset password error:', error);
    next(error);
  }
};

// @desc    Verify email
// @route   POST /api/auth/verify-email/:token
// @access  Public
const verifyEmail = async (req, res, next) => {
  try {
    // Get hashed token
    const verificationToken = crypto
      .createHash('sha256')
      .update(req.params.token)
      .digest('hex');

    const user = await User.findOne({
      'emailVerification.verificationToken': verificationToken,
      'emailVerification.verificationExpires': { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        error: {
          message: 'توکن تأیید ایمیل نامعتبر یا منقضی شده است',
          englishMessage: 'Invalid or expired email verification token'
        }
      });
    }

    // Verify email
    user.emailVerification.isVerified = true;
    user.emailVerification.verificationToken = undefined;
    user.emailVerification.verificationExpires = undefined;
    user.status = 'active'; // Activate account
    await user.save({ validateBeforeSave: false });

    logger.info(`Email verified for user: ${user.email}`);

    res.status(200).json({
      success: true,
      message: {
        message: 'ایمیل با موفقیت تأیید شد',
        englishMessage: 'Email verified successfully'
      }
    });
    
  } catch (error) {
    logger.error('Email verification error:', error);
    next(error);
  }
};

// @desc    Resend verification email
// @route   POST /api/auth/resend-verification
// @access  Private
const resendVerification = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);

    if (user.emailVerification.isVerified) {
      return res.status(400).json({
        success: false,
        error: {
          message: 'ایمیل شما قبلاً تأیید شده است',
          englishMessage: 'Your email is already verified'
        }
      });
    }

    // Generate new verification token
    const verificationToken = user.getEmailVerificationToken();
    await user.save({ validateBeforeSave: false });

    // TODO: Send verification email

    logger.info(`Verification email resent to: ${user.email}`);

    res.status(200).json({
      success: true,
      message: {
        message: 'ایمیل تأیید مجدداً ارسال شد',
        englishMessage: 'Verification email resent'
      }
    });
    
  } catch (error) {
    logger.error('Resend verification error:', error);
    next(error);
  }
};

module.exports = {
  register,
  login,
  getMe,
  updateProfile,
  changePassword,
  forgotPassword,
  resetPassword,
  verifyEmail,
  resendVerification
};
