// Simple socket connection test
import { io } from 'socket.io-client';

const socket = io('http://localhost:5000', {
  auth: { token: 'test-token' },
  transports: ['websocket', 'polling']
});

socket.on('connect', () => {
  console.log('✅ Connected to server');
  console.log('Socket ID:', socket.id);
});

socket.on('connect_error', (error) => {
  console.log('❌ Connection error:', error.message);
});

socket.on('disconnect', (reason) => {
  console.log('🔌 Disconnected:', reason);
});

// Test sending a message
setTimeout(() => {
  if (socket.connected) {
    console.log('📤 Testing message send...');
    socket.emit('send-message', {
      conversationId: 'test-conversation',
      receiverId: 'test-receiver',
      content: 'Hello from test!'
    });
  }
}, 2000);

// Cleanup after 5 seconds
setTimeout(() => {
  socket.disconnect();
  process.exit(0);
}, 5000); 