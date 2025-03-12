/**
 * M-Pesa API Routes
 * Exposes endpoints for official Safaricom M-Pesa API integration
 */

import express, { Request, Response } from 'express';
import { mpesaAPI, stkPushRequestSchema, urlRegistrationSchema, transactionStatusSchema, reversalSchema } from './mpesaApi';
import { storage } from './storage';
import { PaymentDebugger } from './paymentDebugger';

const router = express.Router();

/**
 * Initiate STK Push for M-Pesa payment
 * POST /api/mpesa-api/stkpush
 */
router.post('/stkpush', async (req: Request, res: Response) => {
  try {
    const validationResult = stkPushRequestSchema.safeParse(req.body);
    
    if (!validationResult.success) {
      return res.status(400).json({
        success: false,
        error: `Validation error: ${validationResult.error.message}`
      });
    }
    
    // Initialize payment via M-Pesa API
    const response = await mpesaAPI.initiateSTKPush(validationResult.data);
    
    // Check if response is valid
    if (response && response.ResponseCode === '0') {
      // Store transaction details in database
      const payment = await storage.createPayment({
        transactionId: validationResult.data.transactionId,
        amount: String(validationResult.data.amount),
        phoneNumber: validationResult.data.phoneNumber,
        paymentMethod: 'mpesa',
        status: 'pending',
        merchantRequestId: response.MerchantRequestID,
        checkoutRequestId: response.CheckoutRequestID,
        splitPayment: validationResult.data.splitPayment || false,
        splitIndex: validationResult.data.splitIndex,
        splitTotal: validationResult.data.splitTotal,
        userId: validationResult.data.userId
      });
      
      // Return success response
      return res.status(200).json({
        success: true,
        checkoutRequestId: response.CheckoutRequestID,
        merchantRequestId: response.MerchantRequestID,
        message: response.CustomerMessage
      });
    } else {
      return res.status(400).json({
        success: false,
        error: `M-Pesa API error: ${response?.ResponseDescription || 'Unknown error'}`
      });
    }
  } catch (error) {
    PaymentDebugger.logError('mpesaApiRoutes.stkpush', 'error', error);
    return res.status(500).json({
      success: false,
      error: `Server error: ${error instanceof Error ? error.message : String(error)}`
    });
  }
});

/**
 * Register C2B URLs for M-Pesa callbacks
 * POST /api/mpesa-api/register-urls
 */
router.post('/register-urls', async (req: Request, res: Response) => {
  try {
    const validationResult = urlRegistrationSchema.safeParse(req.body);
    
    if (!validationResult.success) {
      return res.status(400).json({
        success: false,
        error: `Validation error: ${validationResult.error.message}`
      });
    }
    
    // Register URLs via M-Pesa API
    const response = await mpesaAPI.registerURL(validationResult.data);
    
    // Check if response is valid
    if (response && response.ResponseCode === '0') {
      return res.status(200).json({
        success: true,
        conversationId: response.ConversationID,
        originatorCoversationId: response.OriginatorCoversationID,
        responseDescription: response.ResponseDescription
      });
    } else {
      return res.status(400).json({
        success: false,
        error: `M-Pesa API error: ${response?.ResponseDescription || 'Unknown error'}`
      });
    }
  } catch (error) {
    PaymentDebugger.logError('mpesaApiRoutes.registerUrls', 'error', error);
    return res.status(500).json({
      success: false,
      error: `Server error: ${error instanceof Error ? error.message : String(error)}`
    });
  }
});

/**
 * Check transaction status
 * POST /api/mpesa-api/transaction-status
 */
router.post('/transaction-status', async (req: Request, res: Response) => {
  try {
    const validationResult = transactionStatusSchema.safeParse(req.body);
    
    if (!validationResult.success) {
      return res.status(400).json({
        success: false,
        error: `Validation error: ${validationResult.error.message}`
      });
    }
    
    // Check transaction status via M-Pesa API
    const response = await mpesaAPI.checkTransactionStatus(validationResult.data);
    
    // Check if response is valid
    if (response && response.ResponseCode === '0') {
      return res.status(200).json({
        success: true,
        conversationId: response.ConversationID,
        originatorConversationId: response.OriginatorConversationID,
        responseDescription: response.ResponseDescription,
        resultCode: response.ResultCode,
        resultDesc: response.ResultDesc,
        transactionStatus: response.TransactionStatus,
        transactionId: response.TransactionID
      });
    } else {
      return res.status(400).json({
        success: false,
        error: `M-Pesa API error: ${response?.ResponseDescription || 'Unknown error'}`
      });
    }
  } catch (error) {
    PaymentDebugger.logError('mpesaApiRoutes.transactionStatus', 'error', error);
    return res.status(500).json({
      success: false,
      error: `Server error: ${error instanceof Error ? error.message : String(error)}`
    });
  }
});

/**
 * Reverse a transaction
 * POST /api/mpesa-api/reversal
 */
