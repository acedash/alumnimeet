import api from './api';

export const chatService = {
 async getChatMessages(chatId) {
    try {
      const response = await api.get(`/chats/${chatId}`);
      return response.data;
    } catch (error) {
      if (error.response?.status === 404) {
        // Return null instead of throwing error to allow creation flow
        return null;
      }
      throw error;
    }
  },

  async getOrStartChat(participantId) {
    try {
      const response = await api.post('/chats/start', { participantId });
      return response.data;
    } catch (error) {
      console.error('Failed to start chat:', error);
      throw new Error(error.response?.data?.error || 'Failed to start new chat');
    }
  },

  sendMessage: async (chatId, content) => {
    const response = await api.post('/chats/send', { chatId, content });
    return response.data;
  },

  getUserChats: async () => {
    const response = await api.get('/chats');
    return response.data;
  },
}
