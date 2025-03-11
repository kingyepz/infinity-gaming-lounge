import { apiRequest } from "./queryClient";
import { useToast } from "@/hooks/use-toast";

export type PaymentMethod = "cash" | "mpesa" | "airtel";

interface ProcessPaymentParams {
  transactionId: number;
  amount: number;
  method: PaymentMethod;
  customerName: string;
  phoneNumber?: string; // Required for mobile money payments
  discount?: number; // Percentage discount to apply
  loyaltyPoints?: number; // Points to earn or redeem
}

export async function processPayment({
  transactionId,
  amount,
  method,
  customerName,
  phoneNumber,
  discount = 0,
  loyaltyPoints = 0,
}: ProcessPaymentParams): Promise<{ success: boolean; reference?: string; error?: string }> {
  try {
    // Apply discount if any
    const finalAmount = amount - (amount * (discount / 100));
    const amountString = finalAmount.toString(); // Convert amount to string

    // Different API endpoints based on payment method
    if (method === "cash") {
      const response = await apiRequest("POST", "/api/payments/cash", {
        transactionId,
        amount: amountString, // Pass amount as string
        customerName
      });

      return {
        success: true,
        reference: response.receiptNumber
      };
    } else if (method === "mpesa") {
      if (!phoneNumber) {
        return {
          success: false,
          error: "Phone number is required for M-Pesa payments"
        };
      }

      const response = await apiRequest("POST", "/api/payments/mpesa", {
        transactionId,
        amount: amountString, // Pass amount as string
        phoneNumber
      });

      return {
        success: true,
        reference: response.mpesaRef
      };
    } else if (method === "airtel") {
      if (!phoneNumber) {
        return {
          success: false,
          error: "Phone number is required for Airtel Money payments"
        };
      }

      const response = await apiRequest("POST", "/api/payments/airtel", {
        transactionId,
        amount: amountString, // Pass amount as string
        phoneNumber
      });

      return {
        success: true,
        reference: response.reference
      };
    }

    return {
      success: false,
      error: "Invalid payment method"
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || "Failed to process payment"
    };
  }
}

export async function generateReceipt(transactionId: number): Promise<Blob> {
  try {
    const response = await apiRequest("GET", `/api/receipts/${transactionId}`, null, { responseType: "blob" });
    return response;
  } catch (error: any) {
    throw new Error("Failed to generate receipt");
  }
}

export function usePaymentStats() {
  return {
    fetchDailyStats: async () => {
      return await apiRequest("GET", "/api/payments/stats/daily");
    },
    fetchWeeklyStats: async () => {
      return await apiRequest("GET", "/api/payments/stats/weekly");
    },
    fetchMonthlyStats: async () => {
      return await apiRequest("GET", "/api/payments/stats/monthly");
    },
    fetchMethodBreakdown: async () => {
      return await apiRequest("GET", "/api/payments/stats/methods");
    }
  };
}
// payment.ts - Payment utility functions

import axios from 'axios';

/**
 * Process a cash payment for a transaction
 */
export async function processCashPayment(transactionId: number, amount: number) {
  try {
    const response = await axios.post('/api/payments/cash', {
      transactionId,
      amount
    });
    
    return {
      success: true,
      data: response.data
    };
  } catch (error: any) {
    console.error('Cash payment processing error:', error);
    return {
      success: false,
      error: error.response?.data?.error || error.message || 'Failed to process cash payment'
    };
  }
}

/**
 * Process an M-Pesa payment for a transaction
 */
export async function processMpesaPayment(transactionId: number, phoneNumber: string, amount: number) {
  try {
    const response = await axios.post('/api/payments/mpesa', {
      transactionId,
      phoneNumber,
      amount
    });
    
    return {
      success: true,
      data: response.data,
      checkoutRequestId: response.data.checkoutRequestId
    };
  } catch (error: any) {
    console.error('M-Pesa payment processing error:', error);
    return {
      success: false,
      error: error.response?.data?.error || error.message || 'Failed to process M-Pesa payment'
    };
  }
}

/**
 * Process an Airtel Money payment for a transaction
 */
export async function processAirtelPayment(transactionId: number, phoneNumber: string, amount: number) {
  try {
    const response = await axios.post('/api/payments/airtel', {
      transactionId,
      phoneNumber,
      amount,
      reference: `TXN-${transactionId}`
    });
    
    return {
      success: true,
      data: response.data,
      reference: response.data.reference
    };
  } catch (error: any) {
    console.error('Airtel Money payment processing error:', error);
    return {
      success: false,
      error: error.response?.data?.error || error.message || 'Failed to process Airtel Money payment'
    };
  }
}

/**
 * Check M-Pesa payment status
 */
export async function checkMpesaPaymentStatus(checkoutRequestId: string) {
  try {
    const response = await axios.get(`/api/payments/mpesa/status/${checkoutRequestId}`);
    return response.data;
  } catch (error) {
    console.error('Error checking M-Pesa payment status:', error);
    throw error;
  }
}

/**
 * Check Airtel Money payment status
 */
export async function checkAirtelPaymentStatus(referenceId: string) {
  try {
    const response = await axios.get(`/api/payments/airtel/status/${referenceId}`);
    return response.data;
  } catch (error) {
    console.error('Error checking Airtel Money payment status:', error);
    throw error;
  }
}

/**
 * Format currency amount as KSH
 */
export function formatCurrency(amount: number | string) {
  const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
  return `KSH ${numAmount.toFixed(0)}`;
}
