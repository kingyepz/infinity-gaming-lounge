import { useState } from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { SiGoogle } from "react-icons/si";
import { auth, googleProvider } from "@/lib/firebase";
import { signInWithPopup } from "firebase/auth";

export default function StaffLogin() {
  const [loading, setLoading] = useState(false);
  const [role, setRole] = useState<"admin" | "staff">("staff");
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const handleGoogleLogin = async () => {
    try {
      setLoading(true);
      const result = await signInWithPopup(auth, googleProvider);

      // Create user in our backend with selected role
      const response = await apiRequest("POST", "/api/users", {
        displayName: result.user.displayName,
        gamingName: result.user.displayName,
        phoneNumber: result.user.phoneNumber || "254700000000",
        role: role
      });
      
      const userData = await response.json();

      // Store user data in localStorage
      localStorage.setItem("user", JSON.stringify({
        ...userData,
        role: role // Ensure role is set correctly
      }));

      // Redirect based on role
      setLocation(role === "admin" ? "/admin" : "/pos");
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Authentication failed",
        description: error.message
      });
    } finally {
      setLoading(false);
    }
  };

  const handleTestLogin = async (testRole: "admin" | "staff") => {
    try {
      setLoading(true);
      // Get the test account
      const phoneNumber = testRole === "admin" ? "254700000000" : "254700000001";
      
      // Create a default user in case API fails
      let userData = {
        displayName: testRole === "admin" ? "Admin User" : "Staff User",
        gamingName: testRole === "admin" ? "Admin User" : "Staff User",
        phoneNumber: phoneNumber,
        role: testRole
      };
      
      try {
        const response = await apiRequest("GET", `/api/users/phone/${phoneNumber}`);
        if (response.ok) {
          const user = await response.json();
          userData = { ...user, role: testRole };
        }
      } catch (error) {
        console.error("Error fetching user, using default test account", error);
      }

      // Set the role in local state
      setRole(testRole);
      
      // Store user data in localStorage
      localStorage.setItem("user", JSON.stringify(userData));

      // Redirect based on role - immediately
      setLocation(testRole === "admin" ? "/admin" : "/pos");

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
            variant="outline"
            className="w-full"
            onClick={handleGoogleLogin}
            disabled={loading}
          >
            <SiGoogle className="mr-2 h-4 w-4" />
            Continue with Google
          </Button>

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