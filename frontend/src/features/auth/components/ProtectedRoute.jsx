import React from "react";
import { Navigate } from "react-router";
import { useAuth } from "../hooks/useAuth.js";

/**
 * @description Wraps pages that require a logged-in user. Shows nothing (or
 * a simple loading state) while the initial session-restore check is still
 * running, so an authenticated user isn't briefly bounced to /login on page
 * refresh before their token has been verified.
 */
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, isInitializing } = useAuth();

  if (isInitializing) {
    return (
      <div style={{ display: "flex", height: "100vh", alignItems: "center", justifyContent: "center", color: "var(--dim)", fontSize: 13 }}>
        Loading...
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

export default ProtectedRoute;
