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

  useEffect(() => {
    const fetchTransactions = async () => {
      try {
        setLoading(true);
        const data = await apiRequest<Transaction[]>(
          'GET', 
          `/api/transactions/station/${stationId}`
        );
        setTransactions(data);
        setError(null);
      } catch (err) {
        console.error('Error fetching station transactions:', err);
        setError('Failed to load transaction history');
      } finally {
        setLoading(false);
      }
    };

    fetchTransactions();
  }, [stationId]);

  // Calculate total revenue for this station
  const totalRevenue = transactions.reduce((sum, tx) => {
    return sum + (tx.paymentStatus === 'completed' ? Number(tx.amount) : 0);
  }, 0);

  // Get the count of transactions by payment method
  const paymentMethodCounts = transactions.reduce((counts, tx) => {
    // Check if tx has mpesaRef that is not null
    if (tx.mpesaRef) {
      counts.mpesa = (counts.mpesa || 0) + 1;
    // For Airtel payments, we need to check a naming convention pattern since airtelRef isn't in the schema
    } else if (tx.paymentStatus === 'completed' && String(tx.mpesaRef || '').startsWith('AR-')) {
      counts.airtel = (counts.airtel || 0) + 1;
    } else {
      counts.cash = (counts.cash || 0) + 1;
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
                    <TableCell>{tx.createdAt ? new Date(tx.createdAt).toLocaleDateString() : 'Unknown'}</TableCell>
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
                      {tx.mpesaRef 
                        ? (String(tx.mpesaRef || '').startsWith('AR-') ? "Airtel" : "M-Pesa") 
                        : "Cash"}
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