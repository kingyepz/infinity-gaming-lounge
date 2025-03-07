
import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';

export function useAuth(requiredRole: 'admin' | 'staff' | 'customer') {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [, setLocation] = useLocation();

  useEffect(() => {
    const checkAuth = () => {
      try {
        // Check if user data exists in localStorage
        const userData = localStorage.getItem('user');
        
        if (userData) {
          const parsedUser = JSON.parse(userData);
          
          // Check if user has the required role
          if (parsedUser.role === requiredRole) {
            setUser(parsedUser);
            setLoading(false);
          } else {
            // Redirect based on the user's actual role
            if (parsedUser.role === 'admin') {
              setLocation('/admin');
            } else if (parsedUser.role === 'staff') {
              setLocation('/pos');
            } else if (parsedUser.role === 'customer') {
              setLocation('/portal');
            } else {
              // Role not recognized, clear and redirect to login
              localStorage.removeItem('user');
              setLocation(requiredRole === 'customer' ? '/login' : '/staff/login');
            }
          }
        } else {
          // Redirect to appropriate login page if no user data
          setLocation(requiredRole === 'customer' ? '/login' : '/staff/login');
        }
      } catch (error) {
        console.error("Auth error:", error);
        // In case of error, clear and redirect
        localStorage.removeItem('user');
        setLocation('/');
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, [requiredRole, setLocation]);

  return { user, loading };
}
