/* eslint-disable no-console */
require('dotenv').config();
const connectDB = require('../config/database');
const User = require('../models/User');

(async () => {
  try {
    await connectDB();

    const NODE_ENV = process.env.NODE_ENV || 'development';

    const ADMIN_USERNAME = process.env.ADMIN_USERNAME || 'admin';
    const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@example.com';
    const ADMIN_DISPLAY_NAME = process.env.ADMIN_DISPLAY_NAME || 'Administrator';
    // In non-production, default to 'admin' if not provided; in production require explicit var
    const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || (NODE_ENV !== 'production' ? 'admin' : null);

    if (!ADMIN_PASSWORD) {
      console.error('[seedAdmin] ADMIN_PASSWORD is required in production. Aborting.');
      process.exit(1);
    }

    // Try to find any existing admin or the target username/email
    let user = await User.findOne({
      $or: [
        { username: ADMIN_USERNAME },
        { email: ADMIN_EMAIL.toLowerCase() }
      ]
    }).select('+password');

    if (user) {
      // Update existing user to admin
      user.username = ADMIN_USERNAME;
      user.email = ADMIN_EMAIL.toLowerCase();
      user.displayName = ADMIN_DISPLAY_NAME;
      user.role = 'admin';
      user.status = 'active';
      user.gender = user.gender || 'other';
      user.birthDate = user.birthDate || new Date('1990-01-01');
      user.language = user.language || 'fa';
      user.country = user.country || 'IR';
      user.emailVerification = user.emailVerification || {};
      user.emailVerification.isVerified = true;
      // Set new password (will be hashed by pre-save hook)
      user.password = ADMIN_PASSWORD;
      await user.save();
      console.log(`[seedAdmin] Updated existing admin user -> username: ${user.username}, email: ${user.email}`);
    } else {
      // Create new admin
      user = await User.create({
        username: ADMIN_USERNAME,
        email: ADMIN_EMAIL.toLowerCase(),
        password: ADMIN_PASSWORD,
        displayName: ADMIN_DISPLAY_NAME,
        role: 'admin',
        status: 'active',
        gender: 'other',
        birthDate: new Date('1990-01-01'),
        country: 'IR',
        language: 'fa',
        emailVerification: { isVerified: true }
      });
      console.log(`[seedAdmin] Created admin user -> username: ${user.username}, email: ${user.email}`);
    }

    console.log('[seedAdmin] Done.');
    process.exit(0);
  } catch (err) {
    console.error('[seedAdmin] Error:', err?.message || err);
    process.exit(1);
  }
})();