// src/context/ChatContext.js
import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import socketService from '../services/socketService';
import api from '../services/api';

const ChatContext = createContext();

export const ChatProvider = ({ children }) => {
  const [currentChat, setCurrentChat] = useState(null);
  const [conversations, setConversations] = useState([]);
  const [messages, setMessages] = useState([]);
  const [typingUsers, setTypingUsers] = useState({});
  const [onlineUsers, setOnlineUsers] = useState(new Set());
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isFetching, setIsFetching] = useState(false); // Flag to prevent multiple calls
  const [isLoadingChat, setIsLoadingChat] = useState(false); // Flag to prevent multiple chat loads
  const [processedMessageIds, setProcessedMessageIds] = useState(new Set()); // Track processed message IDs

  // Initialize socket connection
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return;

    const connectSocket = async () => {
      try {
        await socketService.connect(token);
        setIsConnected(true);

        // Set up socket event listeners
        socketService.on('new-message', handleNewMessage);
        socketService.on('message-sent', handleNewMessage); // Handle acknowledgment
        socketService.on('typing', handleTyping);
        socketService.on('user-status-changed', handleUserStatusChange);
        socketService.on('message-error', handleMessageError);

        // Handle connection status
        socketService.on('connect', () => setIsConnected(true));
        socketService.on('disconnect', () => setIsConnected(false));

      } catch (error) {
        console.error('Failed to connect socket:', error);
        setIsConnected(false);
      }
    };

    connectSocket();

    return () => {
      socketService.removeAllListeners();
      socketService.disconnect();
    };
  }, []);

  const fetchConversations = useCallback(async () => {
    console.log('fetchConversations called');

    // Prevent multiple simultaneous calls
    if (isFetching) {
      console.log('Already fetching conversations, skipping...');
      return;
    }

    try {
      setIsFetching(true);
      setIsLoading(true);
      setError(null);
      console.log('Fetching conversations from API...');

      // Add timeout to prevent infinite loading
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Request timeout')), 10000)
      );

      const fetchPromise = api.get('/chat/conversations');
      const response = await Promise.race([fetchPromise, timeoutPromise]);

      console.log('Conversations response:', response.data);
      setConversations(response.data);

    } catch (err) {
      console.error('Error fetching conversations:', err);
      console.error('Error details:', {
        message: err.message,
        response: err.response?.data,
        status: err.response?.status
      });

      if (err.message === 'Request timeout') {
        setError('Request timed out. Please check your connection.');
      } else if (err.response?.status === 401) {
        setError('Please login again to view conversations.');
      } else {
        setError('Failed to load conversations');
      }

      setConversations([]); // Set empty array on error
    } finally {
      console.log('Setting isLoading to false in fetchConversations');
      setIsLoading(false);
      setIsFetching(false);
    }
  }, []); // Remove isFetching dependency to prevent circular dependency

  const startChat = useCallback(async (participant) => {
    try {
      setIsLoading(true);
      setError(null);

      // Find existing conversation
      const existingConv = conversations.find(c =>
        c.participants.some(p => p._id === participant._id)
      );

      if (existingConv) {
        setCurrentChat(existingConv);
        await loadMessages(existingConv._id);
      } else {
        // Create new temporary chat
        setCurrentChat({
          _id: `temp-${Date.now()}`,
          participants: [participant],
          lastMessage: null
        });
        setMessages([]);
      }
    } catch (err) {
      console.error('Chat error details:', {
        message: err.message,
        response: err.response?.data,
        status: err.response?.status
      });
      setError('Failed to start chat');
    } finally {
      setIsLoading(false);
    }
  }, [conversations]);

  const loadMessages = useCallback(async (conversationId) => {
    console.log('loadMessages called with:', conversationId);
    try {
      const response = await api.get(`/chat/messages/${conversationId}`);
      console.log('Messages response:', response.data);

      // Merge with existing messages to preserve any real-time messages
      setMessages(prev => {
        console.log('Previous messages before merge:', prev.map(m => ({ id: m._id, content: m.content })));
        console.log('API messages:', response.data.map(m => ({ id: m._id, content: m.content })));

        const existingIds = new Set(prev.map(msg => msg._id));
        const newMessages = response.data.filter(msg => !existingIds.has(msg._id));
        const mergedMessages = [...prev, ...newMessages];

        // Sort by creation time
        mergedMessages.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));

        console.log('Merged messages:', {
          previous: prev.length,
          new: newMessages.length,
          total: mergedMessages.length,
          existingIds: Array.from(existingIds)
        });

        return mergedMessages;
      });

      // Join socket room
      if (isConnected) {
        console.log('Joining socket room:', conversationId);
        socketService.joinChat(conversationId);
      }
    } catch (error) {
      console.error('Error loading messages:', error);
      setError('Failed to load messages');
      setMessages([]);
    }
  }, [isConnected]);

  const loadChat = useCallback(async (conversationId) => {
    console.log('loadChat called with:', conversationId);

    // Prevent multiple simultaneous calls
    if (isLoadingChat) {
      console.log('Already loading chat, skipping...');
      return;
    }

    // Check if we already have this chat loaded
    if (currentChat?._id === conversationId && currentChat.participants) {
      console.log('Chat already loaded with participants, skipping loadChat');
      return;
    }

    try {
      setIsLoadingChat(true);
      setIsLoading(true);
      setError(null);
      console.log('Loading chat details...');

      // Get conversation details
      const convResponse = await api.get(`/chat/conversations/${conversationId}`);
      console.log('Chat details loaded:', convResponse.data);
      setCurrentChat(convResponse.data);

      // Load messages
      console.log('Loading messages...');
      await loadMessages(conversationId);
      console.log('Messages loaded');

    } catch (error) {
      console.error('Error loading chat:', error);
      setError('Failed to load chat');
      // Reset current chat if loading failed
      setCurrentChat(null);
    } finally {
      console.log('Setting isLoading to false');
      setIsLoading(false);
      setIsLoadingChat(false);
    }
  }, [currentChat, loadMessages, isLoadingChat]);

  const sendMessage = useCallback(async (content) => {
    if (!currentChat || !isConnected) return;

    try {
      const currentUserId = getCurrentUserId();
      const receiver = currentChat.participants.find(
        p => p._id !== currentUserId
      );

      if (!receiver) {
        throw new Error('No receiver found in this chat');
      }

      const messageData = {
        conversationId: currentChat._id.startsWith('temp-') ? null : currentChat._id,
        receiverId: receiver._id,
        content
      };

      // Send via socket for real-time delivery
     // Send via socket for real-time delivery
if (!currentChat._id.startsWith('temp-')) {
  console.log('Sending message via socket:', messageData);

  // Add the message optimistically to the state immediately
  const optimisticMessage = {
    _id: `temp-${Date.now()}`,
    sender: { _id: getCurrentUserId() },
    content: messageData.content,
    conversation: messageData.conversationId,
    createdAt: new Date(),
    messageType: 'text'
  };
  setMessages(prev => [...prev, optimisticMessage]);
  console.log('Added optimistic message to state');

  try {
    const response = await socketService.sendMessage(messageData);
    console.log('Socket response:', response);
    // The real message will be added via socket event, so nothing else to do here
    console.log('Returning from sendMessage function');
    return response || { success: true }; // Ensure we always return something
  } catch (error) {
    console.error('Socket send error:', error);
    throw error;
  }
} else {
        // For temp chats, send via API first to create conversation
        console.log('Sending message via API for temp chat:', messageData);
        const response = await api.post('/chat/messages', messageData);
        
        // Update local state optimistically
        setMessages(prev => [...prev, response.data]);
        
        // If temp chat, update with real conversation data
        if (response.data.conversation) {
          setCurrentChat(response.data.conversation);
          await fetchConversations(); // Refresh list
        }
        
        return response.data;
      }

    } catch (error) {
      console.error('Message sending failed:', error);
      setError('Failed to send message');
      throw error;
    }
  }, [currentChat, isConnected, fetchConversations]);

  // Socket event handlers
  const handleNewMessage = (message) => {
    console.log('Received new message via socket:', message);
    console.log('Current chat ID:', currentChat?._id);
    console.log('Message conversation ID:', message.conversation);
    
    // Check if we've already processed this message
    if (processedMessageIds.has(message._id)) {
      console.log('Message already processed, skipping:', message._id);
      return;
    }
    
    // Mark this message as processed
    setProcessedMessageIds(prev => new Set([...prev, message._id]));
    
    // Update messages list if in current chat OR if this is a message we sent
    const currentUserId = getCurrentUserId();
    console.log('User ID comparison:', {
      currentUserId,
      messageSenderId: message.sender._id,
      messageSender: message.sender,
      isEqual: message.sender._id === currentUserId || message.sender === currentUserId
    });
    
    const isOwnMessage = message.sender._id === currentUserId || message.sender === currentUserId;
    const isCurrentChat = currentChat && message.conversation === currentChat._id;

    // If we don't have a current chat, set it for any message in this conversation
    if (!currentChat && message.conversation) {
      console.log('No current chat set, setting current chat for conversation:', message.conversation);
      // Set a minimal chat object - let the ChatWindow handle loading
      setCurrentChat({ _id: message.conversation });
    }

    // Also add messages that belong to the conversation we just set as current chat
    const belongsToCurrentChat = isCurrentChat || (!currentChat && message.conversation);
    console.log('Message processing decision:', { isCurrentChat, belongsToCurrentChat, isOwnMessage, currentChatId: currentChat?._id, messageConversationId: message.conversation });

    if (belongsToCurrentChat || isOwnMessage) {
      console.log('Adding message to current chat:', message);
      setMessages(prev => {
        console.log('Previous messages before adding socket message:', prev.map(m => ({ id: m._id, content: m.content })));
        console.log('Adding socket message:', { id: message._id, content: message.content });
        
        // Check if message already exists to prevent duplicates
        const exists = prev.some(msg => msg._id === message._id);
        if (exists) {
          console.log('Message already exists in state, skipping:', message._id);
          return prev;
        }
        
        // Add the message
        const newMessages = [...prev, message];
        console.log('New messages after adding socket message:', newMessages.map(m => ({ id: m._id, content: m.content })));
        console.log('Successfully added message to state');
        return newMessages;
      });
    } else {
      console.log('Message not for current chat or no current chat');
    }
    
    // Update conversations list
    setConversations(prev => prev.map(conv => 
      conv._id === message.conversation ? {
        ...conv,
        lastMessage: message,
        lastMessageAt: new Date()
      } : conv
    ));
  };

  const handleTyping = ({ userId, conversationId, isTyping }) => {
    if (currentChat && conversationId === currentChat._id) {
      setTypingUsers(prev => ({
        ...prev,
        [userId]: isTyping
      }));
    }
  };

  const handleUserStatusChange = ({ userId, isOnline }) => {
    setOnlineUsers(prev => {
      const newSet = new Set(prev);
      if (isOnline) {
        newSet.add(userId);
      } else {
        newSet.delete(userId);
      }
      return newSet;
    });
  };

  const handleMessageError = (error) => {
    console.error('Socket message error:', error);
    setError(error.error || 'Message error occurred');
  };

  // Typing indicator
  const sendTyping = (isTyping) => {
    if (!currentChat || !isConnected) return;
    socketService.emitTyping(currentChat._id, isTyping);
  };

  const getCurrentUserId = useCallback(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      console.log('No token found in localStorage');
      return null;
    }
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const userId = payload.id || payload.userId;
      console.log('Decoded user ID from token:', userId);
      return userId;
    } catch (e) {
      console.error('Error decoding token:', e);
      return null;
    }
  }, []);

  return (
    <ChatContext.Provider
      value={{
        currentChat,
        conversations,
        messages,
        onlineUsers,
        typingUsers,
        isLoading,
        error,
        isConnected,
        fetchConversations,
        startChat,
        loadChat,
        sendMessage,
        sendTyping,
        setCurrentChat,
        getCurrentUserId,
        setError
      }}
    >
      {children}
    </ChatContext.Provider>
  );
};

export const useChat = () => useContext(ChatContext);