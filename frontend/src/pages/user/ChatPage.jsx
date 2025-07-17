// src/pages/ChatPage.jsx
import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { useChat } from '../../context/chatContext';
import ChatList from '../../components/chat/ChatList';
import ChatWindow from '../../components/chat/ChatWindow';

const ChatPage = () => {
  const { chatId } = useParams();
  const { currentChat, setCurrentChat, isConnected, fetchConversations } = useChat();
  const [isMobileChatOpen, setIsMobileChatOpen] = useState(false);
  const [lastChatId, setLastChatId] = useState(null);

  // Memoize the setCurrentChat function to prevent unnecessary re-renders
  const handleSetCurrentChat = useCallback((chat) => {
    if (chat?._id !== lastChatId) {
      console.log('Setting current chat:', chat?._id);
      setCurrentChat(chat);
      setLastChatId(chat?._id);
    }
  }, [setCurrentChat, lastChatId]);

  // Set current chat when chatId changes (ChatWindow will handle loading)
  useEffect(() => {
    if (chatId && chatId !== lastChatId) {
      console.log('ChatPage: Setting chat ID from URL:', chatId);
      // Just set the chat ID, let ChatWindow handle the loading
      handleSetCurrentChat({ _id: chatId });
      setIsMobileChatOpen(true);
    } else if (!chatId) {
      console.log('ChatPage: Clearing current chat');
      handleSetCurrentChat(null);
    }
  }, [chatId, handleSetCurrentChat]);

  // Fetch conversations only once when component mounts
  useEffect(() => {
    console.log('ChatPage: Fetching conversations on mount');
    fetchConversations();
  }, [fetchConversations]);

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Left sidebar - Chat List */}
      <div className={`w-full lg:w-1/3 ${isMobileChatOpen ? 'hidden lg:block' : 'block'}`}>
        <ChatList />
      </div>

      {/* Right side - Chat Window */}
      <div className={`w-full lg:w-2/3 ${chatId ? 'block' : 'hidden lg:block'}`}>
        {chatId ? (
          <ChatWindow 
            onBack={() => setIsMobileChatOpen(false)} 
          />
        ) : (
          <div className="flex items-center justify-center h-full">
            <div className="text-center p-6 max-w-md">
              <h3 className="text-xl font-medium text-gray-700 mb-2">
                {currentChat ? 'Select a conversation' : 'No chats available'}
              </h3>
              <p className="text-gray-500">
                {currentChat ? 'Choose from your existing conversations' : 'Start a new conversation'}
              </p>
              {!isConnected && (
                <div className="mt-4 p-3 bg-yellow-100 text-yellow-800 rounded">
                  <p className="text-sm">Connecting to chat server...</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatPage;