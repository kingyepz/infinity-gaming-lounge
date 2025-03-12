// WebSocket Test Client
import WebSocket from 'ws';

// Connect to WebSocket server directly (no specific path)
const ws = new WebSocket('ws://localhost:5000');

// Connection opened
ws.on('open', () => {
  console.log('Connected to WebSocket server');
  
  // Register as an admin
  ws.send(JSON.stringify({
    type: 'register_role',
    payload: { role: 'admin' }
  }));
  
  // Request station updates
  setTimeout(() => {
    ws.send(JSON.stringify({
      type: 'station_update_request',
      payload: {}
    }));
  }, 1000);
  
  // Request transaction updates
  setTimeout(() => {
    ws.send(JSON.stringify({
      type: 'transaction_update_request',
      payload: {}
    }));
  }, 2000);
  
  // Close after 5 seconds
  setTimeout(() => {
    ws.close();
    console.log('Connection closed');
    process.exit(0);
  }, 5000);
});

// Listen for messages
ws.on('message', (data) => {
  const message = JSON.parse(data.toString());
  console.log('Received message type:', message.type);
  console.log('Payload:', JSON.stringify(message.payload, null, 2));
});

// Connection errors
ws.on('error', (error) => {
  console.error('WebSocket error:', error);
});

// Connection closed
ws.on('close', () => {
  console.log('Connection closed');
});