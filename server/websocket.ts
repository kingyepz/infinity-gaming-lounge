import { WebSocketServer } from 'ws';
import WebSocket from 'ws';
import { Server as HttpServer } from 'http';
import { storage } from './storage';

// Define event types
export type WebSocketEvent = {
  type: string;
  payload: any;
};

// Define client type (for tracking connected clients)
type Client = {
  id: string;
  ws: any; // Using any because WebSocket types vary across Node versions
  role?: 'admin' | 'staff' | 'customer';
};

export class WebSocketService {
  private wss: any = null;
  private clients: Map<string, Client> = new Map();
  
  constructor() {}

  // Initialize WebSocket server
  initialize(server: HttpServer) {
    // Create a new WebSocketServer instance
    this.wss = new WebSocketServer({ server });
    console.log('WebSocket server initialized');

    this.wss.on('connection', (ws: any) => {
      // Generate a unique client ID
      const clientId = this.generateClientId();
      console.log(`WebSocket client connected: ${clientId}`);
      
      // Store client in the map
      this.clients.set(clientId, { id: clientId, ws });
      
      // Send welcome message with client ID
      this.sendToClient(clientId, { 
        type: 'connection_established', 
        payload: { clientId } 
      });
      
      // Handle incoming messages
      ws.on('message', (message: any) => {
        try {
          const parsedMessage = JSON.parse(message.toString()) as WebSocketEvent;
          this.handleClientMessage(clientId, parsedMessage);
        } catch (error) {
          console.error('Failed to parse WebSocket message:', error);
        }
      });
      
      // Handle client disconnect
      ws.on('close', () => {
        console.log(`WebSocket client disconnected: ${clientId}`);
        this.clients.delete(clientId);
      });
    });
  }
  
  // Handle incoming client messages
  private handleClientMessage(clientId: string, event: WebSocketEvent) {
    console.log(`Received message from ${clientId}:`, event.type);
    
    switch (event.type) {
      case 'register_role':
        // Update client's role for targeted messages
        const client = this.clients.get(clientId);
        if (client && event.payload.role) {
          client.role = event.payload.role;
          this.clients.set(clientId, client);
          console.log(`Client ${clientId} registered as ${client.role}`);
        }
        break;
        
      case 'station_update_request':
        // Send the latest game station data to the requesting client
        this.sendStationUpdates(clientId);
        break;
        
      case 'transaction_update_request':
        // Send the latest transaction data to the requesting client
        this.sendTransactionUpdates(clientId);
        break;
        
      // Add more message handlers as needed
      
      default:
        console.log(`Unknown message type: ${event.type}`);
    }
  }
  
  // Generate a unique client ID
  private generateClientId(): string {
    return `client_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
  }
  
  // Send message to a specific client
  sendToClient(clientId: string, event: WebSocketEvent) {
    const client = this.clients.get(clientId);
    if (client && client.ws.readyState === 1) { // 1 = WebSocket.OPEN
      client.ws.send(JSON.stringify(event));
    }
  }
  
  // Broadcast message to all clients
  broadcast(event: WebSocketEvent) {
    this.clients.forEach((client) => {
      if (client.ws.readyState === 1) { // 1 = WebSocket.OPEN
        client.ws.send(JSON.stringify(event));
      }
    });
  }
  
  // Broadcast message to clients with a specific role
  broadcastToRole(role: 'admin' | 'staff' | 'customer', event: WebSocketEvent) {
    this.clients.forEach((client) => {
      if (client.role === role && client.ws.readyState === 1) {
        client.ws.send(JSON.stringify(event));
      }
    });
  }
  
  // Send station updates to a specific client or broadcast to all if no clientId provided
  async sendStationUpdates(clientId?: string) {
    try {
      const stations = await storage.getGameStations();
      const event: WebSocketEvent = {
        type: 'station_update',
        payload: { stations }
      };
      
      if (clientId) {
        this.sendToClient(clientId, event);
      } else {
        this.broadcast(event);
      }
    } catch (error) {
      console.error('Error sending station updates:', error);
    }
  }
  
  // Send transaction updates to a specific client or broadcast to all if no clientId provided
  async sendTransactionUpdates(clientId?: string) {
    try {
      const transactions = await storage.getTransactions();
      const event: WebSocketEvent = {
        type: 'transaction_update',
        payload: { transactions }
      };
      
      if (clientId) {
        this.sendToClient(clientId, event);
      } else {
        this.broadcast(event);
      }
    } catch (error) {
      console.error('Error sending transaction updates:', error);
    }
  }
  
  // Notify all admin and staff about a new customer check-in
  notifyCustomerCheckIn(customerData: any) {
    const event: WebSocketEvent = {
      type: 'customer_check_in',
      payload: { customer: customerData }
    };
    
    this.broadcastToRole('admin', event);
    this.broadcastToRole('staff', event);
  }
  
  // Notify relevant clients about a new payment
  notifyPaymentConfirmation(paymentData: any) {
    const event: WebSocketEvent = {
      type: 'payment_confirmation',
      payload: { payment: paymentData }
    };
    
    // Notify all admins and staff
    this.broadcastToRole('admin', event);
    this.broadcastToRole('staff', event);
    
    // If the payment has a userId, notify that specific customer
    if (paymentData.userId) {
      // Find client by role and userId (would need to store userId in client)
      // This would require extending the client registration process
      // For now, we'll just broadcast to all customers
      this.broadcastToRole('customer', event);
    }
  }
}

// Create singleton instance
export const websocketService = new WebSocketService();