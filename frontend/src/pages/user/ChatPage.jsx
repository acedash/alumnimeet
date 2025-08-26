// src/pages/ChatPage.jsx
import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { useChat } from '../../context/chatContext';
import ChatList from '../../components/chat/ChatList';
import ChatWindow from '../../components/chat/ChatWindow';

const ChatPage = () => {
  const { chatId } = useParams();
  const { currentChat, setCurrentChat, isConnected, fetchConversations, messages } = useChat();
  const [isMobileChatOpen, setIsMobileChatOpen] = useState(false);
  const [lastChatId, setLastChatId] = useState(null);

  // Memoize the setCurrentChat function to prevent unnecessary re-renders
  const handleSetCurrentChat = useCallback((chat) => {
    if (chat?._id !== lastChatId) {
      setCurrentChat(chat);
      setLastChatId(chat?._id);
    }
  }, [setCurrentChat, lastChatId]);

  // Set current chat when chatId changes (ChatWindow will handle loading)
  useEffect(() => {
    if (chatId && chatId !== lastChatId) {
      // Just set the chat ID, let ChatWindow handle the loading
      handleSetCurrentChat({ _id: chatId });
      setIsMobileChatOpen(true);
    } else if (!chatId && messages.length === 0) { // Only clear current chat if there are no messages
      handleSetCurrentChat(null);
    }
  }, [chatId, handleSetCurrentChat, messages.length]);

  // Fetch conversations only once when component mounts
  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Left sidebar - Chat List */}
     

      {/* Right side - Chat Window */}
      <div className="w-full lg:w-2/3">
        <ChatWindow 
          key={`${currentChat?._id}-${messages?.length ||0}`}
          onBack={() => setIsMobileChatOpen(false)} 
        />
      </div>
    </div>
  );
};

export default ChatPage;