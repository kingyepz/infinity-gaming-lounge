import React, { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { apiRequest } from "@/lib/queryClient";
import { formatCurrency } from "@/lib/payment";
import type { Transaction } from "@shared/schema";

interface StationTransactionHistoryProps {
  stationId: number;
  stationName: string;
}

export default function StationTransactionHistory({ stationId, stationName }: StationTransactionHistoryProps) {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Function to fetch both transactions and their payment methods
  const fetchTransactionData = async () => {
    try {
      setLoading(true);
      // Get transaction data
      const data = await apiRequest<Transaction[]>(
        'GET', 
        `/api/transactions/station/${stationId}`
      );
      
      // For each transaction, determine the payment method more accurately
      const enhancedTransactions = await Promise.all(
        data.map(async (tx) => {
          if (tx.paymentStatus === 'completed') {
            try {
              // Try to get payment record for this transaction
              const paymentData = await apiRequest(
                'GET',
                `/api/payments/transaction/${tx.id}`
              );
              
              // If payment data exists, use it to determine the payment method
              if (paymentData && paymentData.paymentMethod) {
                return {
                  ...tx,
                  // Adding paymentMethodInfo as a transient property
                  paymentMethodInfo: paymentData.paymentMethod
                };
              }
            } catch (e) {
              // Ignore errors fetching payment data, will use fallback logic
              console.log('Could not fetch payment details for transaction', tx.id);
            }
          }
          
          // Fallback logic using mpesaRef field
          return {
            ...tx,
            paymentMethodInfo: tx.mpesaRef 
              ? (String(tx.mpesaRef || '').startsWith('SIM-AIRTEL-') ? 'airtel' : 'mpesa')
              : 'cash'
          };
        })
      );
      
      setTransactions(enhancedTransactions);
      setError(null);
    } catch (err) {
      console.error('Error fetching station transactions:', err);
      setError('Failed to load transaction history');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactionData();
    
    // Set up an interval to refresh the data every 15 seconds
    const intervalId = setInterval(() => {
      fetchTransactionData();
    }, 15000);
    
    // Clean up the interval when the component unmounts
    return () => clearInterval(intervalId);
  }, [stationId]);

  // Calculate total revenue for this station
  const totalRevenue = transactions.reduce((sum, tx) => {
    return sum + (tx.paymentStatus === 'completed' ? Number(tx.amount) : 0);
  }, 0);

  // Get the count of transactions by payment method
  const paymentMethodCounts = transactions.reduce((counts, tx) => {
    // Only count completed transactions
    if (tx.paymentStatus === 'completed') {
      // First check for our custom paymentMethodInfo field
      // @ts-ignore - This is a dynamically added property
      if (tx.paymentMethodInfo) {
        // @ts-ignore
        const method = tx.paymentMethodInfo;
        if (method === 'mpesa') {
          counts.mpesa = (counts.mpesa || 0) + 1;
        } else if (method === 'airtel') {
          counts.airtel = (counts.airtel || 0) + 1;
        } else {
          counts.cash = (counts.cash || 0) + 1;
        }
      } else {
        // Fall back to mpesaRef field logic
        if (tx.mpesaRef) {
          if (String(tx.mpesaRef).startsWith('SIM-AIRTEL-') || String(tx.mpesaRef).startsWith('AR-')) {
            counts.airtel = (counts.airtel || 0) + 1;
          } else {
            counts.mpesa = (counts.mpesa || 0) + 1;
          }
        } else {
          counts.cash = (counts.cash || 0) + 1;
        }
      }
    }
    return counts;
  }, { cash: 0, mpesa: 0, airtel: 0 });

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold">Transaction History: {stationName}</h2>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-black/30 border-primary/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-8 w-24" />
            ) : (
              <div className="text-2xl font-bold">{formatCurrency(totalRevenue)}</div>
            )}
          </CardContent>
        </Card>
        
        <Card className="bg-black/30 border-primary/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Transactions</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <div className="text-2xl font-bold">{transactions.length}</div>
            )}
          </CardContent>
        </Card>
        
        <Card className="bg-black/30 border-primary/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Payment Methods</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-6 w-full" />
            ) : (
              <div className="flex flex-wrap gap-2 text-sm">
                <div className="flex items-center">
                  <div className="w-3 h-3 rounded-full bg-green-500 mr-1"></div>
                  <span>Cash: {paymentMethodCounts.cash}</span>
                </div>
                <div className="flex items-center">
                  <div className="w-3 h-3 rounded-full bg-blue-500 mr-1"></div>
                  <span>M-Pesa: {paymentMethodCounts.mpesa}</span>
                </div>
                <div className="flex items-center">
                  <div className="w-3 h-3 rounded-full bg-red-500 mr-1"></div>
                  <span>Airtel: {paymentMethodCounts.airtel}</span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Transactions Table */}
      <Card className="bg-black/30 border-primary/20">
        <CardHeader>
          <CardTitle className="text-base">Transaction List</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-4 space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex space-x-2">
                  <Skeleton className="h-6 w-12" />
                  <Skeleton className="h-6 w-24" />
                  <Skeleton className="h-6 w-16" />
                  <Skeleton className="h-6 w-24" />
                  <Skeleton className="h-6 w-16" />
                </div>
              ))}
            </div>
          ) : error ? (
            <div className="p-4 text-center text-red-500">{error}</div>
          ) : transactions.length === 0 ? (
            <div className="p-4 text-center">No transactions found for this station</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[80px]">ID</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Game</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Method</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {transactions.map((tx) => (
                  <TableRow key={tx.id}>
                    <TableCell className="font-medium">#{tx.id}</TableCell>
                    <TableCell>{tx.customerName}</TableCell>
                    <TableCell>{tx.gameName}</TableCell>
                    <TableCell>{formatCurrency(tx.amount)}</TableCell>
                    <TableCell>
                      {tx.createdAt ? (
                        <div className="flex flex-col">
                          <span>{new Date(tx.createdAt).toLocaleDateString()}</span>
                          <span className="text-xs text-gray-400">{new Date(tx.createdAt).toLocaleTimeString()}</span>
                        </div>
                      ) : 'Unknown'}
                    </TableCell>
                    <TableCell>
                      <Badge 
                        variant={
                          tx.paymentStatus === "completed" ? "default" : 
                          tx.paymentStatus === "pending" ? "secondary" : 
                          "destructive"
                        }
                      >
                        {tx.paymentStatus}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {tx.paymentStatus === 'completed' ? (
                        // @ts-ignore - paymentMethodInfo is a dynamic property we added
                        tx.paymentMethodInfo ? (
                          <div className="flex flex-col">
                            <span className={
                              // @ts-ignore
                              tx.paymentMethodInfo === 'mpesa' ? "text-blue-500 font-medium" : 
                              // @ts-ignore
                              tx.paymentMethodInfo === 'airtel' ? "text-red-500 font-medium" : 
                              "text-green-500 font-medium"
                            }>
                              {/* @ts-ignore */}
                              {tx.paymentMethodInfo === 'mpesa' ? "M-Pesa" : 
                               // @ts-ignore
                               tx.paymentMethodInfo === 'airtel' ? "Airtel" : 
                               "Cash"}
                            </span>
                            
                            {/* Show reference for mobile money payments */}
                            {/* @ts-ignore */}
                            {(tx.paymentMethodInfo === 'mpesa' || tx.paymentMethodInfo === 'airtel') && tx.mpesaRef && (
                              <div className="flex flex-col">
                                <span className="text-xs text-gray-400 truncate max-w-[120px]" title={tx.mpesaRef}>
                                  Ref: {tx.mpesaRef.substring(0, 14)}{tx.mpesaRef.length > 14 ? '...' : ''}
                                </span>
                                <span className="text-xs text-gray-500">
                                  {tx.createdAt && new Date(tx.createdAt).toLocaleTimeString()}
                                </span>
                              </div>
                            )}
                          </div>
                        ) : (
                          // Fallback to original logic
                          <div className="flex flex-col">
                            {tx.mpesaRef 
                              ? (String(tx.mpesaRef || '').startsWith('AR-') || String(tx.mpesaRef || '').startsWith('SIM-AIRTEL-') ? 
                                 <div>
                                   <span className="text-red-500 font-medium">Airtel</span>
                                   <div className="flex flex-col">
                                     <span className="text-xs text-gray-400 truncate max-w-[120px]" title={tx.mpesaRef}>
                                       Ref: {tx.mpesaRef.substring(0, 14)}{tx.mpesaRef.length > 14 ? '...' : ''}
                                     </span>
                                     <span className="text-xs text-gray-500">
                                       {tx.createdAt && new Date(tx.createdAt).toLocaleTimeString()}
                                     </span>
                                   </div>
                                 </div> : 
                                 <div>
                                   <span className="text-blue-500 font-medium">M-Pesa</span>
                                   <div className="flex flex-col">
                                     <span className="text-xs text-gray-400 truncate max-w-[120px]" title={tx.mpesaRef}>
                                       Ref: {tx.mpesaRef.substring(0, 14)}{tx.mpesaRef.length > 14 ? '...' : ''}
                                     </span>
                                     <span className="text-xs text-gray-500">
                                       {tx.createdAt && new Date(tx.createdAt).toLocaleTimeString()}
                                     </span>
                                   </div>
                                 </div>) 
                              : <span className="text-green-500 font-medium">Cash</span>}
                          </div>
                        )
                      ) : (
                        <span className="text-gray-500">Pending</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}