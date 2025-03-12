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
    
    // In development mode, we'll simulate a successful payment
    // This is to avoid actual API calls during development
    if (process.env.NODE_ENV === 'development' || true) { // Always true for demo
      console.log('DEVELOPMENT MODE: Simulating M-Pesa payment for phone', formattedPhone);
      
      // Return a simulated successful response
      return {
        success: true,
        checkoutRequestId: `SIM-${Date.now()}`,
        message: "M-Pesa payment simulation. In production, customer would receive an STK push."
      };
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
      } else if (enhancedResponse.error) {
        // Handle specific enhanced M-Pesa errors
        if (enhancedResponse.error.includes("Wrong credentials")) {
          return { 
            success: false, 
            error: "M-Pesa API credentials not configured. Please contact system administrator."
          };
        }
        return { success: false, error: enhancedResponse.error };
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
    
    // Handle specific M-Pesa errors for legacy integration
    if (!response.success && response.error) {
      if (response.error.includes("System is busy")) {
        return { 
          success: false, 
          error: "M-Pesa system currently unavailable. Please try again later or use an alternative payment method."
        };
      } else if (response.error.includes("Wrong credentials")) {
        return { 
          success: false, 
          error: "M-Pesa API credentials not configured. Please contact system administrator."
        };
      }
    }
    
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
    // In development mode, we'll simulate a successful payment
    // This is to avoid actual API calls during development
    if (process.env.NODE_ENV === 'development' || true) { // Always true for demo
      console.log('DEVELOPMENT MODE: Simulating Airtel Money payment for phone', phoneNumber);
      
      // Return a simulated successful response
      return {
        success: true,
        reference: `SIM-AIRTEL-${Date.now()}`,
        message: "Airtel Money payment simulation. In production, customer would receive a payment request."
      };
    }
    
    // Format phone number if needed
    let formattedPhone = phoneNumber;
    if (phoneNumber.startsWith('0')) {
      formattedPhone = `254${phoneNumber.substring(1)}`;
    } else if (phoneNumber.startsWith('+254')) {
      formattedPhone = phoneNumber.substring(1); // Remove the + sign
    }
    
    const response = await apiRequest<{success: boolean; reference?: string; error?: string}>({
      method: 'POST',
      path: '/api/payments/airtel',
      data: {
        phoneNumber: formattedPhone,
        amount,
        transactionId,
        userId // Include optional userId for loyalty points
      }
    });
    
    // Handle specific error messages for better user experience
    if (!response.success && response.error) {
      if (response.error.includes("Connection failed")) {
        return { 
          success: false, 
          error: "Airtel Money system currently unavailable. Please try again later or use an alternative payment method."
        };
      } else if (response.error.includes("Invalid credentials")) {
        return { 
          success: false, 
          error: "Airtel Money API credentials not configured. Please contact system administrator."
        };
      }
    }
    
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
    // In development mode, we'll simulate a successful payment status check
    // This is to avoid actual API calls during development
    if (process.env.NODE_ENV === 'development' || true) { // Always true for demo
      // If the checkout ID starts with 'SIM-' it's a simulated transaction
      if (checkoutRequestId.startsWith('SIM-')) {
        console.log('DEVELOPMENT MODE: Simulating successful M-Pesa payment status check');
        
        // After 3 seconds, consider the payment successful (simulating a real-world delay)
        if (Date.now() - parseInt(checkoutRequestId.replace('SIM-', '')) > 3000) {
          return {
            status: 'COMPLETED',
            message: "Simulated M-Pesa payment completed successfully",
            transactionId: parseInt(checkoutRequestId.split('-')[1]) || 0
          };
        } else {
          return {
            status: 'PENDING',
            message: "Simulated M-Pesa payment is still processing"
          };
        }
      }
    }
    
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
      
      if (enhancedResponse.success && enhancedResponse.data) {
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
    // In development mode, simulate a successful Airtel Money payment check
    if (process.env.NODE_ENV === 'development' || true) { // Always true for demo
      // If the reference ID starts with 'SIM-' it's a simulated transaction
      if (referenceId.startsWith('SIM-AIRTEL-')) {
        console.log('DEVELOPMENT MODE: Simulating successful Airtel Money payment status check');
        
        // After 3 seconds, consider the payment successful (simulating a real-world delay)
        if (Date.now() - parseInt(referenceId.replace('SIM-AIRTEL-', '')) > 3000) {
          return {
            transactionStatus: 'SUCCESS',
            message: "Simulated Airtel Money payment completed successfully"
          };
        } else {
          return {
            transactionStatus: 'PENDING',
            message: "Simulated Airtel Money payment is still processing"
          };
        }
      }
    }
    
    // Real implementation
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