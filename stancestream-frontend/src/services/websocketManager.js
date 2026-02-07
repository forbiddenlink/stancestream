// Centralized WebSocket Connection Manager
// Prevents multiple WebSocket connections and provides unified event handling

class WebSocketManager {
    constructor() {
        this.socket = null;
        this.listeners = new Map();
        this.connectionAttempts = 0;
        this.maxReconnectAttempts = 5;
        this.reconnectDelay = 1000;
        this.isConnecting = false;
        this.url = null;
        this.connectionPromise = null;
        this.reconnectTimer = null;
        this.shouldReconnect = true;
    }

    clearReconnectTimer() {
        if (this.reconnectTimer) {
            clearTimeout(this.reconnectTimer);
            this.reconnectTimer = null;
        }
    }

    closeCurrentSocket(code = 1000, reason = 'Reconnect') {
        if (!this.socket) {
            return;
        }

        try {
            this.socket.onopen = null;
            this.socket.onmessage = null;
            this.socket.onclose = null;
            this.socket.onerror = null;

            if (
                this.socket.readyState === WebSocket.OPEN ||
                this.socket.readyState === WebSocket.CONNECTING
            ) {
                this.socket.close(code, reason);
            }
        } catch (error) {
            console.error('Failed to close WebSocket cleanly:', error);
        } finally {
            this.socket = null;
        }
    }

    // Connect to WebSocket with automatic retry logic
    connect(url) {
        // If already connected to the correct URL, return existing connection
        if (this.socket?.readyState === WebSocket.OPEN && this.url === url) {
            console.log('WebSocket already connected to target URL');
            return Promise.resolve(true);
        }

        // If a connection attempt is in progress, return the existing promise
        if (this.isConnecting && this.url === url && this.connectionPromise) {
            console.log('WebSocket connection already in progress');
            return this.connectionPromise;
        }

        this.shouldReconnect = true;
        this.clearReconnectTimer();
        this.closeCurrentSocket(1000, 'Replace connection');

        this.url = url;
        this.isConnecting = true;

        this.connectionPromise = new Promise((resolve) => {
            let settled = false;

            const settle = (result) => {
                if (!settled) {
                    settled = true;
                    resolve(result);
                }
            };

            try {
                this.socket = new WebSocket(url);

                this.socket.onopen = () => {
                    console.log('WebSocket connected');
                    this.connectionAttempts = 0;
                    this.isConnecting = false;
                    this.connectionPromise = null;
                    this.notifyListeners('connected', { status: 'connected' });
                    settle(true);
                };

                this.socket.onmessage = (event) => {
                    try {
                        const data = JSON.parse(event.data);
                        this.notifyListeners('message', data);

                        // Route to specific event types
                        if (data.type) {
                            this.notifyListeners(data.type, data);
                        }
                    } catch (error) {
                        console.error('Failed to parse WebSocket message:', error);
                        this.notifyListeners('error', { error: 'Failed to parse message' });
                    }
                };

                this.socket.onclose = (event) => {
                    console.log('WebSocket disconnected:', event.code, event.reason);
                    this.socket = null;
                    this.isConnecting = false;
                    this.connectionPromise = null;
                    settle(false);
                    this.notifyListeners('disconnected', { code: event.code, reason: event.reason });

                    const isIntentionalClose = event.code === 1000 || !this.shouldReconnect;
                    if (!isIntentionalClose && this.connectionAttempts < this.maxReconnectAttempts) {
                        this.scheduleReconnect();
                    }
                };

                this.socket.onerror = (error) => {
                    console.error('WebSocket error:', error);
                    this.isConnecting = false;
                    this.connectionPromise = null;
                    this.notifyListeners('error', { error: 'Connection error' });
                    settle(false);
                };
            } catch (error) {
                console.error('Failed to create WebSocket connection:', error);
                this.isConnecting = false;
                this.connectionPromise = null;
                settle(false);
            }
        });

        return this.connectionPromise;
    }

    // Schedule reconnection attempt
    scheduleReconnect() {
        if (!this.shouldReconnect || this.isConnecting || this.reconnectTimer) {
            return; // Don't schedule reconnect if already connecting
        }

        this.connectionAttempts++;
        if (this.connectionAttempts > this.maxReconnectAttempts) {
            console.warn('Maximum WebSocket reconnect attempts reached');
            return;
        }

        const delay = Math.min(
            this.reconnectDelay * Math.pow(2, this.connectionAttempts - 1),
            30000 // Max 30 second delay
        );

        console.log(
            `Scheduling WebSocket reconnect ${this.connectionAttempts}/${this.maxReconnectAttempts} in ${delay}ms`
        );

        this.reconnectTimer = setTimeout(() => {
            this.reconnectTimer = null;
            if (this.url && this.shouldReconnect) {
                this.connect(this.url);
            }
        }, delay);
    }

    // Send message through WebSocket
    send(data) {
        if (this.socket?.readyState === WebSocket.OPEN) {
            try {
                this.socket.send(JSON.stringify(data));
                return true;
            } catch (error) {
                console.error('Failed to send WebSocket message:', error);
                return false;
            }
        } else {
            console.warn('WebSocket not connected, cannot send message');
            return false;
        }
    }

    // Add event listener
    addEventListener(event, callback) {
        if (!this.listeners.has(event)) {
            this.listeners.set(event, new Set());
        }
        this.listeners.get(event).add(callback);
        
        // Return cleanup function
        return () => {
            this.removeEventListener(event, callback);
        };
    }

    // Remove event listener
    removeEventListener(event, callback) {
        if (this.listeners.has(event)) {
            this.listeners.get(event).delete(callback);
            if (this.listeners.get(event).size === 0) {
                this.listeners.delete(event);
            }
        }
    }

    // Notify all listeners for an event
    notifyListeners(event, data) {
        if (this.listeners.has(event)) {
            this.listeners.get(event).forEach(callback => {
                try {
                    callback(data);
                } catch (error) {
                    console.error(`Error in WebSocket listener for ${event}:`, error);
                }
            });
        }
    }

    // Get connection status
    getConnectionStatus() {
        if (!this.socket) return 'disconnected';
        
        switch (this.socket.readyState) {
            case WebSocket.CONNECTING: return 'connecting';
            case WebSocket.OPEN: return 'connected';
            case WebSocket.CLOSING: return 'closing';
            case WebSocket.CLOSED: return 'disconnected';
            default: return 'unknown';
        }
    }

    // Check if connected
    isConnected() {
        return this.socket && this.socket.readyState === WebSocket.OPEN;
    }

    // Gracefully disconnect
    disconnect({ clearListeners = false } = {}) {
        this.shouldReconnect = false;
        this.clearReconnectTimer();

        if (this.socket) {
            console.log('Disconnecting WebSocket');
            this.closeCurrentSocket(1000, 'Client disconnect');
        }

        if (clearListeners) {
            this.listeners.clear();
        }

        this.connectionAttempts = 0;
        this.isConnecting = false;
        this.connectionPromise = null;
    }

    // Get connection stats
    getStats() {
        return {
            status: this.getConnectionStatus(),
            connectionAttempts: this.connectionAttempts,
            listenersCount: this.listeners.size,
            url: this.url
        };
    }
}

// Export singleton instance
export const wsManager = new WebSocketManager();
export default wsManager;
