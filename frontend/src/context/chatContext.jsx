// src/context/ChatContext.js
import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
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
  const [isFetching, setIsFetching] = useState(false);
  const [isLoadingChat, setIsLoadingChat] = useState(false);

  // Refs to ensure we have latest state in event handlers
  const currentChatRef = useRef(currentChat);
  const messagesRef = useRef(messages);
  const isInitializedRef = useRef(false);
  const reconnectTimeoutRef = useRef(null);
  
  // Update refs when state changes
  useEffect(() => {
    currentChatRef.current = currentChat;
  }, [currentChat]);
  
  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  // Helper function to get current user ID
  const getCurrentUserId = useCallback(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      return null;
    }
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const userId = payload.id || payload.userId;
      return userId;
    } catch (e) {
      console.error('Error decoding token:', e);
      return null;
    }
  }, []);



  // Socket event handlers
  const handleNewMessage = useCallback((message) => {
    const currentUserId = getCurrentUserId();
    const isOwnMessage = message.sender._id === currentUserId || message.sender === currentUserId;
    
    console.log('📨 Handling new message:', {
      id: message._id,
      content: message.content.substring(0, 30) + '...',
      isOwn: isOwnMessage,
      conversation: message.conversation
    });
    
    // Simple notification for new messages
    if (!isOwnMessage) {
      // Change page title
      document.title = `(1) New Message - Alumni Meet`;
      
      // Show browser notification if permission granted
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification('New Message', {
          body: `New message from ${message.sender.name}`,
          icon: '/favicon.ico'
        });
      }
    }

    // If we don't have a current chat, set it for any message in this conversation
    if (!currentChatRef.current && message.conversation) {
      setCurrentChat({ _id: message.conversation });
    }

    // Add message if it belongs to current chat or if we don't have a current chat
    const belongsToCurrentChat = currentChatRef.current && message.conversation === currentChatRef.current._id;
    const shouldAddMessage = belongsToCurrentChat || !currentChatRef.current;

    if (shouldAddMessage) {
      setMessages(prevMessages => {
        // Check for duplicates by ID first
        const existingById = prevMessages.findIndex(msg => msg._id === message._id);
        if (existingById !== -1) {
          console.log('🔁 Message already exists by ID, skipping:', message._id);
          return prevMessages;
        }
        
        // Check for optimistic message duplicates (same content, recent timestamp)
        const optimisticDuplicates = prevMessages.filter(msg => 
          msg.isOptimistic && 
          msg.content === message.content && 
          Math.abs(new Date(msg.createdAt) - new Date(message.createdAt)) < 10000 // Within 10 seconds
        );
        
        if (optimisticDuplicates.length > 0) {
          console.log(`🔄 Found ${optimisticDuplicates.length} optimistic duplicate(s), removing them`);
          // Remove ALL optimistic messages that match this content
          const withoutOptimistic = prevMessages.filter(msg => 
            !(msg.isOptimistic && 
              msg.content === message.content && 
              Math.abs(new Date(msg.createdAt) - new Date(message.createdAt)) < 10000)
          );
          
          const newMessages = [...withoutOptimistic, message];
          console.log(`✅ Final messages count after duplicate removal: ${newMessages.length}`);
          return newMessages.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
        }
        
        // Add new message and sort by timestamp
        const newMessages = [...prevMessages, message];
        console.log(`✅ Added new message. Final count: ${newMessages.length}`);
        return newMessages.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
      });
    }
    
    // Update conversations list
    setConversations(prev => prev.map(conv => 
      conv._id === message.conversation ? {
        ...conv,
        lastMessage: message,
        lastMessageAt: new Date()
      } : conv
    ));
  }, [getCurrentUserId]);

  const handleTyping = useCallback(({ userId, conversationId, isTyping }) => {
    if (currentChat && conversationId === currentChat._id) {
      setTypingUsers(prev => ({
        ...prev,
        [userId]: isTyping
      }));
    }
  }, [currentChat]);

  const handleUserStatusChange = useCallback(({ userId, isOnline }) => {
    setOnlineUsers(prev => {
      const newSet = new Set(prev);
      if (isOnline) {
        newSet.add(userId);
      } else {
        newSet.delete(userId);
      }
      return newSet;
    });
  }, []);

  const handleMessageError = useCallback((error) => {
    console.error('Socket message error:', error);
    setError(error.error || 'Message error occurred');
  }, []);

  // Reconnection logic
  const attemptReconnect = useCallback(async () => {
    if (isInitializedRef.current && !socketService.isConnected()) {
      try {
        const token = localStorage.getItem('token');
        if (token) {
          console.log('🔄 Attempting to reconnect...');
          await socketService.connect(token);
          setIsConnected(true);
          console.log('✅ Reconnection successful');
          
          // Rejoin current chat room if any
          if (currentChatRef.current?._id) {
            socketService.joinChat(currentChatRef.current._id);
          }
        }
      } catch (error) {
        console.error('❌ Reconnection failed:', error);
        // Schedule another reconnection attempt
        reconnectTimeoutRef.current = setTimeout(attemptReconnect, 5000);
      }
    }
  }, []);

  const fetchConversations = useCallback(async () => {
    if (isFetching) {
      return;
    }

    try {
      setIsFetching(true);
      setIsLoading(true);
      setError(null);

      const response = await api.get('/chat/conversations');
      setConversations(response.data);

    } catch (err) {
      console.error('Error fetching conversations:', err);
      
      if (err.response?.status === 401) {
        setError('Please login again to view conversations.');
      } else {
        setError('Failed to load conversations');
      }

      setConversations([]);
    } finally {
      setIsLoading(false);
      setIsFetching(false);
    }
  }, [isFetching]);

  const loadMessages = useCallback(async (conversationId) => {
    try {
      const response = await api.get(`/chat/messages/${conversationId}`);
      
      // Replace messages for this conversation
      setMessages(response.data.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt)));

      // Join socket room
      if (isConnected) {
        socketService.joinChat(conversationId);
      }
    } catch (error) {
      console.error('Error loading messages:', error);
      setError('Failed to load messages');
      setMessages([]);
    }
  }, [isConnected]);

  const loadChat = useCallback(async (conversationId) => {
    if (isLoadingChat) {
      return;
    }

    // Check if we already have this chat loaded
    if (currentChat?._id === conversationId && currentChat.participants) {
      return;
    }

    try {
      setIsLoadingChat(true);
      setIsLoading(true);
      setError(null);

      // Get conversation details
      const convResponse = await api.get(`/chat/conversations/${conversationId}`);
      
      // Ensure conversation has participants
      if (!convResponse.data.participants || !Array.isArray(convResponse.data.participants)) {
        const existingConv = conversations.find(c => c._id === conversationId);
        if (existingConv && existingConv.participants) {
          setCurrentChat({
            ...convResponse.data,
            participants: existingConv.participants
          });
        } else {
          throw new Error('Conversation data is incomplete');
        }
      } else {
        setCurrentChat(convResponse.data);
      }

      // Join the socket room for this conversation
      if (isConnected) {
        socketService.joinChat(conversationId);
      }

      // Load messages
      await loadMessages(conversationId);

    } catch (error) {
      console.error('Error loading chat:', error);
      setError('Failed to load chat');
      setCurrentChat(null);
    } finally {
      setIsLoading(false);
      setIsLoadingChat(false);
    }
  }, [currentChat, loadMessages, isLoadingChat, conversations, isConnected]);

  const startChat = useCallback(async (participant) => {
    try {
      setIsLoading(true);
      setError(null);

      // Find existing conversation
      const existingConv = conversations.find(c =>
        c.participants.some(p => p._id === participant._id)
      );

      if (existingConv) {
        // Only update current chat if it's different
        if (currentChat?._id !== existingConv._id) {
          setCurrentChat(existingConv);
          if (isConnected) {
            socketService.joinChat(existingConv._id);
          }
          // Only load messages if we don't already have them for this conversation
          const hasMessagesForThisChat = messages.length > 0 && 
            messages[0]?.conversation === existingConv._id;
          
          if (!hasMessagesForThisChat) {
            await loadMessages(existingConv._id);
          }
        }
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
      console.error('Chat error:', err);
      setError('Failed to start chat');
    } finally {
      setIsLoading(false);
    }
  }, [conversations, isConnected, currentChat, messages, loadMessages]);

  const sendMessage = useCallback(async (content) => {
    if (!currentChat || !isConnected) return;

    try {
      // Safety check for participants
      if (!currentChat.participants || !Array.isArray(currentChat.participants) || currentChat.participants.length === 0) {
        if (currentChat._id && !currentChat._id.startsWith('temp-')) {
          await loadChat(currentChat._id);
          if (!currentChat.participants || !Array.isArray(currentChat.participants) || currentChat.participants.length === 0) {
            throw new Error('Chat participants not loaded. Please refresh and try again.');
          }
        } else {
          throw new Error('Chat participants not loaded. Please refresh and try again.');
        }
      }
      
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
      if (!currentChat._id.startsWith('temp-')) {
        // Join the conversation room first if not already joined
        try {
          socketService.joinChat(currentChat._id);
        } catch (error) {
          console.error('Failed to join chat room:', error);
        }

        // Add optimistic update with a unique temp ID
        const tempId = `temp-${Date.now()}-${Math.random()}-${content.substring(0, 10)}`;
        const optimisticMessage = {
          _id: tempId,
          sender: { _id: getCurrentUserId(), name: 'You' },
          content: messageData.content,
          conversation: messageData.conversationId,
          createdAt: new Date(),
          messageType: 'text',
          isOptimistic: true,
          tempId: tempId // Store the temp ID for later removal
        };
        
        console.log('📝 Adding optimistic message with temp ID:', tempId);
        setMessages(prev => [...prev, optimisticMessage]);

        try {
          const response = await socketService.sendMessage(messageData);
          console.log('✅ Message sent successfully, removing optimistic message:', tempId);
          
          // Remove the optimistic message and replace with the real one
          setMessages(prev => {
            // Remove the optimistic message
            const withoutOptimistic = prev.filter(msg => msg._id !== tempId);
            console.log(`🧹 Removed optimistic message. Messages count: ${withoutOptimistic.length}`);
            // Add the real message from the server
            return [...withoutOptimistic, response];
          });
          
          return response || { success: true };
        } catch (error) {
          console.log('❌ Message sending failed, removing optimistic message:', tempId);
          // Remove the optimistic message on error
          setMessages(prev => prev.filter(msg => msg._id !== tempId));
          throw error;
        }
      } else {
        // For temp chats, send via API first to create conversation
        const response = await api.post('/chat/messages', messageData);
        
        // Update local state optimistically
        setMessages(prev => [...prev, response.data]);
        
        // If temp chat, update with real conversation data
        if (response.data.conversation) {
          setCurrentChat(response.data.conversation);
          await fetchConversations();
        }
        
        return response.data;
      }

    } catch (error) {
      console.error('Message sending failed:', error);
      setError('Failed to send message');
      throw error;
    }
  }, [currentChat, isConnected, fetchConversations, getCurrentUserId, loadChat]);

  // Typing indicator
  const sendTyping = useCallback((isTyping) => {
    if (!currentChat || !isConnected) return;
    socketService.emitTyping(currentChat._id, isTyping);
  }, [currentChat, isConnected]);

  // Test function to debug socket events
  const testSocketConnection = useCallback(() => {
    console.log('🧪 Testing socket connection...');
    console.log('🔗 Is connected:', isConnected);
    console.log('🔗 Socket service connected:', socketService.isConnected());
    console.log('🔗 Socket ID:', socketService.getSocketId());
    console.log('📊 Messages count:', messages.length);
    console.log('🏠 Current chat:', currentChat?._id);
    
    if (isConnected && currentChat?._id) {
      console.log('🧪 Emitting test event...');
      try {
        socketService.emit('test-event', { message: 'Test from frontend', timestamp: Date.now() });
        console.log('✅ Test event emitted successfully');
      } catch (error) {
        console.error('❌ Failed to emit test event:', error);
      }
    }
  }, [isConnected, currentChat, messages]);

  // Function to clean up duplicate messages
  const cleanupDuplicateMessages = useCallback(() => {
    setMessages(prevMessages => {
      const seenIds = new Set();
      const uniqueMessages = prevMessages.filter(msg => {
        if (seenIds.has(msg._id)) {
          console.log('🧹 Removing duplicate message:', msg._id);
          return false;
        }
        seenIds.add(msg._id);
        return true;
      });
      
      if (uniqueMessages.length !== prevMessages.length) {
        console.log(`🧹 Cleaned up ${prevMessages.length - uniqueMessages.length} duplicate messages`);
      }
      
      return uniqueMessages;
    });
  }, []);

  // More aggressive cleanup - removes all duplicates and keeps only first occurrence
  const forceCleanupDuplicates = useCallback(() => {
    setMessages(prevMessages => {
      const seenIds = new Set();
      const uniqueMessages = [];
      
      prevMessages.forEach(msg => {
        if (!seenIds.has(msg._id)) {
          seenIds.add(msg._id);
          uniqueMessages.push(msg);
        } else {
          console.log('🧹 Force removing duplicate message:', msg._id);
        }
      });
      
      if (uniqueMessages.length !== prevMessages.length) {
        console.log(`🧹 Force cleaned up ${prevMessages.length - uniqueMessages.length} duplicate messages`);
        console.log(`📊 Before: ${prevMessages.length}, After: ${uniqueMessages.length}`);
      }
      
      return uniqueMessages;
    });
  }, []);

  // Function to check for duplicate message IDs (for debugging)
  const checkForDuplicates = useCallback(() => {
    const messageIds = messages.map(msg => msg._id);
    const duplicateIds = messageIds.filter((id, index) => messageIds.indexOf(id) !== index);
    
    if (duplicateIds.length > 0) {
      console.log('🚨 Found duplicate message IDs:', duplicateIds);
      console.log('📊 Total messages:', messages.length);
      console.log('🔍 All message IDs:', messageIds);
      
      // Show which messages have duplicate IDs
      duplicateIds.forEach(duplicateId => {
        const duplicateMessages = messages.filter(msg => msg._id === duplicateId);
        console.log(`📝 Messages with ID ${duplicateId}:`, duplicateMessages);
      });
    } else {
      console.log('✅ No duplicate message IDs found');
    }
  }, [messages]);

  // Initialize socket connection only once - moved to the end after all functions are defined
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token || isInitializedRef.current) return;

    const connectSocket = async () => {
      try {
        // Only connect if not already connected
        if (!socketService.isConnected()) {
          await socketService.connect(token);
        }
        
        setIsConnected(true);
        isInitializedRef.current = true;

        // Set up socket event listeners only once
        socketService.on('new-message', (message) => {
          handleNewMessage(message);
        });
        
        socketService.on('message-sent', (message) => {
          handleNewMessage(message);
        });
        
        socketService.on('typing', (data) => {
          handleTyping(data);
        });
        
        socketService.on('user-status-changed', (data) => {
          handleUserStatusChange(data);
        });
        
        socketService.on('message-error', (error) => {
          handleMessageError(error);
        });

        // Test response listener
        socketService.on('test-response', (data) => {
          console.log('🧪 Received test response from backend:', data);
        });

        socketService.on('connect', () => {
          setIsConnected(true);
          // Clear any pending reconnection attempts
          if (reconnectTimeoutRef.current) {
            clearTimeout(reconnectTimeoutRef.current);
            reconnectTimeoutRef.current = null;
          }
        });
        
        socketService.on('disconnect', () => {
          setIsConnected(false);
          // Attempt to reconnect after a delay
          if (isInitializedRef.current) {
            reconnectTimeoutRef.current = setTimeout(attemptReconnect, 2000);
          }
        });

        // Request notification permission
        if ('Notification' in window && Notification.permission === 'default') {
          Notification.requestPermission();
        }

      } catch (error) {
        console.error('Failed to connect socket:', error);
        setIsConnected(false);
        // Schedule reconnection attempt
        reconnectTimeoutRef.current = setTimeout(attemptReconnect, 5000);
      }
    };

    connectSocket();

    // Don't disconnect on unmount - keep the connection alive
    return () => {
      // Only remove listeners, don't disconnect
      socketService.removeAllListeners();
    };
  }, []); // No dependencies needed since all functions are now defined above

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      // Only disconnect when the entire app is unmounting
      if (isInitializedRef.current) {
        if (reconnectTimeoutRef.current) {
          clearTimeout(reconnectTimeoutRef.current);
        }
        socketService.disconnect();
        isInitializedRef.current = false;
      }
    };
  }, []);

  // Auto-cleanup duplicates whenever messages change
  useEffect(() => {
    if (messages.length > 0) {
      const messageIds = messages.map(msg => msg._id);
      const duplicateIds = messageIds.filter((id, index) => messageIds.indexOf(id) !== index);
      
      if (duplicateIds.length > 0) {
        console.log('🚨 Auto-detected duplicates, cleaning up:', duplicateIds);
        cleanupDuplicateMessages();
      }
    }
  }, [messages, cleanupDuplicateMessages]);

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
        setError,
        testSocketConnection,
        cleanupDuplicateMessages,
        checkForDuplicates,
        forceCleanupDuplicates
      }}
    >
      {children}
    </ChatContext.Provider>
  );
};

export const useChat = () => useContext(ChatContext);