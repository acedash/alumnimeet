import { io } from 'socket.io-client';

class SocketService {
    constructor() {
        this.apiUrl = 'http://localhost:5000';
        this.socket = null;
        this.listeners = new Map(); // Track active listeners
        this.connectionPromise = null; // Track connection promise
    }

    connect(token) {
        // If already connecting/connected, return existing promise
        if (this.connectionPromise) {
            return this.connectionPromise;
        }

        this.connectionPromise = new Promise((resolve, reject) => {
            // Clean up any existing connection
            this.disconnect();

            this.socket = io(this.apiUrl, {
                auth: { token },
                withCredentials: true,
                reconnection: true,
                reconnectionAttempts: 5,
                reconnectionDelay: 1000,
                transports: ['websocket', 'polling'], // Allow fallback to polling
                timeout: 10000 // 10 second connection timeout
            });

            // Temporary connection handlers
            const connectHandler = () => {
                cleanup();
                console.log('Socket connected successfully');
                resolve();
            };

            const errorHandler = (err) => {
                cleanup();
                console.error('Socket connection error:', err);
                this.socket = null;
                this.connectionPromise = null;
                reject(err);
            };

            const cleanup = () => {
                this.socket?.off('connect', connectHandler);
                this.socket?.off('connect_error', errorHandler);
            };

            // Set up one-time listeners
            this.socket.once('connect', connectHandler);
            this.socket.once('connect_error', errorHandler);
        });

        return this.connectionPromise;
    }

    disconnect() {
        if (this.socket) {
            console.log('Disconnecting socket...');
            
            // Remove all tracked listeners
            this.listeners.forEach((handler, event) => {
                this.socket.off(event, handler);
            });
            this.listeners.clear();
            
            // Disconnect socket
            this.socket.disconnect();
            this.socket = null;
            this.connectionPromise = null;
        }
    }

    isConnected() {
        return this.socket && this.socket.connected;
    }

    joinChat(conversationId) {
        if (!this.isConnected()) {
            throw new Error('Socket not connected');
        }
        console.log('Joining conversation:', conversationId);
        this.socket.emit('join-chat', conversationId);
    }

    sendMessage(data) {
        if (!this.isConnected()) {
            throw new Error('Socket not connected');
        }
        
        return new Promise((resolve, reject) => {
            console.log('Sending message via socket:', data);
            this.socket.emit('send-message', data, (response) => {
                if (response?.error) {
                    console.error('Message send error:', response.error);
                    reject(response.error);
                } else {
                    console.log('Message sent successfully via socket:', response);
                    resolve(response);
                }
            });
        });
    }

    emitTyping(conversationId, isTyping) {
        if (!this.isConnected()) {
            return;
        }
        this.socket.emit('typing', { conversationId, isTyping });
    }

    markAsRead(messageId) {
        if (!this.isConnected()) {
            return;
        }
        this.socket.emit('mark-as-read', { messageId });
    }

    // Event listeners with automatic cleanup
    on(event, handler) {
        if (!this.socket) {
            console.warn('Socket not connected, cannot add listener for:', event);
            return;
        }

        // Remove existing listener if any
        const existingHandler = this.listeners.get(event);
        if (existingHandler) {
            this.socket.off(event, existingHandler);
        }

        // Add new listener
        this.socket.on(event, handler);
        this.listeners.set(event, handler);
    }

    off(event) {
        const handler = this.listeners.get(event);
        if (handler && this.socket) {
            this.socket.off(event, handler);
            this.listeners.delete(event);
        }
    }

    // Remove all listeners
    removeAllListeners() {
        this.listeners.forEach((handler, event) => {
            if (this.socket) {
                this.socket.off(event, handler);
            }
        });
        this.listeners.clear();
    }
}

// Create singleton instance
const socketService = new SocketService();
export default socketService;