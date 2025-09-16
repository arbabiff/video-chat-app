const jwt = require('jsonwebtoken');
const User = require('../models/User');
const logger = require('../utils/logger');

const auth = async (req, res, next) => {
  try {
    // Get token from header
    const authHeader = req.header('Authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        error: {
          message: 'دسترسی مجاز نیست. توکن احراز هویت ارائه نشده',
          englishMessage: 'Access denied. No authentication token provided'
        }
      });
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Get user from database
    const user = await User.findById(decoded.id).select('-password');
    
    if (!user) {
      return res.status(401).json({
        success: false,
        error: {
          message: 'توکن نامعتبر است',
          englishMessage: 'Invalid token'
        }
      });
    }

    // Check if user is active
    if (user.status !== 'active') {
      return res.status(403).json({
        success: false,
        error: {
          message: 'حساب کاربری شما غیرفعال است',
          englishMessage: 'Your account is inactive'
        }
      });
    }

    // Add user to request object
    req.user = user;
    
    // Log successful authentication
    logger.info(`User ${user._id} authenticated for ${req.method} ${req.path}`);
    
    next();
  } catch (error) {
    logger.error('Authentication error:', error);
    
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        error: {
          message: 'توکن نامعتبر است',
          englishMessage: 'Invalid token'
        }
      });
    }
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        error: {
          message: 'توکن منقضی شده است',
          englishMessage: 'Token expired'
        }
      });
    }
    
    res.status(500).json({
      success: false,
      error: {
        message: 'خطای سرور در احراز هویت',
        englishMessage: 'Server error in authentication'
      }
    });
  }
};

// Middleware for admin access
const adminAuth = async (req, res, next) => {
  try {
    // First run regular auth
    await auth(req, res, () => {
      // Check if user is admin
      if (req.user.role !== 'admin') {
        return res.status(403).json({
          success: false,
          error: {
            message: 'دسترسی مجاز نیست. نیاز به مجوز ادمین',
            englishMessage: 'Access denied. Admin privileges required'
          }
        });
      }
      next();
    });
  } catch (error) {
    next(error);
  }
};

// Middleware for moderator access
const moderatorAuth = async (req, res, next) => {
  try {
    await auth(req, res, () => {
      if (!['admin', 'moderator'].includes(req.user.role)) {
        return res.status(403).json({
          success: false,
          error: {
            message: 'دسترسی مجاز نیست. نیاز به مجوز مدیریت',
            englishMessage: 'Access denied. Moderator privileges required'
          }
        });
      }
      next();
    });
  } catch (error) {
    next(error);
  }
};

// Optional auth - doesn't throw error if no token
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.header('Authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next();
    }

    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select('-password');
    
    if (user && user.status === 'active') {
      req.user = user;
    }
    
    next();
  } catch (error) {
    // Continue without authentication
    next();
  }
};

module.exports = {
  auth,
  adminAuth,
  moderatorAuth,
  optionalAuth
};
