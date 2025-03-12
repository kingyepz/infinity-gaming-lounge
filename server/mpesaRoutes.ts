/**
 * M-Pesa Enhanced API Routes
 * Based on the dalienst/mpesa-stk-drf repository structure
 */

import express, { Request, Response } from 'express';
import { z } from 'zod';
import { enhancedMpesaService, stkPushRequestSchema, MPesaTransaction } from './mpesaEnhanced';
import { storage } from './storage';
import { PaymentDebugger } from './paymentDebugger';

// Create router
const router = express.Router();

/**
 * Initiate STK Push for M-Pesa payment
 * POST /api/mpesa/stkpush
 */
router.post('/stkpush', async (req: Request, res: Response) => {
  try {
    // Validate request body
    const requestData = stkPushRequestSchema.safeParse(req.body);
    
    if (!requestData.success) {
      PaymentDebugger.logError('mpesaRoutes', 'stkpush:validation', requestData.error);
      return res.status(400).json({
        success: false,
        error: 'Invalid request data',
        details: requestData.error.errors
      });
    }
    
    const { 
      phoneNumber, 
      amount, 
      accountReference,
      transactionDesc,
      transactionId,
      splitPayment,
      splitIndex,
      splitTotal,
      userId
    } = requestData.data;
    
    PaymentDebugger.log('mpesaRoutes', 'stkpush:request', {
      phoneNumber,
      amount,
      transactionId,
      splitPayment
    });
    
    // Initiate STK Push
    const response = await enhancedMpesaService.initiateSTKPush({
      phoneNumber,
      amount,
      accountReference: accountReference || `TX-${transactionId}`,
      transactionDesc: transactionDesc || `Payment for transaction ${transactionId}`,
      transactionId,
      splitPayment,
      splitIndex,
      splitTotal,
      userId
    });
    
    // Return response
    return res.status(200).json({
      success: true,
      message: 'STK Push initiated successfully',
      data: {
        merchantRequestId: response.MerchantRequestID,
        checkoutRequestId: response.CheckoutRequestID,
        responseDescription: response.ResponseDescription,
        customerMessage: response.CustomerMessage,
        transactionId
      }
    });
  } catch (error) {
    PaymentDebugger.logError('mpesaRoutes', 'stkpush:error', error);
    
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    });
  }
});

/**
 * Check M-Pesa transaction status
 * GET /api/mpesa/status/:checkoutRequestId
 */
router.get('/status/:checkoutRequestId', async (req: Request, res: Response) => {
  try {
    const { checkoutRequestId } = req.params;
    
    if (!checkoutRequestId) {
      return res.status(400).json({
        success: false,
        error: 'Checkout request ID is required'
      });
    }
    
    PaymentDebugger.log('mpesaRoutes', 'status:request', {
      checkoutRequestId
    });
    
    // Check transaction status
    const response = await enhancedMpesaService.checkTransactionStatus(checkoutRequestId);
    
    // Get transaction record
    const transactionRecord = enhancedMpesaService.getTransactionByCheckoutRequestId(checkoutRequestId);
    
    return res.status(200).json({
      success: response.ResultCode === '0',
      message: response.ResultDesc,
      data: {
        resultCode: response.ResultCode,
        resultDesc: response.ResultDesc,
        merchantRequestId: response.MerchantRequestID,
        checkoutRequestId: response.CheckoutRequestID,
        transactionId: transactionRecord?.transactionId
      }
    });
  } catch (error) {
    PaymentDebugger.logError('mpesaRoutes', 'status:error', error);
    
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    });
  }
});

/**
 * Get transaction by checkout request ID
 * GET /api/mpesa/transaction/:checkoutRequestId
 */
router.get('/transaction/:checkoutRequestId', async (req: Request, res: Response) => {
  try {
    const { checkoutRequestId } = req.params;
    
    if (!checkoutRequestId) {
      return res.status(400).json({
        success: false,
        error: 'Checkout request ID is required'
      });
    }
    
    // Get transaction record
    const transactionRecord = enhancedMpesaService.getTransactionByCheckoutRequestId(checkoutRequestId);
    
    if (!transactionRecord) {
      return res.status(404).json({
        success: false,
        error: 'Transaction not found'
      });
    }
    
    return res.status(200).json({
      success: true,
      data: transactionRecord
    });
  } catch (error) {
    PaymentDebugger.logError('mpesaRoutes', 'transaction:error', error);
    
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    });
  }
});

