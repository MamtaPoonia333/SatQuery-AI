import React from "react";
import { Outlet } from "react-router";
import Sidebar from "../../shared/components/Sidebar.jsx";
import "../../style/layout.css";

/**
 * @description Wraps every authenticated page with the persistent sidebar.
 * Each page (Overview, Explore, etc.) renders its own Topbar internally so
 * it can set its own title/subtitle, while this layout only owns the parts
 * shared across all of them (the sidebar + scrollable content column).
 */
const AppLayout = () => {
  return (
    <div className="shell">
      <Sidebar />
      <div className="main">
        <Outlet />
      </div>
    </div>
  );
};

export default AppLayout;
