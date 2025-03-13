import { Switch, Route } from "wouter";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { Toaster } from "@/components/ui/toaster";
import NotFound from "@/pages/not-found";
import WelcomePage from "@/pages/welcome";
import Login from "@/pages/auth/login";
import StaffLogin from "@/pages/staff/login";
import POSDashboard from "@/pages/pos/dashboard";
import GameCatalog from "@/pages/pos/game-catalog";
import CustomerPortal from "@/pages/customer/portal";
import AdminAnalytics from "@/pages/admin/analytics";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import { WebSocketProvider } from "./context/WebSocketContext";

function Router() {
  return (
    <div className="min-h-screen bg-background">
      <Switch>
        {/* Public routes */}
        <Route path="/" component={WelcomePage} />
        <Route path="/login" component={Login} />
        <Route path="/staff/login">
          {() => {
            try {
              const userData = localStorage.getItem('user');
              if (userData) {
                const user = JSON.parse(userData);
                if (user.role === 'admin') {
                  setTimeout(() => window.location.href = '/admin', 100);
                  return <div className="min-h-screen flex items-center justify-center">Redirecting to admin dashboard...</div>;
                } else if (user.role === 'staff') {
                  setTimeout(() => window.location.href = '/pos', 100);
                  return <div className="min-h-screen flex items-center justify-center">Redirecting to staff dashboard...</div>;
                }
              }
            } catch (error) {
              console.error("Error in auth redirect:", error);
            }
            return <StaffLogin />;
          }}
        </Route>

        {/* Protected routes */}
        <Route path="/pos">
          <ProtectedRoute role="staff">
            <POSDashboard />
          </ProtectedRoute>
        </Route>
        <Route path="/pos/dashboard">
          <ProtectedRoute role="staff">
            <POSDashboard />
          </ProtectedRoute>
        </Route>
        <Route path="/pos/games">
          <ProtectedRoute role="staff">
            <GameCatalog />
          </ProtectedRoute>
        </Route>
        <Route path="/pos/game-catalog">
          <ProtectedRoute role="staff">
            <GameCatalog />
          </ProtectedRoute>
        </Route>
        <Route path="/portal">
          <ProtectedRoute role="customer">
            <CustomerPortal />
          </ProtectedRoute>
        </Route>
        <Route path="/admin">
          <ProtectedRoute role="admin">
            <AdminAnalytics />
          </ProtectedRoute>
        </Route>
        <Route path="/admin/analytics">
          <ProtectedRoute role="admin">
            <AdminAnalytics />
          </ProtectedRoute>
        </Route>

        <Route component={NotFound} />
      </Switch>
      <Toaster />
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <WebSocketProvider>
        <Router />
      </WebSocketProvider>
    </QueryClientProvider>
  );
}

export default App;