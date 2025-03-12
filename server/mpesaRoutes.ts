/**
 * M-Pesa Enhanced API Routes
 * Based on the dalienst/mpesa-stk-drf repository structure
 */

import express, { Request, Response } from 'express';
import { z } from 'zod';
import { enhancedMpesaService, stkPushRequestSchema } from './mpesaEnhanced';
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

export default router;