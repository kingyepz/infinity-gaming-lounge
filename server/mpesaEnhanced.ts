/**
 * Enhanced M-Pesa Service based on dalienst/mpesa-stk-drf
 * This implementation provides a more robust approach to M-Pesa STK Push integration
 * with proper error handling, validation, and callback processing
 */

import axios from 'axios';
import { z } from 'zod';
import { PaymentDebugger } from './paymentDebugger';

// Validation schema for M-Pesa configuration
const mpesaConfigSchema = z.object({
  consumerKey: z.string(),
  consumerSecret: z.string(),
  passKey: z.string(),
  shortCode: z.string(),
  callbackUrl: z.string().url(),
  transactionType: z.enum(['CustomerPayBillOnline', 'CustomerBuyGoodsOnline']),
  environment: z.enum(['sandbox', 'production']).default('sandbox'),
});

// Validation schema for STK Push request
export const stkPushRequestSchema = z.object({
  phoneNumber: z.string()
    .regex(/^254\d{9}$/, 'Phone number must be in the format 254XXXXXXXXX'),
  amount: z.number().int().positive(),
  accountReference: z.string().max(12),
  transactionDesc: z.string().max(50),
  callbackUrl: z.string().url().optional(),
  transactionId: z.number().int().positive(),
  splitPayment: z.boolean().optional(),
  splitIndex: z.number().int().nonnegative().optional(),
  splitTotal: z.number().int().positive().optional(),
  userId: z.number().int().positive().nullable().optional(),
});

// Validation schema for callback data
export const callbackDataSchema = z.object({
  Body: z.object({
    stkCallback: z.object({
      MerchantRequestID: z.string(),
      CheckoutRequestID: z.string(),
      ResultCode: z.number().int(),
      ResultDesc: z.string(),
      CallbackMetadata: z.object({
        Item: z.array(
          z.object({
            Name: z.string(),
            Value: z.union([z.string(), z.number()]).nullable().optional()
          })
        ).optional()
      }).optional(),
    }),
  }),
});

// Type for STK Push response
export interface STKPushResponse {
  MerchantRequestID: string;
  CheckoutRequestID: string;
  ResponseCode: string;
  ResponseDescription: string;
  CustomerMessage: string;
}

export interface QRCodeGenerateRequest {
  amount: number;
  transactionId: number;
  referenceNumber?: string;
  trxCode?: string;
}

export interface QRCodeGenerateResponse {
  ResponseCode: string;
  ResponseDescription: string;
  QRCode: string;
  RequestID?: string;
}

// Type for transaction status response
export interface TransactionStatusResponse {
  ResponseCode: string;
  ResponseDescription: string;
  MerchantRequestID: string;
  CheckoutRequestID: string;
  ResultCode: string;
  ResultDesc: string;
}

// Type for M-Pesa transaction record
export interface MPesaTransaction {
  id?: number;
  transactionId: number;
  merchantRequestId: string;
  checkoutRequestId: string;
  resultCode?: number;
  resultDesc?: string;
  mpesaReceiptNumber?: string;
  phoneNumber: string;
  amount: number;
  status: 'pending' | 'completed' | 'failed';
  accountReference: string;
  transactionDesc: string;
  createdAt?: Date;
  updatedAt?: Date;
  splitPayment?: boolean;
  splitIndex?: number;
  splitTotal?: number;
  userId?: number | null;
}

export class EnhancedMpesaService {
  private config: z.infer<typeof mpesaConfigSchema>;
  private accessToken: string | null = null;
  private tokenExpiry: Date | null = null;
  private baseUrl: string;
  private transactionRecords: Map<string, MPesaTransaction> = new Map();
  
