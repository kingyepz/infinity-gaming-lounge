import axios from 'axios';
import { Buffer } from 'buffer';

// Airtel Money API configuration
const AIRTEL_CONFIG = {
  clientId: process.env.AIRTEL_CLIENT_ID || 'your-client-id',
  clientSecret: process.env.AIRTEL_CLIENT_SECRET || 'your-client-secret',
  publicKey: process.env.AIRTEL_PUBLIC_KEY || 'your-public-key',
  countryCode: process.env.AIRTEL_COUNTRY_CODE || 'KE',
  currency: process.env.AIRTEL_CURRENCY || 'KES',
  callbackUrl: process.env.AIRTEL_CALLBACK_URL || 'https://your-callback-url.com/api/airtel/callback',
  baseUrl: process.env.AIRTEL_BASE_URL || 'https://openapi.airtel.africa'
};

export interface AirtelPaymentRequest {
  phoneNumber: string;
  amount: number;
  reference: string;
  transactionDesc: string;
}

export interface AirtelPaymentResponse {
  status: string;
  message: string;
  reference: string;
  transactionId: string;
}

export class AirtelMoneyService {
  
  private async getAccessToken(): Promise<string> {
    try {
      const auth = Buffer.from(`${AIRTEL_CONFIG.clientId}:${AIRTEL_CONFIG.clientSecret}`).toString('base64');
      
      const response = await axios({
        method: 'post',
        url: `${AIRTEL_CONFIG.baseUrl}/auth/oauth2/token`,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Basic ${auth}`
        },
        data: {
          grant_type: 'client_credentials'
        }
      });
      
      return response.data.access_token;
    } catch (error) {
      console.error("Failed to get Airtel access token:", error);
      throw new Error("Failed to get Airtel access token");
    }
  }
  
  public async initiatePayment(request: AirtelPaymentRequest): Promise<AirtelPaymentResponse> {
    try {
      const accessToken = await this.getAccessToken();
      
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
        url: `${AIRTEL_CONFIG.baseUrl}/merchant/v1/payments/`,
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
          'X-Country': AIRTEL_CONFIG.countryCode,
          'X-Currency': AIRTEL_CONFIG.currency
        },
        data: {
          reference: request.reference,
          subscriber: {
            country: AIRTEL_CONFIG.countryCode,
            currency: AIRTEL_CONFIG.currency,
            msisdn: phoneNumber
          },
          transaction: {
            amount: request.amount,
            country: AIRTEL_CONFIG.countryCode,
            currency: AIRTEL_CONFIG.currency,
            id: `INF-${Date.now()}` // Generate a unique transaction ID
          },
          description: request.transactionDesc || 'Payment for gaming services'
        }
      });
      
      return {
        status: response.data.status,
        message: response.data.message,
        reference: response.data.transaction.id,
        transactionId: response.data.transaction.id
      };
    } catch (error: any) {
      console.error("Failed to initiate Airtel Money payment:", error.response?.data || error.message);
      throw new Error(error.response?.data?.message || "Failed to initiate Airtel Money payment");
    }
  }
  
  public async checkTransactionStatus(transactionId: string): Promise<any> {
    try {
      const accessToken = await this.getAccessToken();
      
      const response = await axios({
        method: 'get',
        url: `${AIRTEL_CONFIG.baseUrl}/standard/v1/payments/${transactionId}`,
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
          'X-Country': AIRTEL_CONFIG.countryCode,
          'X-Currency': AIRTEL_CONFIG.currency
        }
      });
      
      return {
        status: response.data.status,
        message: response.data.message,
        transactionId: response.data.transaction.id,
        transactionStatus: response.data.transaction.status
      };
    } catch (error: any) {
      console.error("Failed to check Airtel transaction status:", error.response?.data || error.message);
      throw new Error("Failed to check payment status");
    }
  }
}

export const airtelMoneyService = new AirtelMoneyService();