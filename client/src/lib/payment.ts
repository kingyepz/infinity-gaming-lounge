import { apiRequest } from './queryClient';

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

export type PaymentFormData = {
  customerName: string;
  stationId?: number;
  phoneNumber?: string;
  amount: number;
  paymentMethod: 'mpesa' | 'cash' | 'card';
  sessionType: 'hourly' | 'per_game' | 'tournament' | 'membership';
  duration?: number;
  gameName?: string;
  discountApplied?: number;
};

export type PaymentResult = {
  transactionId: string;
  customerName: string;
  phoneNumber?: string;
  stationId?: number;
  amount: number;
  paymentMethod: string;
  paymentStatus: 'completed' | 'pending' | 'failed';
  mpesaReceiptNumber?: string;
  timestamp: string;
  sessionType: string;
  duration?: number;
  gameName?: string;
  pointsAwarded: number;
  discountApplied?: number;
};

export async function processCashPayment(data: PaymentFormData): Promise<PaymentResult> {
  // Simulate processing time
  await new Promise(resolve => setTimeout(resolve, 1000));

  const reference = generateReference('CASH');
  const pointsAwarded = calculateLoyaltyPoints(data.amount);

  return {
    transactionId: generateReference('CASH'),
    customerName: data.customerName,
    amount: data.amount,
    paymentMethod: 'cash',
    paymentStatus: 'completed',
    timestamp: new Date().toISOString(),
    sessionType: data.sessionType,
    pointsAwarded,
    discountApplied: data.discountApplied
  };
}

export async function processMpesaPayment(data: PaymentFormData): Promise<PaymentResult> {
  // Validate phone number
  if (!data.phoneNumber || !data.phoneNumber.match(/^254\d{9}$/)) {
    return {
      transactionId: '',
      customerName: data.customerName,
      amount: data.amount,
      paymentMethod: 'mpesa',
      paymentStatus: 'failed',
      timestamp: new Date().toISOString(),
      sessionType: data.sessionType,
      pointsAwarded: 0,
      message: 'Invalid phone number. Please use format: 254XXXXXXXXX'
    };
  }

  // Simulate API call and processing time
  await new Promise(resolve => setTimeout(resolve, 2000));

  const reference = generateReference('MPESA');
  const pointsAwarded = calculateLoyaltyPoints(data.amount);

  return {
    transactionId: reference,
    customerName: data.customerName,
    phoneNumber: data.phoneNumber,
    amount: data.amount,
    paymentMethod: 'mpesa',
    paymentStatus: 'completed',
    timestamp: new Date().toISOString(),
    sessionType: data.sessionType,
    pointsAwarded,
    discountApplied: data.discountApplied
  };
}

export async function processAirtelPayment(data: PaymentFormData): Promise<PaymentResult> {
  // Validate phone number
  if (!data.phoneNumber || !data.phoneNumber.match(/^254\d{9}$/)) {
    return {
      transactionId: '',
      customerName: data.customerName,
      amount: data.amount,
      paymentMethod: 'airtel',
      paymentStatus: 'failed',
      timestamp: new Date().toISOString(),
      sessionType: data.sessionType,
      pointsAwarded: 0,
      message: 'Invalid phone number. Please use format: 254XXXXXXXXX'
    };
  }

  // Simulate API call and processing time
  await new Promise(resolve => setTimeout(resolve, 2000));

  const reference = generateReference('AIRTEL');
  const pointsAwarded = calculateLoyaltyPoints(data.amount);

  return {
    transactionId: reference,
    customerName: data.customerName,
    phoneNumber: data.phoneNumber,
    amount: data.amount,
    paymentMethod: 'airtel',
    paymentStatus: 'completed',
    timestamp: new Date().toISOString(),
    sessionType: data.sessionType,
    pointsAwarded,
    discountApplied: data.discountApplied
  };
}

