import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Timer, Star, Gamepad2, Clock } from "lucide-react";

export default function CustomerPortal() {
  const { toast } = useToast();

  const { data: user, isLoading: userLoading } = useQuery({
    queryKey: ["/api/users/current"],
  });

  const { data: transactions, isLoading: txLoading } = useQuery({
    queryKey: ["/api/transactions/user/current"],
    enabled: !!user,
  });

  if (userLoading || txLoading) {
    return (
      <div className="flex items-center justify-center h-[50vh]">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Customer Profile Card */}
      <Card className="backdrop-blur-sm bg-white/10 border-primary/20">
        <CardHeader>
          <CardTitle>Customer Profile</CardTitle>
          <CardDescription>Your gaming profile and preferences</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Display Name</p>
              <p className="text-lg font-semibold">{user?.displayName}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Gaming Name</p>
              <p className="text-lg font-semibold">{user?.gamingName}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Phone Number</p>
              <p className="text-lg font-semibold">{user?.phoneNumber}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Member Since</p>
              <p className="text-lg font-semibold">
                {new Date(user?.createdAt).toLocaleDateString()}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Points Summary */}
      <Card className="backdrop-blur-sm bg-white/10 border-primary/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Star className="w-5 h-5 text-primary" />
            Loyalty Points
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold">{user?.points || 0} points</div>
          <p className="text-sm text-muted-foreground mt-1">
            Earn points for every gaming session
          </p>
        </CardContent>
      </Card>

      {/* Gaming History */}
      <Card className="backdrop-blur-sm bg-white/10 border-primary/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-primary" />
            Recent Gaming Sessions
          </CardTitle>
          <CardDescription>Your recent gaming activity</CardDescription>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[300px] w-full pr-4">
            <div className="space-y-4">
              {transactions?.map((tx) => (
                <div key={tx.id} className="flex items-center justify-between border-b border-primary/10 pb-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-full bg-primary/10">
                      <Gamepad2 className="w-4 h-4 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium">{tx.game}</p>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Timer className="w-3 h-3" />
                        <span>{tx.sessionType === "per_game" ? "Single Game" : `${tx.duration} minutes`}</span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">KES {tx.amount}</p>
                    <p className="text-sm text-emerald-500">+{tx.points} points</p>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Favorite Games */}
      <Card className="backdrop-blur-sm bg-white/10 border-primary/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Gamepad2 className="w-5 h-5 text-primary" />
            Favorite Games
          </CardTitle>
          <CardDescription>Your most played games</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              { name: "FC25", plays: 45, hours: 38 },
              { name: "GTA 5", plays: 38, hours: 32 },
              { name: "NBA 2K25", plays: 32, hours: 28 },
              { name: "F1 Racing", plays: 28, hours: 24 }
            ].map((game, i) => (
              <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-primary/5">
                <div>
                  <p className="font-medium">{game.name}</p>
                  <p className="text-sm text-muted-foreground">{game.plays} sessions</p>
                </div>
                <p className="text-sm text-primary">{game.hours} hours</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}