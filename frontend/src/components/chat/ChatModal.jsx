import React, { useState, useEffect, useRef } from 'react';
import { FiX, FiSend, FiUser, FiCircle } from 'react-icons/fi';
import { useChat } from '../../context/chatContext';
import './ChatModal.css';

const ChatModal = ({ isOpen, onClose, user }) => {
  const [message, setMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  
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
    setError
  } = useChat();

  // Start chat when modal opens
  useEffect(() => {
    if (isOpen && user && user._id) {
      startChat(user);
    }
  }, [isOpen, user?._id, startChat]);

  // Auto scroll to bottom when new messages arrive
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Clear error when modal opens
  useEffect(() => {
    if (isOpen) {
      setError(null);
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
        return payload.id || payload.userId;
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

        <div className="chat-messages">
          {isLoading ? (
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
                className={`message ${msg.sender === currentUserId ? 'sent' : 'received'}`}
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