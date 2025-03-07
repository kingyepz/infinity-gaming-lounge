import { useState } from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

export default function Login() {
  const [loading, setLoading] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState("");
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);

      // Verify if user exists with this phone number
      const response = await apiRequest("GET", `/api/users/phone/${phoneNumber}`);
      if (!response.ok) {
        throw new Error("Customer not found. Please ask staff to register you.");
      }

      setLocation("/portal");

    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Login failed",
        description: error.message
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-primary/20">
      <Card className="w-[400px] shadow-xl">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">
            Infinity Gaming Lounge
          </CardTitle>
          <CardDescription>
            Enter your phone number to continue gaming
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Input
                type="tel"
                placeholder="254700000000"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                required
              />
            </div>

            <Button
              type="submit"
              className="w-full"
              disabled={loading || !phoneNumber}
            >
              {loading ? "Verifying..." : "Continue"}
            </Button>
          </form>

          <Button
            variant="link"
            className="w-full"
            onClick={() => setLocation("/")}
          >
            Back to Welcome Page
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}