import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { auth } from "@/lib/firebase";

export function useAuth(requiredRole?: "admin" | "staff" | "customer") {
  const [, setLocation] = useLocation();
  const [loading, setLoading] = useState(true);

  // Get current user's role from our backend
  const { data: user } = useQuery({
    queryKey: [`/api/users/phone/${auth.currentUser?.phoneNumber}`],
    enabled: !!auth.currentUser?.phoneNumber,
  });

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      setLoading(true);
      
      if (!user) {
        setLocation("/");
      } else if (requiredRole && user && (!user || user.role !== requiredRole)) {
        // Redirect based on role if they're trying to access wrong area
        switch (user.role) {
          case "admin":
            setLocation("/admin");
            break;
          case "staff":
            setLocation("/pos");
            break;
          case "customer":
            setLocation("/portal");
            break;
          default:
            setLocation("/");
        }
      }
      
      setLoading(false);
    });

    return () => unsubscribe();
  }, [setLocation, requiredRole]);

  return { loading, user };
}
