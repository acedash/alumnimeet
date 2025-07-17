import Chat from '../models/Chat.js';
import User from '../models/User.js';
import mongoose from 'mongoose';

// Helper function to validate participant
const validateParticipants = async (userId, participantId) => {
  if (userId.toString() === participantId) {
    throw new Error('Cannot chat with yourself');
  }

  const participants = await User.find({
    _id: { $in: [userId, participantId] }
  }).lean();

  if (participants.length !== 2) {
    throw new Error('One or more participants not found');
  }
};

// Start or get existing chat
export const getOrCreateChat = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  
  try {
    const { participantId } = req.body;
    const userId = req.user._id;

    // Validate participants
    await validateParticipants(userId, participantId);

    // Find or create chat
    let chat = await Chat.findOne({
      participants: { $all: [userId, participantId], $size: 2 }
    })
    .populate('participants', 'name profilePicture userType')
    .session(session);

    if (!chat) {
      chat = new Chat({
        participants: [userId, participantId],
        createdAt: new Date(),
        updatedAt: new Date()
      });
      
      await chat.save({ session });
      
      // Repopulate after save
      chat = await Chat.findById(chat._id)
        .populate('participants', 'name profilePicture userType')
        .session(session);
    }

    await session.commitTransaction();
    res.json({
      success: true,
      data: chat
    });
  } catch (error) {
    await session.abortTransaction();
    console.error('Error in getOrCreateChat:', error);
    
    const statusCode = error.message.includes('not found') ? 404 : 
                      error.message.includes('Cannot chat') ? 400 : 500;
    
    res.status(statusCode).json({ 
      success: false,
      error: error.message,
      code: error.message.replace(/\s+/g, '_').toUpperCase()
    });
  } finally {
    session.endSession();
  }
};

// Send message
export const sendMessage = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { chatId, content } = req.body;
    const senderId = req.user._id;

    if (!content || !content.trim()) {
      throw new Error('Message content cannot be empty');
    }

    const chat = await Chat.findOneAndUpdate(
      { _id: chatId, participants: senderId },
      {
        $push: { messages: { sender: senderId, content } },
        $set: { lastMessage: new Date(), updatedAt: new Date() }
      },
      { 
        new: true,
        session,
        runValidators: true 
      }
    )
    .populate('participants', 'name profilePicture userType')
    .populate('messages.sender', 'name profilePicture');

    if (!chat) {
      throw new Error('Chat not found or access denied');
    }

    await session.commitTransaction();
    res.json({
      success: true,
      data: chat
    });
  } catch (error) {
    await session.abortTransaction();
    console.error('Error in sendMessage:', error);
    
    const statusCode = error.message.includes('not found') ? 404 : 
                      error.message.includes('empty') ? 400 : 500;
    
    res.status(statusCode).json({ 
      success: false,
      error: error.message,
      code: error.message.replace(/\s+/g, '_').toUpperCase()
    });
  } finally {
    session.endSession();
  }
};

// Get user chats
export const getUserChats = async (req, res) => {
  try {
    const userId = req.user._id;

    const chats = await Chat.find({ participants: userId })
      .populate('participants', 'name profilePicture userType')
      .sort({ lastMessage: -1, updatedAt: -1 })
      .lean(); // Use lean() for better performance

    // Transform data to include unread count
    const transformedChats = chats.map(chat => ({
      ...chat,
      unreadCount: chat.messages.filter(
        msg => !msg.read && msg.sender.toString() !== userId.toString()
      ).length
    }));

    res.json({
      success: true,
      data: transformedChats
    });
  } catch (error) {
    console.error('Error in getUserChats:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to fetch chats',
      code: 'FETCH_CHATS_ERROR'
    });
  }
};

// Get chat messages
export const getChatMessages = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { chatId } = req.params;
    const userId = req.user._id;

    // Validate chatId format
    if (!mongoose.Types.ObjectId.isValid(chatId)) {
      throw new Error('Invalid chat ID format');
    }

    // Find and update chat in single operation
    const chat = await Chat.findOneAndUpdate(
      { 
        _id: chatId,
        participants: userId 
      },
      {
        $set: { 
          'messages.$[elem].read': true,
          updatedAt: new Date() 
        }
      },
      {
        new: true,
        session,
        arrayFilters: [
          { 
            'elem.sender': { $ne: userId },
            'elem.read': false 
          }
        ]
      }
    )
    .populate('participants', 'name profilePicture userType')
    .populate('messages.sender', 'name profilePicture');

    if (!chat) {
      throw new Error('Chat not found or access denied');
    }

    await session.commitTransaction();
    res.json({
      success: true,
      data: chat
    });
  } catch (error) {
    await session.abortTransaction();
    console.error('Error in getChatMessages:', error);
    
    const statusCode = error.message.includes('Invalid') ? 400 : 
                      error.message.includes('not found') ? 404 : 500;
    
    res.status(statusCode).json({ 
      success: false,
      error: error.message,
      code: error.message.replace(/\s+/g, '_').toUpperCase()
    });
  } finally {
    session.endSession();
  }
};