import { useState, useRef, useEffect, useCallback } from 'react';
import { useChat } from "../../context/chatContext";
import { Send, User, Wifi, WifiOff } from 'lucide-react';
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
    error,
    testSocketConnection,
    cleanupDuplicateMessages,
    checkForDuplicates,
    forceCleanupDuplicates
  } = useChat();
  
  const [newMessage, setNewMessage] = useState('');
  const [localLoading, setLocalLoading] = useState(false);
  const [loadedChatId, setLoadedChatId] = useState(null);
  const [connectionStatus, setConnectionStatus] = useState('connecting');
  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const loadingTimeoutRef = useRef(null);

  // Update connection status
  useEffect(() => {
    if (isConnected) {
      setConnectionStatus('connected');
    } else {
      setConnectionStatus('disconnected');
    }
  }, [isConnected]);

  const handleLoadChat = useCallback(async (chatId) => {
    if (!chatId || chatId.startsWith('temp-')) return;
    if (loadedChatId === chatId) return;
    
    // Don't reload if we already have messages for this chat
    if (messages.length > 0 && messages[0]?.conversation === chatId) {
      setLoadedChatId(chatId);
      return;
    }
    
    setLocalLoading(true);
    setLoadedChatId(chatId);
    loadingTimeoutRef.current = setTimeout(() => setLocalLoading(false), 10000);
    try {
      await loadChat(chatId);
    } finally {
      setLocalLoading(false);
      if (loadingTimeoutRef.current) clearTimeout(loadingTimeoutRef.current);
    }
  }, [loadChat, loadedChatId, messages]);

  useEffect(() => {
    if (currentChat?._id) {
      handleLoadChat(currentChat._id);
    }
    return () => {
      if (loadingTimeoutRef.current) clearTimeout(loadingTimeoutRef.current);
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    };
  }, [currentChat?._id, handleLoadChat]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSend = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !isConnected) return;
    try {
      await sendMessage(newMessage);
      setNewMessage('');
      sendTyping(false);
    } catch {}
  };

  const handleTyping = (e) => {
    setNewMessage(e.target.value);
    if (isConnected && currentChat) {
      sendTyping(true);
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = setTimeout(() => {
        sendTyping(false);
      }, 2000);
    }
  };

  const getOtherParticipant = () => {
    if (!currentChat?.participants) {
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

  const getConnectionStatusText = () => {
    switch (connectionStatus) {
      case 'connected':
        return 'Connected to chat server';
      case 'disconnected':
        return 'Disconnected from chat server';
      case 'connecting':
        return 'Connecting to chat server...';
      default:
        return 'Unknown connection status';
    }
  };

  if (currentChat && localLoading) {
    return (
      <div className="chat-window">
        <div className="loading-messages">
          <p>Loading messages...</p>
          <button onClick={() => { setLocalLoading(false); setLoadedChatId(null); }}>
            Stop Loading
          </button>
          <button onClick={() => { setLoadedChatId(null); handleLoadChat(currentChat._id); }}>
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!currentChat && messages.length === 0) {
    return (
      <div className="chat-window">
        <div className="empty-chat">
          <p>Select a conversation to start chatting</p>
        </div>
      </div>
    );
  }

  const otherParticipant = getOtherParticipant();
  const isOnline = onlineUsers.has(otherParticipant?._id);
  const isTyping = typingUsers[otherParticipant?._id];

  return (
    <div className="chat-window">
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
            <span className={`status ${isOnline ? 'online' : 'offline'}`}>{isOnline ? 'Online' : 'Offline'}</span>
          </div>
        </div>
        <div className={`connection-status ${connectionStatus}`}>
          {connectionStatus === 'connected' ? <Wifi size={16} /> : <WifiOff size={16} />}
          <span>{getConnectionStatusText()}</span>
        </div>
        {/* Test button for debugging */}
        <button 
          onClick={testSocketConnection}
          style={{ 
            padding: '4px 8px', 
            fontSize: '12px', 
            background: '#f0f0f0', 
            border: '1px solid #ccc',
            borderRadius: '4px',
            cursor: 'pointer',
            marginRight: '8px'
          }}
        >
          🧪 Test
        </button>
        {/* Cleanup button for debugging */}
        <button 
          onClick={cleanupDuplicateMessages}
          style={{ 
            padding: '4px 8px', 
            fontSize: '12px', 
            background: '#ffebee', 
            border: '1px solid #f44336',
            borderRadius: '4px',
            cursor: 'pointer',
            color: '#d32f2f',
            marginRight: '8px'
          }}
        >
          🧹 Clean
        </button>
        {/* Check duplicates button for debugging */}
        <button 
          onClick={checkForDuplicates}
          style={{ 
            padding: '4px 8px', 
            fontSize: '12px', 
            background: '#fff3e0', 
            border: '1px solid #ff9800',
            borderRadius: '4px',
            cursor: 'pointer',
            color: '#e65100',
            marginRight: '8px'
          }}
        >
          🔍 Check
        </button>
        {/* Force cleanup button for debugging */}
        <button 
          onClick={forceCleanupDuplicates}
          style={{ 
            padding: '4px 8px', 
            fontSize: '12px', 
            background: '#e8f5e8', 
            border: '1px solid #4caf50',
            borderRadius: '4px',
            cursor: 'pointer',
            color: '#2e7d32'
          }}
        >
          🚀 Force
        </button>
      </div>
      {error && (
        <div className="error-message">
          <p>{error}</p>
        </div>
      )}
      {connectionStatus === 'disconnected' && (
        <div className="connection-warning">
          <p>⚠️ Chat server connection lost. Messages may not be delivered in real-time.</p>
        </div>
      )}
      <div className="messages-container">
        {messages.length > 0 ? (
          messages.map(msg => {
            const currentUserId = getCurrentUserId();
            const isOwnMessage = msg.sender._id === currentUserId || msg.sender === currentUserId;
            return (
              <div key={msg._id} className={`message-bubble ${isOwnMessage ? 'own' : 'other'}`}>
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
                  <div className="timestamp">{formatMessageTime(msg.createdAt)}</div>
                </div>
              </div>
            );
          })
        ) : (
          <div className="no-messages">
            <p>No messages yet. Start the conversation!</p>
          </div>
        )}
        {isTyping && (
          <div className="message-bubble received">
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
          className="message-input"
        />
        <button type="submit" disabled={!newMessage.trim() || !isConnected} className={`send-button ${newMessage.trim() && isConnected ? 'active' : 'inactive'}`}>
          <Send size={20} />
        </button>
      </form>
    </div>
  );
};

export default ChatWindow;