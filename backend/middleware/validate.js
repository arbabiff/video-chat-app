const { validationResult } = require('express-validator');

const validate = (req, res, next) => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    // Format errors for consistent response
    const formattedErrors = errors.array().map(error => ({
      field: error.path || error.param,
      message: error.msg,
      value: error.value
    }));
    
    return res.status(400).json({
      success: false,
      error: {
        message: 'اطلاعات ورودی نامعتبر است',
        englishMessage: 'Validation failed',
        details: formattedErrors
      }
    });
  }
  
  next();
};

module.exports = { validate };
