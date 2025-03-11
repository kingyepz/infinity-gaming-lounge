import { apiRequest } from "./queryClient";

export type PaymentMethod = "cash" | "mpesa" | "airtel";

/**
 * Process a cash payment
 */
export async function processCashPayment(transactionId: number, amount: number) {
  try {
    const response = await axios.post('/api/payments/cash', {
      transactionId,
      amount
    });
    return response.data;
  } catch (error) {
    console.error('Error processing cash payment:', error);
    throw error;
  }
}

/**
 * Initiate M-Pesa payment
 */
export async function initiateMpesaPayment(phoneNumber: string, amount: number, transactionId: number) {
  try {
    const response = await axios.post('/api/payments/mpesa', {
      phoneNumber,
      amount,
      transactionId
    });
    return response.data;
  } catch (error) {
    console.error('Error initiating M-Pesa payment:', error);
    throw error;
  }
}

/**
 * Initiate Airtel Money payment
 */
export async function initiateAirtelPayment(phoneNumber: string, amount: number, transactionId: number) {
  try {
    const response = await axios.post('/api/payments/airtel', {
      phoneNumber,
      amount,
      transactionId
    });
    return response.data;
  } catch (error) {
    console.error('Error initiating Airtel Money payment:', error);
    throw error;
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
 * Format currency amount as KES
 */
export function formatCurrency(amount: number | string) {
  const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
  return `KES ${numAmount.toFixed(0)}`;
}