/**
 * Get transaction by application transaction ID
 * GET /api/mpesa/transaction/by-id/:transactionId
 */
router.get('/transaction/by-id/:transactionId', async (req: Request, res: Response) => {
  try {
    const transactionId = parseInt(req.params.transactionId);
    
    if (isNaN(transactionId)) {
      return res.status(400).json({
        success: false,
        error: 'Valid transaction ID is required'
      });
    }
    
    // Get transaction record
    const transactionRecord = enhancedMpesaService.getTransactionByTransactionId(transactionId);
    
    if (!transactionRecord) {
      return res.status(404).json({
        success: false,
        error: 'Transaction not found'
      });
    }
    
    return res.status(200).json({
      success: true,
      data: transactionRecord
    });
  } catch (error) {
    PaymentDebugger.logError('mpesaRoutes', 'transactionById:error', error);
    
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    });
  }
});

/**
 * List all M-Pesa transactions (for development/debugging)
 * GET /api/mpesa/transactions
 */
router.get('/transactions', (_req: Request, res: Response) => {
  try {
    const transactions = enhancedMpesaService.getTransactions();
    
    return res.status(200).json({
      success: true,
      count: transactions.length,
      data: transactions
    });
  } catch (error) {
    PaymentDebugger.logError('mpesaRoutes', 'transactions:error', error);
    
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    });
  }
});

/**
 * Process STK Push callback from M-Pesa
 * POST /api/mpesa/callback
 */
router.post('/callback', async (req: Request, res: Response) => {
  try {
    PaymentDebugger.log('mpesaRoutes', 'callback:received', req.body);
    
    // Process the callback
    const callbackResult = await enhancedMpesaService.processSTKCallback(req.body);
    
    // If successful and we have a valid transaction, update payment status
    if (callbackResult.success && callbackResult.transactionId && callbackResult.transactionRecord) {
      const transactionId = callbackResult.transactionId;
      const mpesaRef = callbackResult.transactionRecord.mpesaReceiptNumber || '';
      
      try {
        // Update transaction status
        await storage.updateTransactionStatus(
          transactionId,
          'completed',
          mpesaRef
        );
        
        // Update payment status if payment record exists
        const payment = await storage.getPaymentByTransactionId(transactionId);
        if (payment) {
          await storage.updatePaymentStatus(
            payment.id,
            'completed',
            mpesaRef
          );
        }
        
        // Award loyalty points if userId is provided
        if (callbackResult.transactionRecord.userId) {
          const pointsToAward = Math.floor(callbackResult.transactionRecord.amount / 10);
          if (pointsToAward > 0) {
            await storage.awardLoyaltyPoints(callbackResult.transactionRecord.userId, pointsToAward);
          }
        }
        
        PaymentDebugger.log('mpesaRoutes', 'callback:dbUpdated', {
          transactionId,
          status: 'completed',
          mpesaRef
        });
      } catch (dbError) {
        PaymentDebugger.logError('mpesaRoutes', 'callback:dbError', dbError);
      }
    } else if (!callbackResult.success && callbackResult.transactionId) {
      // Update transaction as failed
      try {
        await storage.updateTransactionStatus(
          callbackResult.transactionId,
          'failed'
        );
        
        // Update payment status if payment record exists
        const payment = await storage.getPaymentByTransactionId(callbackResult.transactionId);
        if (payment) {
          await storage.updatePaymentStatus(
            payment.id,
            'failed'
          );
        }
        
        PaymentDebugger.log('mpesaRoutes', 'callback:paymentFailed', {
          transactionId: callbackResult.transactionId,
          resultCode: callbackResult.mpesaData.ResultCode,
          resultDesc: callbackResult.mpesaData.ResultDesc
        });
      } catch (dbError) {
        PaymentDebugger.logError('mpesaRoutes', 'callback:dbError', dbError);
      }
    }
    
    // Always respond with success to M-Pesa API
    return res.status(200).json({ ResultCode: 0, ResultDesc: 'Callback processed successfully' });
  } catch (error) {
    PaymentDebugger.logError('mpesaRoutes', 'callback:error', error);
    
    // Always respond with success to M-Pesa API (even on error)
    // This prevents M-Pesa from retrying the callback
    return res.status(200).json({ ResultCode: 0, ResultDesc: 'Callback acknowledged' });
  }
});

/**
 * Generate QR code for M-Pesa payment using Safaricom's official Ratiba API
 * POST /api/mpesa/qrcode
 */
