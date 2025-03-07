import { Switch, Route } from "wouter";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { Toaster } from "@/components/ui/toaster";
import NotFound from "@/pages/not-found";
import WelcomePage from "@/pages/welcome";
import Login from "@/pages/auth/login";
import StaffLogin from "@/pages/staff/login";
import POSDashboard from "@/pages/pos/dashboard";
import CustomerPortal from "@/pages/customer/portal";
import AdminAnalytics from "@/pages/admin/analytics";
import Header from "@/components/layout/Header";
import Sidebar from "@/components/layout/Sidebar";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import React from "react";

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
                // Use setLocation instead of window.location for better SPA experience
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

        {/* Protected routes with layout */}
        <Route path="/pos">
          <ProtectedRoute role="staff">
            <Layout>
              <POSDashboard />
            </Layout>
          </ProtectedRoute>
        </Route>
        <Route path="/portal">
          <ProtectedRoute role="customer">
            <Layout>
              <CustomerPortal />
            </Layout>
          </ProtectedRoute>
        </Route>
        <Route path="/admin">
          <ProtectedRoute role="admin">
            <Layout>
              <AdminAnalytics />
            </Layout>
          </ProtectedRoute>
        </Route>

        <Route component={NotFound} />
      </Switch>
      <Toaster />
    </div>
  );
}

function Layout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Header />
      <div className="flex">
        <Sidebar />
        <main className="flex-1 p-6">
          {children}
        </main>
      </div>
    </>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router />
    </QueryClientProvider>
  );
}

export default App;