  constructor(config: Partial<z.infer<typeof mpesaConfigSchema>> = {}) {
    // Default config for development (these are just placeholders)
    const defaultConfig = {
      consumerKey: process.env.MPESA_CONSUMER_KEY || 'your-consumer-key',
      consumerSecret: process.env.MPESA_CONSUMER_SECRET || 'your-consumer-secret',
      passKey: process.env.MPESA_PASS_KEY || 'your-pass-key',
      shortCode: process.env.MPESA_SHORT_CODE || '174379',
      callbackUrl: process.env.MPESA_CALLBACK_URL || 'https://yourdomain.com/api/mpesa/callback',
      transactionType: 'CustomerPayBillOnline',
      environment: 'sandbox',
    };
    
    // Override defaults with provided config
    const mergedConfig = { ...defaultConfig, ...config };
    
    try {
      this.config = mpesaConfigSchema.parse(mergedConfig);
    } catch (error) {
      if (error instanceof z.ZodError) {
        console.error('Invalid M-Pesa configuration:', error.errors);
      }
      throw new Error('Failed to initialize M-Pesa service due to invalid configuration');
    }
    
    // Set base URL based on environment
    this.baseUrl = this.config.environment === 'production'
      ? 'https://api.safaricom.co.ke'
      : 'https://sandbox.safaricom.co.ke';
      
    PaymentDebugger.log('MpesaEnhanced', 'init', { 
      baseUrl: this.baseUrl,
      environment: this.config.environment
    });
  }
  
  /**
   * Generate base64 encoded authentication string
   */
  private getAuthCredential(): string {
    const auth = Buffer.from(`${this.config.consumerKey}:${this.config.consumerSecret}`).toString('base64');
    return auth;
  }
  
  /**
   * Generate current timestamp in YYYYMMDDHHmmss format
   */
  private generateTimestamp(): string {
    const date = new Date();
    return date.toISOString()
      .replace(/[-T:.Z]/g, '')  // Remove non-numeric characters
      .slice(0, 14);             // Get YYYYMMDDHHmmss format
  }
  
  /**
   * Generate password for STK Push
   * Format: Base64(Shortcode+Passkey+Timestamp)
   */
  private generatePassword(timestamp: string): string {
    const password = Buffer.from(
      `${this.config.shortCode}${this.config.passKey}${timestamp}`
    ).toString('base64');
    
    return password;
  }
  
  /**
   * Get access token for M-Pesa API
   * Tokens are cached and refreshed only when expired
   */
  public async getAccessToken(): Promise<string> {
    // If we have a valid token, return it
    if (this.accessToken && this.tokenExpiry && this.tokenExpiry > new Date()) {
      return this.accessToken;
    }
    
    // Otherwise, get a new token
    try {
      PaymentDebugger.log('MpesaEnhanced', 'getAccessToken:start', {});
      
      const auth = this.getAuthCredential();
      const response = await axios({
        method: 'get',
        url: `${this.baseUrl}/oauth/v1/generate?grant_type=client_credentials`,
        headers: {
          Authorization: `Basic ${auth}`,
        },
      });
      
      // Set token and expiry (token valid for 1 hour)
      this.accessToken = response.data.access_token;
      const expiryTime = new Date();
      expiryTime.setHours(expiryTime.getHours() + 1);
      this.tokenExpiry = expiryTime;
      
      PaymentDebugger.log('MpesaEnhanced', 'getAccessToken:success', { 
        tokenExpiry: this.tokenExpiry 
      });
      
      return this.accessToken;
    } catch (error) {
      PaymentDebugger.logError('MpesaEnhanced', 'getAccessToken:error', error);
      throw new Error('Failed to get M-Pesa access token');
    }
  }
  
