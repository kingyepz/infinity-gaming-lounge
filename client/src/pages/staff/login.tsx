import { useState } from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";

export default function StaffLogin() {
  const [loading, setLoading] = useState(false);
  const [role, setRole] = useState<"admin" | "staff">("staff");
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const handleTestLogin = async (testRole: "admin" | "staff") => {
    try {
      console.log('StaffLogin: Starting test login...', { testRole });
      setLoading(true);

      // Create test user data
      const userData = {
        id: testRole === "admin" ? 1 : 2,
        displayName: testRole === "admin" ? "Admin Test" : "Staff Test",
        gamingName: testRole === "admin" ? "admin" : "staff",
        phoneNumber: testRole === "admin" ? "254700000000" : "254700000001",
        role: testRole,
        points: 0,
        createdAt: new Date()
      };

      console.log('StaffLogin: Storing user data...', userData);

      // Store complete user data in localStorage
      localStorage.setItem("user", JSON.stringify(userData));

      // Set role and redirect
      setRole(testRole);
      console.log('StaffLogin: Redirecting to dashboard...');

      // Use setLocation instead of window.location for better SPA experience
      setLocation(testRole === "admin" ? "/admin" : "/pos");

    } catch (error: any) {
      console.error('StaffLogin: Error during login:', error);
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
            Staff Portal
          </CardTitle>
          <CardDescription>
            Login to manage gaming sessions and payments
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Select
              value={role}
              onValueChange={(value: "admin" | "staff") => setRole(value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="admin">Admin</SelectItem>
                <SelectItem value="staff">Staff</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">
                Quick Access
              </span>
            </div>
          </div>

          <div className="grid gap-2">
            <Button
              variant="outline"
              className="bg-green-500/10 hover:bg-green-500/20 border-green-500/50"
              onClick={() => handleTestLogin("admin")}
              disabled={loading}
            >
              Test as Admin
            </Button>
            <Button
              variant="outline"
              className="bg-blue-500/10 hover:bg-blue-500/20 border-blue-500/50"
              onClick={() => handleTestLogin("staff")}
              disabled={loading}
            >
              Test as Staff
            </Button>
          </div>

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