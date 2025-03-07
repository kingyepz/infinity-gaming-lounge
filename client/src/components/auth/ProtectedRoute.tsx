import { ReactNode } from "react";
import { useAuth } from "@/hooks/useAuth";

interface Props {
  children: ReactNode;
  role: "admin" | "staff" | "customer";
}

export default function ProtectedRoute({ children, role }: Props) {
  const { loading, user } = useAuth(role);

  console.log('ProtectedRoute: Checking access...', { role, user, loading });

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!user) {
    console.log('ProtectedRoute: No user found, access denied');
    return null; // useAuth will handle redirect
  }

  console.log('ProtectedRoute: Access granted');
  return <>{children}</>;
}