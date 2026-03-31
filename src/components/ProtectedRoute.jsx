import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import Forbidden403 from "../pages/Forbidden403";

export default function ProtectedRoute({ children, allowedRoles }) {
  const { user, isAuthenticated, loading } = useAuth();
  const location = useLocation();
  const isLeaderRoute = location.pathname.startsWith("/leader");

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 dark:bg-[#0d1117]">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    let target = "/login";

    // After user-initiated logout, we want to land on homepage, not login.
    if (typeof window !== "undefined") {
      const flag = sessionStorage.getItem("ems_logout_redirect_home");
      if (flag === "1") {
        target = "/";
      }
    }

    return <Navigate to={target} state={{ from: location }} replace />;
  }

  if (
    allowedRoles &&
    allowedRoles.length > 0 &&
    !allowedRoles.includes(user.role)
  ) {
    if (import.meta.env.DEV) {
      console.warn("ProtectedRoute - Access denied by role", {
        path: location.pathname,
        role: user.role,
        allowedRoles,
        user,
      });
    }
    // Super-admin bypass: always allow
    if (!user.isSuperAdmin) {
      return <Forbidden403 />;
    }
  }

  // Special case: allow "student" into leader routes only if they have club access.
  // (We still keep DB role as "student" for club members.)
  if (
    isLeaderRoute &&
    allowedRoles &&
    allowedRoles.length > 0 &&
    user?.role === "student" &&
    allowedRoles.includes("faculty_coordinator")
  ) {
    const hasClubAccess = (user?.clubIds?.length ?? 0) > 0;
    if (!user.isSuperAdmin && !hasClubAccess) {
      if (import.meta.env.DEV) {
        console.warn("ProtectedRoute - Access denied by club gating", {
          path: location.pathname,
          role: user.role,
          allowedRoles,
          clubIds: user?.clubIds,
        });
      }
      return <Forbidden403 />;
    }
  }

  return children;
}
