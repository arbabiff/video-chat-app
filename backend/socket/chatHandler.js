const logger = require('../utils/logger');
const User = require('../models/User');

// Active users and chat rooms
const activeUsers = new Map(); // userId -> socket.id
const chatRooms = new Map();   // roomId -> { users: [], messages: [] }
const waitingQueue = new Map(); // userId -> { socket, preferences }

const chatHandler = (socket, io) => {
  
  // User goes online
  socket.on('user_online', async (data) => {
    try {
      if (!socket.userId) {
        socket.emit('error', { message: 'Not authenticated' });
        return;
      }

      // Add user to active users
      activeUsers.set(socket.userId, socket.id);
      
      // Update user's last active time
      await User.findByIdAndUpdate(socket.userId, {
        lastActive: new Date()
      });

      logger.info(`User ${socket.userId} went online`);
      
      // Notify friends if they allow it
      const user = await User.findById(socket.userId)
        .populate('friends.user', '_id privacy.showOnline')
        .select('friends privacy');
      
      if (user.privacy.showOnline) {
        user.friends.forEach(friend => {
          if (friend.user.privacy.showOnline) {
            const friendSocketId = activeUsers.get(friend.user._id.toString());
            if (friendSocketId) {
              io.to(friendSocketId).emit('friend_online', {
                userId: socket.userId,
                username: user.username,
                displayName: user.displayName
              });
            }
          }
        });
      }
      
      socket.emit('user_online_success', { 
        message: 'Successfully went online',
        activeUsersCount: activeUsers.size 
      });

    } catch (error) {
      logger.error('User online error:', error);
      socket.emit('error', { message: 'Failed to go online' });
    }
  });

  // Find random chat partner
  socket.on('find_random_chat', async (preferences) => {
    try {
      if (!socket.userId) {
        socket.emit('error', { message: 'Not authenticated' });
        return;
      }

      const user = await User.findById(socket.userId);
      if (!user) {
        socket.emit('error', { message: 'User not found' });
        return;
      }

      // Remove from waiting queue if already in it
      waitingQueue.delete(socket.userId);

      // Find matching users from waiting queue
      const matchingUsers = Array.from(waitingQueue.entries()).filter(([userId, userData]) => {
        const otherUser = userData.user;
        const otherPrefs = userData.preferences;

        // Check if users have blocked each other
        if (user.blockedUsers.includes(userId) || otherUser.blockedUsers.includes(socket.userId)) {
          return false;
        }

        // Check gender preference
        if (preferences.genderPreference !== 'both' && 
            otherUser.gender !== preferences.genderPreference) {
          return false;
        }

        if (otherPrefs.genderPreference !== 'both' && 
            user.gender !== otherPrefs.genderPreference) {
          return false;
        }

        // Check age preference
        const userAge = Math.floor((Date.now() - user.birthDate.getTime()) / (365.25 * 24 * 60 * 60 * 1000));
        const otherUserAge = Math.floor((Date.now() - otherUser.birthDate.getTime()) / (365.25 * 24 * 60 * 60 * 1000));

        if (userAge < otherPrefs.ageRange.min || userAge > otherPrefs.ageRange.max) {
          return false;
        }

        if (otherUserAge < preferences.ageRange.min || otherUserAge > preferences.ageRange.max) {
          return false;
        }

        return true;
      });

      if (matchingUsers.length > 0) {
        // Match found - pick random match
        const [matchedUserId, matchedData] = matchingUsers[Math.floor(Math.random() * matchingUsers.length)];
        const matchedSocket = matchedData.socket;
        const matchedUser = matchedData.user;

        // Remove matched user from waiting queue
        waitingQueue.delete(matchedUserId);

        // Create chat room
        const roomId = `room_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        
        chatRooms.set(roomId, {
          users: [
            { 
              userId: socket.userId, 
              socketId: socket.id, 
              user: user 
            },
            { 
              userId: matchedUserId, 
              socketId: matchedSocket.id, 
              user: matchedUser 
            }
          ],
          messages: [],
          createdAt: new Date(),
          type: 'random'
        });

        // Join both users to the room
        socket.join(roomId);
        matchedSocket.join(roomId);

        // Notify both users
        const userInfo = {
          id: user._id,
          username: user.username,
          displayName: user.displayName,
          avatar: user.avatar,
          age: Math.floor((Date.now() - user.birthDate.getTime()) / (365.25 * 24 * 60 * 60 * 1000)),
          country: user.country
        };

        const matchedUserInfo = {
          id: matchedUser._id,
          username: matchedUser.username,
          displayName: matchedUser.displayName,
          avatar: matchedUser.avatar,
          age: Math.floor((Date.now() - matchedUser.birthDate.getTime()) / (365.25 * 24 * 60 * 60 * 1000)),
          country: matchedUser.country
        };

        socket.emit('chat_matched', {
          roomId,
          partner: matchedUserInfo,
          message: 'یک شریک چت برای شما پیدا شد!'
        });

        matchedSocket.emit('chat_matched', {
          roomId,
          partner: userInfo,
          message: 'یک شریک چت برای شما پیدا شد!'
        });

        logger.info(`Chat match found: ${user.username} and ${matchedUser.username} in room ${roomId}`);

      } else {
        // No match found - add to waiting queue
        waitingQueue.set(socket.userId, {
          socket: socket,
          user: user,
          preferences: preferences,
          timestamp: Date.now()
        });

        socket.emit('finding_chat_partner', {
          message: 'در حال جستجوی شریک چت...',
          queuePosition: waitingQueue.size
        });

        logger.info(`User ${user.username} added to waiting queue`);
      }

    } catch (error) {
      logger.error('Find random chat error:', error);
      socket.emit('error', { message: 'Failed to find chat partner' });
    }
  });

  // Send message in chat room
  socket.on('send_message', async (data) => {
    try {
      const { roomId, message, type = 'text' } = data;
      
      if (!socket.userId || !roomId || !message) {
        socket.emit('error', { message: 'Invalid message data' });
        return;
      }

      const room = chatRooms.get(roomId);
      if (!room) {
        socket.emit('error', { message: 'Chat room not found' });
        return;
      }

      // Check if user is in this room
      const userInRoom = room.users.find(u => u.userId === socket.userId);
      if (!userInRoom) {
        socket.emit('error', { message: 'User not in this room' });
        return;
      }

      // Create message object
      const messageObj = {
        id: Date.now() + Math.random(),
        userId: socket.userId,
        username: userInRoom.user.username,
        displayName: userInRoom.user.displayName,
        avatar: userInRoom.user.avatar,
        message: message.trim(),
        type: type,
        timestamp: new Date(),
        roomId: roomId
      };

      // Add message to room
      room.messages.push(messageObj);

      // Keep only last 100 messages per room
      if (room.messages.length > 100) {
        room.messages = room.messages.slice(-100);
      }

      // Send message to all users in room
      io.to(roomId).emit('new_message', messageObj);

      // Update user stats
      await User.findByIdAndUpdate(socket.userId, {
        $inc: { 'stats.totalChats': 1 }
      });

      logger.info(`Message sent in room ${roomId} by ${userInRoom.user.username}`);

    } catch (error) {
      logger.error('Send message error:', error);
      socket.emit('error', { message: 'Failed to send message' });
    }
  });

  // Leave chat room
  socket.on('leave_chat', async (data) => {
    try {
      const { roomId } = data;
      
      if (!roomId) {
        socket.emit('error', { message: 'Room ID required' });
        return;
      }

      const room = chatRooms.get(roomId);
      if (!room) {
        socket.emit('error', { message: 'Chat room not found' });
        return;
      }

      // Remove user from room
      room.users = room.users.filter(u => u.userId !== socket.userId);
      
      socket.leave(roomId);
      
      // Notify other users in room
      socket.to(roomId).emit('user_left_chat', {
        userId: socket.userId,
        message: 'کاربر چت را ترک کرد'
      });

      // If room is empty, delete it
      if (room.users.length === 0) {
        chatRooms.delete(roomId);
        logger.info(`Chat room ${roomId} deleted - no users left`);
      }

      socket.emit('left_chat_success', { roomId });
      logger.info(`User ${socket.userId} left chat room ${roomId}`);

    } catch (error) {
      logger.error('Leave chat error:', error);
      socket.emit('error', { message: 'Failed to leave chat' });
    }
  });

  // Stop searching for chat partner
  socket.on('stop_searching', () => {
    try {
      if (waitingQueue.has(socket.userId)) {
        waitingQueue.delete(socket.userId);
        socket.emit('search_stopped', { message: 'جستجو متوقف شد' });
        logger.info(`User ${socket.userId} stopped searching for chat partner`);
      }
    } catch (error) {
      logger.error('Stop searching error:', error);
    }
  });

  // Typing indicator
  socket.on('typing_start', (data) => {
    try {
      const { roomId } = data;
      if (roomId) {
        socket.to(roomId).emit('user_typing', {
          userId: socket.userId,
          typing: true
        });
      }
    } catch (error) {
      logger.error('Typing start error:', error);
    }
  });

  socket.on('typing_stop', (data) => {
    try {
      const { roomId } = data;
      if (roomId) {
        socket.to(roomId).emit('user_typing', {
          userId: socket.userId,
          typing: false
        });
      }
    } catch (error) {
      logger.error('Typing stop error:', error);
    }
  });

  // Handle user disconnect
  socket.on('disconnect', async () => {
    try {
      if (socket.userId) {
        // Remove from active users
        activeUsers.delete(socket.userId);
        
        // Remove from waiting queue
        waitingQueue.delete(socket.userId);
        
        // Leave all chat rooms and notify other users
        for (const [roomId, room] of chatRooms.entries()) {
          const userInRoom = room.users.find(u => u.userId === socket.userId);
          if (userInRoom) {
            // Remove user from room
            room.users = room.users.filter(u => u.userId !== socket.userId);
            
            // Notify other users
            socket.to(roomId).emit('user_disconnected', {
              userId: socket.userId,
              message: 'کاربر قطع شد'
            });
            
            // If room is empty, delete it
            if (room.users.length === 0) {
              chatRooms.delete(roomId);
            }
          }
        }
        
        // Update last active time
        await User.findByIdAndUpdate(socket.userId, {
          lastActive: new Date()
        });
        
        // Notify friends user went offline
        const user = await User.findById(socket.userId)
          .populate('friends.user', '_id privacy.showOnline')
          .select('friends privacy username displayName');
        
        if (user && user.privacy.showOnline) {
          user.friends.forEach(friend => {
            if (friend.user.privacy.showOnline) {
              const friendSocketId = activeUsers.get(friend.user._id.toString());
              if (friendSocketId) {
                io.to(friendSocketId).emit('friend_offline', {
                  userId: socket.userId,
                  username: user.username,
                  displayName: user.displayName
                });
              }
            }
          });
        }
        
        logger.info(`User ${socket.userId} disconnected from chat`);
      }
    } catch (error) {
      logger.error('Chat disconnect error:', error);
    }
  });
};

// Clean up old waiting queue entries (older than 5 minutes)
setInterval(() => {
  const fiveMinutesAgo = Date.now() - 5 * 60 * 1000;
  for (const [userId, data] of waitingQueue.entries()) {
    if (data.timestamp < fiveMinutesAgo) {
      waitingQueue.delete(userId);
      if (data.socket) {
        data.socket.emit('search_timeout', { 
          message: 'جستجو به دلیل مدت زمان طولانی متوقف شد' 
        });
      }
    }
  }
}, 60000); // Check every minute

module.exports = chatHandler;
