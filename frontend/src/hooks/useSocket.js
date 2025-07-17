import { useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';

export const useSocket = (token) => {
  const socketRef = useRef(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    if (!token) return;

    socketRef.current = io('http://localhost:5000', {
      auth: { token },
      transports: ['websocket', 'polling']
    });

    const socket = socketRef.current;

    socket.on('connect', () => {
      setIsConnected(true);
      console.log('Connected to server');
    });

    socket.on('disconnect', () => {
      setIsConnected(false);
      console.log('Disconnected from server');
    });

    socket.on('error', (error) => {
      console.error('Socket error:', error);
    });

    return () => {
      socket.disconnect();
    };
  }, [token]);

  const sendMessage = (messageData) => {
    if (socketRef.current && isConnected) {
      socketRef.current.emit('sendMessage', messageData);
    }
  };

  const markAsRead = (messageId, senderId) => {
    if (socketRef.current && isConnected) {
      socketRef.current.emit('markAsRead', { messageId, senderId });
    }
  };

  const emitTyping = (receiverId, isTyping) => {
    if (socketRef.current && isConnected) {
      socketRef.current.emit('typing', { receiverId, isTyping });
    }
  };

  return {
    socket: socketRef.current,
    isConnected,
    sendMessage,
    markAsRead,
    emitTyping
  };
};