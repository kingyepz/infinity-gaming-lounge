
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
