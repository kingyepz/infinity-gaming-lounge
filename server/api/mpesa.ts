
import axios from 'axios';
import { z } from 'zod';
import { storage } from '../storage';

// M-Pesa API URLs
const MPESA_AUTH_URL = 'https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials';
const MPESA_STK_URL = 'https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest';
const MPESA_QUERY_URL = 'https://sandbox.safaricom.co.ke/mpesa/stkpushquery/v1/query';

// M-Pesa credentials from environment variables (Secrets)
const mpesaCredentials = {
  consumerKey: process.env.MPESA_CONSUMER_KEY || '',
  consumerSecret: process.env.MPESA_CONSUMER_SECRET || '',
  passKey: process.env.MPESA_PASS_KEY || '',
  shortCode: process.env.MPESA_SHORT_CODE || '',
  callbackUrl: process.env.MPESA_CALLBACK_URL || ''
};

// M-Pesa credentials schema for validation
const mpesaCredentialsSchema = z.object({
  consumerKey: z.string().min(1, "Consumer Key is required"),
  consumerSecret: z.string().min(1, "Consumer Secret is required"),
  passKey: z.string().min(1, "Pass Key is required"),
  shortCode: z.string().min(1, "Short Code is required"),
  callbackUrl: z.string().url("Valid Callback URL is required")
});

// M-Pesa payment request schema
const mpesaPaymentSchema = z.object({
  phoneNumber: z.string(),
  amount: z.number(),
  transactionId: z.number(),
  customerName: z.string().optional()
});

// Get access token from M-Pesa
export async function getMpesaAccessToken(credentials: {
  consumerKey: string;
  consumerSecret: string;
}) {
  try {
    const auth = Buffer.from(`${credentials.consumerKey}:${credentials.consumerSecret}`).toString('base64');
    
    const response = await axios.get(MPESA_AUTH_URL, {
      headers: {
        'Authorization': `Basic ${auth}`
      }
    });
    
    return response.data.access_token;
  } catch (error) {
    console.error('M-Pesa auth error:', error);
    throw new Error('Failed to get M-Pesa access token');
  }
}

// Initiate STK Push request
export async function initiateSTKPush(
  accessToken: string,
  credentials: {
    shortCode: string;
    passKey: string;
    callbackUrl: string;
  },
  data: {
    phoneNumber: string;
    amount: number;
    transactionId: number;
    customerName?: string;
  }
) {
  try {
    // Format timestamp for M-Pesa
    const timestamp = new Date().toISOString().replace(/[-:T.]/g, '').slice(0, 14);
    
    // Generate password (base64 of shortcode + passkey + timestamp)
    const password = Buffer.from(
      `${credentials.shortCode}${credentials.passKey}${timestamp}`
    ).toString('base64');
    
    // Format phone number (remove country code prefix if present)
    let formattedPhone = data.phoneNumber;
    if (formattedPhone.startsWith('254')) {
      formattedPhone = formattedPhone.substring(3);
    }
    if (formattedPhone.startsWith('0')) {
      formattedPhone = formattedPhone.substring(1);
    }
    formattedPhone = `254${formattedPhone}`;
    
    // STK Push request payload
    const payload = {
      BusinessShortCode: credentials.shortCode,
      Password: password,
      Timestamp: timestamp,
      TransactionType: 'CustomerPayBillOnline',
      Amount: data.amount,
      PartyA: formattedPhone,
      PartyB: credentials.shortCode,
      PhoneNumber: formattedPhone,
      CallBackURL: credentials.callbackUrl,
      AccountReference: `INF-${data.transactionId}`,
      TransactionDesc: `Payment for Infinity Gaming Lounge - ${data.customerName || 'Customer'}`
    };
    
    // Make STK Push request
    const response = await axios.post(MPESA_STK_URL, payload, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      }
    });
    
    // Store CheckoutRequestID for later verification
    await storage.updateTransactionMpesaDetails(
      data.transactionId,
      response.data.CheckoutRequestID
    );
    
    return {
      ...response.data,
      transactionId: data.transactionId
    };
  } catch (error) {
    console.error('M-Pesa STK push error:', error);
    throw new Error('Failed to initiate M-Pesa payment');
  }
}

// Query STK Push status
export async function querySTKStatus(
  accessToken: string,
  credentials: {
    shortCode: string;
    passKey: string;
  },
  checkoutRequestId: string
) {
  try {
    // Format timestamp for M-Pesa
    const timestamp = new Date().toISOString().replace(/[-:T.]/g, '').slice(0, 14);
    
    // Generate password (base64 of shortcode + passkey + timestamp)
    const password = Buffer.from(
      `${credentials.shortCode}${credentials.passKey}${timestamp}`
    ).toString('base64');
    
    // Query request payload
    const payload = {
      BusinessShortCode: credentials.shortCode,
      Password: password,
      Timestamp: timestamp,
      CheckoutRequestID: checkoutRequestId
    };
    
    // Make query request
    const response = await axios.post(MPESA_QUERY_URL, payload, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      }
    });
    
    return response.data;
  } catch (error) {
    console.error('M-Pesa query error:', error);
    throw new Error('Failed to query M-Pesa payment status');
  }
}

// Process M-Pesa callback - this handles the async confirmation from M-Pesa
export async function processMpesaCallback(callbackData: any) {
  try {
    const resultCode = callbackData.Body.stkCallback.ResultCode;
    const checkoutRequestId = callbackData.Body.stkCallback.CheckoutRequestID;
    
    // Find transaction by checkoutRequestId
    const transaction = await storage.getTransactionByMpesaRequestId(checkoutRequestId);
    
    if (!transaction) {
      console.error('Transaction not found for CheckoutRequestID:', checkoutRequestId);
      return;
    }
    
    if (resultCode === 0) {
      // Payment successful
      const callbackMetadata = callbackData.Body.stkCallback.CallbackMetadata.Item;
      const mpesaReceiptNumber = callbackMetadata.find((item: any) => item.Name === 'MpesaReceiptNumber').Value;
      
      // Update transaction status
      await storage.updateTransactionStatus(
        transaction.id,
        'completed',
        mpesaReceiptNumber
      );
    } else {
      // Payment failed
      await storage.updateTransactionStatus(
        transaction.id,
        'failed'
      );
    }
    
    return true;
  } catch (error) {
    console.error('Error processing M-Pesa callback:', error);
    return false;
  }
}
