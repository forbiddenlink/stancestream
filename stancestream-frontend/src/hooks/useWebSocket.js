import { useState, useEffect, useRef } from 'react';

const useWebSocket = (url) => {
    const [socket, setSocket] = useState(null);
    const [connectionStatus, setConnectionStatus] = useState('Disconnected');
    const [lastMessage, setLastMessage] = useState(null);
    const [messages, setMessages] = useState([]);
    const reconnectTimeoutRef = useRef(null);
    const reconnectAttemptsRef = useRef(0);
    const maxReconnectAttempts = 5;
    const reconnectDelayBase = 1000; // Start with 1 second

    const connect = () => {
        try {
            const ws = new WebSocket(url);

            ws.onopen = () => {
                console.log('🔌 Connected to StanceStream server');
                setConnectionStatus('Connected');
                setSocket(ws);
                reconnectAttemptsRef.current = 0; // Reset attempts on successful connection
            };

            ws.onmessage = (event) => {
                try {
                    const data = JSON.parse(event.data);
                    setLastMessage(data);
                    setMessages(prev => {
                        // Limit message history to prevent memory bloat (last 1000 messages)
                        const newMessages = [...prev, data];
                        return newMessages.length > 1000 ? newMessages.slice(-1000) : newMessages;
                    });
                } catch (error) {
                    console.error('Error parsing WebSocket message:', error);
                }
            };

            ws.onclose = (event) => {
                console.log('🔌 Disconnected from StanceStream server');
                setConnectionStatus('Disconnected');
                setSocket(null);

                // Attempt reconnection if not a manual close and under attempt limit
                if (event.code !== 1000 && reconnectAttemptsRef.current < maxReconnectAttempts) {
                    const delay = Math.min(
                        reconnectDelayBase * Math.pow(2, reconnectAttemptsRef.current), 
                        30000 // Max 30 seconds
                    );
                    
                    console.log(`🔄 Attempting reconnection in ${delay}ms (attempt ${reconnectAttemptsRef.current + 1}/${maxReconnectAttempts})`);
                    setConnectionStatus(`Reconnecting in ${Math.ceil(delay/1000)}s...`);
                    
                    reconnectTimeoutRef.current = setTimeout(() => {
                        reconnectAttemptsRef.current += 1;
                        connect();
                    }, delay);
                } else if (reconnectAttemptsRef.current >= maxReconnectAttempts) {
                    console.error('❌ Max reconnection attempts reached');
                    setConnectionStatus('Failed');
                }
            };

            ws.onerror = (error) => {
                console.error('WebSocket error:', error);
                setConnectionStatus('Error');
            };

            return ws;
        } catch (error) {
            console.error('Failed to create WebSocket:', error);
            setConnectionStatus('Error');
            return null;
        }
    };

    useEffect(() => {
        const ws = connect();

        // Cleanup function
        return () => {
            if (reconnectTimeoutRef.current) {
                clearTimeout(reconnectTimeoutRef.current);
            }
            if (ws && ws.readyState === WebSocket.OPEN) {
                ws.close(1000); // Normal closure
            }
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [url]);

    const sendMessage = (message) => {
        if (socket && socket.readyState === WebSocket.OPEN) {
            socket.send(JSON.stringify(message));
        } else {
            console.warn('⚠️ Cannot send message: WebSocket not connected');
        }
    };

    // Manual reconnection function
    const reconnect = () => {
        if (reconnectTimeoutRef.current) {
            clearTimeout(reconnectTimeoutRef.current);
        }
        reconnectAttemptsRef.current = 0;
        setConnectionStatus('Connecting...');
        connect();
    };

    return {
        socket,
        connectionStatus,
        lastMessage,
        messages,
        sendMessage,
        reconnect
    };
};

export default useWebSocket;
