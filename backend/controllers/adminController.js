const User = require('../models/User');
const logger = require('../utils/logger');

// @desc    Get dashboard statistics
// @route   GET /api/admin/dashboard
// @access  Private (Admin)
const getDashboardStats = async (req, res, next) => {
  try {
    const now = new Date();
    const lastMonth = new Date(now.setMonth(now.getMonth() - 1));
    
    // Get various statistics
    const [
      totalUsers,
      activeUsers,
      newUsersThisMonth,
      bannedUsers,
      premiumUsers,
      onlineUsers
    ] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ status: 'active' }),
      User.countDocuments({ createdAt: { $gte: lastMonth } }),
      User.countDocuments({ status: 'banned' }),
      User.countDocuments({ 'subscription.type': { $in: ['premium', 'vip'] } }),
      User.countDocuments({ 
        lastActive: { $gte: new Date(Date.now() - 5 * 60 * 1000) },
        status: 'active'
      })
    ]);

    // Get user registration trend (last 7 days)
    const registrationTrend = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const startOfDay = new Date(date.setHours(0, 0, 0, 0));
      const endOfDay = new Date(date.setHours(23, 59, 59, 999));
      
      const count = await User.countDocuments({
        createdAt: { $gte: startOfDay, $lte: endOfDay }
      });
      
      registrationTrend.push({
        date: startOfDay.toISOString().split('T')[0],
        count
      });
    }

    // Get top countries
    const topCountries = await User.aggregate([
      { $match: { status: 'active' } },
      { $group: { _id: '$country', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 5 }
    ]);

    res.status(200).json({
      success: true,
      stats: {
        overview: {
          totalUsers,
          activeUsers,
          newUsersThisMonth,
          bannedUsers,
          premiumUsers,
          onlineUsers
        },
        registrationTrend,
        topCountries: topCountries.map(item => ({
          country: item._id,
          count: item.count
        }))
      }
    });

  } catch (error) {
    logger.error('Get dashboard stats error:', error);
    next(error);
  }
};

// @desc    Get all users with pagination
// @route   GET /api/admin/users
// @access  Private (Admin)
const getUsers = async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 20,
      status,
      role,
      subscription,
      search,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    // Build query
    const query = {};
    
    if (status) query.status = status;
    if (role) query.role = role;
    if (subscription) query['subscription.type'] = subscription;
    
    if (search) {
      query.$or = [
        { username: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { displayName: { $regex: search, $options: 'i' } }
      ];
    }

    // Pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const limitNum = parseInt(limit) > 100 ? 100 : parseInt(limit);

    // Sort
    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    const [users, totalCount] = await Promise.all([
      User.find(query)
        .select('-password -passwordReset -emailVerification -twoFactor -deviceTokens')
        .skip(skip)
        .limit(limitNum)
        .sort(sort),
      User.countDocuments(query)
    ]);

    const formattedUsers = users.map(user => ({
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
      subscription: user.subscription,
      stats: user.stats,
      emailVerified: user.emailVerification.isVerified,
      createdAt: user.createdAt,
      lastActive: user.lastActive
    }));

    res.status(200).json({
      success: true,
      users: formattedUsers,
      pagination: {
        page: parseInt(page),
        limit: limitNum,
        totalPages: Math.ceil(totalCount / limitNum),
        totalCount,
        hasNext: skip + users.length < totalCount,
        hasPrev: page > 1
      }
    });

  } catch (error) {
    logger.error('Get users error:', error);
    next(error);
  }
};

// @desc    Get user details by ID
// @route   GET /api/admin/users/:id
// @access  Private (Admin)
const getUserDetails = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id)
      .select('-password -passwordReset -twoFactor.secret -twoFactor.backupCodes')
      .populate('blockedUsers', 'username displayName')
      .populate('friends.user', 'username displayName')
      .populate('friendRequests.from', 'username displayName');

    if (!user) {
      return res.status(404).json({
        success: false,
        error: {
          message: 'کاربر یافت نشد',
          englishMessage: 'User not found'
        }
      });
    }

    res.status(200).json({
      success: true,
      user
    });

  } catch (error) {
    logger.error('Get user details error:', error);
    next(error);
  }
};

// @desc    Update user status
// @route   PUT /api/admin/users/:id/status
// @access  Private (Admin)
const updateUserStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    const userId = req.params.id;

    if (!['active', 'inactive', 'banned', 'pending'].includes(status)) {
      return res.status(400).json({
        success: false,
        error: {
          message: 'وضعیت نامعتبر است',
          englishMessage: 'Invalid status'
        }
      });
    }

    const user = await User.findByIdAndUpdate(
      userId,
      { status },
      { new: true }
    ).select('username email status');

    if (!user) {
      return res.status(404).json({
        success: false,
        error: {
          message: 'کاربر یافت نشد',
          englishMessage: 'User not found'
        }
      });
    }

    logger.info(`User status updated: ${user.username} status changed to ${status} by admin ${req.user.username}`);

    res.status(200).json({
      success: true,
      message: {
        message: 'وضعیت کاربر به‌روزرسانی شد',
        englishMessage: 'User status updated successfully'
      },
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        status: user.status
      }
    });

  } catch (error) {
    logger.error('Update user status error:', error);
    next(error);
  }
};

