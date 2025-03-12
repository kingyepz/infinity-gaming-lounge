/**
 * M-Pesa API Integration 
 * Implementation of official Safaricom M-Pesa API endpoints
 * 
 * This module implements the following endpoints:
 * - STK Push: https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest
 * - Register URL: https://sandbox.safaricom.co.ke/mpesa/c2b/v1/registerurl
 * - Transaction Status: https://sandbox.safaricom.co.ke/mpesa/transactionstatus/v1/query
 * - Reversal: https://sandbox.safaricom.co.ke/mpesa/reversal/v1/request
 */

import axios from 'axios';
import * as z from 'zod';
import { PaymentDebugger } from './paymentDebugger';

// Environment configuration schema
export const mpesaConfigSchema = z.object({
  consumerKey: z.string().min(1),
  consumerSecret: z.string().min(1),
  shortCode: z.string().min(1),
  passKey: z.string().min(1),
  callbackUrl: z.string().url(),
  environment: z.enum(['sandbox', 'production']).default('sandbox'),
  initiatorName: z.string().min(1).default('testapi'),
  securityCredential: z.string().min(1).optional()
});

// STK Push request schema
export const stkPushRequestSchema = z.object({
  phoneNumber: z.string().min(10).max(13),
  amount: z.number().positive(),
  accountReference: z.string().min(1).max(20).default('InfinityGaming'),
  transactionDesc: z.string().min(1).max(50).default('Payment for Gaming Services'),
  transactionId: z.number().positive(),
  callbackUrl: z.string().url().optional(),
  userId: z.number().optional(),
  splitPayment: z.boolean().optional(),
  splitIndex: z.number().optional(),
  splitTotal: z.number().optional()
});

// URL Registration request schema
export const urlRegistrationSchema = z.object({
  shortCode: z.string().min(1),
  responseType: z.enum(['Completed', 'Cancelled']).default('Completed'),
  confirmationUrl: z.string().url(),
  validationUrl: z.string().url()
});

// Transaction status request schema
export const transactionStatusSchema = z.object({
  transactionId: z.string().min(1),
  initiator: z.string().min(1),
  securityCredential: z.string().min(1),
  commandID: z.string().min(1).default('TransactionStatusQuery'),
  partyA: z.string().min(1),
  identifierType: z.string().min(1).default('1'),
  resultUrl: z.string().url(),
  queueTimeoutUrl: z.string().url(),
  remarks: z.string().min(1).default('Check transaction status'),
  occasion: z.string().optional()
});

// Reversal request schema
export const reversalSchema = z.object({
  initiator: z.string().min(1),
  securityCredential: z.string().min(1),
  commandID: z.string().min(1).default('TransactionReversal'),
  transactionID: z.string().min(1),
  amount: z.number().positive(),
  receiverParty: z.string().min(1),
  receiverIdentifierType: z.string().min(1).default('4'),
  resultUrl: z.string().url(),
  queueTimeoutUrl: z.string().url(),
  remarks: z.string().min(1).default('Reversal'),
  occasion: z.string().optional()
});

// Response interfaces
export interface STKPushResponse {
  MerchantRequestID: string;
  CheckoutRequestID: string;
  ResponseCode: string;
  ResponseDescription: string;
  CustomerMessage: string;
}

export interface URLRegistrationResponse {
  ConversationID: string;
  OriginatorCoversationID: string;
  ResponseCode: string;
  ResponseDescription: string;
}

export interface TransactionStatusResponse {
  ResponseCode: string;
  ResponseDescription: string;
  OriginatorConversationID: string;
  ConversationID: string;
  TransactionID: string;
  ResultCode: string;
  ResultDesc: string;
  TransactionStatus?: string;
  ReasonType?: string;
  DebitPartyCharges?: string;
  DebitAccountType?: string;
  InitiatedTime?: string;
  OriginatorDateTime?: string;
  CreditPartyName?: string;
  DebitPartyName?: string;
}

export interface ReversalResponse {
  ResponseCode: string;
  ResponseDescription: string;
  OriginatorConversationID: string;
  ConversationID: string;
}

// Main M-Pesa API class
export class MpesaAPI {
  private config: z.infer<typeof mpesaConfigSchema>;
  private accessToken: string | null = null;
  private tokenExpiry: Date | null = null;
  private baseUrl: string;

