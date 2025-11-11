// src/components/ProtectedRoute.tsx
import { Navigate } from "react-router";
import { useAuth } from "@/contexts/auth";
import type { JSX } from "react";

export default function ProtectedRoute({
  children,
}: {
  children: JSX.Element;
}) {
  const { user, isLoading } = useAuth();

  if (isLoading) return <div>Loading...</div>;
  if (!user) return <Navigate to="/login" replace />;
  return children;
}
