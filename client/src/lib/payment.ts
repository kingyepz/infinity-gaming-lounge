import { apiRequest } from "./queryClient";

export type PaymentMethod = "cash" | "mpesa" | "airtel";

/**
 * Create a transaction record
 */
export async function createTransaction(transactionData: {
  stationId: number;
  customerName: string;
  gameName: string;
  sessionType: string;
  amount: string;
  duration: number | null;
}) {
  try {
    const response = await apiRequest<{
      success: boolean;
      transaction?: any;
      transactionId?: number;
      error?: string;
    }>({
      method: 'POST',
      path: '/api/transactions',
      data: transactionData
    });
    
    // Check if the response has a success flag and transaction ID
    if (response.success && response.transactionId) {
      return { 
        success: true, 
        transactionId: response.transactionId,
        transaction: response.transaction
      };
    }
    
    // If there's no success flag or it's false, handle the error
    return { 
      success: false, 
      error: response.error || 'Failed to create transaction'
    };
  } catch (error) {
    console.error('Error creating transaction:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}

/**
 * Process a cash payment
 */
export async function processCashPayment(transactionId: number, amount: number, userId?: number) {
  try {
    const response = await apiRequest<{success: boolean; error?: string}>({
      method: 'POST',
      path: '/api/payments/cash',
      data: {
        transactionId,
        amount,
        userId // Include optional userId for loyalty points
      }
    });
    return response;
  } catch (error) {
    console.error('Error processing cash payment:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

/**
 * Initiate M-Pesa payment
 */
export async function initiateMpesaPayment(phoneNumber: string, amount: number, transactionId: number, userId?: number) {
  try {
    const response = await apiRequest<{success: boolean; checkoutRequestId?: string; error?: string}>({
      method: 'POST',
      path: '/api/payments/mpesa',
      data: {
        phoneNumber,
        amount,
        transactionId,
        userId // Include optional userId for loyalty points
      }
    });
    return response;
  } catch (error) {
    console.error('Error initiating M-Pesa payment:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

/**
 * Initiate Airtel Money payment
 */
export async function initiateAirtelPayment(phoneNumber: string, amount: number, transactionId: number, userId?: number) {
  try {
    const response = await apiRequest<{success: boolean; reference?: string; error?: string}>({
      method: 'POST',
      path: '/api/payments/airtel',
      data: {
        phoneNumber,
        amount,
        transactionId,
        userId // Include optional userId for loyalty points
      }
    });
    return response;
  } catch (error) {
    console.error('Error initiating Airtel Money payment:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

/**
 * Check M-Pesa payment status
 */
export async function checkMpesaPaymentStatus(checkoutRequestId: string) {
  try {
    const response = await apiRequest<{status: string; message?: string}>({
      method: 'GET',
      path: `/api/payments/mpesa/status/${checkoutRequestId}`
    });
    return response;
  } catch (error) {
    console.error('Error checking M-Pesa payment status:', error);
    return { status: 'ERROR', message: error instanceof Error ? error.message : 'Unknown error' };
  }
}

/**
 * Check Airtel Money payment status
 */
export async function checkAirtelPaymentStatus(referenceId: string) {
  try {
    const response = await apiRequest<{transactionStatus: string; message?: string}>({
      method: 'GET',
      path: `/api/payments/airtel/status/${referenceId}`
    });
    return response;
  } catch (error) {
    console.error('Error checking Airtel Money payment status:', error);
    return { transactionStatus: 'ERROR', message: error instanceof Error ? error.message : 'Unknown error' };
  }
}

/**
 * Format currency amount as KES
 */
export function formatCurrency(amount: number | string) {
  const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
  return `KES ${numAmount.toFixed(0)}`;
}