  constructor(config: Partial<z.infer<typeof mpesaConfigSchema>> = {}) {
    // Set default values for sandbox environment if not provided
    const defaultConfig = {
      environment: 'sandbox' as const,
      consumerKey: process.env.MPESA_CONSUMER_KEY || 'your-consumer-key',
      consumerSecret: process.env.MPESA_CONSUMER_SECRET || 'your-consumer-secret',
      shortCode: process.env.MPESA_SHORTCODE || '174379',
      passKey: process.env.MPESA_PASSKEY || 'bfb279f9aa9bdbcf158e97dd71a467cd2e0c893059b10f78e6b72ada1ed2c919',
      callbackUrl: process.env.MPESA_CALLBACK_URL || 'https://mydomain.com/mpesa/callback',
      initiatorName: process.env.MPESA_INITIATOR_NAME || 'testapi',
      securityCredential: process.env.MPESA_SECURITY_CREDENTIAL
    };

    try {
      this.config = mpesaConfigSchema.parse({ ...defaultConfig, ...config });
      this.baseUrl = this.config.environment === 'production'
        ? 'https://api.safaricom.co.ke'
        : 'https://sandbox.safaricom.co.ke';
    } catch (error) {
      PaymentDebugger.logError('MpesaAPI.constructor', 'validation', error);
      throw new Error(`Invalid M-Pesa configuration: ${error instanceof Error ? error.message : String(error)}`);
    }

    PaymentDebugger.log('MpesaAPI.constructor', 'init', {
      environment: this.config.environment,
      shortCode: this.config.shortCode,
      baseUrl: this.baseUrl
    });
  }

  /**
   * Generate base64 encoded authentication string
   */
  private getAuthCredential(): string {
    const authString = `${this.config.consumerKey}:${this.config.consumerSecret}`;
    return Buffer.from(authString).toString('base64');
  }

  /**
   * Generate current timestamp in YYYYMMDDHHmmss format
   */
  private generateTimestamp(): string {
    return new Date().toISOString().replace(/[^0-9]/g, '').slice(0, 14);
  }

  /**
   * Generate password for STK Push
   * Format: Base64(Shortcode+Passkey+Timestamp)
   */
  private generatePassword(timestamp: string): string {
    const passwordString = `${this.config.shortCode}${this.config.passKey}${timestamp}`;
    return Buffer.from(passwordString).toString('base64');
  }

