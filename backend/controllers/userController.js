const User = require('../models/User');
const logger = require('../utils/logger');

// @desc    Get user profile by ID
// @route   GET /api/users/:id
// @access  Private
const getUserProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id)
      .select('-password -passwordReset -emailVerification -twoFactor -deviceTokens -lastLoginIP -registrationIP');

    if (!user) {
      return res.status(404).json({
        success: false,
        error: {
          message: 'کاربر یافت نشد',
          englishMessage: 'User not found'
        }
      });
    }

    // Check privacy settings
    if (user.privacy.profileVisibility === 'private' && 
        user._id.toString() !== req.user.id && 
        !req.user.role.includes('admin') && 
        !req.user.role.includes('moderator')) {
      return res.status(403).json({
        success: false,
        error: {
          message: 'دسترسی به پروفایل این کاربر محدود است',
          englishMessage: 'Access to this user profile is restricted'
        }
      });
    }

    // Check if users are friends for friends-only visibility
    if (user.privacy.profileVisibility === 'friends' && 
        user._id.toString() !== req.user.id && 
        !req.user.role.includes('admin') && 
        !req.user.role.includes('moderator')) {
      const isFriend = user.friends.some(friend => 
        friend.user.toString() === req.user.id
      );
      
      if (!isFriend) {
        return res.status(403).json({
          success: false,
          error: {
            message: 'فقط دوستان می‌توانند این پروفایل را مشاهده کنند',
            englishMessage: 'Only friends can view this profile'
          }
        });
      }
    }

    res.status(200).json({
      success: true,
      user: {
        id: user._id,
        username: user.username,
        displayName: user.displayName,
        avatar: user.avatar,
        gender: user.gender,
        age: user.age,
        country: user.country,
        language: user.language,
        stats: user.stats,
        lastActive: user.lastActive,
        createdAt: user.createdAt,
        isOnline: user.privacy.showOnline && (Date.now() - user.lastActive < 5 * 60 * 1000) // 5 minutes
      }
    });

  } catch (error) {
    logger.error('Get user profile error:', error);
    next(error);
  }
};

