import { Navigate, Outlet } from "react-router";
import { useAuth } from "@/contexts/auth";
import { Spinner } from "./ui/spinner";

export default function RedirectIfAuthenticated() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return <Spinner className="mx-auto mt-36 size-6 text-pink-600" />;
  }

  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  return <Outlet />;
}
