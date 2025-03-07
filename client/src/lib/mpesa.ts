
import { apiRequest } from "./queryClient";

export interface MpesaCredentials {
  consumerKey: string;
  consumerSecret: string;
  passKey: string;
  shortCode: string;
  callbackUrl: string;
}

export interface MpesaPaymentRequest {
  phoneNumber: string;
  amount: number;
  transactionId: number;
  customerName?: string;
}

export interface MpesaResponse {
  success: boolean;
  message: string;
  reference?: string;
  transactionId?: string;
}

// Get access token from Daraja API
export async function getMpesaAccessToken(): Promise<string> {
  try {
    const response = await apiRequest("GET", "/api/payments/mpesa/token");
    return response.accessToken;
  } catch (error) {
    console.error("Error getting M-Pesa access token:", error);
    throw new Error("Failed to get M-Pesa access token");
  }
}

// Initiate STK Push to customer phone
export async function initiateMpesaPayment(data: MpesaPaymentRequest): Promise<MpesaResponse> {
  try {
    const response = await apiRequest("POST", "/api/payments/mpesa", data);
    return {
      success: true,
      message: "Payment request sent to your phone. Please check and enter PIN.",
      reference: response.CheckoutRequestID,
      transactionId: response.transactionId
    };
  } catch (error) {
    console.error("M-Pesa payment initiation error:", error);
    return {
      success: false,
      message: "Failed to initiate payment. Please try again."
    };
  }
}

// Check payment status
export async function checkPaymentStatus(transactionId: number): Promise<{status: string, reference?: string}> {
  try {
    const response = await apiRequest("GET", `/api/payments/status/${transactionId}`);
    return {
      status: response.paymentStatus,
      reference: response.mpesaRef
    };
  } catch (error) {
    console.error("Error checking payment status:", error);
    return { status: "unknown" };
  }
}
