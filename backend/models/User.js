const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: [true, 'نام کاربری الزامی است'],
    unique: true,
    trim: true,
    minlength: [3, 'نام کاربری باید حداقل ۳ کاراکتر باشد'],
    maxlength: [30, 'نام کاربری نباید بیش از ۳۰ کاراکتر باشد'],
    match: [/^[a-zA-Z0-9_.-]+$/, 'نام کاربری فقط می‌تواند شامل حروف انگلیسی، اعداد و علائم _ . - باشد']
  },
  
  email: {
    type: String,
    required: [true, 'ایمیل الزامی است'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'لطفاً یک ایمیل معتبر وارد کنید']
  },
  
  password: {
    type: String,
    required: [true, 'رمز عبور الزامی است'],
    minlength: [6, 'رمز عبور باید حداقل ۶ کاراکتر باشد'],
    select: false // Don't include password in queries by default
  },
  
  displayName: {
    type: String,
    required: [true, 'نام نمایشی الزامی است'],
    trim: true,
    maxlength: [50, 'نام نمایشی نباید بیش از ۵۰ کاراکتر باشد']
  },
  
  avatar: {
    type: String,
    default: null
  },
  
  role: {
    type: String,
    enum: ['user', 'moderator', 'admin'],
    default: 'user'
  },
  
  status: {
    type: String,
    enum: ['active', 'inactive', 'banned', 'pending'],
    default: 'pending'
  },
  
  gender: {
    type: String,
    enum: ['male', 'female', 'other'],
    required: [true, 'جنسیت الزامی است']
  },
  
  birthDate: {
    type: Date,
    required: [true, 'تاریخ تولد الزامی است'],
    validate: {
      validator: function(date) {
        const age = Math.floor((Date.now() - date.getTime()) / (365.25 * 24 * 60 * 60 * 1000));
        return age >= 13; // Minimum age requirement
      },
      message: 'حداقل سن مجاز ۱۳ سال است'
    }
  },
  
  country: {
    type: String,
    default: 'IR' // Default to Iran
  },
  
  language: {
    type: String,
    enum: ['fa', 'en'],
    default: 'fa'
  },
  
  // Video chat preferences
  preferences: {
    ageRange: {
      min: {
        type: Number,
        default: 18,
        min: 13
      },
      max: {
        type: Number,
        default: 100,
        max: 120
      }
    },
    genderPreference: {
      type: String,
      enum: ['male', 'female', 'both'],
      default: 'both'
    },
    allowLocation: {
      type: Boolean,
      default: false
    }
  },
  
  // Subscription info
  subscription: {
    type: {
      type: String,
      enum: ['free', 'premium', 'vip'],
      default: 'free'
    },
    expiresAt: Date,
    autoRenew: {
      type: Boolean,
      default: false
    }
  },
  
  // Statistics
  stats: {
    totalChats: {
      type: Number,
      default: 0
    },
    totalMinutes: {
      type: Number,
      default: 0
    },
    averageRating: {
      type: Number,
      default: 0
    },
    reportCount: {
      type: Number,
      default: 0
    }
  },
  
  // Email verification
  emailVerification: {
    isVerified: {
      type: Boolean,
      default: false
    },
    verificationToken: String,
    verificationExpires: Date
  },
  
  // Password reset
  passwordReset: {
    resetToken: String,
    resetExpires: Date
  },
  
  // Two-factor authentication
  twoFactor: {
    enabled: {
      type: Boolean,
      default: false
    },
    secret: String,
    backupCodes: [String]
  },
  
  // Security
  loginAttempts: {
    type: Number,
    default: 0
  },
  lockUntil: Date,
  
  // Privacy settings
  privacy: {
    showOnline: {
      type: Boolean,
      default: true
    },
    allowMessages: {
      type: Boolean,
      default: true
    },
    profileVisibility: {
      type: String,
      enum: ['public', 'friends', 'private'],
      default: 'public'
    }
  },
  
  // Last activity
  lastActive: {
    type: Date,
    default: Date.now
  },
  
  // IP tracking for security
  lastLoginIP: String,
  registrationIP: String,
  
  // Blocked users
  blockedUsers: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  
  // Friend requests and friends
  friends: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    addedAt: {
      type: Date,
      default: Date.now
    }
  }],
  
  friendRequests: [{
    from: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    sentAt: {
      type: Date,
      default: Date.now
    }
  }],
  
  // Device tokens for push notifications
  deviceTokens: [{
    token: String,
    platform: {
      type: String,
      enum: ['ios', 'android', 'web']
    },
    addedAt: {
      type: Date,
      default: Date.now
    }
  }]
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for user age
userSchema.virtual('age').get(function() {
  if (this.birthDate) {
    return Math.floor((Date.now() - this.birthDate.getTime()) / (365.25 * 24 * 60 * 60 * 1000));
  }
  return null;
});

