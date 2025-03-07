import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip } from "recharts";

export default function AdminAnalytics() {
  const { data: transactions, isLoading } = useQuery({
    queryKey: ["/api/transactions"],
  });

  if (isLoading) {
    return <div>Loading analytics...</div>;
  }

  // Calculate revenue metrics
  const totalRevenue = transactions?.reduce((sum, tx) => sum + tx.amount, 0) || 0;
  const dailyRevenue = transactions?.reduce((acc, tx) => {
    const date = new Date(tx.createdAt).toLocaleDateString();
    acc[date] = (acc[date] || 0) + tx.amount;
    return acc;
  }, {});

  const chartData = Object.entries(dailyRevenue || {}).map(([date, amount]) => ({
    date,
    amount
  }));

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Total Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">KSH {totalRevenue}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Active Sessions</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">
              {transactions?.filter(tx => tx.paymentStatus === "completed").length || 0}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Total Users</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">
              {new Set(transactions?.map(tx => tx.userId)).size || 0}
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Daily Revenue</CardTitle>
        </CardHeader>
        <CardContent>
          <BarChart width={800} height={300} data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip />
            <Bar dataKey="amount" fill="hsl(var(--primary))" />
          </BarChart>
        </CardContent>
      </Card>
    </div>
  );
}
