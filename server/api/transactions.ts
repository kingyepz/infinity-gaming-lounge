
import { Request, Response } from "express";
import { db } from "../db";
import { transactions, users } from '@shared/schema';
import { eq, and, gte, desc } from 'drizzle-orm';

// Get all transactions
export async function getAllTransactions(_req: Request, res: Response) {
  try {
    const allTransactions = await db.select().from(transactions).orderBy(desc(transactions.createdAt));
    res.json(allTransactions);
  } catch (error) {
    console.error("Error fetching transactions:", error);
    res.status(500).json({ error: "Failed to fetch transactions" });
  }
}

// Get transactions by payment status
export async function getTransactionsByStatus(req: Request, res: Response) {
  try {
    const { status } = req.params;
    const filteredTransactions = await db.select().from(transactions)
      .where(eq(transactions.paymentStatus, status as any))
      .orderBy(desc(transactions.createdAt));
    res.json(filteredTransactions);
  } catch (error) {
    console.error("Error fetching transactions by status:", error);
    res.status(500).json({ error: "Failed to fetch transactions" });
  }
}

// Process new transaction
export async function createTransaction(req: Request, res: Response) {
  try {
    const transactionData = req.body;
    
    // Insert the transaction
    const [newTransaction] = await db.insert(transactions).values({
      stationId: transactionData.stationId,
      customerName: transactionData.customerName,
      gameName: transactionData.gameName,
      sessionType: transactionData.sessionType,
      amount: transactionData.amount,
      paymentStatus: transactionData.paymentStatus || 'pending',
      mpesaRef: transactionData.mpesaRef,
      duration: transactionData.duration
    }).returning();
    
    // If customer is a registered user, award loyalty points
    if (transactionData.customerId && transactionData.pointsAwarded) {
      await db.update(users)
        .set({ 
          points: users.points + transactionData.pointsAwarded 
        })
        .where(eq(users.id, transactionData.customerId));
    }
    
    res.status(201).json(newTransaction);
  } catch (error) {
    console.error("Error creating transaction:", error);
    res.status(500).json({ error: "Failed to create transaction" });
  }
}

// Get analytics data
export async function getAnalytics(req: Request, res: Response) {
  try {
    const { period } = req.query;
    
    // Default to 'daily' if not specified
    const analyticsPeriod = period || 'daily';
    
    let startDate = new Date();
    
    // Set the start date based on the period
    switch(analyticsPeriod) {
      case 'weekly':
        startDate.setDate(startDate.getDate() - 7);
        break;
      case 'monthly':
        startDate.setMonth(startDate.getMonth() - 1);
        break;
      case 'yearly':
        startDate.setFullYear(startDate.getFullYear() - 1);
        break;
      default: // daily
        startDate.setHours(0, 0, 0, 0);
    }
    
    // Get completed transactions within the period
    const periodTransactions = await db.select().from(transactions)
      .where(
        and(
          eq(transactions.paymentStatus, 'completed'),
          gte(transactions.createdAt, startDate)
        )
      );
    
    // Calculate total revenue
    const totalRevenue = periodTransactions.reduce((sum, tx) => sum + tx.amount, 0);
    
    // Count by payment method (using mpesaRef as an indicator)
    const mpesaCount = periodTransactions.filter(tx => tx.mpesaRef?.startsWith('MP')).length;
    const airtelCount = periodTransactions.filter(tx => tx.mpesaRef?.startsWith('AT')).length;
    const cashCount = periodTransactions.length - mpesaCount - airtelCount;
    
    // Count by session type
    const perGameCount = periodTransactions.filter(tx => tx.sessionType === 'per_game').length;
    const hourlyCount = periodTransactions.filter(tx => tx.sessionType === 'hourly').length;
    
    // Send back the analytics data
    res.json({
      period: analyticsPeriod,
      totalRevenue,
      transactionCount: periodTransactions.length,
      paymentMethods: {
        cash: cashCount,
        mpesa: mpesaCount,
        airtel: airtelCount
      },
      sessionTypes: {
        perGame: perGameCount,
        hourly: hourlyCount
      }
    });
  } catch (error) {
    console.error("Error fetching analytics:", error);
    res.status(500).json({ error: "Failed to fetch analytics data" });
  }
}

// Get pending payments
export async function getPendingPayments(_req: Request, res: Response) {
  try {
    const pendingPayments = await db.select().from(transactions)
      .where(eq(transactions.paymentStatus, 'pending'))
      .orderBy(desc(transactions.createdAt));
    
    res.json(pendingPayments);
  } catch (error) {
    console.error("Error fetching pending payments:", error);
    res.status(500).json({ error: "Failed to fetch pending payments" });
  }
}

// Update transaction status
export async function updateTransactionStatus(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const { status, reference } = req.body;
    
    const [updatedTransaction] = await db.update(transactions)
      .set({ 
        paymentStatus: status,
        mpesaRef: reference || transactions.mpesaRef
      })
      .where(eq(transactions.id, parseInt(id)))
      .returning();
    
    res.json(updatedTransaction);
  } catch (error) {
    console.error("Error updating transaction status:", error);
    res.status(500).json({ error: "Failed to update transaction status" });
  }
}
