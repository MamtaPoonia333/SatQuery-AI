import React, { useState } from "react";
import Topbar from "../../../shared/components/Topbar.jsx";
import { useAlerts } from "../hooks/useAlerts.js";
import "../../../style/alerts.css";

const PHENOMENON_ICON = {
  flood: { icon: "\u{1F4A7}", bg: "var(--coral-soft)" },
  crop_stress: { icon: "\u{1F33E}", bg: "var(--saffron-soft)" },
  deforestation: { icon: "\u{1F332}", bg: "var(--green-soft)" },
  glacial_lake: { icon: "\u{1F9CA}", bg: "var(--blue-soft)" },
};

const Alerts = () => {
  const { regions, loading, error, addRegion, toggleNotifications, removeRegion } = useAlerts();
  const [showForm, setShowForm] = useState(false);
  const [formError, setFormError] = useState(null);
  const [form, setForm] = useState({
    regionName: "",
    lat: "",
    lng: "",
    phenomenon: "flood",
    threshold: "",
  });

  const onFormChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const onAddRegion = async (e) => {
    e.preventDefault();
    setFormError(null);
    try {
      await addRegion({
        regionName: form.regionName,
        coordinates: { lat: parseFloat(form.lat), lng: parseFloat(form.lng) },
        phenomenon: form.phenomenon,
        threshold: parseFloat(form.threshold),
      });
      setForm({ regionName: "", lat: "", lng: "", phenomenon: "flood", threshold: "" });
      setShowForm(false);
    } catch (err) {
      setFormError(err.message || "Could not add region");
    }
  };

  return (
    <>
      <Topbar title="Alerts" subtitle="Monitored regions and thresholds" />
      <div className="content">
        {loading && <div className="state-msg">Loading alerts...</div>}
        {error && <div className="state-msg error">{error}</div>}

        {!loading && regions.length === 0 && (
          <div className="empty-state">No watched regions yet — add one below.</div>
        )}

        {regions.map((region) => {
          const meta = PHENOMENON_ICON[region.phenomenon] || PHENOMENON_ICON.flood;
          return (
            <div className="alert-card" key={region._id}>
              <div className="alert-left">
                <div className="alert-ic" style={{ background: meta.bg }}>
                  {meta.icon}
                </div>
                <div>
                  <div className="alert-title">{region.regionName}</div>
                  <div className="alert-sub">
                    {region.phenomenon.replace("_", " ")} threshold: {region.threshold}
                    {region.lastCheckedValue != null && ` · Currently ${region.lastCheckedValue}`}
                  </div>
                </div>
              </div>
              <div className="alert-right">
                <button
                  className={"switch" + (region.notificationsEnabled ? " on" : "")}
                  onClick={() => toggleNotifications(region)}
                  title="Toggle notifications"
                />
                <button className="remove-btn" onClick={() => removeRegion(region._id)}>
                  Remove
                </button>
              </div>
            </div>
          );
        })}

        {showForm ? (
          <form className="add-region-form" onSubmit={onAddRegion}>
            {formError && <div className="state-msg error">{formError}</div>}
            <div className="form-row">
              <input
                name="regionName"
                placeholder="Region name (e.g. Kosi Basin, Bihar)"
                value={form.regionName}
                onChange={onFormChange}
                required
              />
              <select name="phenomenon" value={form.phenomenon} onChange={onFormChange}>
                <option value="flood">Flood</option>
                <option value="crop_stress">Crop stress</option>
                <option value="deforestation">Deforestation</option>
                <option value="glacial_lake">Glacial lake</option>
              </select>
            </div>
            <div className="form-row">
              <input
                name="lat"
                type="number"
                step="any"
                placeholder="Latitude"
                value={form.lat}
                onChange={onFormChange}
                required
              />
              <input
                name="lng"
                type="number"
                step="any"
                placeholder="Longitude"
                value={form.lng}
                onChange={onFormChange}
                required
              />
              <input
                name="threshold"
                type="number"
                step="any"
                placeholder="Alert threshold"
                value={form.threshold}
                onChange={onFormChange}
                required
              />
            </div>
            <button type="submit" className="auth-submit" style={{ marginTop: 8 }}>
              Save Region
            </button>
          </form>
        ) : (
          <button className="add-region-btn" onClick={() => setShowForm(true)}>
            + Add region to watch
          </button>
        )}
      </div>
    </>
  );
};

export default Alerts;