// @desc    Search users
// @route   GET /api/users/search
// @access  Private
const searchUsers = async (req, res, next) => {
  try {
    const {
      query,
      gender,
      country,
      minAge,
      maxAge,
      page = 1,
      limit = 20
    } = req.query;

    // Build search criteria
    const searchCriteria = {
      status: 'active',
      _id: { $ne: req.user.id },
      blockedUsers: { $nin: [req.user.id] },
      _id: { $nin: req.user.blockedUsers }
    };

    // Text search on username and displayName
    if (query) {
      searchCriteria.$or = [
        { username: { $regex: query, $options: 'i' } },
        { displayName: { $regex: query, $options: 'i' } }
      ];
    }

    // Gender filter
    if (gender && ['male', 'female', 'other'].includes(gender)) {
      searchCriteria.gender = gender;
    }

    // Country filter
    if (country) {
      searchCriteria.country = country.toUpperCase();
    }

    // Age range filter
    if (minAge || maxAge) {
      const now = new Date();
      if (maxAge) {
        const minBirthDate = new Date();
        minBirthDate.setFullYear(now.getFullYear() - maxAge);
        searchCriteria.birthDate = { ...searchCriteria.birthDate, $gte: minBirthDate };
      }
      if (minAge) {
        const maxBirthDate = new Date();
        maxBirthDate.setFullYear(now.getFullYear() - minAge);
        searchCriteria.birthDate = { ...searchCriteria.birthDate, $lte: maxBirthDate };
      }
    }

    // Only show users with public or friends visibility
    // If friends visibility, user must be in their friends list
    searchCriteria.$or = [
      { 'privacy.profileVisibility': 'public' },
      { 
        'privacy.profileVisibility': 'friends',
        'friends.user': req.user.id 
      }
    ];

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const limitNum = parseInt(limit) > 100 ? 100 : parseInt(limit); // Max 100 per page

    const users = await User.find(searchCriteria)
      .select('username displayName avatar gender age country lastActive privacy.showOnline')
      .skip(skip)
      .limit(limitNum)
      .sort({ lastActive: -1 });

    const totalCount = await User.countDocuments(searchCriteria);

    const formattedUsers = users.map(user => ({
      id: user._id,
      username: user.username,
      displayName: user.displayName,
      avatar: user.avatar,
      gender: user.gender,
      age: user.age,
      country: user.country,
      isOnline: user.privacy.showOnline && (Date.now() - user.lastActive < 5 * 60 * 1000),
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
    logger.error('Search users error:', error);
    next(error);
  }
};

// @desc    Find matching users for video chat
// @route   GET /api/users/find-match
// @access  Private
const findMatch = async (req, res, next) => {
  try {
    const currentUser = req.user;
    
    // Check if user has active subscription for premium features
    const isPremium = ['premium', 'vip'].includes(currentUser.subscription.type);
    
    // Use static method from User model
    const matchingUsers = await User.findMatchingUsers(currentUser, isPremium ? 20 : 5);
    
    if (matchingUsers.length === 0) {
      return res.status(200).json({
        success: true,
        users: [],
        message: {
          message: 'در حال حاضر کاربری با تنظیمات شما یافت نشد',
          englishMessage: 'No matching users found with your preferences'
        }
      });
    }

    // Randomize the order for fairness
    const shuffledUsers = matchingUsers.sort(() => Math.random() - 0.5);
    
    const formattedUsers = shuffledUsers.map(user => ({
      id: user._id,
      username: user.username,
      displayName: user.displayName,
      avatar: user.avatar,
      age: user.age,
      country: user.country,
      isOnline: Date.now() - user.lastActive < 5 * 60 * 1000
    }));

    res.status(200).json({
      success: true,
      users: formattedUsers
    });

  } catch (error) {
    logger.error('Find match error:', error);
    next(error);
  }
};

// @desc    Block a user
// @route   POST /api/users/:id/block
// @access  Private
const blockUser = async (req, res, next) => {
  try {
    const userToBlock = req.params.id;
    
    if (userToBlock === req.user.id) {
      return res.status(400).json({
        success: false,
        error: {
          message: 'نمی‌توانید خودتان را مسدود کنید',
          englishMessage: 'You cannot block yourself'
        }
      });
    }

    // Check if user exists
    const targetUser = await User.findById(userToBlock);
    if (!targetUser) {
      return res.status(404).json({
        success: false,
        error: {
          message: 'کاربر یافت نشد',
          englishMessage: 'User not found'
        }
      });
    }

    // Check if already blocked
    if (req.user.blockedUsers.includes(userToBlock)) {
      return res.status(400).json({
        success: false,
        error: {
          message: 'این کاربر قبلاً مسدود شده است',
          englishMessage: 'User is already blocked'
        }
      });
    }

    // Add to blocked users list
    await User.findByIdAndUpdate(req.user.id, {
      $addToSet: { blockedUsers: userToBlock }
    });

    // Remove from friends if they were friends
    await User.findByIdAndUpdate(req.user.id, {
      $pull: { 
        friends: { user: userToBlock },
        friendRequests: { from: userToBlock }
      }
    });

    await User.findByIdAndUpdate(userToBlock, {
      $pull: { 
        friends: { user: req.user.id },
        friendRequests: { from: req.user.id }
      }
    });

    logger.info(`User ${req.user.username} blocked user ${targetUser.username}`);

    res.status(200).json({
      success: true,
      message: {
        message: 'کاربر با موفقیت مسدود شد',
        englishMessage: 'User blocked successfully'
      }
    });

  } catch (error) {
    logger.error('Block user error:', error);
    next(error);
  }
};

// @desc    Unblock a user
// @route   DELETE /api/users/:id/block
// @access  Private
const unblockUser = async (req, res, next) => {
  try {
    const userToUnblock = req.params.id;
    
    // Check if user is actually blocked
    if (!req.user.blockedUsers.includes(userToUnblock)) {
      return res.status(400).json({
        success: false,
        error: {
          message: 'این کاربر مسدود نشده است',
          englishMessage: 'User is not blocked'
        }
      });
    }

    // Remove from blocked users list
    await User.findByIdAndUpdate(req.user.id, {
      $pull: { blockedUsers: userToUnblock }
    });

    logger.info(`User ${req.user.username} unblocked user ${userToUnblock}`);

    res.status(200).json({
      success: true,
      message: {
        message: 'کاربر از فهرست مسدود شده‌ها حذف شد',
        englishMessage: 'User unblocked successfully'
      }
    });

  } catch (error) {
    logger.error('Unblock user error:', error);
    next(error);
  }
};

// @desc    Get blocked users list
// @route   GET /api/users/blocked
// @access  Private
const getBlockedUsers = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id)
      .populate('blockedUsers', 'username displayName avatar')
      .select('blockedUsers');

    res.status(200).json({
      success: true,
      blockedUsers: user.blockedUsers.map(blocked => ({
        id: blocked._id,
        username: blocked.username,
        displayName: blocked.displayName,
        avatar: blocked.avatar
      }))
    });

  } catch (error) {
    logger.error('Get blocked users error:', error);
    next(error);
  }
};

