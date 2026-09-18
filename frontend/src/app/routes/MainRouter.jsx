import React from "react";
import { createBrowserRouter, Navigate } from "react-router";
import Login from "../../features/auth/pages/Login.jsx";
import Register from "../../features/auth/pages/Register.jsx";
import ProtectedRoute from "../../features/auth/components/ProtectedRoute.jsx";
import AppLayout from "../layout/AppLayout.jsx";
import Overview from "../../features/dashboard/pages/Overview.jsx";
import Explore from "../../features/explore/pages/Explore.jsx";
import Analytics from "../../features/analytics/pages/Analytics.jsx";
import Alerts from "../../features/alerts/pages/Alerts.jsx";
import Reports from "../../features/reports/pages/Reports.jsx";
import AnalysisLab from "../../features/analysis/pages/AnalysisLab.jsx";

/**
 * @description The app's full route table.
 * - `/login`, `/register` — public, unauthenticated.
 * - `/` — redirects straight to `/dashboard`.
 * - Everything under the protected layout requires a valid session
 *   (ProtectedRoute checks this and redirects to /login otherwise) and
 *   renders inside AppLayout, which supplies the persistent sidebar.
 */
export const MainRouter = createBrowserRouter([
  { path: "/login", element: <Login /> },
  { path: "/register", element: <Register /> },
  { path: "/", element: <Navigate to="/dashboard" replace /> },
  {
    element: (
      <ProtectedRoute>
        <AppLayout />
      </ProtectedRoute>
    ),
    children: [
      { path: "/dashboard", element: <Overview /> },
      { path: "/explore", element: <Explore /> },
      { path: "/analytics", element: <Analytics /> },
      { path: "/alerts", element: <Alerts /> },
      { path: "/reports", element: <Reports /> },
      { path: "/analysis", element: <AnalysisLab /> },
    ],
  },
  { path: "*", element: <Navigate to="/dashboard" replace /> },
]);