router.post('/qrcode', async (req: Request, res: Response) => {
  try {
    // Define validation schema for QR code request
    const qrCodeRequestSchema = z.object({
      amount: z.number().int().positive(),
      transactionId: z.number().int().positive(),
      referenceNumber: z.string().max(20).optional(),
      trxCode: z.string().max(2).optional()
    });
    
    // Validate request body
    const requestData = qrCodeRequestSchema.safeParse(req.body);
    
    if (!requestData.success) {
      PaymentDebugger.logError('mpesaRoutes', 'qrcode:validation', requestData.error);
      return res.status(400).json({
        success: false,
        error: 'Invalid request data',
        details: requestData.error.errors
      });
    }
    
    const { amount, transactionId, referenceNumber, trxCode } = requestData.data;
    
    PaymentDebugger.log('mpesaRoutes', 'qrcode:request', {
      amount,
      transactionId,
      referenceNumber: referenceNumber || `TX-${transactionId}`
    });
    
    // Generate QR code using Safaricom's Ratiba API via the enhanced service
    const response = await enhancedMpesaService.generateQRCode({
      amount,
      transactionId,
      referenceNumber: referenceNumber || `TX-${transactionId}`,
      trxCode
    });
    
    // Log the full QR code response for debugging
    PaymentDebugger.log('mpesaRoutes', 'qrcode:response', {
      ResponseCode: response.ResponseCode,
      ResponseDescription: response.ResponseDescription,
      RequestID: response.RequestID,
      hasQRCode: !!response.QRCode,
      QRCodeLength: response.QRCode ? response.QRCode.length : 0,
    });
    
    // Create or update transaction record with the QR request ID
    const checkoutRequestId = response.RequestID || `QR-${transactionId}`;
    let transactionRecord = enhancedMpesaService.getTransactionByTransactionId(transactionId);
    
    if (!transactionRecord) {
      // Create a new transaction record in our system
      const newTransaction: MPesaTransaction = {
        transactionId,
        merchantRequestId: `QR-MR-${transactionId}`,
        checkoutRequestId,
        resultCode: parseInt(response.ResponseCode),
        resultDesc: response.ResponseDescription,
        phoneNumber: '0', // For QR payments, we don't have a phone number initially
        amount,
        status: 'pending',
        accountReference: referenceNumber || `TX-${transactionId}`,
        transactionDesc: "QR code payment for gaming services",
        createdAt: new Date()
      };
      
      enhancedMpesaService.saveTransaction(checkoutRequestId, newTransaction);
      PaymentDebugger.log('mpesaRoutes', 'qrcode:transaction-created', newTransaction);
    } else {
      // Update existing transaction with new QR code request
      transactionRecord.checkoutRequestId = checkoutRequestId;
      transactionRecord.resultCode = parseInt(response.ResponseCode);
      transactionRecord.resultDesc = response.ResponseDescription;
      transactionRecord.status = 'pending';
      transactionRecord.updatedAt = new Date();
      
      enhancedMpesaService.saveTransaction(checkoutRequestId, transactionRecord);
      PaymentDebugger.log('mpesaRoutes', 'qrcode:transaction-updated', transactionRecord);
    }
    
    // Return QR code data with the format expected by the client
    return res.status(200).json({
      success: response.ResponseCode === '0',
      message: response.ResponseDescription,
      data: {
        QRCode: response.QRCode, // This is now explicitly named to match client expectations
        RequestID: response.RequestID || `QR-${transactionId}`,
        ResponseCode: response.ResponseCode,
        ResponseDescription: response.ResponseDescription,
        transactionId
      }
    });
  } catch (error) {
    PaymentDebugger.logError('mpesaRoutes', 'qrcode:error', error);
    
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    });
  }
});

/**
 * Check QR transaction status
 * GET /api/mpesa/qrcode/status/:transactionId
 */
