
import { formatCurrency } from './utils';

// Mock data types for analytics
export type PaymentMethod = 'cash' | 'mpesa' | 'airtel';
export type PaymentStatus = 'completed' | 'pending' | 'failed';

export interface Transaction {
  id: number;
  customerId?: number;
  customerName: string;
  stationId: number;
  amount: number;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  timestamp: Date;
  sessionType: 'per_game' | 'hourly';
  pointsAwarded?: number;
  discountApplied?: number;
}

// Generate mock transaction data
export function generateMockTransactions(count: number = 20): Transaction[] {
  const paymentMethods: PaymentMethod[] = ['cash', 'mpesa', 'airtel'];
  const paymentStatuses: PaymentStatus[] = ['completed', 'pending', 'failed'];
  const sessionTypes = ['per_game', 'hourly'];
  const names = [
    'John Doe', 'Jane Smith', 'Michael Johnson', 'Sarah Williams', 
    'David Brown', 'Emily Davis', 'Robert Wilson', 'Jessica Taylor'
  ];
  
  // Create 10 days of transaction history
  const transactions: Transaction[] = [];
  
  for (let i = 0; i < count; i++) {
    // Random date within the last 10 days
    const date = new Date();
    date.setDate(date.getDate() - Math.floor(Math.random() * 10));
    date.setHours(Math.floor(Math.random() * 24), Math.floor(Math.random() * 60));
    
    const sessionType = sessionTypes[Math.floor(Math.random() * sessionTypes.length)] as 'per_game' | 'hourly';
    const amount = sessionType === 'per_game' ? 40 : (Math.floor(Math.random() * 3) + 1) * 200;
    
    // Points are typically 5-10% of the amount spent
    const pointsAwarded = Math.floor(amount * (0.05 + Math.random() * 0.05));
    
    // 30% chance of having a discount
    const discountApplied = Math.random() < 0.3 ? Math.floor(Math.random() * 20) + 5 : 0;
    
    transactions.push({
      id: i + 1,
      customerId: Math.floor(Math.random() * 100) + 1,
      customerName: names[Math.floor(Math.random() * names.length)],
      stationId: Math.floor(Math.random() * 5) + 1,
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

// Functions for analytics calculations
export function calculateDailyRevenue(transactions: Transaction[]): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  return transactions
    .filter(tx => tx.paymentStatus === 'completed' && tx.timestamp >= today)
    .reduce((sum, tx) => sum + tx.amount, 0);
}

export function calculateWeeklyRevenue(transactions: Transaction[]): number {
  const weekStart = new Date();
  weekStart.setDate(weekStart.getDate() - weekStart.getDay()); // Start of week (Sunday)
  weekStart.setHours(0, 0, 0, 0);
  
  return transactions
    .filter(tx => tx.paymentStatus === 'completed' && tx.timestamp >= weekStart)
    .reduce((sum, tx) => sum + tx.amount, 0);
}

export function calculateMonthlyRevenue(transactions: Transaction[]): number {
  const monthStart = new Date();
  monthStart.setDate(1); // Start of month
  monthStart.setHours(0, 0, 0, 0);
  
  return transactions
    .filter(tx => tx.paymentStatus === 'completed' && tx.timestamp >= monthStart)
    .reduce((sum, tx) => sum + tx.amount, 0);
}

export function getPaymentMethodBreakdown(transactions: Transaction[]) {
  const completed = transactions.filter(tx => tx.paymentStatus === 'completed');
  
  // Count by method
  const countByMethod = completed.reduce((acc, tx) => {
    acc[tx.paymentMethod] = (acc[tx.paymentMethod] || 0) + 1;
    return acc;
  }, {} as Record<PaymentMethod, number>);
  
  // Amount by method
  const amountByMethod = completed.reduce((acc, tx) => {
    acc[tx.paymentMethod] = (acc[tx.paymentMethod] || 0) + tx.amount;
    return acc;
  }, {} as Record<PaymentMethod, number>);
  
  return {
    countByMethod,
    amountByMethod,
    total: completed.length,
    totalAmount: completed.reduce((sum, tx) => sum + tx.amount, 0)
  };
}

export function getPendingTransactions(transactions: Transaction[]): Transaction[] {
  return transactions.filter(tx => tx.paymentStatus === 'pending');
}

export function formatAnalyticsSummary(transactions: Transaction[]) {
  const dailyRevenue = calculateDailyRevenue(transactions);
  const weeklyRevenue = calculateWeeklyRevenue(transactions);
  const monthlyRevenue = calculateMonthlyRevenue(transactions);
  const methodBreakdown = getPaymentMethodBreakdown(transactions);
  
  return {
    dailyRevenue: formatCurrency(dailyRevenue),
    weeklyRevenue: formatCurrency(weeklyRevenue),
    monthlyRevenue: formatCurrency(monthlyRevenue),
    completedTransactions: transactions.filter(tx => tx.paymentStatus === 'completed').length,
    pendingTransactions: transactions.filter(tx => tx.paymentStatus === 'pending').length,
    methodBreakdown
  };
}
