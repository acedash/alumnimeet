import { io } from 'socket.io-client';

class SocketService {
    constructor() {
        this.apiUrl = 'http://localhost:5000';
        this.socket = null;
        this.listeners = new Map(); // Track active listeners
        this.connectionPromise = null; // Track connection promise
        this.lastJoinedConversationId = null; // Track last joined conversation
        this.isConnecting = false; // Track connection state
    }

    connect(token) {
        // If already connected, return resolved promise
        if (this.socket && this.socket.connected) {
            return Promise.resolve();
        }

        // If already connecting, return existing promise
        if (this.isConnecting && this.connectionPromise) {
            return this.connectionPromise;
        }

        this.isConnecting = true;
        this.connectionPromise = new Promise((resolve, reject) => {
            // Clean up any existing connection
            if (this.socket && !this.socket.connected) {
                this.socket.removeAllListeners();
                this.socket = null;
            }

            this.socket = io(this.apiUrl, {
                auth: { token },
                withCredentials: true,
                reconnection: true,
                reconnectionAttempts: 5,
                reconnectionDelay: 1000,
                transports: ['websocket', 'polling'], // Allow fallback to polling
                timeout: 10000, // 10 second connection timeout
                forceNew: false // Don't force new connection if one exists
            });

            // Temporary connection handlers
            const connectHandler = () => {
                cleanup();
                this.isConnecting = false;
                console.log('✅ Socket connected successfully');
                resolve();
            };

            const errorHandler = (err) => {
                cleanup();
                this.isConnecting = false;
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
            this.lastJoinedConversationId = null;
            this.isConnecting = false;
        }
    }

    isConnected() {
        return this.socket && this.socket.connected;
    }

    getSocketId() {
        return this.socket ? this.socket.id : null;
    }

    joinChat(conversationId) {
        if (!this.isConnected()) {
            console.error('Cannot join chat - socket not connected');
            throw new Error('Socket not connected');
        }
        if (this.lastJoinedConversationId === conversationId) {
            return;
        }
        this.lastJoinedConversationId = conversationId;
        this.socket.emit('join-chat', conversationId);
    }

    sendMessage(data) {
        if (!this.isConnected()) {
            throw new Error('Socket not connected');
        }
        
        return new Promise((resolve, reject) => {
            this.socket.emit('send-message', data, (response) => {
                if (response?.success === false || response?.error) {
                    console.error('Message send error:', response.error || 'Unknown error');
                    reject(new Error(response.error || 'Failed to send message'));
                } else if (response?.success === true) {
                    resolve(response.message);
                } else {
                    // Fallback for older format
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

    // Generic emit method for testing
    emit(event, data) {
        if (!this.isConnected()) {
            throw new Error('Socket not connected');
        }
        this.socket.emit(event, data);
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