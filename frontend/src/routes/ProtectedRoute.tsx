import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth, UserRole } from "@/contexts/AuthContext";

interface ProtectedRouteProps {
  children: JSX.Element;
  role?: UserRole;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, role }) => {
  const { user, loading } = useAuth();

  // Wait until the AuthContext restores localStorage session
  if (loading) return null; // or a loading spinner

  // User is not logged in
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Wrong role → redirect them to their correct homepage
  if (role && user.role !== role) {
    const redirectPath =
      user.role === "staff"
        ? "/staff/orders" // 🔥 Staff default page
        : user.role === "customer"
        ? "/menu"
        : "/admin/dashboard";

    return <Navigate to={redirectPath} replace />;
  }

  // Access allowed
  return children;
};

export default ProtectedRoute;
