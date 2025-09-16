const logger = require('../utils/logger');
const User = require('../models/User');

// Active video calls
const activeVideoCalls = new Map(); // callId -> { caller, callee, status, startTime }
const userCalls = new Map();         // userId -> callId

const videoCallHandler = (socket, io) => {
  
  // Initiate video call
  socket.on('initiate_call', async (data) => {
    try {
      const { targetUserId, callType = 'video' } = data;
      
      if (!socket.userId) {
        socket.emit('call_error', { message: 'Not authenticated' });
        return;
      }

      if (!targetUserId) {
        socket.emit('call_error', { message: 'Target user ID required' });
        return;
      }

      if (targetUserId === socket.userId) {
        socket.emit('call_error', { 
          message: 'نمی‌توانید با خودتان تماس برقرار کنید',
          englishMessage: 'Cannot call yourself'
        });
        return;
      }

      // Check if caller is already in a call
      if (userCalls.has(socket.userId)) {
        socket.emit('call_error', { 
          message: 'شما در حال حاضر در تماس هستید',
          englishMessage: 'You are already in a call'
        });
        return;
      }

      // Check if target user is already in a call
      if (userCalls.has(targetUserId)) {
        socket.emit('call_error', { 
          message: 'کاربر مقصد در حال حاضر مشغول است',
          englishMessage: 'Target user is currently busy'
        });
        return;
      }

      // Get caller and target user info
      const [caller, targetUser] = await Promise.all([
        User.findById(socket.userId).select('username displayName avatar subscription blockedUsers'),
        User.findById(targetUserId).select('username displayName avatar privacy blockedUsers')
      ]);

      if (!caller || !targetUser) {
        socket.emit('call_error', { 
          message: 'کاربر یافت نشد',
          englishMessage: 'User not found'
        });
        return;
      }

      // Check if users have blocked each other
      if (caller.blockedUsers.includes(targetUserId) || 
          targetUser.blockedUsers.includes(socket.userId)) {
        socket.emit('call_error', { 
          message: 'امکان برقراری تماس وجود ندارد',
          englishMessage: 'Cannot establish call'
        });
        return;
      }

      // Check target user's privacy settings
      if (!targetUser.privacy.allowMessages && 
          !targetUser.friends.some(f => f.user.toString() === socket.userId)) {
        socket.emit('call_error', { 
          message: 'کاربر مقصد تماس‌های ناشناس را نمی‌پذیرد',
          englishMessage: 'Target user does not accept calls from strangers'
        });
        return;
      }

      // Check if target user is online
      const targetSocketId = [...io.sockets.sockets.entries()]
        .find(([_, s]) => s.userId === targetUserId)?.[0];
      
      if (!targetSocketId) {
        socket.emit('call_error', { 
          message: 'کاربر مقصد آنلاین نیست',
          englishMessage: 'Target user is offline'
        });
        return;
      }

      // Create call
      const callId = `call_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      const callData = {
        callId,
        caller: {
          userId: socket.userId,
          socketId: socket.id,
          username: caller.username,
          displayName: caller.displayName,
          avatar: caller.avatar
        },
        callee: {
          userId: targetUserId,
          socketId: targetSocketId,
          username: targetUser.username,
          displayName: targetUser.displayName,
          avatar: targetUser.avatar
        },
        callType,
        status: 'calling',
        startTime: new Date(),
        offer: null,
        answer: null
      };

      activeVideoCalls.set(callId, callData);
      userCalls.set(socket.userId, callId);
      userCalls.set(targetUserId, callId);

      // Join call room
      socket.join(callId);
      io.sockets.sockets.get(targetSocketId).join(callId);

      // Notify caller that call is being initiated
      socket.emit('call_initiated', {
        callId,
        targetUser: {
          id: targetUser._id,
          username: targetUser.username,
          displayName: targetUser.displayName,
          avatar: targetUser.avatar
        },
        callType
      });

      // Notify target user of incoming call
      io.to(targetSocketId).emit('incoming_call', {
        callId,
        caller: {
          id: caller._id,
          username: caller.username,
          displayName: caller.displayName,
          avatar: caller.avatar
        },
        callType
      });

      logger.info(`Video call initiated: ${caller.username} calling ${targetUser.username}`);

      // Auto-reject call after 45 seconds if not answered
      setTimeout(() => {
        const call = activeVideoCalls.get(callId);
        if (call && call.status === 'calling') {
          endCall(callId, 'timeout', io);
        }
      }, 45000);

    } catch (error) {
      logger.error('Initiate call error:', error);
      socket.emit('call_error', { message: 'Failed to initiate call' });
    }
  });

  // Accept incoming call
  socket.on('accept_call', async (data) => {
    try {
      const { callId } = data;
      
      if (!socket.userId || !callId) {
        socket.emit('call_error', { message: 'Invalid call data' });
        return;
      }

      const call = activeVideoCalls.get(callId);
      if (!call) {
        socket.emit('call_error', { 
          message: 'تماس یافت نشد',
          englishMessage: 'Call not found'
        });
        return;
      }

      if (call.callee.userId !== socket.userId) {
        socket.emit('call_error', { 
          message: 'دسترسی غیر مجاز به تماس',
          englishMessage: 'Unauthorized call access'
        });
        return;
      }

      if (call.status !== 'calling') {
        socket.emit('call_error', { 
          message: 'تماس دیگر در دسترس نیست',
          englishMessage: 'Call no longer available'
        });
        return;
      }

      // Update call status
      call.status = 'accepted';
      call.acceptedAt = new Date();

      // Notify both users that call was accepted
      io.to(callId).emit('call_accepted', {
        callId,
        message: 'تماس پذیرفته شد'
      });

      logger.info(`Call accepted: ${call.caller.username} and ${call.callee.username}`);

    } catch (error) {
      logger.error('Accept call error:', error);
      socket.emit('call_error', { message: 'Failed to accept call' });
    }
  });

  // Reject incoming call
  socket.on('reject_call', async (data) => {
    try {
      const { callId } = data;
      
      if (!socket.userId || !callId) {
        socket.emit('call_error', { message: 'Invalid call data' });
        return;
      }

      const call = activeVideoCalls.get(callId);
      if (!call) {
        return;
      }

      if (call.callee.userId !== socket.userId) {
        return;
      }

      endCall(callId, 'rejected', io);

    } catch (error) {
      logger.error('Reject call error:', error);
    }
  });

  // End active call
  socket.on('end_call', async (data) => {
    try {
      const { callId } = data;
      
      if (!socket.userId || !callId) {
        socket.emit('call_error', { message: 'Invalid call data' });
        return;
      }

      const call = activeVideoCalls.get(callId);
      if (!call) {
        return;
      }

      // Only participants can end the call
      if (call.caller.userId !== socket.userId && 
          call.callee.userId !== socket.userId) {
        return;
      }

      endCall(callId, 'ended', io);

    } catch (error) {
      logger.error('End call error:', error);
    }
  });

  // WebRTC signaling - offer
  socket.on('webrtc_offer', (data) => {
    try {
      const { callId, offer } = data;
      
      if (!callId || !offer) {
        socket.emit('call_error', { message: 'Invalid offer data' });
        return;
      }

      const call = activeVideoCalls.get(callId);
      if (!call) {
        socket.emit('call_error', { message: 'Call not found' });
        return;
      }

      // Only caller can send offer
      if (call.caller.userId !== socket.userId) {
        return;
      }

      call.offer = offer;

      // Forward offer to callee
      socket.to(callId).emit('webrtc_offer', {
        callId,
        offer,
        from: socket.userId
      });

      logger.info(`WebRTC offer sent in call ${callId}`);

    } catch (error) {
      logger.error('WebRTC offer error:', error);
      socket.emit('call_error', { message: 'Failed to send offer' });
    }
  });

  // WebRTC signaling - answer
  socket.on('webrtc_answer', (data) => {
    try {
      const { callId, answer } = data;
      
      if (!callId || !answer) {
        socket.emit('call_error', { message: 'Invalid answer data' });
        return;
      }

      const call = activeVideoCalls.get(callId);
      if (!call) {
        socket.emit('call_error', { message: 'Call not found' });
        return;
      }

      // Only callee can send answer
      if (call.callee.userId !== socket.userId) {
        return;
      }

      call.answer = answer;
      call.status = 'connected';
      call.connectedAt = new Date();

      // Forward answer to caller
      socket.to(callId).emit('webrtc_answer', {
        callId,
        answer,
        from: socket.userId
      });

      // Update user stats
      User.findByIdAndUpdate(call.caller.userId, {
        $inc: { 'stats.totalMinutes': 1 }
      }).catch(err => logger.error('Stats update error:', err));

      User.findByIdAndUpdate(call.callee.userId, {
        $inc: { 'stats.totalMinutes': 1 }
      }).catch(err => logger.error('Stats update error:', err));

      logger.info(`WebRTC answer sent in call ${callId} - call connected`);

    } catch (error) {
      logger.error('WebRTC answer error:', error);
      socket.emit('call_error', { message: 'Failed to send answer' });
    }
  });

  // WebRTC signaling - ICE candidate
  socket.on('webrtc_ice_candidate', (data) => {
    try {
      const { callId, candidate } = data;
      
      if (!callId || !candidate) {
        return;
      }

      const call = activeVideoCalls.get(callId);
      if (!call) {
        return;
      }

      // Forward ICE candidate to the other participant
      socket.to(callId).emit('webrtc_ice_candidate', {
        callId,
        candidate,
        from: socket.userId
      });

    } catch (error) {
      logger.error('WebRTC ICE candidate error:', error);
    }
  });

  // Toggle video during call
  socket.on('toggle_video', (data) => {
    try {
      const { callId, videoEnabled } = data;
      
      const call = activeVideoCalls.get(callId);
      if (!call) {
        return;
      }

      // Notify other participant
      socket.to(callId).emit('participant_video_toggle', {
        userId: socket.userId,
        videoEnabled
      });

    } catch (error) {
      logger.error('Toggle video error:', error);
    }
  });

  // Toggle audio during call
  socket.on('toggle_audio', (data) => {
    try {
      const { callId, audioEnabled } = data;
      
      const call = activeVideoCalls.get(callId);
      if (!call) {
        return;
      }

      // Notify other participant
      socket.to(callId).emit('participant_audio_toggle', {
        userId: socket.userId,
        audioEnabled
      });

    } catch (error) {
      logger.error('Toggle audio error:', error);
    }
  });

  // Handle socket disconnect
  socket.on('disconnect', async () => {
    try {
      if (socket.userId) {
        // Find and end any active calls for this user
        const callId = userCalls.get(socket.userId);
        if (callId) {
          endCall(callId, 'disconnected', io);
        }
      }
    } catch (error) {
      logger.error('Video call disconnect error:', error);
    }
  });
};

// Helper function to end a call
function endCall(callId, reason, io) {
  try {
    const call = activeVideoCalls.get(callId);
    if (!call) {
      return;
    }

    // Calculate call duration if call was connected
    let duration = 0;
    if (call.connectedAt) {
      duration = Math.floor((Date.now() - call.connectedAt.getTime()) / 1000);
    }

    // Update call status
    call.status = 'ended';
    call.endReason = reason;
    call.endedAt = new Date();
    call.duration = duration;

    // Notify all participants
    io.to(callId).emit('call_ended', {
      callId,
      reason,
      duration,
      message: getEndMessage(reason)
    });

    // Update user statistics if call was connected
    if (duration > 0) {
      User.findByIdAndUpdate(call.caller.userId, {
        $inc: { 'stats.totalMinutes': Math.ceil(duration / 60) }
      }).catch(err => logger.error('Stats update error:', err));

      User.findByIdAndUpdate(call.callee.userId, {
        $inc: { 'stats.totalMinutes': Math.ceil(duration / 60) }
      }).catch(err => logger.error('Stats update error:', err));
    }

    // Clean up
    userCalls.delete(call.caller.userId);
    userCalls.delete(call.callee.userId);
    activeVideoCalls.delete(callId);

    // Leave room
    io.in(callId).socketsLeave(callId);

    logger.info(`Call ended: ${callId}, reason: ${reason}, duration: ${duration}s`);

  } catch (error) {
    logger.error('End call error:', error);
  }
}

function getEndMessage(reason) {
  const messages = {
    'ended': 'تماس به پایان رسید',
    'rejected': 'تماس رد شد',
    'timeout': 'تماس به دلیل عدم پاسخ قطع شد',
    'disconnected': 'تماس به دلیل قطع شدن ارتباط پایان یافت',
    'busy': 'کاربر مشغول است'
  };
  
  return messages[reason] || 'تماس به پایان رسید';
}

// Clean up old calls every 5 minutes
setInterval(() => {
  const fiveMinutesAgo = Date.now() - 5 * 60 * 1000;
  for (const [callId, call] of activeVideoCalls.entries()) {
    if (call.startTime.getTime() < fiveMinutesAgo && call.status !== 'connected') {
      endCall(callId, 'timeout');
    }
  }
}, 5 * 60 * 1000);

module.exports = videoCallHandler;
