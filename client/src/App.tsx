import { Route, Switch } from 'wouter';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from '@/lib/queryClient';
import { Toaster } from '@/components/ui/toaster';
import Header from '@/components/layout/Header';

// Pages
import Welcome from '@/pages/welcome';
import NotFound from '@/pages/not-found';
import CustomerPortal from '@/pages/customer/portal';
import AdminAnalytics from '@/pages/admin/analytics';
import POSDashboard from '@/pages/pos/dashboard';
import StaffLogin from '@/pages/staff/login';
import AuthLogin from '@/pages/auth/login';

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <div className="min-h-screen bg-background">
        <Header />
        <main>
          <Switch>
            <Route path="/" component={Welcome} />
            <Route path="/customer/portal" component={CustomerPortal} />
            <Route path="/admin/analytics" component={AdminAnalytics} />
            <Route path="/pos/dashboard" component={POSDashboard} />
            <Route path="/staff/login" component={StaffLogin} />
            <Route path="/auth/login" component={AuthLogin} />
            <Route component={NotFound} />
          </Switch>
        </main>
        <Toaster />
      </div>
    </QueryClientProvider>
  );
}