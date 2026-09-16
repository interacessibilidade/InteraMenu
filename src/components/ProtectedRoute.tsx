import { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";

interface ProtectedRouteProps {
  children: ReactNode;
  /** Se informado, só permite acesso a quem tem exatamente esse papel (ex: "super_admin") */
  requireRole?: "super_admin" | "restaurant_owner" | "staff";
}

export default function ProtectedRoute({ children, requireRole }: ProtectedRouteProps) {
  const { session, role, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center" role="status" aria-live="polite">
        <p className="text-muted-foreground">Carregando...</p>
      </div>
    );
  }

  if (!session) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // super_admin sempre passa, mesmo em telas de dono/staff
  if (requireRole && role !== requireRole && role !== "super_admin") {
    return <Navigate to="/admin" replace />;
  }

  return <>{children}</>;
}