export async function processPayment({
  customerName,
  stationId,
  phoneNumber,
  amount,
  paymentMethod,
  sessionType,
  duration,
  gameName,
  discountApplied
}: PaymentFormData): Promise<PaymentResult> {
  console.log("Processing payment:", {
    customerName,
    stationId,
    phoneNumber,
    amount,
    paymentMethod,
    sessionType,
    duration,
    gameName,
    discountApplied
  });

  try {
    // For M-Pesa payments, we'll initiate the STK push
    if (paymentMethod === 'mpesa' && phoneNumber) {
      try {
        const response = await apiRequest('POST', '/api/payments/mpesa', {
          phoneNumber,
          amount,
          customerName
        });

        const mpesaResponse = await response.json();
        console.log("M-Pesa response:", mpesaResponse);

        // In a real application, we would need to implement a callback or polling
        // to check the status of the M-Pesa payment. For now, we'll simulate success.

        // Check if M-Pesa initiation was successful
        if (mpesaResponse.error) {
          throw new Error(mpesaResponse.error);
        }
      } catch (err) {
        console.error("M-Pesa error:", err);
        throw new Error("M-Pesa payment failed. Please try again.");
      }
    }

    // Then we record the payment
    const response = await apiRequest('POST', '/api/payments', {
      customerName,
      stationId,
      phoneNumber,
      amount,
      paymentMethod,
      sessionType,
      duration,
      gameName,
      discountApplied
    });

    const paymentResult = await response.json();
    console.log("Payment result:", paymentResult);

    return paymentResult;
  } catch (error) {
    console.error("Payment processing error:", error);
    if (error instanceof Error) {
      throw error;
    } else {
      throw new Error("Failed to process payment. Please try again.");
    }
  }
}

// For demo/development purposes - mock data for transactions
export type Transaction = {
  id: number;
  userId: number;
  transactionId: string;
  customerName: string;
  phoneNumber?: string;
  stationId?: number;
  amount: number;
  paymentMethod: 'mpesa' | 'cash' | 'card';
  paymentStatus: 'completed' | 'pending' | 'failed';
  timestamp: Date;
  sessionType: 'hourly' | 'per_game' | 'tournament' | 'membership';
  duration?: number;
  gameName?: string;
  pointsAwarded: number;
  discountApplied?: number;
};

// Mock function to generate random transactions for demo purposes
export function generateMockTransactions(days = 30, count = 100): Transaction[] {
  const transactions: Transaction[] = [];
  const now = new Date();
  const sessionTypes = ['hourly', 'per_game', 'tournament', 'membership'] as const;
  const paymentMethods = ['mpesa', 'cash', 'card'] as const;
  const paymentStatuses = ['completed', 'pending', 'failed'] as const;
  const games = [
    'FIFA 25',
    'Call of Duty: Modern Warfare',
    'Fortnite',
    'GTA V',
    'NBA 2K25',
    'Mortal Kombat 12',
    'Madden NFL 25',
    'Minecraft',
    'Apex Legends',
    'Rocket League'
  ];

  for (let i = 0; i < count; i++) {
    // Generate random date within the past 'days'
    const date = new Date(now);
    date.setDate(date.getDate() - Math.floor(Math.random() * days));
    date.setHours(
      Math.floor(Math.random() * 12) + 10, // Random hour between 10am-10pm
      Math.floor(Math.random() * 60),       // Random minute
      0, 0                                   // Zero seconds and milliseconds
    );

    // Random amount between 20 and 2000
    let amount = Math.floor(Math.random() * 1980) + 20;

    // Session type
    const sessionType = sessionTypes[Math.floor(Math.random() * sessionTypes.length)];

    // Apply discounts to random transactions
    const discountApplied = Math.random() > 0.8 ? Math.floor(Math.random() * 30) + 5 : 0;

    // Award points (typically 1 point per 100 KES spent)
    const pointsAwarded = Math.floor((amount * (1 - (discountApplied || 0) / 100)) / 100);

    transactions.push({
      id: i + 1,
      userId: Math.floor(Math.random() * 10) + 1, // Random user ID between 1-10
      transactionId: `TRX${String(i + 1000).padStart(5, '0')}`,
      customerName: `Customer ${i + 1}`,
      phoneNumber: Math.random() > 0.3 ? `2547${Math.floor(Math.random() * 100000000).toString().padStart(8, '0')}` : undefined,
      stationId: Math.floor(Math.random() * 10) + 1, // Random station ID between 1-10
      amount: discountApplied ? amount * (1 - discountApplied/100) : amount,
      paymentMethod: paymentMethods[Math.floor(Math.random() * paymentMethods.length)],
      paymentStatus: paymentStatuses[Math.floor(Math.random() * paymentStatuses.length)],
      timestamp: date,
      sessionType,
      pointsAwarded,
      discountApplied
    });
  }

  // Sort by date, newest first
  return transactions.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
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