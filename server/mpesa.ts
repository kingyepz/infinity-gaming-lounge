
import axios from 'axios';
import { Buffer } from 'buffer';

// M-Pesa API configuration
const MPESA_CONFIG = {
  consumerKey: process.env.MPESA_CONSUMER_KEY || 'your-consumer-key',
  consumerSecret: process.env.MPESA_CONSUMER_SECRET || 'your-consumer-secret',
  shortCode: process.env.MPESA_SHORTCODE || '174379',
  passKey: process.env.MPESA_PASSKEY || 'bfb279f9aa9bdbcf158e97dd71a467cd2e0c893059b10f78e6b72ada1ed2c919',
  callbackUrl: process.env.MPESA_CALLBACK_URL || 'https://your-callback-url.com/api/mpesa/callback',
  baseUrl: 'https://sandbox.safaricom.co.ke'
};

export interface STKPushRequest {
  phoneNumber: string;
  amount: number;
  accountReference: string;
  transactionDesc: string;
}

export interface STKPushResponse {
  MerchantRequestID: string;
  CheckoutRequestID: string;
  ResponseCode: string;
  ResponseDescription: string;
  CustomerMessage: string;
}

export class MpesaService {
  
  private generateTimestamp(): string {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hour = String(date.getHours()).padStart(2, '0');
    const minute = String(date.getMinutes()).padStart(2, '0');
    const second = String(date.getSeconds()).padStart(2, '0');
    
    return `${year}${month}${day}${hour}${minute}${second}`;
  }
  
  private async getAccessToken(): Promise<string> {
    try {
      const auth = Buffer.from(`${MPESA_CONFIG.consumerKey}:${MPESA_CONFIG.consumerSecret}`).toString('base64');
      
      const response = await axios({
        method: 'get',
        url: `${MPESA_CONFIG.baseUrl}/oauth/v1/generate?grant_type=client_credentials`,
        headers: {
          'Authorization': `Basic ${auth}`
        }
      });
      
      return response.data.access_token;
    } catch (error) {
      console.error("Failed to get M-Pesa access token:", error);
      throw new Error("Failed to get M-Pesa access token");
    }
  }
  
  public async initiateSTKPush(request: STKPushRequest): Promise<STKPushResponse> {
    try {
      const accessToken = await this.getAccessToken();
      const timestamp = this.generateTimestamp();
      const password = Buffer.from(
        `${MPESA_CONFIG.shortCode}${MPESA_CONFIG.passKey}${timestamp}`
      ).toString('base64');
      
      // Format phone number (remove leading 0 and add country code if needed)
      let phoneNumber = request.phoneNumber;
      if (phoneNumber.startsWith('0')) {
        phoneNumber = `254${phoneNumber.substring(1)}`;
      }
      if (!phoneNumber.startsWith('254')) {
        phoneNumber = `254${phoneNumber}`;
      }
      
      const response = await axios({
        method: 'post',
        url: `${MPESA_CONFIG.baseUrl}/mpesa/stkpush/v1/processrequest`,
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        data: {
          BusinessShortCode: MPESA_CONFIG.shortCode,
          Password: password,
          Timestamp: timestamp,
          TransactionType: 'CustomerPayBillOnline',
          Amount: request.amount,
          PartyA: phoneNumber,
          PartyB: MPESA_CONFIG.shortCode,
          PhoneNumber: phoneNumber,
          CallBackURL: MPESA_CONFIG.callbackUrl,
          AccountReference: request.accountReference || 'Infinity Gaming',
          TransactionDesc: request.transactionDesc || 'Payment for gaming services'
        }
      });
      
      return response.data;
    } catch (error: any) {
      console.error("Failed to initiate M-Pesa STK Push:", error.response?.data || error.message);
      throw new Error(error.response?.data?.errorMessage || "Failed to initiate M-Pesa payment");
    }
  }
  
  public async checkTransactionStatus(checkoutRequestId: string): Promise<any> {
    try {
      const accessToken = await this.getAccessToken();
      const timestamp = this.generateTimestamp();
      const password = Buffer.from(
        `${MPESA_CONFIG.shortCode}${MPESA_CONFIG.passKey}${timestamp}`
      ).toString('base64');
      
      const response = await axios({
        method: 'post',
        url: `${MPESA_CONFIG.baseUrl}/mpesa/stkpushquery/v1/query`,
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        data: {
          BusinessShortCode: MPESA_CONFIG.shortCode,
          Password: password,
          Timestamp: timestamp,
          CheckoutRequestID: checkoutRequestId
        }
      });
      
      return response.data;
    } catch (error: any) {
      console.error("Failed to check M-Pesa transaction status:", error.response?.data || error.message);
      throw new Error("Failed to check payment status");
    }
  }
}

export const mpesaService = new MpesaService();