// @desc    Send friend request
// @route   POST /api/users/:id/friend-request
// @access  Private
const sendFriendRequest = async (req, res, next) => {
  try {
    const targetUserId = req.params.id;
    
    if (targetUserId === req.user.id) {
      return res.status(400).json({
        success: false,
        error: {
          message: 'نمی‌توانید برای خودتان درخواست دوستی ارسال کنید',
          englishMessage: 'You cannot send friend request to yourself'
        }
      });
    }

    // Check if target user exists
    const targetUser = await User.findById(targetUserId);
    if (!targetUser) {
      return res.status(404).json({
        success: false,
        error: {
          message: 'کاربر یافت نشد',
          englishMessage: 'User not found'
        }
      });
    }

    // Check if users have blocked each other
    if (req.user.blockedUsers.includes(targetUserId) || 
        targetUser.blockedUsers.includes(req.user.id)) {
      return res.status(403).json({
        success: false,
        error: {
          message: 'امکان ارسال درخواست دوستی وجود ندارد',
          englishMessage: 'Cannot send friend request'
        }
      });
    }

    // Check if already friends
    const isAlreadyFriend = targetUser.friends.some(friend => 
      friend.user.toString() === req.user.id
    );
    
    if (isAlreadyFriend) {
      return res.status(400).json({
        success: false,
        error: {
          message: 'شما قبلاً با این کاربر دوست هستید',
          englishMessage: 'You are already friends with this user'
        }
      });
    }

    // Check if request already sent
    const requestExists = targetUser.friendRequests.some(request => 
      request.from.toString() === req.user.id
    );
    
    if (requestExists) {
      return res.status(400).json({
        success: false,
        error: {
          message: 'درخواست دوستی قبلاً ارسال شده است',
          englishMessage: 'Friend request already sent'
        }
      });
    }

    // Add friend request
    await User.findByIdAndUpdate(targetUserId, {
      $addToSet: { 
        friendRequests: { 
          from: req.user.id,
          sentAt: new Date()
        }
      }
    });

    logger.info(`Friend request sent from ${req.user.username} to ${targetUser.username}`);

    res.status(200).json({
      success: true,
      message: {
        message: 'درخواست دوستی ارسال شد',
        englishMessage: 'Friend request sent'
      }
    });

  } catch (error) {
    logger.error('Send friend request error:', error);
    next(error);
  }
};

