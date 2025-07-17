import express from 'express';
import Message from '../models/Message.js';
import Conversation from '../models/Conversation.js';
import User from '../models/User.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// Get user's conversations with last message
router.get('/conversations', protect, async (req, res) => {
  try {
    const conversations = await Conversation.find({
      participants: req.user._id
    })
    .populate({
      path: 'participants',
      select: 'name profilePicture userType department'
    })
    .populate({
      path: 'lastMessage',
      populate: {
        path: 'sender',
        select: 'name profilePicture'
      }
    })
    .sort({ lastMessageAt: -1 }); // Most recent conversations first

    res.json(conversations);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get a specific conversation
router.get('/conversations/:conversationId', protect, async (req, res) => {
  try {
    const conversation = await Conversation.findOne({
      _id: req.params.conversationId,
      participants: req.user._id
    })
    .populate({
      path: 'participants',
      select: 'name profilePicture userType department'
    })
    .populate({
      path: 'lastMessage',
      populate: {
        path: 'sender',
        select: 'name profilePicture'
      }
    });

    if (!conversation) {
      return res.status(404).json({ message: 'Conversation not found' });
    }

    res.json(conversation);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get messages for a specific conversation
router.get('/messages/:conversationId', protect, async (req, res) => {
  try {
    // Verify user is part of conversation
    const conversation = await Conversation.findOne({
      _id: req.params.conversationId,
      participants: req.user._id
    });

    if (!conversation) {
      return res.status(404).json({ message: 'Conversation not found' });
    }

    const messages = await Message.find({
      conversation: req.params.conversationId
    })
    .populate('sender', 'name profilePicture')
    .sort({ createdAt: 1 }); // Oldest first

    res.json(messages);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get available users to chat with
router.get('/available-users', protect, async (req, res) => {
    try {
        const currentUserType = req.user.userType;
        let targetUserType;
        
        if (currentUserType === 'student') {
            targetUserType = 'alumni';
        } else if (currentUserType === 'alumni') {
            targetUserType = 'student';
        } else {
            return res.status(400).json({ message: 'Invalid user type for chat' });
        }

        const users = await User.find({
            userType: targetUserType,
            verificationStatus: 'verified',
            _id: { $ne: req.user._id }
        }).select('name profilePicture department graduationYear currentYear');

        res.json(users);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Search users
router.get('/search-users', protect, async (req, res) => {
    try {
        const { query } = req.query;
        const currentUserType = req.user.userType;
        const targetUserType = currentUserType === 'student' ? 'alumni' : 'student';

        const users = await User.find({
            userType: targetUserType,
            verificationStatus: 'verified',
            _id: { $ne: req.user._id },
            $or: [
                { name: { $regex: query, $options: 'i' } },
                { department: { $regex: query, $options: 'i' } }
            ]
        }).select('name profilePicture department graduationYear currentYear');

        res.json(users);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Send a message
router.post('/messages', protect, async (req, res) => {
  try {
    const { receiverId, content, conversationId } = req.body;

    // Validate input
    if (!receiverId || !content) {
      return res.status(400).json({ message: 'Receiver and content are required' });
    }

    // Find or create conversation
    let conversation = conversationId 
      ? await Conversation.findById(conversationId)
      : await Conversation.findOne({
          participants: { $all: [req.user._id, receiverId] }
        });

    if (!conversation) {
      conversation = new Conversation({
        participants: [req.user._id, receiverId]
      });
      await conversation.save();
    }

    // Create message
    const message = new Message({
      sender: req.user._id,
      receiver: receiverId,
      conversation: conversation._id,
      content
    });
    await message.save();
    await message.populate('sender', 'name profilePicture');

    // Update conversation
    conversation.lastMessage = message._id;
    conversation.lastMessageAt = new Date();
    await conversation.save();

    // Get socket.io instance properly
    const io = req.app.get('io');
    if (io) {
      console.log('Emitting new-message to conversation:', conversation._id.toString());
      console.log('Message data:', message);
      io.to(conversation._id.toString()).emit('new-message', message);
    } else {
      console.error('Socket.io instance not found');
    }

    res.status(201).json({
      ...message.toObject(),
      conversation
    });

  } catch (error) {
    console.error('Message creation error:', error);
    res.status(500).json({ 
      message: 'Failed to send message',
      error: error.message 
    });
  }
});

export default router;