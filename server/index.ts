import express from 'express';
import { WebSocketServer } from 'ws';
import { createServer } from 'http';
import { setupRoutes } from './routes';

const app = express();
const httpServer = createServer(app);

// Create WebSocket server on a different path than Vite's HMR
const wss = new WebSocketServer({ server: httpServer, path: '/ws' });

app.use(express.json());

// Setup routes
setupRoutes(app);

// WebSocket connection handling
wss.on('connection', (ws) => {
  console.log('Client connected to WebSocket');
  
  ws.on('message', (message) => {
    // Handle incoming messages
    console.log('Received:', message);
  });
  
  ws.on('close', () => {
    console.log('Client disconnected');
  });
});

const PORT = process.env.PORT || 5000;
httpServer.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
});
