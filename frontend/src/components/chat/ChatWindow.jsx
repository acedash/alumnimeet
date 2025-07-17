import { useState, useRef, useEffect, useCallback } from 'react';
import { useChat } from "../../context/chatContext";
import { Send, ArrowLeft, User, Phone, Video, MoreVertical } from 'lucide-react';
import './ChatWindow.css';

const ChatWindow = () => {
  const { 
    currentChat, 
    messages, 
    onlineUsers, 
    typingUsers, 
    sendMessage, 
    sendTyping,
    loadChat,
    getCurrentUserId,
    isConnected,
    error
  } = useChat();
  
  const [newMessage, setNewMessage] = useState('');
  const [localLoading, setLocalLoading] = useState(false);
  const [loadedChatId, setLoadedChatId] = useState(null);
  const [forceUpdate, setForceUpdate] = useState(0); // Force re-render
  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const loadingTimeoutRef = useRef(null);

  // Debug logging - only log when important values change
  useEffect(() => {
    console.log('ChatWindow State:', {
      currentChatId: currentChat?._id,
      loadedChatId,
      localLoading,
      messagesCount: messages.length,
      isConnected
    });
    
    // Log messages when they change
    if (messages.length > 0) {
      console.log('ChatWindow Messages:', messages.map(m => ({ id: m._id, content: m.content, sender: m.sender })));
    }
  }, [currentChat?._id, loadedChatId, localLoading, messages.length, isConnected, messages]);

  // Memoize the load chat function - remove hasLoadedChat dependency to prevent recreation
  const handleLoadChat = useCallback(async (chatId) => {
    if (!chatId || chatId.startsWith('temp-')) {
      console.log('Skipping load chat - invalid chat ID:', chatId);
      return;
    }

    // Check if we already loaded this chat
    if (loadedChatId === chatId) {
      console.log('Chat already loaded:', chatId);
      return;
    }

    console.log('Loading chat:', chatId);
    setLocalLoading(true);
    setLoadedChatId(chatId);
    
    // Set a timeout to prevent infinite loading
    loadingTimeoutRef.current = setTimeout(() => {
      console.log('Loading timeout reached, stopping loading');
      setLocalLoading(false);
    }, 10000); // 10 second timeout
    
    try {
      await loadChat(chatId);
      console.log('Load chat completed successfully');
    } catch (error) {
      console.error('Failed to load chat:', error);
      setLoadedChatId(null); // Reset on error to allow retry
    } finally {
      console.log('Load chat completed');
      setLocalLoading(false);
      if (loadingTimeoutRef.current) {
        clearTimeout(loadingTimeoutRef.current);
      }
    }
  }, [loadChat, loadedChatId]);

  // Single useEffect to handle chat loading
  useEffect(() => {
    if (currentChat?._id) {
      console.log('ChatWindow: Loading chat with ID:', currentChat._id);
      handleLoadChat(currentChat._id);
    }

    // Cleanup function
    return () => {
      if (loadingTimeoutRef.current) {
        clearTimeout(loadingTimeoutRef.current);
      }
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, [currentChat?._id, handleLoadChat]);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    console.log('Messages changed, forcing re-render. Count:', messages.length);
    setForceUpdate(prev => prev + 1);
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSend = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !isConnected) return;
    
    console.log('Sending message:', newMessage);
    
    try {
      await sendMessage(newMessage);
      console.log('Message sent successfully, clearing input');
      setNewMessage('');
      
      // Stop typing indicator
      sendTyping(false);
    } catch (error) {
      console.error('Failed to send message:', error);
    }
  };

  const handleTyping = (e) => {
    setNewMessage(e.target.value);
    
    if (isConnected && currentChat) {
      // Start typing indicator
      sendTyping(true);
      
      // Clear existing timeout
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      
      // Set new timeout to stop typing indicator
      typingTimeoutRef.current = setTimeout(() => {
        sendTyping(false);
      }, 2000);
    }
  };

  const getOtherParticipant = () => {
    if (!currentChat?.participants) {
      // If we don't have participants but have messages, try to get from messages
      if (messages.length > 0) {
        const currentUserId = getCurrentUserId();
        const otherMessage = messages.find(msg => 
          (msg.sender._id !== currentUserId && msg.sender !== currentUserId) ||
          (msg.receiver !== currentUserId)
        );
        if (otherMessage) {
          return otherMessage.sender._id !== currentUserId ? otherMessage.sender : { _id: otherMessage.receiver };
        }
      }
      return null;
    }
    const currentUserId = getCurrentUserId();
    return currentChat.participants.find(p => p._id !== currentUserId);
  };

  const formatMessageTime = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  // Show loading only when we have a chat but are loading messages locally
  if (currentChat && localLoading) {
    console.log('Showing loading state');
    return (
      <div className="chat-container">
        <div className="loading-messages">
          <p>Loading messages...</p>
          <button 
            onClick={() => {
              setLocalLoading(false);
              setLoadedChatId(null);
            }}
            style={{ marginTop: '10px', padding: '5px 10px', marginRight: '10px' }}
          >
            Stop Loading
          </button>
          <button 
            onClick={() => {
              setLoadedChatId(null);
              handleLoadChat(currentChat._id);
            }}
            style={{ marginTop: '10px', padding: '5px 10px' }}
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  // Show empty state when no chat is selected and no messages
  if (!currentChat && messages.length === 0) {
    console.log('Showing empty state');
    return (
      <div className="chat-container">
        <div className="empty-chat">
          <p>Select a conversation to start chatting</p>
        </div>
      </div>
    );
  }

  console.log('Rendering chat window');
  const otherParticipant = getOtherParticipant();
  const isOnline = onlineUsers.has(otherParticipant?._id);
  const isTyping = typingUsers[otherParticipant?._id];
  
  // If we have messages but no currentChat, create a minimal chat object
  const displayChat = currentChat || (messages.length > 0 ? { _id: messages[0]?.conversation } : null);

  return (
    <div className="chat-container">
      <div className="chat-header">
        <div className="chat-user-info">
          <div className="user-avatar">
            {otherParticipant?.profilePicture ? (
              <img src={otherParticipant.profilePicture} alt={otherParticipant.name} />
            ) : (
              <User size={24} />
            )}
            <div className={`online-indicator ${isOnline ? 'online' : 'offline'}`}></div>
          </div>
          <div className="user-details">
            <h3>{otherParticipant?.name || 'Unknown User'}</h3>
            <span className={`status ${isOnline ? 'online' : 'offline'}`}>
              {isOnline ? 'Online' : 'Offline'}
            </span>
          </div>
        </div>
      </div>

      {error && (
        <div className="error-message">
          <p>{error}</p>
        </div>
      )}

      {!isConnected && (
        <div className="connection-warning">
          <p>Connecting to chat server...</p>
        </div>
      )}

      <div className="messages">
        {/* Debug info */}
        <div style={{ padding: '10px', background: '#f0f0f0', fontSize: '12px' }}>
          Debug: {messages.length} messages loaded (Force Update: {forceUpdate})
          {messages.length > 0 && (
            <div>
              Latest: {messages[messages.length - 1].content}
              <br />
              All messages: {messages.map(m => m.content).join(', ')}
            </div>
          )}
        </div>
        
        {messages.length > 0 ? (
          messages.map(msg => {
            const currentUserId = getCurrentUserId();
            const isOwnMessage = msg.sender._id === currentUserId || msg.sender === currentUserId;
            
            console.log('Rendering message:', {
              messageId: msg._id,
              content: msg.content,
              senderId: msg.sender._id,
              currentUserId,
              isOwnMessage
            });
            
            return (
              <div 
                key={msg._id} 
                className={`message ${isOwnMessage ? 'sent' : 'received'}`}
              >
                {!isOwnMessage && (
                  <div className="sender-avatar">
                    {otherParticipant?.profilePicture ? (
                      <img src={otherParticipant.profilePicture} alt={otherParticipant.name} />
                    ) : (
                      <User size={16} />
                    )}
                  </div>
                )}
                <div className="message-content">
                  <div className="text">{msg.content}</div>
                  <div className="timestamp">
                    {formatMessageTime(msg.createdAt)}
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div className="no-messages">
            <p>No messages yet. Start the conversation!</p>
          </div>
        )}
        
        {/* Typing indicator */}
        {isTyping && (
          <div className="message received">
            <div className="message-content">
              <div className="typing-indicator">
                <span></span>
                <span></span>
                <span></span>
              </div>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>
      
      <form onSubmit={handleSend} className="message-form">
        <input
          value={newMessage}
          onChange={handleTyping}
          placeholder="Type a message..."
          disabled={!isConnected}
        />
        <button type="submit" disabled={!newMessage.trim() || !isConnected}>
          <Send size={20} />
        </button>
      </form>
    </div>
  );
};

export default ChatWindow;