router.get('/qrcode/status/:transactionId', async (req: Request, res: Response) => {
  try {
    const { transactionId } = req.params;
    
    if (!transactionId) {
      return res.status(400).json({
        success: false,
        error: 'Transaction ID is required'
      });
    }
    
    const txId = parseInt(transactionId);
    
    PaymentDebugger.log('mpesaRoutes', 'qrcode/status:request', {
      transactionId: txId
    });
    
    // In a real implementation, we'd check actual transaction status with M-Pesa
    // For development purposes or if API access is limited, we'll simulate payment statuses
    
    // Check if we should use simulation mode (for testing)
    const SIMULATION_MODE = false; // Set to true for simulated responses
    
    if (SIMULATION_MODE) {
      // If in simulation mode, let's check if we've stored a transaction record
      // If not, we'll simulate one based on the transaction ID
      
      const simulationKey = `qr-payment-${txId}`;
      const simulationStartTime = localStorage.getItem(simulationKey);
      
      if (!simulationStartTime) {
        localStorage.setItem(simulationKey, Date.now().toString());
        return res.status(200).json({
          success: false,
          status: 'pending',
          message: 'Simulated payment is awaiting completion. Please scan the QR code.',
          transactionId: txId
        });
      }
      
      // After 5 seconds, consider the payment successful
      if (Date.now() - parseInt(simulationStartTime) > 5000) {
        const mpesaRef = `MTEST${Math.floor(Math.random() * 10000000)}`;
        
        return res.status(200).json({
          success: true,
          status: 'completed',
          mpesaRef,
          message: `Simulated payment completed successfully. Receipt: ${mpesaRef}`,
          transactionId: txId
        });
      }
      
      return res.status(200).json({
        success: false,
        status: 'pending',
        message: 'Simulated payment is still processing. Please scan the QR code.',
        transactionId: txId
      });
    }
    
    // For QR transactions, we use a different ID format: QR-{transactionId}
    // This is how we identify these transactions in our system
    const checkoutRequestId = `QR-${txId}`;
    
    // Try first to get transaction by transaction ID (more reliable)
    let transactionRecord = enhancedMpesaService.getTransactionByTransactionId(txId);
    
    // If not found, try by checkout request ID
    if (!transactionRecord) {
      transactionRecord = enhancedMpesaService.getTransactionByCheckoutRequestId(checkoutRequestId);
    }
    
    // If still not found, return appropriate error
    if (!transactionRecord) {
      PaymentDebugger.log('mpesaRoutes', 'qrcode/status:not-found', {
        transactionId: txId,
        checkoutRequestId
      });
      
      return res.status(404).json({
        success: false,
        status: 'not_found',
        error: 'QR code transaction not found',
        message: 'QR payment record not found. The payment may not have been initiated properly.'
      });
    }
    
    // Log transaction record for debugging
    PaymentDebugger.log('mpesaRoutes', 'qrcode/status:record-found', {
      transactionRecord
    });
    
    // For QR payments, we don't have a direct status check API in some implementations
    // Instead, we check if it's been updated in our records 
    // In a production environment, you would implement the appropriate status check
    // based on Safaricom's API for the specific QR code implementation
    
    // Check if payment is completed
    if (transactionRecord.status === 'completed' && transactionRecord.mpesaReceiptNumber) {
      return res.status(200).json({
        success: true,
        status: 'completed',
        mpesaRef: transactionRecord.mpesaReceiptNumber,
        message: transactionRecord.resultDesc || 'Payment completed successfully',
        transactionId: transactionRecord.transactionId
      });
    }
    
    // For testing purposes - auto-complete payment after a certain time in development
    // In a real implementation, you would rely on the callback from M-Pesa
    if (process.env.NODE_ENV !== 'production' && transactionRecord.createdAt) {
      const fiveMinutesAgo = new Date(Date.now() - 1000 * 30); // 30 seconds for testing
      
      if (transactionRecord.createdAt < fiveMinutesAgo) {
        // Auto-complete for testing purposes
        const mpesaRef = `MPESA${Math.floor(Math.random() * 10000000)}`;
        transactionRecord.status = 'completed';
        transactionRecord.mpesaReceiptNumber = mpesaRef;
        transactionRecord.resultDesc = 'Payment completed successfully (auto-completed for testing)';
        transactionRecord.updatedAt = new Date();
        
        // Update record in our service
        enhancedMpesaService.saveTransaction(transactionRecord.checkoutRequestId, transactionRecord);
        
        // Return completed status
        return res.status(200).json({
          success: true,
          status: 'completed',
          mpesaRef,
          message: 'Payment auto-completed for testing purposes',
          transactionId: transactionRecord.transactionId
        });
      }
    }
    
    // Otherwise return pending status
    return res.status(200).json({
      success: false,
      status: transactionRecord.status || 'pending',
      message: transactionRecord.resultDesc || `Transaction is ${transactionRecord.status || 'pending'}`,
      transactionId: transactionRecord.transactionId
    });
  } catch (error) {
    PaymentDebugger.logError('mpesaRoutes', 'qrcode/status:error', error);
    
    return res.status(500).json({
      success: false,
      status: 'error',
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    });
  }
});

// Export router
export default router;