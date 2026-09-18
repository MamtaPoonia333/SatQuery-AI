import React from "react";
import { NavLink } from "react-router";
import { useAuth } from "../../features/auth/hooks/useAuth.js";

const NAV_ITEMS = [
  { to: "/dashboard", icon: "\u25E7", label: "Overview" },
  { to: "/explore", icon: "\u25CE", label: "Explore" },
  { to: "/analytics", icon: "\u25A4", label: "Analytics" },
  { to: "/alerts", icon: "\u25ED", label: "Alerts" },
  { to: "/reports", icon: "\u25A7", label: "Reports" },
  { to: "/analysis", icon: "\u25C8", label: "Analysis Lab" },
];

const Sidebar = () => {
  const { user, handleLogout } = useAuth();

  const initial = user?.name?.charAt(0)?.toUpperCase() || "?";

  return (
    <div className="sidebar">
      <div className="sb-brand">
        <div className="sb-brand-ring">
          <div className="sb-brand-dot" />
        </div>
        <div className="sb-brand-name">SatQuery AI</div>
      </div>

      <div className="sb-nav">
        {NAV_ITEMS.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) => "sb-item" + (isActive ? " active" : "")}
          >
            <span className="ic">{item.icon}</span>
            <span className="lbl">{item.label}</span>
          </NavLink>
        ))}
      </div>

      <div className="sb-foot">
        <div className="sb-user">
          <div className="sb-avatar">{initial}</div>
          <div className="sb-user-info">
            <div className="sb-user-name">{user?.name || "Loading..."}</div>
            <div className="sb-user-role">
              {user?.role === "admin" ? "Administrator" : "Field Analyst"}
            </div>
          </div>
          <button className="sb-logout" title="Log out" onClick={handleLogout}>
            &#9211;
          </button>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
