// /socket/sockethandlers.js
import { Server } from 'socket.io';
import Message from '../models/Message.js';
import User from '../models/User.js';
import Conversation from '../models/Conversation.js';

let io;

const initializeSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: process.env.CLIENT_URL || "http://localhost:5173",
      methods: ["GET", "POST"],
      credentials: true
    }
  });

  // Socket authentication middleware
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token;
      if (!token) {
        return next(new Error('Authentication error: No token provided'));
      }

      const user = await User.verifyToken(token);
      if (!user) {
        return next(new Error('Authentication error: User not found'));
      }

      socket.user = user;
      socket.userId = user._id.toString();
      next();
    } catch (err) {
      console.error('Socket auth error:', err.message);
      next(new Error('Authentication error: Invalid token'));
    }
  });

  io.on('connection', (socket) => {
    console.log(`User connected: ${socket.user._id}`);
    
    // Join user's personal room
    socket.join(socket.userId);

    // Update user online status
    User.findByIdAndUpdate(socket.user._id, { isOnline: true }, { new: true })
      .then(user => {
        io.emit('user-status-changed', { userId: user._id, isOnline: true });
      })
      .catch(err => console.error('Error updating online status:', err));

    // Test event handler
    socket.on('test-event', (data) => {
      console.log('🧪 Received test-event from frontend:', data);
      // Send a response back to the sender
      socket.emit('test-response', { 
        message: 'Test response from backend', 
        originalData: data,
        timestamp: new Date().toISOString()
      });
      console.log('🧪 Test response sent to frontend');
    });

    // Test basic event handler
    socket.on('test-basic', (data) => {
      console.log('🧪 Received test-basic event:', data);
      // Send a response back to the sender
      socket.emit('test-response', { message: 'Test response from backend', originalData: data });
    });

    // Test message event
    socket.on('test-message', (data) => {
      console.log('🧪 Received test-message event:', data);
      // Emit a test new-message event to the user's personal room
      const testMessage = {
        _id: 'test-' + Date.now(),
        sender: { _id: socket.user._id, name: 'Test User' },
        content: 'This is a test message',
        conversation: 'test-conversation',
        createdAt: new Date(),
        messageType: 'text'
      };
      socket.emit('new-message', testMessage);
      console.log('🧪 Test new-message event emitted');
    });

    // Join chat room
    socket.on('join-chat', (conversationId) => {
      console.log(`🏠 User ${socket.user._id} attempting to join conversation ${conversationId}`);
      
      // Handle test room specially
      if (conversationId === 'test-room') {
        console.log('🧪 Test room join request:', conversationId);
        socket.join(conversationId);
        socket.emit('test-room-joined', { message: 'Joined test room' });
        return;
      }
      
      socket.join(conversationId);
      console.log(`✅ User ${socket.user._id} joined conversation ${conversationId}`);
      
      // Send a test event to confirm room joining worked
      socket.emit('room-joined', { conversationId, message: 'Successfully joined room' });
      
      // Debug: Check room membership
      io.in(conversationId).fetchSockets().then(sockets => {
        console.log(`📊 Room ${conversationId} now has ${sockets.length} sockets`);
        // List socket IDs in the room
        const socketIds = sockets.map(s => s.id);
        console.log(`🔗 Socket IDs in room: ${socketIds.join(', ')}`);
      });
    });

    // Send message
    socket.on('send-message', async (data,callback) => {
      try {
        console.log('Received send-message event:', data);
        const { conversationId, content, receiverId } = data;
        
        if (!content || !content.trim()) {
          socket.emit('message-error', { error: 'Message content cannot be empty' });
          return;
        }

        // Create message
        const message = new Message({
          sender: socket.user._id,
          receiver: receiverId,
          conversation: conversationId,
          content: content.trim()
        });

        const savedMessage = await message.save();
        await savedMessage.populate('sender', 'name profilePicture');
        console.log('Message saved:', savedMessage);

        // Update conversation
        await Conversation.findByIdAndUpdate(conversationId, {
          lastMessage: savedMessage._id,
          lastMessageAt: new Date()
        });

        // Emit to conversation room (including sender)
        console.log('🚀 Emitting new-message to room:', conversationId);
        console.log('📋 Message being emitted:', savedMessage);
        
        // Emit to conversation room only
        io.to(conversationId).emit('new-message', savedMessage);
        console.log('✅ new-message sent to room:', conversationId);
        
        // Send acknowledgment back to sender with callback
        if (callback) {
          callback({ success: true, message: savedMessage });
        }
      } catch (error) {
        console.error('Error sending message:', error);
        socket.emit('message-error', { error: 'Failed to send message' });
        if (callback) {
          callback({ success: false, error: 'Failed to send message' });
        }
      }
    });

    // Typing indicator
    socket.on('typing', (data) => {
      const { conversationId, isTyping } = data;
      socket.to(conversationId).emit('typing', {
        userId: socket.user._id,
        conversationId,
        isTyping
      });
    });

    // Mark message as read
    socket.on('mark-as-read', async (data) => {
      try {
        const { messageId } = data;
        await Message.findByIdAndUpdate(messageId, { read: true });
        socket.emit('message-read', { messageId });
      } catch (error) {
        console.error('Error marking message as read:', error);
      }
    });

    // Disconnect handler
    socket.on('disconnect', async () => {
      console.log(`User disconnected: ${socket.user._id}`);
      
      try {
        await User.findByIdAndUpdate(socket.user._id, { isOnline: false });
        io.emit('user-status-changed', { 
          userId: socket.user._id, 
          isOnline: false 
        });
      } catch (err) {
        console.error('Error updating offline status:', err);
      }
    });
  });

  // Make io instance available to the app
  server.io = io;
  
  return io;
};

export { initializeSocket };
