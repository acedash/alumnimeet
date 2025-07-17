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

    // Join chat room
    socket.on('join-chat', (conversationId) => {
      socket.join(conversationId);
      console.log(`User ${socket.user._id} joined conversation ${conversationId}`);
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

        // Emit to conversation room
        console.log('Emitting new-message to room:', conversationId);
        io.to(conversationId).emit('new-message', savedMessage);
        
        // Send acknowledgment back to sender
        // socket.emit('message-sent', savedMessage);
        if (callback) callback(savedMessage);
      } catch (error) {
        console.error('Error sending message:', error);
        socket.emit('message-error', { error: 'Failed to send message' });
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
