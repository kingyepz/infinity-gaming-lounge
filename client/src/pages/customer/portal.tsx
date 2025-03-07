import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { apiRequest } from "@/lib/queryClient";
import {
  Timer,
  Star,
  Gamepad2,
  Clock,
  Calendar,
  Trophy,
  BarChart3,
  Gift,
  Users,
  CalendarClock,
  Bell,
  Copy
} from "lucide-react";

export default function CustomerPortal() {
  const { toast } = useToast();

  // Fetch all customers
  const { data: customers, isLoading: customersLoading } = useQuery({
    queryKey: ["/api/users/customers"],
  });

  // Fetch all transactions
  const { data: transactions, isLoading: transactionsLoading } = useQuery({
    queryKey: ["/api/transactions"],
  });

  if (customersLoading || transactionsLoading) {
    return (
      <div className="flex items-center justify-center h-[50vh]">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Customer List */}
      <Card className="bg-black/30 border-primary/20">
        <CardHeader>
          <CardTitle>Customer List</CardTitle>
          <CardDescription>Manage registered customers</CardDescription>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[400px]">
            <div className="space-y-4">
              {!customers || customers.length === 0 ? (
                <p className="text-center text-muted-foreground py-4">No customers found</p>
              ) : (
                customers.map((customer) => (
                  <div key={customer.id} className="flex items-center justify-between p-3 rounded-md bg-primary/5 hover:bg-primary/10">
                    <div className="flex items-center gap-3">
                      <Avatar className="w-10 h-10">
                        <AvatarFallback>{customer.displayName?.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">{customer.displayName}</p>
                        <p className="text-sm text-muted-foreground">@{customer.gamingName}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">{customer.points} points</p>
                      <p className="text-xs text-muted-foreground">
                        Joined {new Date(customer.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Recent Transactions */}
      <Card className="bg-black/30 border-primary/20">
        <CardHeader>
          <CardTitle>Recent Transactions</CardTitle>
          <CardDescription>Latest gaming sessions and payments</CardDescription>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[300px]">
            <div className="space-y-4">
              {!transactions || transactions.length === 0 ? (
                <p className="text-center text-muted-foreground py-4">No transactions found</p>
              ) : (
                transactions.map((tx) => (
                  <div key={tx.id} className="flex items-center justify-between p-3 rounded-md bg-primary/5">
                    <div>
                      <p className="font-medium">Station #{tx.stationId}</p>
                      <p className="text-sm text-muted-foreground">
                        {tx.sessionType === "per_game" ? "Per Game" : `${tx.duration} minutes`}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">KSH {tx.amount}</p>
                      <Badge variant={tx.paymentStatus === "completed" ? "default" : "secondary"}>
                        {tx.paymentStatus}
                      </Badge>
                    </div>
                  </div>
                ))
              )}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}