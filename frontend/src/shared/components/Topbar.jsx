import React from "react";
import LanguageSelector from "./LanguageSelector.jsx";

const Topbar = ({ title, subtitle }) => {
  return (
    <div className="topbar">
      <div>
        <h1>{title}</h1>
        {subtitle && <div className="sub">{subtitle}</div>}
      </div>
      <div className="tb-right">
        <LanguageSelector />
        <div className="tb-pill">
          <span className="led" /> Sentinel-2 Live
        </div>
      </div>
    </div>
  );
};

export default Topbar;
