import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { auth } from "@/lib/firebase";
import type { User } from "@shared/schema";

export function useAuth(requiredRole?: "admin" | "staff" | "customer") {
  const [, setLocation] = useLocation();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);

  // Get current user's role from our backend or localStorage
  useEffect(() => {
    const checkUser = async () => {
      setLoading(true);
      console.log('useAuth: Checking user authentication...', { requiredRole });

      try {
        // First check localStorage for test users
        const storedUser = localStorage.getItem('user');
        console.log('useAuth: Stored user data:', storedUser);

        if (storedUser) {
          const parsedUser = JSON.parse(storedUser);
          console.log('useAuth: Found stored user:', parsedUser);
          setUser(parsedUser);

          // Handle role-based redirection
          if (requiredRole && parsedUser.role !== requiredRole) {
            console.log('useAuth: Role mismatch, redirecting...', {
              userRole: parsedUser.role,
              requiredRole
            });

            switch (parsedUser.role) {
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
          } else {
            console.log('useAuth: User authorized for this route');
          }
        } else {
          console.log('useAuth: No stored user found');
          if (!auth.currentUser) {
            console.log('useAuth: No Firebase user, redirecting to home');
            setLocation("/");
          }
        }
      } catch (error) {
        console.error("useAuth: Error checking user:", error);
        setLocation("/");
      }

      setLoading(false);
    };

    checkUser();
  }, [setLocation, requiredRole]);

  return { loading, user };
}