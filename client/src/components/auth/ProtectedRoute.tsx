import { ReactNode } from "react";
import { useAuth } from "@/hooks/useAuth";

interface Props {
  children: ReactNode;
  role: "admin" | "staff" | "customer";
}

export default function ProtectedRoute({ children, role }: Props) {
  const { loading, user } = useAuth(role);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!user) {
    return null; // useAuth will handle redirect
  }

  return <>{children}</>;
}