  /**
   * Initialize STK Push request to make a payment
   */
  public async initiateSTKPush(requestData: z.infer<typeof stkPushRequestSchema>): Promise<STKPushResponse> {
    try {
      // Validate request data
      const validatedData = stkPushRequestSchema.parse(requestData);
      
      PaymentDebugger.log('MpesaEnhanced', 'initiateSTKPush:start', {
        phoneNumber: validatedData.phoneNumber,
        amount: validatedData.amount,
        transactionId: validatedData.transactionId,
        splitPayment: validatedData.splitPayment || false
      });
      
      // Format phone number (remove leading zero if needed)
      const phoneNumber = validatedData.phoneNumber.startsWith('0') 
        ? `254${validatedData.phoneNumber.substring(1)}` 
        : validatedData.phoneNumber;
      
      // Get token and generate timestamp and password
      const accessToken = await this.getAccessToken();
      const timestamp = this.generateTimestamp();
      const password = this.generatePassword(timestamp);
      
      // Use provided callback URL or default from config
      const callbackUrl = validatedData.callbackUrl || this.config.callbackUrl;
      
      // Build request payload
      const payload = {
        BusinessShortCode: this.config.shortCode,
        Password: password,
        Timestamp: timestamp,
        TransactionType: this.config.transactionType,
        Amount: Math.round(validatedData.amount),
        PartyA: phoneNumber,
        PartyB: this.config.shortCode,
        PhoneNumber: phoneNumber,
        CallBackURL: callbackUrl,
        AccountReference: validatedData.accountReference,
        TransactionDesc: validatedData.transactionDesc
      };
      
      // Make the request
      const response = await axios({
        method: 'post',
        url: `${this.baseUrl}/mpesa/stkpush/v1/processrequest`,
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        data: payload
      });
      
      // Store transaction record for callback processing
      const transactionRecord: MPesaTransaction = {
        transactionId: validatedData.transactionId,
        merchantRequestId: response.data.MerchantRequestID,
        checkoutRequestId: response.data.CheckoutRequestID,
        phoneNumber: phoneNumber,
        amount: validatedData.amount,
        status: 'pending',
        accountReference: validatedData.accountReference,
        transactionDesc: validatedData.transactionDesc,
        createdAt: new Date(),
        splitPayment: validatedData.splitPayment,
        splitIndex: validatedData.splitIndex,
        splitTotal: validatedData.splitTotal,
        userId: validatedData.userId
      };
      
      // Store by checkout request ID for callback lookup
      this.transactionRecords.set(response.data.CheckoutRequestID, transactionRecord);
      
      PaymentDebugger.log('MpesaEnhanced', 'initiateSTKPush:success', {
        merchantRequestId: response.data.MerchantRequestID,
        checkoutRequestId: response.data.CheckoutRequestID,
        responseCode: response.data.ResponseCode,
        responseDesc: response.data.ResponseDescription
      });
      
      return response.data;
    } catch (error) {
      PaymentDebugger.logError('MpesaEnhanced', 'initiateSTKPush:error', error);
      
      // Rethrow with more context for API consumers
      if (error instanceof z.ZodError) {
        throw new Error(`Invalid STK Push request data: ${error.message}`);
      }
      
      if (axios.isAxiosError(error) && error.response) {
        throw new Error(`M-Pesa STK Push failed: ${error.response.data?.errorMessage || error.message}`);
      }
      
      throw new Error(`M-Pesa STK Push failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
  
  /**
   * Process STK Push callback data
   * Returns processed callback data with payment details
   */
  public async processSTKCallback(callbackData: any): Promise<{
    success: boolean;
    transactionId: number;
    mpesaData: any;
    transactionRecord?: MPesaTransaction;
  }> {
    try {
      // Validate callback data
      const validatedData = callbackDataSchema.parse(callbackData);
      
      const { stkCallback } = validatedData.Body;
      const { MerchantRequestID, CheckoutRequestID, ResultCode, ResultDesc } = stkCallback;
      
      PaymentDebugger.log('MpesaEnhanced', 'processSTKCallback:received', {
        checkoutRequestId: CheckoutRequestID,
        resultCode: ResultCode,
        resultDesc: ResultDesc
      });
      
      // Look up the transaction
      const transactionRecord = this.transactionRecords.get(CheckoutRequestID);
      
      if (!transactionRecord) {
        PaymentDebugger.log('MpesaEnhanced', 'processSTKCallback:notFound', {
          checkoutRequestId: CheckoutRequestID
        });
        
        return {
          success: false,
          transactionId: 0,
          mpesaData: { ResultCode, ResultDesc },
          transactionRecord: undefined
        };
      }
      
      // Update transaction record with callback results
      transactionRecord.resultCode = ResultCode;
      transactionRecord.resultDesc = ResultDesc;
      transactionRecord.status = ResultCode === 0 ? 'completed' : 'failed';
      transactionRecord.updatedAt = new Date();
      
      // Extract payment details if successful
      if (ResultCode === 0 && stkCallback.CallbackMetadata?.Item) {
        // Extract values from callback metadata
        const metadata = stkCallback.CallbackMetadata.Item.reduce((acc: any, item: any) => {
          if (item.Name && item.Value !== undefined) {
            acc[item.Name] = item.Value;
          }
          return acc;
        }, {});
        
        // Update transaction record with payment details
        if (metadata.MpesaReceiptNumber) {
          transactionRecord.mpesaReceiptNumber = metadata.MpesaReceiptNumber;
        }
        
        PaymentDebugger.log('MpesaEnhanced', 'processSTKCallback:success', {
          transactionId: transactionRecord.transactionId,
          mpesaReceiptNumber: metadata.MpesaReceiptNumber || null,
          phoneNumber: metadata.PhoneNumber || transactionRecord.phoneNumber,
          amount: metadata.Amount || transactionRecord.amount
        });
      } else {
        PaymentDebugger.log('MpesaEnhanced', 'processSTKCallback:failed', {
          transactionId: transactionRecord.transactionId,
          resultCode: ResultCode,
          resultDesc: ResultDesc
        });
      }
      
      // Update stored record
      this.transactionRecords.set(CheckoutRequestID, transactionRecord);
      
      return {
        success: ResultCode === 0,
        transactionId: transactionRecord.transactionId,
        mpesaData: {
          ResultCode,
          ResultDesc,
          MerchantRequestID,
          CheckoutRequestID,
          ...stkCallback.CallbackMetadata ? { Metadata: stkCallback.CallbackMetadata } : {}
        },
        transactionRecord
      };
    } catch (error) {
      PaymentDebugger.logError('MpesaEnhanced', 'processSTKCallback:error', error);
      
      if (error instanceof z.ZodError) {
        throw new Error(`Invalid callback data: ${error.message}`);
      }
      
      throw new Error(`Failed to process M-Pesa callback: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
  
  /**
   * Check transaction status using STK Query API
   */
  public async checkTransactionStatus(checkoutRequestId: string): Promise<TransactionStatusResponse> {
    try {
      PaymentDebugger.log('MpesaEnhanced', 'checkTransactionStatus:start', {
        checkoutRequestId
      });
      
      // Find the transaction record
      const transactionRecord = this.transactionRecords.get(checkoutRequestId);
      
      if (!transactionRecord) {
        throw new Error(`Transaction with checkout request ID ${checkoutRequestId} not found`);
      }
      
      // Get token and generate timestamp and password
      const accessToken = await this.getAccessToken();
      const timestamp = this.generateTimestamp();
      const password = this.generatePassword(timestamp);
      
      // Build request payload
      const payload = {
        BusinessShortCode: this.config.shortCode,
        Password: password,
        Timestamp: timestamp,
        CheckoutRequestID: checkoutRequestId
      };
      
      // Make the request
      const response = await axios({
        method: 'post',
        url: `${this.baseUrl}/mpesa/stkpushquery/v1/query`,
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        data: payload
      });
      
      PaymentDebugger.log('MpesaEnhanced', 'checkTransactionStatus:success', {
        checkoutRequestId,
        responseCode: response.data.ResponseCode,
        resultCode: response.data.ResultCode,
        resultDesc: response.data.ResultDesc
      });
      
      // Update transaction record if status has changed
      if (response.data.ResultCode !== undefined) {
        transactionRecord.resultCode = response.data.ResultCode;
        transactionRecord.resultDesc = response.data.ResultDesc;
        transactionRecord.status = response.data.ResultCode === 0 ? 'completed' : 'failed';
        transactionRecord.updatedAt = new Date();
        
        // Update stored record
        this.transactionRecords.set(checkoutRequestId, transactionRecord);
      }
      
      return response.data;
    } catch (error) {
      PaymentDebugger.logError('MpesaEnhanced', 'checkTransactionStatus:error', error);
      
      if (axios.isAxiosError(error) && error.response) {
        throw new Error(`M-Pesa transaction status check failed: ${error.response.data?.errorMessage || error.message}`);
      }
      
      throw new Error(`M-Pesa transaction status check failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
  
  /**
   * Get list of transactions (for debugging/development only)
   */
  public getTransactions(): MPesaTransaction[] {
    return Array.from(this.transactionRecords.values());
  }
  
  /**
   * Get a transaction by checkout request ID
   */
  public getTransactionByCheckoutRequestId(checkoutRequestId: string): MPesaTransaction | undefined {
    return this.transactionRecords.get(checkoutRequestId);
  }
  
  /**
   * Get a transaction by application transaction ID
   */
  public getTransactionByTransactionId(transactionId: number): MPesaTransaction | undefined {
    for (const transaction of this.transactionRecords.values()) {
      if (transaction.transactionId === transactionId) {
        return transaction;
      }
    }
    return undefined;
  }
  
  /**
   * Delete a transaction record (for testing/cleanup)
   */
  public deleteTransaction(checkoutRequestId: string): boolean {
    return this.transactionRecords.delete(checkoutRequestId);
  }

  /**
   * Generate QR code for M-Pesa payment
   * Uses the M-Pesa QR Code API to generate a QR code for payment
   */
  public async generateQRCode(requestData: QRCodeGenerateRequest): Promise<QRCodeGenerateResponse> {
    try {
      PaymentDebugger.log('MpesaEnhanced', 'generateQRCode:start', {
        amount: requestData.amount,
        transactionId: requestData.transactionId
      });
      
      // Get access token
      const accessToken = await this.getAccessToken();
      
      // Generate reference number if not provided
      const referenceNumber = requestData.referenceNumber || `TX-${requestData.transactionId}`;
      
      // Transaction code (default to BG = Buy Goods)
      const trxCode = requestData.trxCode || 'BG';
      
      // Build request payload
      const payload = {
        MerchantName: "Infinity Gaming Lounge",
        RefNo: referenceNumber,
        Amount: Math.round(requestData.amount),
        TrxCode: trxCode,
        CPI: this.config.shortCode, // Customer Payment Identifier (shortCode)
        Size: "300" // QR code size
      };
      
      // Make request to M-Pesa QR code API
      const response = await axios({
        method: 'post',
        url: `${this.baseUrl}/mpesa/qrcode/v1/generate`,
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        data: payload
      });
      
      PaymentDebugger.log('MpesaEnhanced', 'generateQRCode:success', {
        responseCode: response.data.ResponseCode,
        responseDesc: response.data.ResponseDescription,
        requestId: response.data.RequestID || null
      });
      
      // Store a reference to this QR code transaction for potential status check
      const transactionRecord: MPesaTransaction = {
        transactionId: requestData.transactionId,
        merchantRequestId: response.data.RequestID || `QR-${requestData.transactionId}`, 
        checkoutRequestId: `QR-${requestData.transactionId}`,
        phoneNumber: "N/A", // QR code doesn't require a specific phone number
        amount: requestData.amount,
        status: 'pending',
        accountReference: referenceNumber,
        transactionDesc: `QR Payment for transaction ${requestData.transactionId}`,
        createdAt: new Date()
      };
      
      // Store transaction record for later reference
      this.transactionRecords.set(`QR-${requestData.transactionId}`, transactionRecord);
      
      return {
        ResponseCode: response.data.ResponseCode,
        ResponseDescription: response.data.ResponseDescription,
        QRCode: response.data.QRCode,
        RequestID: response.data.RequestID
      };
    } catch (error) {
      PaymentDebugger.logError('MpesaEnhanced', 'generateQRCode:error', error);
      
      if (axios.isAxiosError(error) && error.response) {
        throw new Error(`M-Pesa QR code generation failed: ${error.response.data?.errorMessage || error.message}`);
      }
      
      throw new Error(`M-Pesa QR code generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}

// Create singleton instance
export const enhancedMpesaService = new EnhancedMpesaService();