// @desc    Accept friend request
// @route   POST /api/users/:id/accept-friend
// @access  Private
const acceptFriendRequest = async (req, res, next) => {
  try {
    const requesterId = req.params.id;
    
    // Check if friend request exists
    const requestExists = req.user.friendRequests.some(request => 
      request.from.toString() === requesterId
    );
    
    if (!requestExists) {
      return res.status(404).json({
        success: false,
        error: {
          message: 'درخواست دوستی یافت نشد',
          englishMessage: 'Friend request not found'
        }
      });
    }

    // Add to both users' friends lists
    await User.findByIdAndUpdate(req.user.id, {
      $addToSet: { friends: { user: requesterId, addedAt: new Date() } },
      $pull: { friendRequests: { from: requesterId } }
    });

    await User.findByIdAndUpdate(requesterId, {
      $addToSet: { friends: { user: req.user.id, addedAt: new Date() } }
    });

    const requester = await User.findById(requesterId).select('username');
    
    logger.info(`Friend request accepted: ${requester.username} and ${req.user.username}`);

    res.status(200).json({
      success: true,
      message: {
        message: 'درخواست دوستی پذیرفته شد',
        englishMessage: 'Friend request accepted'
      }
    });

  } catch (error) {
    logger.error('Accept friend request error:', error);
    next(error);
  }
};

// @desc    Reject friend request
// @route   DELETE /api/users/:id/friend-request
// @access  Private
const rejectFriendRequest = async (req, res, next) => {
  try {
    const requesterId = req.params.id;
    
    // Remove friend request
    await User.findByIdAndUpdate(req.user.id, {
      $pull: { friendRequests: { from: requesterId } }
    });

    res.status(200).json({
      success: true,
      message: {
        message: 'درخواست دوستی رد شد',
        englishMessage: 'Friend request rejected'
      }
    });

  } catch (error) {
    logger.error('Reject friend request error:', error);
    next(error);
  }
};

// @desc    Get friend requests
// @route   GET /api/users/friend-requests
// @access  Private
const getFriendRequests = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id)
      .populate('friendRequests.from', 'username displayName avatar')
      .select('friendRequests');

    const formattedRequests = user.friendRequests.map(request => ({
      id: request._id,
      from: {
        id: request.from._id,
        username: request.from.username,
        displayName: request.from.displayName,
        avatar: request.from.avatar
      },
      sentAt: request.sentAt
    }));

    res.status(200).json({
      success: true,
      friendRequests: formattedRequests
    });

  } catch (error) {
    logger.error('Get friend requests error:', error);
    next(error);
  }
};

// @desc    Get friends list
// @route   GET /api/users/friends
// @access  Private
const getFriends = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id)
      .populate('friends.user', 'username displayName avatar lastActive privacy.showOnline')
      .select('friends');

    const formattedFriends = user.friends.map(friendship => ({
      id: friendship.user._id,
      username: friendship.user.username,
      displayName: friendship.user.displayName,
      avatar: friendship.user.avatar,
      isOnline: friendship.user.privacy.showOnline && 
                (Date.now() - friendship.user.lastActive < 5 * 60 * 1000),
      addedAt: friendship.addedAt
    }));

    res.status(200).json({
      success: true,
      friends: formattedFriends
    });

  } catch (error) {
    logger.error('Get friends error:', error);
    next(error);
  }
};

// @desc    Remove friend
// @route   DELETE /api/users/:id/friend
// @access  Private
const removeFriend = async (req, res, next) => {
  try {
    const friendId = req.params.id;
    
    // Remove from both users' friends lists
    await User.findByIdAndUpdate(req.user.id, {
      $pull: { friends: { user: friendId } }
    });

    await User.findByIdAndUpdate(friendId, {
      $pull: { friends: { user: req.user.id } }
    });

    res.status(200).json({
      success: true,
      message: {
        message: 'دوست از فهرست حذف شد',
        englishMessage: 'Friend removed from list'
      }
    });

  } catch (error) {
    logger.error('Remove friend error:', error);
    next(error);
  }
};

module.exports = {
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
};
