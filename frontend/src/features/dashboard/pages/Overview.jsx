import React from "react";
import { useNavigate } from "react-router";
import Topbar from "../../../shared/components/Topbar.jsx";
import { useOverview } from "../hooks/useOverview.js";

const Overview = () => {
  const { data, loading, error } = useOverview();
  const navigate = useNavigate();

  return (
    <>
      <Topbar title="Overview" subtitle="Mission status at a glance" />
      <div className="content">
        {loading && <div className="state-msg">Loading overview...</div>}
        {error && <div className="state-msg error">{error}</div>}

        {data && (
          <>
            <div className="stat-row">
              <div className="stat-card">
                <div className="n">{data.stats.queriesThisWeek}</div>
                <div className="l">Queries this week</div>
              </div>
              <div className="stat-card">
                <div className="n">{data.stats.activeAlertsCount}</div>
                <div className="l">Active alerts</div>
                <div className="delta down">{data.stats.criticalAlertsCount} critical</div>
              </div>
              <div className="stat-card">
                <div className="n">{data.stats.regionsMonitoredCount}</div>
                <div className="l">Regions monitored</div>
              </div>
              <div className="stat-card">
                <div className="n">{data.stats.avgConfidence}%</div>
                <div className="l">Avg. confidence</div>
              </div>
            </div>

            <div className="grid2">
              <div>
                <div className="card">
                  <div className="card-head">
                    <h3>Recent Queries</h3>
                    <button className="link" onClick={() => navigate("/explore")}>
                      Go to Explore &rarr;
                    </button>
                  </div>
                  {data.recentQueries.length === 0 ? (
                    <div className="empty-state">
                      No queries yet — try asking something in Explore.
                    </div>
                  ) : (
                    data.recentQueries.map((q) => (
                      <div
                        key={q._id}
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          padding: "10px 0",
                          borderBottom: "1px solid var(--border)",
                          fontSize: 12.5,
                        }}
                      >
                        <div>
                          <div>"{q.rawQueryText}"</div>
                          <div style={{ fontSize: 10.5, color: "var(--dim-2)", marginTop: 2 }}>
                            {new Date(q.createdAt).toLocaleString()}
                          </div>
                        </div>
                        <span
                          style={{
                            fontSize: 9.5,
                            padding: "3px 9px",
                            borderRadius: 100,
                            fontWeight: 700,
                            height: "fit-content",
                            background:
                              q.status === "resolved"
                                ? "var(--green-soft)"
                                : q.status === "low_confidence"
                                ? "var(--saffron-soft)"
                                : "var(--coral-soft)",
                            color:
                              q.status === "resolved"
                                ? "var(--green)"
                                : q.status === "low_confidence"
                                ? "#b5690f"
                                : "var(--coral)",
                          }}
                        >
                          {q.status.replace("_", " ")}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div>
                <div className="card">
                  <div className="card-head">
                    <h3>Active Alerts</h3>
                    <button className="link" onClick={() => navigate("/alerts")}>
                      Manage &rarr;
                    </button>
                  </div>
                  {data.activeAlerts.length === 0 ? (
                    <div className="empty-state">No active alerts right now.</div>
                  ) : (
                    data.activeAlerts.map((a) => (
                      <div
                        key={a._id}
                        style={{
                          padding: "10px 0",
                          borderBottom: "1px solid var(--border)",
                          fontSize: 12.5,
                        }}
                      >
                        <div>{a.regionName}</div>
                        <div style={{ fontSize: 10.5, color: "var(--dim-2)", marginTop: 2 }}>
                          {a.riskLevel === "critical" ? "Threshold exceeded" : "Monitoring"}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </>
  );
};

export default Overview;
