import { apiRequest } from "./queryClient";

export interface MpesaPaymentRequest {
  phoneNumber: string;
  amount: number;
  transactionId: number;
}

export async function initiateMpesaPayment(data: MpesaPaymentRequest) {
  const response = await apiRequest("POST", "/api/payments/mpesa", data);
  return response.json();
}

export async function checkPaymentStatus(transactionId: number) {
  const response = await apiRequest("GET", `/api/payments/status/${transactionId}`);
  return response.json();
}
