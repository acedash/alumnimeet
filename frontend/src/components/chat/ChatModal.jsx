import React, { useState, useEffect, useRef } from 'react';
import { FiX, FiSend, FiUser, FiCircle } from 'react-icons/fi';
import { useChat } from '../../context/chatContext';
import './ChatModal.css';

const ChatModal = ({ isOpen, onClose, user }) => {
  const [message, setMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isInitializing, setIsInitializing] = useState(false);
  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const [lastLoadedUserId, setLastLoadedUserId] = useState(null);
  
  const {
    messages, 
    sendMessage, 
    sendTyping, 
    onlineUsers, 
    typingUsers,
    isConnected,
    startChat,
    isLoading,
    error,
    setError,
    fetchConversations
  } = useChat();

  // Start chat when modal opens
  useEffect(() => {
    if (
      isOpen &&
      user &&
      user._id &&
      user._id !== lastLoadedUserId
    ) {
      const initializeChat = async () => {
        setIsInitializing(true);
        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Initialization timeout')), 10000)
        );
        try {
          const initPromise = (async () => {
            await fetchConversations();
            await startChat(user);
          })();
          await Promise.race([initPromise, timeoutPromise]);
          setLastLoadedUserId(user._id);
        } catch (error) {
          console.error('Failed to initialize chat:', error);
        } finally {
          setIsInitializing(false);
        }
      };
      initializeChat();
    }
    if (!isOpen) setLastLoadedUserId(null);
  }, [isOpen, user?._id, startChat, fetchConversations]);

  // Auto scroll to bottom when new messages arrive
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Clear error when modal opens
  useEffect(() => {
    if (isOpen) {
      setError(null);
    } else {
      // Clear messages and current chat when modal closes
      setError(null);
      // Note: We don't clear messages here as they might be needed for other components
      // The context will handle this when switching conversations
    }
  }, [isOpen, setError]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!message.trim() || !user) return;

    try {
      await sendMessage(message.trim());
      setMessage('');
      
      // Stop typing indicator
      if (isTyping) {
        sendTyping(false);
        setIsTyping(false);
      }
    } catch (error) {
      console.error('Failed to send message:', error);
    }
  };

  const handleTyping = (e) => {
    setMessage(e.target.value);

    // Only emit typing if socket is connected
    if (isConnected) {
      if (!isTyping) {
        setIsTyping(true);
        sendTyping(true);
      }

      // Clear existing timeout
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }

      // Set new timeout
      typingTimeoutRef.current = setTimeout(() => {
        setIsTyping(false);
        sendTyping(false);
      }, 2000);
    }
  };

  const getCurrentUserId = () => {
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        // Try all possible fields and always return as string
        return String(payload.id || payload.userId || payload._id);
      } catch (e) {
        return null;
      }
    }
    return null;
  };

  const formatMessageTime = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  if (!isOpen) return null;

  const currentUserId = getCurrentUserId();
  const isOnline = onlineUsers.has(user?._id);

  // Debug badge for ID comparison
  // Remove after verifying
  const debug = false; // set to true to show debug info

  return (
    <div className="chat-modal-overlay">
      <div className="chat-modal">
        <div className="chat-modal-header">
          <div className="chat-user-info">
            <div className="user-avatar">
              {user?.profilePicture ? (
                <img src={user.profilePicture} alt={user.name} />
              ) : (
                <FiUser />
              )}
              <div className={`online-indicator ${isOnline ? 'online' : 'offline'}`}>
                <FiCircle />
              </div>
            </div>
            <div className="user-details">
              <h3>{user?.name}</h3>
              <p>{user?.department}</p>
            </div>
          </div>
          <button className="close-button" onClick={onClose}>
            <FiX />
          </button>
        </div>
        {debug && (
          <div style={{fontSize: '0.8em', color: '#888', padding: '0.5em', background: '#f3f4f6'}}>
            <div>currentUserId: {currentUserId}</div>
            <div>user._id: {user?._id}</div>
          </div>
        )}
        <div className="chat-messages">
          {isLoading || isInitializing ? (
            <div className="loading-messages">
              <p>Loading messages...</p>
            </div>
          ) : error ? (
            <div className="error-message">
              <p>{error}</p>
            </div>
          ) : messages.length === 0 ? (
            <div className="no-messages">
              <p>No messages yet. Start the conversation!</p>
            </div>
          ) : (
            messages.map((msg) => (
              <div
                key={msg._id}
                className={`message ${String(msg.sender) === String(currentUserId) ? 'sent' : 'received'}`}
              >
                <div className="message-content">
                  <p>{msg.content}</p>
                  <span className="message-time">
                    {formatMessageTime(msg.createdAt)}
                  </span>
                </div>
              </div>
            ))
          )}
          
          {/* Typing indicator */}
          {typingUsers[user?._id] && (
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

        <form className="chat-input-form" onSubmit={handleSendMessage}>
          <input
            type="text"
            value={message}
            onChange={handleTyping}
            placeholder="Type a message..."
            disabled={!isConnected}
          />
          <button type="submit" disabled={!message.trim() || !isConnected}>
            <FiSend />
          </button>
        </form>
      </div>
    </div>
  );
};

export default ChatModal;