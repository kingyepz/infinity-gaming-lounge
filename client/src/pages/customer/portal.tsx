import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { auth } from "@/lib/firebase";
import { useToast } from "@/hooks/use-toast";

export default function CustomerPortal() {
  const { toast } = useToast();
  
  const { data: user, isLoading: userLoading } = useQuery({
    queryKey: [`/api/users/${auth.currentUser?.uid}`],
  });

  const { data: transactions, isLoading: txLoading } = useQuery({
    queryKey: [`/api/transactions/user/${auth.currentUser?.uid}`],
    enabled: !!auth.currentUser,
  });

  if (userLoading || txLoading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Loyalty Points</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{user?.points || 0}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {transactions?.map((tx) => (
                <div key={tx.id} className="flex justify-between items-center">
                  <div>
                    <p className="font-medium">Game Session</p>
                    <p className="text-sm text-muted-foreground">
                      {new Date(tx.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">KSH {tx.amount}</p>
                    <p className="text-sm text-emerald-500">+{tx.points} points</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
