import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useChat } from '../../context/chatContext';
import LoadingSpinner from '../ui/LoadingSpinner';
import './ChatList.css';

const ChatList = () => {
  const { 
    conversations, 
    fetchConversations, 
    isLoading, 
    error, 
    getCurrentUserId,
    onlineUsers 
  } = useChat();

  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  if (isLoading) return <LoadingSpinner />;
  if (error) return <div className="error-message">Error: {error}</div>;

  return (
    <div className="chat-list">
      <h2>Your Conversations</h2>
      {conversations.length === 0 ? (
        <div className="no-chats">No conversations yet</div>
      ) : (
        <ul>
          {conversations.map(conversation => {
            const currentUserId = getCurrentUserId();
            const otherParticipant = conversation.participants.find(p => p._id !== currentUserId);
            const isOnline = onlineUsers.has(otherParticipant?._id);
            
            return (
              <li key={conversation._id} className="chat-item">
                <Link to={`/chat/${conversation._id}`} className="chat-link">
                  <div className="participant-avatar-container">
                    <img 
                      src={otherParticipant?.profilePicture || 'https://bit.ly/dan-abramov'} 
                      alt={otherParticipant?.name || 'User'}
                      className="participant-avatar"
                    />
                    <div className={`online-indicator ${isOnline ? 'online' : 'offline'}`}></div>
                  </div>
                  <div className="chat-info">
                    <h3>{otherParticipant?.name || 'Unknown User'}</h3>
                    <p className="participant-type">
                      {otherParticipant?.userType === 'alumni' ? 'Alumni' : 'Student'}
                    </p>
                    {conversation.lastMessage && (
                      <p className="last-message">
                        {conversation.lastMessage.content.substring(0, 50)}...
                      </p>
                    )}
                    <p className="last-message-time">
                      {conversation.lastMessageAt ? 
                        new Date(conversation.lastMessageAt).toLocaleDateString() : 
                        'No messages yet'
                      }
                    </p>
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
};

export default ChatList;