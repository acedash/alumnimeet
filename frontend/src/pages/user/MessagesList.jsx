import React, { useState, useEffect } from 'react';
import { useChat } from '../../context/chatContext';
import { MessageCircle, Search, User, Clock, Check, CheckCheck } from 'lucide-react';
import './MessagesList.css';
import { useNavigate } from 'react-router-dom';

const MessagesList = ({ onConversationSelect }) => {
    const navigate = useNavigate();
  // Use context's conversations and fetchConversations
  const { conversations, startChat, onlineUsers, isLoading, error, fetchConversations, getCurrentUserId } = useChat();

  const [searchTerm, setSearchTerm] = useState('');
  const [filteredConversations, setFilteredConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [isMounted, setIsMounted] = useState(true);

  // Debug authentication
  useEffect(() => {
    const token = localStorage.getItem('token');
    console.log('MessagesList - Token exists:', !!token);
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        console.log('MessagesList - Token payload:', payload);
      } catch (e) {
        console.error('MessagesList - Invalid token:', e);
      }
    }
  }, []);

  // Use context's fetchConversations instead of your own
  useEffect(() => {
    console.log('MessagesList - fetchConversations effect triggered');
    if (isMounted) {
      fetchConversations();
    }
    
    return () => {
      setIsMounted(false);
    };
  }, []); // Remove fetchConversations from dependencies to prevent infinite loop

  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredConversations(conversations);
    } else {
      const filtered = conversations.filter(conversation => {
        const otherParticipant = conversation.participants.find(p => p._id !== getCurrentUserId());
        return otherParticipant?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
               otherParticipant?.department?.toLowerCase().includes(searchTerm.toLowerCase());
      });
      setFilteredConversations(filtered);
    }
  }, [conversations, searchTerm, getCurrentUserId]);

  const handleConversationClick = (conversation) => {
    console.log('Conversation clicked:', conversation); // Debug log
    const currentUserId = getCurrentUserId();
    const otherParticipant = conversation.participants.find(p => p._id !== currentUserId);

    if (otherParticipant) {
      console.log('Starting chat with:', otherParticipant); // Debug log
      setSelectedConversation(conversation);
      
      // Navigate to the chat page with the conversation ID
      navigate(`/chat/${conversation._id}`);
      
      // Call the parent handler to show chat window if provided
      if (onConversationSelect) {
        onConversationSelect();
      }
    }
  };

  const formatLastMessageTime = (timestamp) => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = (now - date) / (1000 * 60 * 60);

    if (diffInHours < 24) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (diffInHours < 168) {
      return date.toLocaleDateString([], { weekday: 'short' });
    } else {
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    }
  };

  const truncateMessage = (message, maxLength = 50) => {
    if (!message) return 'No messages yet';
    if (message.length <= maxLength) return message;
    return message.substring(0, maxLength) + '...';
  };

  const isUserOnline = (userId) => {
    return onlineUsers.has(userId);
  };

  if (isLoading) {
    return (
      <div className="messages-container">
        <div className="loading-spinner">
          <p>Loading conversations...</p>
          <button 
            onClick={() => {
              console.log('Manual retry clicked');
              fetchConversations();
            }}
            style={{ 
              marginTop: '10px', 
              padding: '8px 16px',
              backgroundColor: '#667eea',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="messages-container">
        <div className="error-message">
          <p>Error loading conversations: {error}</p>
          <button onClick={fetchConversations}>Retry</button>
        </div>
      </div>
    );
  }

  return (
    <div className="messages-container">
      <div className="messages-box">
        <div className="messages-header">
          <h1><MessageCircle size={24} /> Messages</h1>
          <div className="search-wrapper">
            <Search className="search-icon" size={16} />
            <input
              type="text"
              placeholder="Search conversations..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div className="conversations-list">
          {filteredConversations.length === 0 ? (
            <div className="empty-state">
              <MessageCircle size={48} />
              <p>No conversations yet</p>
              <span>Start chatting with alumni or students to see your messages here</span>
            </div>
          ) : (
            filteredConversations.map((conversation) => {
              const currentUserId = getCurrentUserId();
              const otherParticipant = conversation.participants.find(p => p._id !== currentUserId);
              const isOnline = isUserOnline(otherParticipant?._id);
              const isSelected = selectedConversation?._id === conversation._id;

              return (
                <div
                  key={conversation._id}
                  onClick={() => handleConversationClick(conversation)}
                  className={`conversation-item ${isSelected ? 'selected' : ''}`}
                >
                  <div className="avatar-section">
                    {otherParticipant?.profilePicture ? (
                      <img src={otherParticipant.profilePicture} alt={otherParticipant.name} />
                    ) : (
                      <div className="default-avatar">
                        <User size={20} />
                      </div>
                    )}
                    {isOnline && <span className="online-indicator" />}
                  </div>

                  <div className="conversation-details">
                    <div className="conversation-top">
                      <h3>{otherParticipant?.name || 'Unknown User'}</h3>
                      {conversation.lastMessageAt && (
                        <span>{formatLastMessageTime(conversation.lastMessageAt)}</span>
                      )}
                      {conversation.lastMessage?.sender === currentUserId && (
                        <span className="read-status">
                          {conversation.lastMessage?.isRead ? (
                            <CheckCheck size={16} />
                          ) : (
                            <Check size={16} />
                          )}
                        </span>
                      )}
                    </div>

                    <div className="conversation-meta">
                      <span className="department">{otherParticipant?.department}</span>
                      <span className="user-type">
                        {otherParticipant?.userType === 'alumni' ? 'Alumni' : 'Student'}
                      </span>
                      {isOnline && <span className="status-online">Online</span>}
                    </div>

                    {conversation.lastMessage && (
                      <p className="last-message">
                        {conversation.lastMessage.sender === currentUserId ? 'You: ' : ''}
                        {truncateMessage(conversation.lastMessage.content)}
                      </p>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};

export default MessagesList;