// Virtual for account lock status
userSchema.virtual('isLocked').get(function() {
  return !!(this.lockUntil && this.lockUntil > Date.now());
});

// Indexes for better performance
userSchema.index({ email: 1 });
userSchema.index({ username: 1 });
userSchema.index({ status: 1 });
userSchema.index({ lastActive: -1 });
userSchema.index({ 'subscription.type': 1 });
userSchema.index({ createdAt: -1 });

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) {
    return next();
  }
  
  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Update lastActive on save
userSchema.pre('save', function(next) {
  if (this.isNew || this.isModified()) {
    this.lastActive = new Date();
  }
  next();
});

// Instance method to check password
userSchema.methods.matchPassword = async function(enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Generate JWT token
userSchema.methods.getSignedJwtToken = function() {
  return jwt.sign(
    { 
      id: this._id,
      role: this.role,
      subscription: this.subscription.type
    },
    process.env.JWT_SECRET,
    {
      expiresIn: process.env.JWT_EXPIRE || '7d'
    }
  );
};

// Generate email verification token
userSchema.methods.getEmailVerificationToken = function() {
  const crypto = require('crypto');
  const verificationToken = crypto.randomBytes(20).toString('hex');
  
  this.emailVerification.verificationToken = crypto
    .createHash('sha256')
    .update(verificationToken)
    .digest('hex');
  
  this.emailVerification.verificationExpires = Date.now() + 24 * 60 * 60 * 1000; // 24 hours
  
  return verificationToken;
};

// Generate password reset token
userSchema.methods.getResetPasswordToken = function() {
  const crypto = require('crypto');
  const resetToken = crypto.randomBytes(20).toString('hex');
  
  this.passwordReset.resetToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');
  
  this.passwordReset.resetExpires = Date.now() + 10 * 60 * 1000; // 10 minutes
  
  return resetToken;
};

// Increment login attempts
userSchema.methods.incLoginAttempts = function() {
  // If previous attempt was more than 2 hours ago, reset attempts
  if (this.lockUntil && this.lockUntil < Date.now()) {
    return this.updateOne({
      $unset: { lockUntil: 1 },
      $set: { loginAttempts: 1 }
    });
  }
  
  const updates = { $inc: { loginAttempts: 1 } };
  
  // Lock account after 5 failed attempts for 2 hours
  if (this.loginAttempts + 1 >= 5 && !this.isLocked) {
    updates.$set = { lockUntil: Date.now() + 2 * 60 * 60 * 1000 }; // 2 hours
  }
  
  return this.updateOne(updates);
};

// Reset login attempts
userSchema.methods.resetLoginAttempts = function() {
  return this.updateOne({
    $unset: {
      loginAttempts: 1,
      lockUntil: 1
    }
  });
};

// Static method to find users for matching
userSchema.statics.findMatchingUsers = function(user, limit = 10) {
  const query = {
    _id: { $ne: user._id },
    status: 'active',
    blockedUsers: { $nin: [user._id] },
    _id: { $nin: user.blockedUsers }
  };
  
  // Apply gender preference
  if (user.preferences.genderPreference !== 'both') {
    query.gender = user.preferences.genderPreference;
  }
  
  // Apply age range preference
  const minDate = new Date();
  minDate.setFullYear(minDate.getFullYear() - user.preferences.ageRange.max);
  const maxDate = new Date();
  maxDate.setFullYear(maxDate.getFullYear() - user.preferences.ageRange.min);
  
  query.birthDate = {
    $gte: minDate,
    $lte: maxDate
  };
  
  return this.find(query)
    .select('username displayName avatar age country lastActive')
    .limit(limit)
    .sort({ lastActive: -1 });
};

module.exports = mongoose.model('User', userSchema);
