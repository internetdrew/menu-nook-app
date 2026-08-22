import { Navigate, Outlet } from "react-router";
import { useAuth } from "@/contexts/auth";

type ProtectedRouteProps = {
  requireAuth?: boolean;
  redirectTo?: string;
};

export function ProtectedRoute({
  requireAuth = true,
  redirectTo = requireAuth ? "/login" : "/",
}: ProtectedRouteProps = {}) {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return null;
  }

  if ((requireAuth && !user) || (!requireAuth && user)) {
    return <Navigate to={redirectTo} replace />;
  }

  return <Outlet />;
}
