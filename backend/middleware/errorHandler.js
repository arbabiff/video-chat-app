const logger = require('../utils/logger');

const errorHandler = (error, req, res, next) => {
  let customError = {
    statusCode: error.statusCode || 500,
    message: error.message || 'خطای سرور داخلی',
    englishMessage: error.message || 'Internal Server Error'
  };

  // Log the error
  logger.error(`${req.method} ${req.path} - ${error.message}`, {
    error: error.stack,
    user: req.user?.id,
    ip: req.ip,
    userAgent: req.get('User-Agent')
  });

  // Mongoose validation error
  if (error.name === 'ValidationError') {
    const message = Object.values(error.errors).map(val => val.message).join(', ');
    customError.message = message;
    customError.englishMessage = message;
    customError.statusCode = 400;
  }

  // Mongoose duplicate error
  if (error.code && error.code === 11000) {
    const field = Object.keys(error.keyValue)[0];
    const value = Object.values(error.keyValue)[0];
    customError.message = `${field} با مقدار ${value} قبلاً ثبت شده است`;
    customError.englishMessage = `${field} with value ${value} already exists`;
    customError.statusCode = 400;
  }

  // Mongoose cast error
  if (error.name === 'CastError') {
    customError.message = 'منبع مورد نظر یافت نشد';
    customError.englishMessage = 'Resource not found';
    customError.statusCode = 404;
  }

  // JWT errors
  if (error.name === 'JsonWebTokenError') {
    customError.message = 'توکن نامعتبر است';
    customError.englishMessage = 'Invalid token';
    customError.statusCode = 401;
  }

  if (error.name === 'TokenExpiredError') {
    customError.message = 'توکن منقضی شده است';
    customError.englishMessage = 'Token expired';
    customError.statusCode = 401;
  }

  // File upload errors
  if (error.code === 'LIMIT_FILE_SIZE') {
    customError.message = 'حجم فایل از حد مجاز بیشتر است';
    customError.englishMessage = 'File size exceeds the limit';
    customError.statusCode = 400;
  }

  // Rate limit errors
  if (error.status === 429) {
    customError.message = 'درخواست‌های زیادی ارسال کرده‌اید، لطفاً کمی صبر کنید';
    customError.englishMessage = 'Too many requests, please try again later';
    customError.statusCode = 429;
  }

  // Payment errors
  if (error.type === 'StripeCardError') {
    customError.message = 'خطا در پردازش پرداخت: ' + error.message;
    customError.englishMessage = 'Payment processing error: ' + error.message;
    customError.statusCode = 402;
  }

  res.status(customError.statusCode).json({
    success: false,
    error: {
      message: customError.message,
      englishMessage: customError.englishMessage,
      ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
    }
  });
};

module.exports = errorHandler;
