
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
    
    // Different API endpoints based on payment method
    if (method === "cash") {
      const response = await apiRequest("POST", "/api/payments/cash", {
        transactionId,
        amount: finalAmount,
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
        amount: finalAmount,
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
        amount: finalAmount,
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
import { generateReference, calculateLoyaltyPoints } from './utils';
import { Transaction } from './analytics';

export type PaymentType = 'cash' | 'mpesa' | 'airtel';

export interface PaymentFormData {
  customerId?: number;
  customerName: string;
  stationId: number;
  amount: number;
  paymentMethod: PaymentType;
  phoneNumber?: string;
  discount?: number;
  redeemPoints?: boolean;
  pointsToRedeem?: number;
  sessionType: 'per_game' | 'hourly';
  duration?: number;
  gameName: string;
}

export interface PaymentResult {
  success: boolean;
  message: string;
  reference?: string;
  transaction?: Transaction;
  pointsAwarded?: number;
}

// Mock function to process Cash payment
export async function processCashPayment(data: PaymentFormData): Promise<PaymentResult> {
  // Simulate processing time
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  const reference = generateReference('CASH');
  const pointsAwarded = calculateLoyaltyPoints(data.amount);
  
  return {
    success: true,
    message: 'Cash payment received successfully',
    reference,
    pointsAwarded,
    transaction: {
      id: Math.floor(Math.random() * 10000),
      customerName: data.customerName,
      stationId: data.stationId,
      amount: data.amount,
      paymentMethod: 'cash',
      paymentStatus: 'completed',
      timestamp: new Date(),
      sessionType: data.sessionType,
      pointsAwarded,
      discountApplied: data.discount
    }
  };
}

// Mock function to process M-Pesa payment
export async function processMpesaPayment(data: PaymentFormData): Promise<PaymentResult> {
  // Validate phone number
  if (!data.phoneNumber || !data.phoneNumber.match(/^254\d{9}$/)) {
    return {
      success: false,
      message: 'Invalid phone number. Please use format: 254XXXXXXXXX'
    };
  }
  
  // Simulate API call and processing time
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  const reference = generateReference('MPESA');
  const pointsAwarded = calculateLoyaltyPoints(data.amount);
  
  return {
    success: true,
    message: 'M-Pesa payment initiated. Customer should confirm on phone.',
    reference,
    pointsAwarded,
    transaction: {
      id: Math.floor(Math.random() * 10000),
      customerName: data.customerName,
      stationId: data.stationId,
      amount: data.amount,
      paymentMethod: 'mpesa',
      paymentStatus: 'completed', // In real implementation, this would initially be 'pending'
      timestamp: new Date(),
      sessionType: data.sessionType,
      pointsAwarded,
      discountApplied: data.discount
    }
  };
}

// Mock function to process Airtel Money payment
export async function processAirtelPayment(data: PaymentFormData): Promise<PaymentResult> {
  // Validate phone number
  if (!data.phoneNumber || !data.phoneNumber.match(/^254\d{9}$/)) {
    return {
      success: false,
      message: 'Invalid phone number. Please use format: 254XXXXXXXXX'
    };
  }
  
  // Simulate API call and processing time
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  const reference = generateReference('AIRTEL');
  const pointsAwarded = calculateLoyaltyPoints(data.amount);
  
  return {
    success: true,
    message: 'Airtel Money payment initiated. Customer should confirm on phone.',
    reference,
    pointsAwarded,
    transaction: {
      id: Math.floor(Math.random() * 10000),
      customerName: data.customerName,
      stationId: data.stationId,
      amount: data.amount,
      paymentMethod: 'airtel',
      paymentStatus: 'completed', // In real implementation, this would initially be 'pending'
      timestamp: new Date(),
      sessionType: data.sessionType,
      pointsAwarded,
      discountApplied: data.discount
    }
  };
}

// Main payment processing function
export async function processPayment(data: PaymentFormData): Promise<PaymentResult> {
  try {
    // Calculate final amount after discount
    if (data.discount && data.discount > 0) {
      data.amount = data.amount * (1 - (data.discount / 100));
    }
    
    // Apply points redemption
    if (data.redeemPoints && data.pointsToRedeem && data.pointsToRedeem > 0) {
      // Assuming 1 point = 1 KSH
      const discountFromPoints = Math.min(data.pointsToRedeem, data.amount);
      data.amount = Math.max(0, data.amount - discountFromPoints);
    }
    
    // Choose payment processor based on method
    switch(data.paymentMethod) {
      case 'cash':
        return processCashPayment(data);
      case 'mpesa':
        return processMpesaPayment(data);
      case 'airtel':
        return processAirtelPayment(data);
      default:
        return {
          success: false,
          message: 'Invalid payment method selected'
        };
    }
  } catch (error) {
    console.error('Payment processing error:', error);
    return {
      success: false,
      message: 'An error occurred while processing your payment'
    };
  }
}

// Mock function to retrieve pending payments from ended game sessions
export function getPendingGameSessionPayments(): PaymentFormData[] {
  // This would come from the backend in a real implementation
  return [
    {
      customerName: "Alex Smith",
      stationId: 1,
      amount: 400,
      paymentMethod: 'cash',
      sessionType: 'hourly',
      duration: 120, // 2 hours
      gameName: "FIFA 25"
    },
    {
      customerName: "Jane Doe",
      stationId: 2,
      amount: 40,
      paymentMethod: 'cash',
      sessionType: 'per_game',
      gameName: "Call of Duty"
    },
    {
      customerName: "Michael Johnson",
      stationId: 3,
      amount: 200,
      paymentMethod: 'cash',
      sessionType: 'hourly',
      duration: 60, // 1 hour
      gameName: "GTA V"
    }
  ];
}
