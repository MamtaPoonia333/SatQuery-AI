import React, { useState } from "react";
import Topbar from "../../../shared/components/Topbar.jsx";
import { useReports } from "../hooks/useReports.js";
import { getReportDownloadUrl } from "../services/reports.api.js";
import "../../../style/reports.css";

const displayRegionName = (value = "") => {
  const withoutTitle = value.replace(/\s+—\s+Query Summary$/i, "").trim();
  const match = withoutTitle.match(
    /(?:\d+(?:\.\d+)?\s*[NS]?\s*,\s*\d+(?:\.\d+)?\s*[EW]?)\s+in\s+([^?.]+?)(?:[?.]|$)/i
  );
  return match?.[1]?.trim() || withoutTitle;
};

const Reports = () => {
  const { reports, loading, generating, error, create } = useReports();
  const [regionName, setRegionName] = useState("");

  const onGenerate = async (e) => {
    e.preventDefault();
    if (!regionName.trim()) return;
    try {
      await create(regionName.trim());
      setRegionName("");
    } catch {
      // error already surfaced via `error`
    }
  };

  return (
    <>
      <Topbar title="Reports" subtitle="Generated summaries and exports" />
      <div className="content">
        <div className="card">
          <div className="card-head">
            <h3>Generate a Report</h3>
          </div>
          <form className="generate-form" onSubmit={onGenerate}>
            <input
              placeholder="Region name — must match a region you've queried before, e.g. Kosi Basin, Bihar"
              value={regionName}
              onChange={(e) => setRegionName(e.target.value)}
            />
            <button type="submit" className="gen-btn" disabled={generating}>
              {generating ? "Generating..." : "+ Generate CSV"}
            </button>
          </form>
          {error && <div className="state-msg error">{error}</div>}
          <div style={{ fontSize: 11, color: "var(--dim-2)" }}>
            Only CSV export is available right now — it summarises every query you've made for
            that exact region name via Explore.
          </div>
        </div>

        <div className="card">
          <div className="card-head">
            <h3>Generated Reports</h3>
          </div>
          {loading && <div className="state-msg">Loading reports...</div>}
          {!loading && reports.length === 0 && (
            <div className="empty-state">No reports generated yet.</div>
          )}
          {reports.length > 0 && (
            <table className="reports-table">
              <thead>
                <tr>
                  <th>Report</th>
                  <th>Region</th>
                  <th>Date</th>
                  <th>Type</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {reports.map((r) => (
                  (() => {
                    const region = displayRegionName(r.regionName);
                    return (
                  <tr key={r._id}>
                    <td>{region} — Query Summary</td>
                    <td>{region}</td>
                    <td>{new Date(r.createdAt).toLocaleDateString()}</td>
                    <td>{r.type.toUpperCase()}</td>
                    <td>
                      <a href={getReportDownloadUrl(r.fileUrl)} target="_blank" rel="noreferrer">
                        <button className="dl-btn">Download</button>
                      </a>
                    </td>
                  </tr>
                    );
                  })()
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </>
  );
};

export default Reports;