// @desc    Update user role
// @route   PUT /api/admin/users/:id/role
// @access  Private (Admin)
const updateUserRole = async (req, res, next) => {
  try {
    const { role } = req.body;
    const userId = req.params.id;

    if (!['user', 'moderator', 'admin'].includes(role)) {
      return res.status(400).json({
        success: false,
        error: {
          message: 'نقش نامعتبر است',
          englishMessage: 'Invalid role'
        }
      });
    }

    // Prevent changing own role
    if (userId === req.user.id) {
      return res.status(400).json({
        success: false,
        error: {
          message: 'نمی‌توانید نقش خودتان را تغییر دهید',
          englishMessage: 'Cannot change your own role'
        }
      });
    }

    const user = await User.findByIdAndUpdate(
      userId,
      { role },
      { new: true }
    ).select('username email role');

    if (!user) {
      return res.status(404).json({
        success: false,
        error: {
          message: 'کاربر یافت نشد',
          englishMessage: 'User not found'
        }
      });
    }

    logger.info(`User role updated: ${user.username} role changed to ${role} by admin ${req.user.username}`);

    res.status(200).json({
      success: true,
      message: {
        message: 'نقش کاربر به‌روزرسانی شد',
        englishMessage: 'User role updated successfully'
      },
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role
      }
    });

  } catch (error) {
    logger.error('Update user role error:', error);
    next(error);
  }
};

// @desc    Delete user account
// @route   DELETE /api/admin/users/:id
// @access  Private (Admin)
const deleteUser = async (req, res, next) => {
  try {
    const userId = req.params.id;

    // Prevent deleting own account
    if (userId === req.user.id) {
      return res.status(400).json({
        success: false,
        error: {
          message: 'نمی‌توانید حساب خودتان را حذف کنید',
          englishMessage: 'Cannot delete your own account'
        }
      });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        error: {
          message: 'کاربر یافت نشد',
          englishMessage: 'User not found'
        }
      });
    }

    // Remove user from other users' friends lists and blocked lists
    await User.updateMany(
      { 
        $or: [
          { 'friends.user': userId },
          { 'friendRequests.from': userId },
          { blockedUsers: userId }
        ]
      },
      { 
        $pull: { 
          friends: { user: userId },
          friendRequests: { from: userId },
          blockedUsers: userId
        }
      }
    );

    // Delete the user
    await User.findByIdAndDelete(userId);

    logger.warn(`User deleted: ${user.username} (${user.email}) deleted by admin ${req.user.username}`);

    res.status(200).json({
      success: true,
      message: {
        message: 'حساب کاربری حذف شد',
        englishMessage: 'User account deleted successfully'
      }
    });

  } catch (error) {
    logger.error('Delete user error:', error);
    next(error);
  }
};

// @desc    Send message to user
// @route   POST /api/admin/users/:id/message
// @access  Private (Admin)
const sendMessageToUser = async (req, res, next) => {
  try {
    const { message, type = 'info' } = req.body;
    const userId = req.params.id;

    if (!message || message.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: {
          message: 'پیام نمی‌تواند خالی باشد',
          englishMessage: 'Message cannot be empty'
        }
      });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        error: {
          message: 'کاربر یافت نشد',
          englishMessage: 'User not found'
        }
      });
    }

    // In a real application, you would store this message in a notifications/messages model
    // For now, we'll just log it
    logger.info(`Admin message sent to user: ${req.user.username} sent message to ${user.username}`, {
      adminId: req.user.id,
      userId: userId,
      message: message.trim(),
      type
    });

    res.status(200).json({
      success: true,
      message: {
        message: 'پیام ارسال شد',
        englishMessage: 'Message sent successfully'
      }
    });

  } catch (error) {
    logger.error('Send message to user error:', error);
    next(error);
  }
};

// @desc    Get system health information
// @route   GET /api/admin/system/health
// @access  Private (Admin)
const getSystemHealth = async (req, res, next) => {
  try {
    const uptime = process.uptime();
    const memoryUsage = process.memoryUsage();
    const cpuUsage = process.cpuUsage();

    const health = {
      status: 'healthy',
      uptime: {
        seconds: Math.floor(uptime),
        formatted: `${Math.floor(uptime / 3600)}h ${Math.floor((uptime % 3600) / 60)}m ${Math.floor(uptime % 60)}s`
      },
      memory: {
        rss: Math.round(memoryUsage.rss / 1024 / 1024), // MB
        heapTotal: Math.round(memoryUsage.heapTotal / 1024 / 1024), // MB
        heapUsed: Math.round(memoryUsage.heapUsed / 1024 / 1024), // MB
        external: Math.round(memoryUsage.external / 1024 / 1024) // MB
      },
      cpu: {
        user: cpuUsage.user,
        system: cpuUsage.system
      },
      environment: process.env.NODE_ENV || 'development',
      nodeVersion: process.version,
      timestamp: new Date().toISOString()
    };

    res.status(200).json({
      success: true,
      health
    });

  } catch (error) {
    logger.error('Get system health error:', error);
    next(error);
  }
};

// @desc    Get system logs (recent logs)
// @route   GET /api/admin/system/logs
// @access  Private (Admin)
const getSystemLogs = async (req, res, next) => {
  try {
    const { level = 'info', limit = 100 } = req.query;
    
    // In a real application, you would read from log files or log database
    // For now, we'll return a sample response
    res.status(200).json({
      success: true,
      logs: [],
      message: {
        message: 'عملکرد لاگ‌ها در محیط واقعی پیاده‌سازی خواهد شد',
        englishMessage: 'Log functionality will be implemented in production environment'
      }
    });

  } catch (error) {
    logger.error('Get system logs error:', error);
    next(error);
  }
};

module.exports = {
  getDashboardStats,
  getUsers,
  getUserDetails,
  updateUserStatus,
  updateUserRole,
  deleteUser,
  sendMessageToUser,
  getSystemHealth,
  getSystemLogs
};
