
import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';

export function useAuth(requiredRole: 'admin' | 'staff' | 'customer') {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [, setLocation] = useLocation();

  useEffect(() => {
    // Check if user data exists in localStorage
    const userData = localStorage.getItem('user');
    
    if (userData) {
      const parsedUser = JSON.parse(userData);
      
      // Check if user has the required role
      if (parsedUser.role === requiredRole) {
        setUser(parsedUser);
      } else {
        // Redirect to appropriate login page if roles don't match
        localStorage.removeItem('user');
        setLocation(requiredRole === 'customer' ? '/login' : '/staff/login');
      }
    } else {
      // Redirect to appropriate login page if no user data
      setLocation(requiredRole === 'customer' ? '/login' : '/staff/login');
    }
    
    setLoading(false);
  }, [requiredRole, setLocation]);

  return { user, loading };
}
