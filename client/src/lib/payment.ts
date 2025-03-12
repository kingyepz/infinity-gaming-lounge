import { apiRequest } from "./queryClient";

export type PaymentMethod = "cash" | "mpesa" | "qr-mpesa";

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
export async function processCashPayment(transactionId: number, amount: number, userId?: number, splitIndex?: number) {
  try {
    // Generate a unique reference for cash payments for consistent tracking
    const cashReference = splitIndex !== undefined 
      ? `CASH-${transactionId}-${splitIndex+1}` 
      : `CASH-${transactionId}-${Date.now().toString().slice(-4)}`;
    
    const response = await apiRequest<{success: boolean; reference?: string; error?: string}>({
      method: 'POST',
      path: '/api/payments/cash',
      data: {
        transactionId,
        amount,
        userId, // Include optional userId for loyalty points
        reference: cashReference // Include a reference for tracking purposes
      }
    });
    
    // Ensure a reference is returned for consistency with mobile money payments
    if(response.success) {
      return {
        ...response,
        reference: response.reference || cashReference
      };
    }
    
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
    
    // Simulation mode can be toggled for testing without actual M-Pesa API
    const SIMULATION_MODE = true; // Set to false to use real M-Pesa API
    
    if (SIMULATION_MODE) {
      console.log('DEVELOPMENT MODE: Simulating M-Pesa payment for phone', formattedPhone);
      
      // Store simulation start time for status checking
      localStorage.setItem(`mpesa-sim-${transactionId}`, Date.now().toString());
      
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
          checkoutRequestId: enhancedResponse.data?.checkoutRequestId || '',
          merchantRequestId: enhancedResponse.data?.merchantRequestId || '',
          message: enhancedResponse.data?.customerMessage || 'M-Pesa payment request initiated successfully'
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
      } else {
        // If there's no error but the response isn't successful
        return { 
          success: false, 
          error: "Unknown error with M-Pesa request. Please try again or use a different payment method."
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
 * Check M-Pesa payment status
 */
export async function checkMpesaPaymentStatus(checkoutRequestId: string) {
  try {
    // Simulation mode for testing without actual M-Pesa API
    // Only use simulation for transactions that start with 'SIM-' 
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
          message: enhancedResponse.data.resultDesc || 'M-Pesa payment status checked successfully',
          transactionId: enhancedResponse.data.transactionId || 0
        };
      } else {
        // No data available - might be pending
        return {
          status: 'PENDING',
          message: enhancedResponse.message || 'Payment is still being processed'
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
 * Generate QR code for M-Pesa payment using Safaricom's official Ratiba API
 */
export async function generateMpesaQRCode(amount: number, transactionId: number, referenceNumber?: string) {
  try {
    // Determine if we should use simulation mode or real API
    const SIMULATION_MODE = false; // Set to true to use simulated QR codes for testing
    
    if (SIMULATION_MODE) {
      console.log('DEVELOPMENT MODE: Simulating M-Pesa QR code generation');
      
      // Store time for simulating payment completion
      localStorage.setItem(`qr-payment-${transactionId}`, Date.now().toString());
      
      // Return a simulated successful response with a base64 encoded QR code
      // This is a placeholder QR code for demo purposes
      const placeholderQRCode = 'iVBORw0KGgoAAAANSUhEUgAAAIQAAACECAYAAABRRIIvAAAAAklEQVR4AewaftIAAAOSSURBVO3BQa7jRgADweyHvv8ld45+SIBgMYnHrsjMH1hrXYa11nUZ1lqXYa11GdZal2GtdRnWWpdhrXUZ1lqXYa11GdZal2GtdRnWWpdhrXUZ1lqX4YNDIn+TMToidyJKxjMidyJKxm9EfDKstS7DWusyrLUuw1rrMnxwWcZNIk+IfCIjRTwh441DNxkp4g2RmzJuGtZal2GtdRnWWpfhgy8WeZORIp4QeUPkJpGbiIyIJ0TeiPiXDGutYFhrXYa11mX44B8nkiKeEHlGJEVkxE8SeUbkXzKstS7DWusyrLUuwwf/MJGeUUSUiBKRIkrEExk9oojcJPKThrXWZVhrXYa11mX44ItF/k1GdkSJSBElomcUkR5RInpGiejZEU+I/KRhrXUZ1lqXYa11GT64TOSniaQdmR3RM4pIimgRo0ekiGdEnhF5Q+SmYa11GdZal2GtdRk+OCQyMorIjOgRJaJEzIiekSJSRMkoETUjRfSMFNEySsSMKBFPiLwxrLUuw1rrMqy1LsMH/xERN0XMiJ5RIlJEiegZRaRH9IwikSKyI0XMiO/0rw1rrWBYa12GtdZl+OBQxBMiT0TMiJ5RRJ4QmRE9o0jUiO6IEVFE3hC5KWJGvDGstS7DWusyrLUuwweHRJ4QeSJiRvSMFJERRaRF9IwU0TN6RI3IjtgRm2GtdRnWWpdhrXUZPvgyETWiRbSIGdEzRkSL6BlFpGfMiDdERkTLSBEtokdkxLPDWusyrLUuw1rrMnxwKKJlzIie0SJ6RpHoGUWkZ2RHz5gRL4icUUTe+JXDWusyrLUuw1rrMnxwWcSTiBExIlpEy0gRKSJFtIwZ0SNyxIjYEVmiR7SMlpEd0SNaxE3DWusyrLUuw1rrMnzwZUQyokS0jBTRMlJEi+gZM6JGjIgZ0SNGRHbEiMiOJ0RGRInYEW8Ma63LsNa6DGuty/DBlyoSI+KNiJaRIlrGjOgZPeJV3hjZETOiZ/SIJzJ+0rDWugxrrcsw9gcPiLwhkiJaRBHJiJ4xI3rEE3kjokVkR8+YESMiRfSMGTEibhrWWpdhrXUZ1lqX4YNDIn+TMSOeEUkRLaJEzIge0SNyRIvoGTOiRaSIGZEdNw1rrWBYa12GtdZl+OCyjJtEnhA5IyJFvBHRMlpEz8gRM6JlpIiWkSJaxoh4QmRGfNKw1roMa63LsNa6DB98scg3jBgRPSNFpIiW0TN6xDOyI1pEdvSMGTEiciNGxE3DWusyrLUuw1rrMnzwDxN5I+KmiOyIF5Ed0SJ6RM+YEUXkmYiMeHZYa12GtdZlWGtdhrXWZVhrXYa11mVYa12GtdZlWGtdhrXWZVhrXYa11mVYa12GtdZlWGtdhv8BRG6XuC9VJSsAAAAASUVORK5CYII=';
      
      return {
        success: true,
        qrCode: placeholderQRCode,
        requestId: `QR-${transactionId}`,
        message: "QR code generated successfully (simulated)"
      };
    }
    
    // Log the request
    console.log("Generating M-Pesa QR code for transaction:", {
      amount,
      transactionId,
      referenceNumber: referenceNumber || `TX-${transactionId}`
    });
    
    // Make request to our backend API which calls Safaricom's M-Pesa Ratiba API
    const response = await apiRequest<{
      success: boolean;
      message?: string;
      data?: {
        QRCode: string;
        RequestID: string;
        ResponseCode: string;
        ResponseDescription: string;
        transactionId: number;
      };
      error?: string;
    }>({
      method: 'POST',
      path: '/api/mpesa/qrcode',
      data: {
        amount,
        transactionId,
        referenceNumber: referenceNumber || `TX-${transactionId}`,
      }
    });
    
    // Log success/error
    if (response.success && response.data) {
      console.log("Successfully generated M-Pesa QR code:", {
        requestId: response.data.RequestID,
        hasQRCode: !!response.data.QRCode,
        responseCode: response.data.ResponseCode,
        responseDesc: response.data.ResponseDescription
      });
      
      return {
        success: true,
        qrCode: response.data.QRCode || '',
        requestId: response.data.RequestID || `QR-${transactionId}`,
        message: response.message || 'QR code generated successfully',
        responseCode: response.data.ResponseCode,
        responseDescription: response.data.ResponseDescription
      };
    } else {
      console.error("Failed to generate M-Pesa QR code:", response.error || "Unknown error");
    }
    
    return {
      success: false,
      error: response.error || 'Failed to generate QR code'
    };
  } catch (error) {
    console.error('Error generating M-Pesa QR code:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Check M-Pesa QR code payment status
 */
export async function checkMpesaQRPaymentStatus(transactionId: number) {
  try {
    // Simulation mode for testing without actual M-Pesa QR code API
    const SIMULATION_MODE = true; // Set to false to use real M-Pesa QR code API
    
    if (SIMULATION_MODE) {
      console.log('DEVELOPMENT MODE: Simulating M-Pesa QR code payment status check');
      
      // After 5 seconds, consider the payment successful (simulating a real-world delay)
      const qrCodeGenerationTime = localStorage.getItem(`qr-payment-${transactionId}`);
      if (qrCodeGenerationTime && (Date.now() - parseInt(qrCodeGenerationTime)) > 5000) {
        return {
          success: true,
          status: 'COMPLETED',
          message: "Simulated QR code payment completed successfully"
        };
      } else {
        // Store the generation time if not already stored
        if (!qrCodeGenerationTime) {
          localStorage.setItem(`qr-payment-${transactionId}`, Date.now().toString());
        }
        return {
          success: false,
          status: 'PENDING',
          message: "Simulated QR code payment is still processing. Please scan the QR code."
        };
      }
    }
    
    const response = await apiRequest<{
      success: boolean;
      status?: string;
      message?: string;
      error?: string;
    }>({
      method: 'GET',
      path: `/api/mpesa/qrcode/status/${transactionId}`
    });
    
    if (response.success) {
      return {
        success: true,
        status: 'COMPLETED',
        message: response.message || 'Payment completed successfully'
      };
    }
    
    if (response.status === 'pending') {
      return {
        success: false,
        status: 'PENDING',
        message: 'Payment is still pending. Please scan the QR code and complete the payment.'
      };
    }
    
    return {
      success: false,
      status: response.status || 'FAILED',
      message: response.message || 'Payment failed or status unknown'
    };
  } catch (error) {
    console.error('Error checking M-Pesa QR payment status:', error);
    return {
      success: false,
      status: 'ERROR',
      message: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
}



/**
 * Format currency amount as KES
 */
export function formatCurrency(amount: number | string) {
  const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
  return `KES ${numAmount.toFixed(0)}`;
}

/**
 * Generate a receipt for a transaction as a PDF
 */
export async function generateReceipt(transactionId: number): Promise<Blob> {
  try {
    // First, fetch the transaction details from the API
    const transactionResponse = await apiRequest<{
      success: boolean;
      transaction?: any;
      error?: string;
    }>({
      method: 'GET',
      path: `/api/transactions/${transactionId}`
    });
    
    if (!transactionResponse.success || !transactionResponse.transaction) {
      throw new Error(transactionResponse.error || 'Failed to fetch transaction details');
    }
    
    const tx = transactionResponse.transaction;
    
    // Fetch payment details for this transaction
    const paymentResponse = await apiRequest<{
      success: boolean;
      payment?: any;
      error?: string;
    }>({
      method: 'GET',
      path: `/api/payments/transaction/${transactionId}`
    });
    
    if (!paymentResponse.success || !paymentResponse.payment) {
      throw new Error(paymentResponse.error || 'Failed to fetch payment details');
    }
    
    const payment = paymentResponse.payment;
    
    // In a real implementation, we'd use a PDF generation library like jsPDF
    // For this implementation, we'll create a simple HTML receipt and convert it to PDF format
    
    // Create receipt HTML content
    const receiptHtml = `
      <html>
        <head>
          <title>Receipt #${transactionId}</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              margin: 0;
              padding: 20px;
              color: #333;
            }
            .receipt {
              max-width: 300px;
              margin: 0 auto;
              border: 1px solid #ddd;
              padding: 20px;
            }
            .header {
              text-align: center;
              border-bottom: 1px solid #ddd;
              padding-bottom: 10px;
              margin-bottom: 10px;
            }
            .logo {
              font-size: 20px;
              font-weight: bold;
            }
            .info-row {
              display: flex;
              justify-content: space-between;
              margin-bottom: 5px;
            }
            .footer {
              margin-top: 20px;
              text-align: center;
              font-size: 12px;
              color: #666;
            }
            .thank-you {
              margin-top: 20px;
              text-align: center;
              font-weight: bold;
            }
            .payment-info {
              margin-top: 15px;
              border-top: 1px dashed #ddd;
              padding-top: 10px;
            }
          </style>
        </head>
        <body>
          <div class="receipt">
            <div class="header">
              <div class="logo">Infinity Gaming Lounge</div>
              <div>Official Receipt</div>
              <div>${new Date(tx.createdAt).toLocaleDateString()}</div>
            </div>
            
            <div class="info-row">
              <div>Receipt #:</div>
              <div>${transactionId}</div>
            </div>
            <div class="info-row">
              <div>Customer:</div>
              <div>${tx.customerName}</div>
            </div>
            <div class="info-row">
              <div>Game:</div>
              <div>${tx.gameName || 'N/A'}</div>
            </div>
            <div class="info-row">
              <div>Station:</div>
              <div>#${tx.stationId}</div>
            </div>
            <div class="info-row">
              <div>Session Type:</div>
              <div>${tx.sessionType === 'per_game' ? 'Per Game' : 'Hourly'}</div>
            </div>
            ${tx.duration ? `
            <div class="info-row">
              <div>Duration:</div>
              <div>${tx.duration} ${tx.duration === 1 ? 'hour' : 'hours'}</div>
            </div>` : ''}
            
            <div class="payment-info">
              <div class="info-row">
                <div>Amount:</div>
                <div>${formatCurrency(tx.amount)}</div>
              </div>
              <div class="info-row">
                <div>Payment Method:</div>
                <div>${payment.paymentMethod.toUpperCase()}</div>
              </div>
              <div class="info-row">
                <div>Status:</div>
                <div>${payment.status.toUpperCase()}</div>
              </div>
              ${payment.reference ? `
              <div class="info-row">
                <div>Reference:</div>
                <div>${payment.reference}</div>
              </div>` : ''}
            </div>
            
            <div class="thank-you">
              Thank you for your business!
            </div>
            
            <div class="footer">
              <p>Infinity Gaming Lounge</p>
              <p>123 Gaming Street, Nairobi, Kenya</p>
              <p>Tel: +254 700 123 456</p>
            </div>
          </div>
        </body>
      </html>
    `;
    
    // Convert HTML to PDF-like blob
    // In a production environment, we would use a proper PDF generation library
    // For this implementation, we're creating a blob with HTML content
    const blob = new Blob([receiptHtml], { type: 'text/html' });
    return blob;
  } catch (error) {
    console.error('Error generating receipt:', error);
    throw error;
  }
}

/**
 * Initiate M-Pesa payment using the official API
 */
export async function initiateMpesaAPIPayment(phoneNumber: string, amount: number, transactionId: number, userId?: number, splitPayment?: boolean, splitIndex?: number, splitTotal?: number) {
  try {
    // Format phone number to ensure it's in the required format (254XXXXXXXXX)
    let formattedPhone = phoneNumber;
    if (phoneNumber.startsWith('0')) {
      formattedPhone = `254${phoneNumber.substring(1)}`;
    } else if (phoneNumber.startsWith('+254')) {
      formattedPhone = phoneNumber.substring(1); // Remove the + sign
    }
    
    console.log(
      'Initiating M-Pesa STK Push through official API:',
      { phoneNumber: formattedPhone, amount, transactionId, userId, splitPayment, splitIndex, splitTotal }
    );
    
    // Simulation mode for testing without actual M-Pesa API
    const SIMULATION_MODE = true; // Set to false to use real M-Pesa API
    
    if (SIMULATION_MODE) {
      console.log('DEVELOPMENT MODE: Simulating M-Pesa API payment for phone', formattedPhone);
      
      // Create a timestamp to be used for status checking - will complete after 3 seconds
      const timestamp = Date.now();
      
      // Return a simulated successful response
      return {
        success: true,
        checkoutRequestId: `SIM-API-${timestamp}`,
        merchantRequestId: `SIM-MR-${timestamp}`,
        message: "M-Pesa API payment simulation. In production, customer would receive an STK push."
      };
    }
    
    const data = {
      phoneNumber: formattedPhone,
      amount,
      transactionId,
      accountReference: `InfGaming-${transactionId}`,
      transactionDesc: "Payment for gaming services",
      userId,
      splitPayment,
      splitIndex,
      splitTotal,
      callbackUrl: `${window.location.origin}/api/mpesa-api/callback` // Callback URL for webhook
    };
    
    const response = await apiRequest<{
      success: boolean;
      checkoutRequestId?: string;
      merchantRequestId?: string;
      message?: string;
      error?: string;
    }>({
      method: 'POST',
      path: '/api/mpesa-api/stkpush',
      data
    });
    
    if (response.success && response.checkoutRequestId) {
      return {
        success: true,
        checkoutRequestId: response.checkoutRequestId,
        merchantRequestId: response.merchantRequestId,
        message: response.message
      };
    }
    
    return {
      success: false,
      error: response.error || 'Failed to initiate M-Pesa STK Push'
    };
  } catch (error) {
    console.error('Error initiating M-Pesa payment through API:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Check M-Pesa payment status using the official API
 */
export async function checkMpesaAPIPaymentStatus(checkoutRequestId: string) {
  try {
    // In development mode, simulate a successful payment status check
    if (process.env.NODE_ENV === 'development' || true) { // Always true for demo
      // If the checkout ID starts with 'SIM-' it's a simulated transaction
      if (checkoutRequestId.startsWith('SIM-API-')) {
        console.log('DEVELOPMENT MODE: Simulating successful M-Pesa API payment status check');
        
        // After 3 seconds, consider the payment successful (simulating a real-world delay)
        if (Date.now() - parseInt(checkoutRequestId.replace('SIM-API-', '')) > 3000) {
          return {
            success: true,
            status: 'completed',
            resultDesc: "Simulated M-Pesa API payment completed successfully",
            mpesaRef: `MAPI-${Math.floor(Math.random() * 1000000)}`,
            transactionId: parseInt(checkoutRequestId.split('-')[2]) || 0
          };
        } else {
          return {
            success: true,
            status: 'pending',
            resultDesc: "Simulated M-Pesa API payment is still processing"
          };
        }
      }
    }
    
    const response = await apiRequest<{
      success: boolean;
      status?: string;
      resultDesc?: string;
      mpesaRef?: string;
      transactionId?: number;
      error?: string;
    }>({
      method: 'GET',
      path: `/api/mpesa-api/status/${checkoutRequestId}`,
    });
    
    if (response.success) {
      return {
        success: true,
        status: response.status || 'pending',
        resultDesc: response.resultDesc,
        mpesaRef: response.mpesaRef,
        transactionId: response.transactionId
      };
    }
    
    return {
      success: false,
      error: response.error || 'Failed to check M-Pesa payment status'
    };
  } catch (error) {
    console.error('Error checking M-Pesa payment status through API:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Register callback URLs for C2B payments
 */
export async function registerMpesaURLs(validationUrl: string, confirmationUrl: string) {
  try {
    // In development mode, simulate a successful registration
    if (process.env.NODE_ENV === 'development' || true) { // Always true for demo
      console.log('DEVELOPMENT MODE: Simulating M-Pesa URL registration');
      
      return {
        success: true,
        conversationId: `SIM-CONV-${Date.now()}`,
        responseDescription: "URLs registered successfully (simulated)"
      };
    }
    
    const response = await apiRequest<{
      success: boolean;
      conversationId?: string;
      originatorCoversationId?: string;
      responseDescription?: string;
      error?: string;
    }>({
      method: 'POST',
      path: '/api/mpesa-api/register-urls',
      data: {
        shortCode: process.env.MPESA_SHORTCODE || '174379', // Default sandbox shortcode
        responseType: 'Completed',
        validationUrl,
        confirmationUrl
      }
    });
    
    if (response.success) {
      return {
        success: true,
        conversationId: response.conversationId,
        responseDescription: response.responseDescription
      };
    }
    
    return {
      success: false,
      error: response.error || 'Failed to register M-Pesa URLs'
    };
  } catch (error) {
    console.error('Error registering M-Pesa URLs:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Check transaction status using official API
 */
export async function checkMpesaTransactionStatus(transactionId: string) {
  try {
    // In development mode, simulate a successful status check
    if (process.env.NODE_ENV === 'development' || true) { // Always true for demo
      console.log('DEVELOPMENT MODE: Simulating M-Pesa transaction status check');
      
      return {
        success: true,
        transactionStatus: "Completed",
        resultCode: "0",
        resultDesc: "The service request has been accepted successfully (simulated)"
      };
    }
    
    const response = await apiRequest<{
      success: boolean;
      conversationId?: string;
      originatorConversationId?: string;
      responseDescription?: string;
      resultCode?: string;
      resultDesc?: string;
      transactionStatus?: string;
      error?: string;
    }>({
      method: 'POST',
      path: '/api/mpesa-api/transaction-status',
      data: {
        transactionId,
        initiator: process.env.MPESA_INITIATOR_NAME || 'testapi',
        securityCredential: process.env.MPESA_SECURITY_CREDENTIAL || 'Safaricom999!*!',
        commandID: 'TransactionStatusQuery',
        partyA: process.env.MPESA_SHORTCODE || '174379',
        identifierType: '1',
        resultUrl: `${window.location.origin}/api/mpesa-api/callback`,
        queueTimeoutUrl: `${window.location.origin}/api/mpesa-api/callback`,
        remarks: 'Check transaction status',
        occasion: 'Payment verification'
      }
    });
    
    if (response.success) {
      return {
        success: true,
        transactionStatus: response.transactionStatus,
        resultCode: response.resultCode,
        resultDesc: response.resultDesc
      };
    }
    
    return {
      success: false,
      error: response.error || 'Failed to check transaction status'
    };
  } catch (error) {
    console.error('Error checking transaction status:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Request transaction reversal using official API
 */
export async function reverseMpesaTransaction(transactionId: string, amount: number) {
  try {
    // In development mode, simulate a successful reversal
    if (process.env.NODE_ENV === 'development' || true) { // Always true for demo
      console.log('DEVELOPMENT MODE: Simulating M-Pesa transaction reversal');
      
      return {
        success: true,
        conversationId: `SIM-REV-${Date.now()}`,
        responseDescription: "Reversal request accepted successfully (simulated)"
      };
    }
    
    const response = await apiRequest<{
      success: boolean;
      conversationId?: string;
      originatorConversationId?: string;
      responseDescription?: string;
      error?: string;
    }>({
      method: 'POST',
      path: '/api/mpesa-api/reversal',
      data: {
        initiator: process.env.MPESA_INITIATOR_NAME || 'testapi',
        securityCredential: process.env.MPESA_SECURITY_CREDENTIAL || 'Safaricom999!*!',
        commandID: 'TransactionReversal',
        transactionID: transactionId,
        amount,
        receiverParty: process.env.MPESA_SHORTCODE || '174379',
        receiverIdentifierType: '4',
        resultUrl: `${window.location.origin}/api/mpesa-api/callback`,
        queueTimeoutUrl: `${window.location.origin}/api/mpesa-api/callback`,
        remarks: 'Reversal request',
        occasion: 'Payment reversal'
      }
    });
    
    if (response.success) {
      return {
        success: true,
        conversationId: response.conversationId,
        responseDescription: response.responseDescription
      };
    }
    
    return {
      success: false,
      error: response.error || 'Failed to reverse transaction'
    };
  } catch (error) {
    console.error('Error reversing transaction:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}