router.post('/reversal', async (req: Request, res: Response) => {
  try {
    const validationResult = reversalSchema.safeParse(req.body);
    
    if (!validationResult.success) {
      return res.status(400).json({
        success: false,
        error: `Validation error: ${validationResult.error.message}`
      });
    }
    
    // Reverse transaction via M-Pesa API
    const response = await mpesaAPI.reverseTransaction(validationResult.data);
    
    // Check if response is valid
    if (response && response.ResponseCode === '0') {
      return res.status(200).json({
        success: true,
        conversationId: response.ConversationID,
        originatorConversationId: response.OriginatorConversationID,
        responseDescription: response.ResponseDescription
      });
    } else {
      return res.status(400).json({
        success: false,
        error: `M-Pesa API error: ${response?.ResponseDescription || 'Unknown error'}`
      });
    }
  } catch (error) {
    PaymentDebugger.logError('mpesaApiRoutes.reversal', 'error', error);
    return res.status(500).json({
      success: false,
      error: `Server error: ${error instanceof Error ? error.message : String(error)}`
    });
  }
});

/**
 * Handle M-Pesa callback
 * POST /api/mpesa-api/callback
 */
router.post('/callback', async (req: Request, res: Response) => {
  try {
    // Log callback data
    PaymentDebugger.log('mpesaApiRoutes.callback', 'received', req.body);
    
    // Return success response immediately to acknowledge receipt
    res.status(200).json({ ResultCode: 0, ResultDesc: "Accepted" });
    
    // Process callback asynchronously
    try {
      const callbackData = req.body;
      
      // Check if callback is for STK Push
      if (callbackData.Body && callbackData.Body.stkCallback) {
        const stkCallback = callbackData.Body.stkCallback;
        const merchantRequestId = stkCallback.MerchantRequestID;
        const checkoutRequestId = stkCallback.CheckoutRequestID;
        const resultCode = stkCallback.ResultCode;
        const resultDesc = stkCallback.ResultDesc;
        
        // Find associated payment record
        const payment = await storage.getPaymentByCheckoutRequestId(checkoutRequestId);
        
        if (!payment) {
          PaymentDebugger.log('mpesaApiRoutes.callback', 'warning', {
            message: 'Payment record not found for checkout request ID',
            checkoutRequestId
          });
          return;
        }
        
        // Update payment status based on result code
        if (resultCode === 0) {
          // Payment successful
          // Extract M-Pesa receipt number if available
          let mpesaRef = null;
          if (stkCallback.CallbackMetadata && stkCallback.CallbackMetadata.Item) {
            const receiptItem = stkCallback.CallbackMetadata.Item.find((item: any) => item.Name === "MpesaReceiptNumber");
            if (receiptItem && receiptItem.Value) {
              mpesaRef = receiptItem.Value;
            }
          }
          
          // Update payment and transaction status
          await storage.updatePaymentStatus(payment.id, 'completed', mpesaRef);
          await storage.updateTransactionStatus(payment.transactionId, 'completed', mpesaRef);
          
          // Award loyalty points if user ID is available
          if (payment.userId) {
            await storage.awardLoyaltyPoints(payment.userId, Math.floor(Number(payment.amount) / 10));
          }
          
          PaymentDebugger.log('mpesaApiRoutes.callback', 'success', {
            message: 'Payment completed successfully',
            paymentId: payment.id,
            transactionId: payment.transactionId,
            mpesaRef
          });
        } else {
          // Payment failed
          await storage.updatePaymentStatus(payment.id, 'failed');
          await storage.updateTransactionStatus(payment.transactionId, 'failed');
          
          PaymentDebugger.log('mpesaApiRoutes.callback', 'failed', {
            message: 'Payment failed',
            paymentId: payment.id,
            transactionId: payment.transactionId,
            resultCode,
            resultDesc
          });
        }
      } else {
        PaymentDebugger.log('mpesaApiRoutes.callback', 'warning', {
          message: 'Unrecognized callback format',
          data: callbackData
        });
      }
    } catch (processError) {
      PaymentDebugger.logError('mpesaApiRoutes.callback', 'process-error', processError);
    }
  } catch (error) {
    PaymentDebugger.logError('mpesaApiRoutes.callback', 'error', error);
    // Always return success to M-Pesa to avoid retries
    return res.status(200).json({ ResultCode: 0, ResultDesc: "Accepted" });
  }
});

/**
 * Query payment status by checkout request ID
 * GET /api/mpesa-api/status/:checkoutRequestId
 */
router.get('/status/:checkoutRequestId', async (req: Request, res: Response) => {
  try {
    const checkoutRequestId = req.params.checkoutRequestId;
    
    if (!checkoutRequestId) {
      return res.status(400).json({
        success: false,
        error: 'Checkout request ID is required'
      });
    }
    
    // Find payment record
    const payment = await storage.getPaymentByCheckoutRequestId(checkoutRequestId);
    
    if (!payment) {
      return res.status(404).json({
        success: false,
        error: 'Payment record not found'
      });
    }
    
    // Return payment status
    return res.status(200).json({
      success: true,
      status: payment.status,
      amount: payment.amount,
      transactionId: payment.transactionId,
      mpesaRef: payment.mpesaRef,
      paymentMethod: payment.paymentMethod,
      phoneNumber: payment.phoneNumber,
      reference: payment.reference,
      createdAt: payment.createdAt
    });
  } catch (error) {
    PaymentDebugger.logError('mpesaApiRoutes.status', 'error', error);
    return res.status(500).json({
      success: false,
      error: `Server error: ${error instanceof Error ? error.message : String(error)}`
    });
  }
});

export default router;