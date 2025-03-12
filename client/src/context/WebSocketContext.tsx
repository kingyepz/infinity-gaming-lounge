import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';

// Define the WebSocket event type to match the server type
interface WebSocketEvent {
  type: string;
  payload: any;
}

// Define the WebSocketContext structure
interface WebSocketContextType {
  connected: boolean;
  clientId: string | null;
  gameStations: any[];
  transactions: any[];
  sendMessage: (event: WebSocketEvent) => void;
  registerRole: (role: 'admin' | 'staff' | 'customer') => void;
  requestStationUpdates: () => void;
  requestTransactionUpdates: () => void;
}

// Create the WebSocket context with default values
const WebSocketContext = createContext<WebSocketContextType>({
  connected: false,
  clientId: null,
  gameStations: [],
  transactions: [],
  sendMessage: () => {},
  registerRole: () => {},
  requestStationUpdates: () => {},
  requestTransactionUpdates: () => {},
});

// Custom hook to use the WebSocket context
export const useWebSocket = () => useContext(WebSocketContext);

// WebSocket Provider component
export const WebSocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [connected, setConnected] = useState(false);
  const [clientId, setClientId] = useState<string | null>(null);
  const [gameStations, setGameStations] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  
  // Use ref to maintain the WebSocket instance across renders
  const webSocketRef = useRef<WebSocket | null>(null);
  
  // Initialize WebSocket connection
  useEffect(() => {
    // Add connection status for tracking reconnection attempts
    let isReconnecting = false;
    let reconnectAttempts = 0;
    const maxReconnectAttempts = 10; // Maximum number of reconnection attempts
    
    const connectWebSocket = () => {
      // Determine WebSocket URL based on current location
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const host = window.location.host;
      const wsUrl = `${protocol}//${host}`;
      
      console.log(`Connecting to WebSocket at ${wsUrl}`);
      const ws = new WebSocket(wsUrl);
      
      // Connection opened
      ws.onopen = () => {
        console.log('Connected to WebSocket server');
        setConnected(true);
        // Reset reconnection attempts on successful connection
        isReconnecting = false;
        reconnectAttempts = 0;
      };
      
      // Listen for messages
      ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data) as WebSocketEvent;
          console.log('Received WebSocket message:', message.type);
          
          // Handle different message types
          switch (message.type) {
            case 'connection_established':
              setClientId(message.payload.clientId);
              break;
              
            case 'station_update':
              setGameStations(message.payload.stations);
              break;
              
            case 'transaction_update':
              setTransactions(message.payload.transactions);
              break;
              
            case 'customer_check_in':
              // Handle customer check-in notification
              console.log('Customer check-in:', message.payload.customer);
              break;
              
            case 'payment_confirmation':
              // Handle payment confirmation notification
              console.log('Payment confirmation:', message.payload.payment);
              break;
              
            default:
              console.log('Unknown message type:', message.type);
          }
        } catch (error) {
          console.error('Error handling WebSocket message:', error);
        }
      };
      
      // Connection closed
      ws.onclose = () => {
        console.log('WebSocket connection closed');
        setConnected(false);
        setClientId(null);
        
        // Implement exponential backoff for reconnection
        if (!isReconnecting && reconnectAttempts < maxReconnectAttempts) {
          isReconnecting = true;
          const delay = Math.min(3000 * Math.pow(1.5, reconnectAttempts), 30000); // Max 30s delay
          reconnectAttempts++;
          console.log(`Attempting to reconnect (${reconnectAttempts}/${maxReconnectAttempts}) in ${delay/1000}s...`);
          setTimeout(connectWebSocket, delay);
        } else if (reconnectAttempts >= maxReconnectAttempts) {
          console.error('Maximum reconnection attempts reached. Please refresh the page.');
        }
      };
      
      // Connection error
      ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        // Let onclose handle reconnection
      };
      
      // Store the WebSocket instance
      webSocketRef.current = ws;
      
      // Clean up on unmount
      return () => {
        ws.close();
        webSocketRef.current = null;
      };
    };
    
    connectWebSocket();
    
    // Cleanup function
    return () => {
      if (webSocketRef.current) {
        webSocketRef.current.close();
        webSocketRef.current = null;
      }
    };
  }, []);
  
  // Send message to WebSocket server
  const sendMessage = useCallback((event: WebSocketEvent) => {
    if (webSocketRef.current && webSocketRef.current.readyState === WebSocket.OPEN) {
      webSocketRef.current.send(JSON.stringify(event));
    } else {
      console.warn('WebSocket not connected, cannot send message');
    }
  }, []);
  
  // Register role with WebSocket server
  const registerRole = useCallback((role: 'admin' | 'staff' | 'customer') => {
    sendMessage({
      type: 'register_role',
      payload: { role }
    });
  }, [sendMessage]);
  
  // Request station updates from server
  const requestStationUpdates = useCallback(() => {
    sendMessage({
      type: 'station_update_request',
      payload: {}
    });
  }, [sendMessage]);
  
  // Request transaction updates from server
  const requestTransactionUpdates = useCallback(() => {
    sendMessage({
      type: 'transaction_update_request',
      payload: {}
    });
  }, [sendMessage]);
  
  // Context value
  const contextValue: WebSocketContextType = {
    connected,
    clientId,
    gameStations,
    transactions,
    sendMessage,
    registerRole,
    requestStationUpdates,
    requestTransactionUpdates,
  };
  
  return (
    <WebSocketContext.Provider value={contextValue}>
      {children}
    </WebSocketContext.Provider>
  );
};