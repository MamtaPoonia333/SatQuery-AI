import React from "react";
import Topbar from "../../../shared/components/Topbar.jsx";
import { useAnalytics } from "../hooks/useAnalytics.js";
import "../../../style/analytics.css";
import "../../../style/reports.css";

/**
 * @description Analytics page — visualises the current user's own query
 * history (volume over the last 7 days, status breakdown, most-queried
 * regions). All computed from real data returned by GET /api/query; see
 * useAnalytics.js for why this aggregation happens client-side for now.
 */
const Analytics = () => {
  const { loading, error, volumeByDay, statusCounts, topRegions, queries } = useAnalytics();

  const maxCount = Math.max(1, ...volumeByDay.map((d) => d.count));

  return (
    <>
      <Topbar title="Analytics" subtitle="Trends from your query history" />
      <div className="content">
        {loading && <div className="state-msg">Loading analytics...</div>}
        {error && <div className="state-msg error">{error}</div>}

        {!loading && !error && (
          <>
            <div className="card">
              <div className="card-head">
                <h3>Query Volume — Last 7 Days</h3>
              </div>
              <div className="bar-chart">
                {volumeByDay.map((day, i) => (
                  <div className="bar-chart-col" key={i}>
                    <div className="bar-chart-value">{day.count}</div>
                    <div
                      className="bar-chart-bar"
                      style={{ height: `${(day.count / maxCount) * 100}%` }}
                    />
                    <div className="bar-chart-label">{day.label}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid2">
              <div className="card">
                <div className="card-head">
                  <h3>Result Status Breakdown</h3>
                </div>
                <div className="status-breakdown">
                  <div className="status-chip" style={{ background: "var(--green-soft)" }}>
                    <div className="n" style={{ color: "var(--green)" }}>
                      {statusCounts.resolved}
                    </div>
                    <div className="l">Resolved</div>
                  </div>
                  <div className="status-chip" style={{ background: "var(--saffron-soft)" }}>
                    <div className="n" style={{ color: "#b5690f" }}>
                      {statusCounts.low_confidence}
                    </div>
                    <div className="l">Low confidence</div>
                  </div>
                  <div className="status-chip" style={{ background: "var(--coral-soft)" }}>
                    <div className="n" style={{ color: "var(--coral)" }}>
                      {statusCounts.failed}
                    </div>
                    <div className="l">Failed / unmatched</div>
                  </div>
                </div>
              </div>

              <div className="card">
                <div className="card-head">
                  <h3>Most-Queried Regions</h3>
                </div>
                {topRegions.length === 0 ? (
                  <div className="empty-state">No queries yet — try Explore first.</div>
                ) : (
                  <table className="reports-table">
                    <tbody>
                      {topRegions.map(([region, count]) => (
                        <tr key={region}>
                          <td>{region}</td>
                          <td style={{ textAlign: "right", fontWeight: 600 }}>{count}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>

            {queries.length === 0 && (
              <div className="empty-state" style={{ marginTop: 16 }}>
                Once you run a few queries in Explore, real trends will show up here.
              </div>
            )}
          </>
        )}
      </div>
    </>
  );
};

export default Analytics;
