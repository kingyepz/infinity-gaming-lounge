
// Airtel Money Service Implementation
import axios from 'axios';
import { z } from 'zod';

// Config schema
const airtelConfigSchema = z.object({
  baseUrl: z.string().default('https://openapiuat.airtel.africa'),
  clientId: z.string().default('test-client-id'),
  clientSecret: z.string().default('test-client-secret'),
  environment: z.enum(['sandbox', 'production']).default('sandbox'),
  currency: z.string().default('KES'),
  country: z.string().default('KE')
});

// For mock implementation in development
const mockTransactions = new Map();

class AirtelMoneyService {
  private config: z.infer<typeof airtelConfigSchema>;
  private accessToken: string | null = null;
  private tokenExpiry: Date | null = null;

  constructor(config: Partial<z.infer<typeof airtelConfigSchema>> = {}) {
    this.config = airtelConfigSchema.parse(config);
  }

  /**
   * Generate a mock reference
   */
  private generateReference() {
    return `AIR${Date.now().toString().slice(-8)}${Math.floor(Math.random() * 1000)}`;
  }

  /**
   * Mock implementation for development
   */
  async initiatePayment(params: { 
    phoneNumber: string; 
    amount: number | string; 
    reference?: string;
    transactionDesc?: string;
  }) {
    // Ensure amount is a number
    const amount = typeof params.amount === 'string' ? parseFloat(params.amount) : params.amount;
    
    // Generate a reference if not provided
    const reference = params.reference || this.generateReference();
    
    // Store mock transaction
    mockTransactions.set(reference, {
      phoneNumber: params.phoneNumber,
      amount,
      status: 'PENDING',
      createdAt: new Date(),
      reference
    });
    
    console.log(`[MOCK] Airtel Money payment initiated: ${amount} to ${params.phoneNumber}, ref: ${reference}`);
    
    // In development, automatically complete payment after a delay (for testing)
    setTimeout(() => {
      if (mockTransactions.has(reference)) {
        const tx = mockTransactions.get(reference);
        tx.status = 'COMPLETED';
        mockTransactions.set(reference, tx);
        console.log(`[MOCK] Airtel Money payment completed: ${reference}`);
      }
    }, 10000); // 10 seconds delay
    
    return {
      status: 'PENDING',
      message: 'Payment request sent to customer',
      reference,
      transactionId: `TX${Date.now()}`
    };
  }

  /**
   * Check transaction status - mock implementation
   */
  async checkTransactionStatus(reference: string) {
    // Get mock transaction
    const tx = mockTransactions.get(reference);
    
    if (!tx) {
      return {
        status: 'NOT_FOUND',
        message: 'Transaction not found'
      };
    }
    
    return {
      status: tx.status,
      message: tx.status === 'COMPLETED' 
        ? 'Transaction completed successfully' 
        : 'Transaction is being processed',
      reference,
      amount: tx.amount,
      phoneNumber: tx.phoneNumber
    };
  }

  /**
   * In a real implementation, these methods would integrate with Airtel API
   */
  private async authenticate() {
    try {
      // For actual implementation
      // const response = await axios.post(...);
      // this.accessToken = response.data.access_token;
      this.accessToken = 'mock-token';
      
      // Set token expiry to 1 hour from now
      const expiry = new Date();
      expiry.setHours(expiry.getHours() + 1);
      this.tokenExpiry = expiry;
      
      return this.accessToken;
    } catch (error) {
      console.error('Airtel Money authentication error:', error);
      throw new Error('Failed to authenticate with Airtel Money API');
    }
  }
}

// Create and export service instance
export const airtelMoneyService = new AirtelMoneyService();
