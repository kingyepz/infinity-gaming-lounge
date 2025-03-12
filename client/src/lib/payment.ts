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
export async function initiateMpesaPayment(phoneNumber: string, amount: number, transactionId: number, userId?: number, splitPayment?: boolean, splitIndex?: number, splitTotal?: number) {
  try {
    // Format phone number to ensure it's in the required format (254XXXXXXXXX)
    let formattedPhone = phoneNumber;
    if (phoneNumber.startsWith('0')) {
      formattedPhone = `254${phoneNumber.substring(1)}`;
    } else if (phoneNumber.startsWith('+254')) {
      formattedPhone = phoneNumber.substring(1); // Remove the + sign
    }
    
    // First try the enhanced M-Pesa integration
    try {
      const enhancedResponse = await apiRequest<{
        success: boolean; 
        message?: string;
        data?: {
          merchantRequestId: string;
          checkoutRequestId: string;
          responseDescription: string;
          customerMessage: string;
          transactionId: number;
        };
        error?: string;
      }>({
        method: 'POST',
        path: '/api/mpesa/stkpush',
        data: {
          phoneNumber: formattedPhone,
          amount,
          accountReference: `TX-${transactionId}`,
          transactionDesc: `Payment for transaction ${transactionId}`,
          transactionId,
          userId,
          splitPayment,
          splitIndex,
          splitTotal
        }
      });
      
      if (enhancedResponse.success && enhancedResponse.data) {
        return {
          success: true,
          checkoutRequestId: enhancedResponse.data.checkoutRequestId,
          merchantRequestId: enhancedResponse.data.merchantRequestId,
          message: enhancedResponse.data.customerMessage
        };
      }
    } catch (enhancedError) {
      console.log('Enhanced M-Pesa integration not available, falling back to legacy integration');
      // If enhanced integration fails, continue to legacy integration
    }
    
    // Legacy integration as fallback
    const response = await apiRequest<{success: boolean; checkoutRequestId?: string; error?: string}>({
      method: 'POST',
      path: '/api/payments/mpesa',
      data: {
        phoneNumber: formattedPhone,
        amount,
        transactionId,
        userId, // Include optional userId for loyalty points
        splitPayment,
        splitIndex,
        splitTotal
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
    // First try with enhanced M-Pesa API endpoint
    try {
      const enhancedResponse = await apiRequest<{
        success: boolean;
        message: string;
        data: {
          resultCode: string;
          resultDesc: string;
          merchantRequestId: string;
          checkoutRequestId: string;
          transactionId?: number;
        }
      }>({
        method: 'GET',
        path: `/api/mpesa/status/${checkoutRequestId}`
      });
      
      if (enhancedResponse.success) {
        return {
          status: enhancedResponse.data.resultCode === '0' ? 'COMPLETED' : 'FAILED',
          message: enhancedResponse.data.resultDesc,
          transactionId: enhancedResponse.data.transactionId
        };
      }
    } catch (enhancedError) {
      console.log('Enhanced M-Pesa status API not available, falling back to legacy API');
      // If enhanced integration fails, continue to legacy integration
    }
    
    // Fall back to legacy integration
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