  /**
   * Get access token for M-Pesa API
   * Tokens are cached and refreshed only when expired
   */
  public async getAccessToken(): Promise<string> {
    // Check if token is still valid
    if (this.accessToken && this.tokenExpiry && this.tokenExpiry > new Date()) {
      return this.accessToken;
    }

    try {
      PaymentDebugger.log('MpesaAPI.getAccessToken', 'fetching', {
        url: `${this.baseUrl}/oauth/v1/generate?grant_type=client_credentials`
      });

      const response = await axios.get(
        `${this.baseUrl}/oauth/v1/generate?grant_type=client_credentials`,
        {
          headers: {
            Authorization: `Basic ${this.getAuthCredential()}`
          }
        }
      );

      if (response.data && response.data.access_token) {
        this.accessToken = response.data.access_token;
        // Set token expiry to 55 minutes (tokens are valid for 1 hour)
        this.tokenExpiry = new Date(Date.now() + 55 * 60 * 1000);
        
        PaymentDebugger.log('MpesaAPI.getAccessToken', 'success', {
          tokenExpiresIn: '55 minutes'
        });
        
        return this.accessToken;
      } else {
        throw new Error('Invalid response from M-Pesa OAuth endpoint');
      }
    } catch (error) {
      PaymentDebugger.logError('MpesaAPI.getAccessToken', 'failed', error);
      throw new Error(`Failed to get M-Pesa access token: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Initialize STK Push request to make a payment
   */
  public async initiateSTKPush(requestData: z.infer<typeof stkPushRequestSchema>): Promise<STKPushResponse> {
    try {
      // Validate request data
      const validatedData = stkPushRequestSchema.parse(requestData);
      
      // Format phone number (remove leading 0 and add country code if needed)
      const formattedPhone = validatedData.phoneNumber.startsWith('0') 
        ? `254${validatedData.phoneNumber.substring(1)}`
        : validatedData.phoneNumber.startsWith('+') 
          ? validatedData.phoneNumber.substring(1) 
          : validatedData.phoneNumber;
      
      // Generate timestamp
      const timestamp = this.generateTimestamp();
      
      // Get access token
      const accessToken = await this.getAccessToken();
      
      // Build request payload
      const payload = {
        BusinessShortCode: this.config.shortCode,
        Password: this.generatePassword(timestamp),
        Timestamp: timestamp,
        TransactionType: "CustomerPayBillOnline",
        Amount: validatedData.amount.toString(),
        PartyA: formattedPhone,
        PartyB: this.config.shortCode,
        PhoneNumber: formattedPhone,
        CallBackURL: validatedData.callbackUrl || this.config.callbackUrl,
        AccountReference: validatedData.accountReference,
        TransactionDesc: validatedData.transactionDesc
      };
      
      PaymentDebugger.log('MpesaAPI.initiateSTKPush', 'request', {
        url: `${this.baseUrl}/mpesa/stkpush/v1/processrequest`,
        payload: {
          ...payload,
          // Mask sensitive data
          Password: '******'
        }
      });
      
      // Send request to M-Pesa API
      const response = await axios.post(
        `${this.baseUrl}/mpesa/stkpush/v1/processrequest`,
        payload,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      PaymentDebugger.log('MpesaAPI.initiateSTKPush', 'response', response.data);
      
      return response.data;
    } catch (error) {
      PaymentDebugger.logError('MpesaAPI.initiateSTKPush', 'failed', error);
      throw new Error(`Failed to initiate M-Pesa STK Push: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Register URLs for C2B callbacks
   */
  public async registerURL(requestData: z.infer<typeof urlRegistrationSchema>): Promise<URLRegistrationResponse> {
    try {
      // Validate request data
      const validatedData = urlRegistrationSchema.parse(requestData);
      
      // Get access token
      const accessToken = await this.getAccessToken();
      
      // Build request payload
      const payload = {
        ShortCode: validatedData.shortCode,
        ResponseType: validatedData.responseType,
        ConfirmationURL: validatedData.confirmationUrl,
        ValidationURL: validatedData.validationUrl
      };
      
      PaymentDebugger.log('MpesaAPI.registerURL', 'request', {
        url: `${this.baseUrl}/mpesa/c2b/v1/registerurl`,
        payload
      });
      
      // Send request to M-Pesa API
      const response = await axios.post(
        `${this.baseUrl}/mpesa/c2b/v1/registerurl`,
        payload,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      PaymentDebugger.log('MpesaAPI.registerURL', 'response', response.data);
      
      return response.data;
    } catch (error) {
      PaymentDebugger.logError('MpesaAPI.registerURL', 'failed', error);
      throw new Error(`Failed to register M-Pesa URLs: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Check transaction status
   */
  public async checkTransactionStatus(requestData: z.infer<typeof transactionStatusSchema>): Promise<TransactionStatusResponse> {
    try {
      // Validate request data
      const validatedData = transactionStatusSchema.parse(requestData);
      
      // Get access token
      const accessToken = await this.getAccessToken();
      
      // Build request payload
      const payload = {
        Initiator: validatedData.initiator,
        SecurityCredential: validatedData.securityCredential,
        CommandID: validatedData.commandID,
        TransactionID: validatedData.transactionId,
        PartyA: validatedData.partyA,
        IdentifierType: validatedData.identifierType,
        ResultURL: validatedData.resultUrl,
        QueueTimeOutURL: validatedData.queueTimeoutUrl,
        Remarks: validatedData.remarks,
        Occasion: validatedData.occasion
      };
      
      PaymentDebugger.log('MpesaAPI.checkTransactionStatus', 'request', {
        url: `${this.baseUrl}/mpesa/transactionstatus/v1/query`,
        payload: {
          ...payload,
          // Mask sensitive data
          SecurityCredential: '******'
        }
      });
      
      // Send request to M-Pesa API
      const response = await axios.post(
        `${this.baseUrl}/mpesa/transactionstatus/v1/query`,
        payload,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      PaymentDebugger.log('MpesaAPI.checkTransactionStatus', 'response', response.data);
      
      return response.data;
    } catch (error) {
      PaymentDebugger.logError('MpesaAPI.checkTransactionStatus', 'failed', error);
      throw new Error(`Failed to check M-Pesa transaction status: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Reverse a transaction
   */
  public async reverseTransaction(requestData: z.infer<typeof reversalSchema>): Promise<ReversalResponse> {
    try {
      // Validate request data
      const validatedData = reversalSchema.parse(requestData);
      
      // Get access token
      const accessToken = await this.getAccessToken();
      
      // Build request payload
      const payload = {
        Initiator: validatedData.initiator,
        SecurityCredential: validatedData.securityCredential,
        CommandID: validatedData.commandID,
        TransactionID: validatedData.transactionID,
        Amount: validatedData.amount.toString(),
        ReceiverParty: validatedData.receiverParty,
        ReceiverIdentifierType: validatedData.receiverIdentifierType,
        ResultURL: validatedData.resultUrl,
        QueueTimeOutURL: validatedData.queueTimeoutUrl,
        Remarks: validatedData.remarks,
        Occasion: validatedData.occasion
      };
      
      PaymentDebugger.log('MpesaAPI.reverseTransaction', 'request', {
        url: `${this.baseUrl}/mpesa/reversal/v1/request`,
        payload: {
          ...payload,
          // Mask sensitive data
          SecurityCredential: '******'
        }
      });
      
      // Send request to M-Pesa API
      const response = await axios.post(
        `${this.baseUrl}/mpesa/reversal/v1/request`,
        payload,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      PaymentDebugger.log('MpesaAPI.reverseTransaction', 'response', response.data);
      
      return response.data;
    } catch (error) {
      PaymentDebugger.logError('MpesaAPI.reverseTransaction', 'failed', error);
      throw new Error(`Failed to reverse M-Pesa transaction: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
}

// Create an instance with default configuration
export const mpesaAPI = new MpesaAPI();