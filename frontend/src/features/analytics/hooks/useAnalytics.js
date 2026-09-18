import { useEffect, useState } from "react";
import { listQueries } from "../../explore/services/explore.api.js";

/**
 * @description There is no dedicated /api/analytics endpoint yet — this hook
 * fetches the user's real query history and computes simple aggregates
 * client-side (volume per day, status breakdown, region frequency). It's
 * genuine data, just computed here instead of on the server. If query
 * volume grows large, this aggregation should move server-side instead.
 */
export const useAnalytics = () => {
  const [queries, setQueries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await listQueries({ limit: 100 });
        if (!cancelled) setQueries(data.queries);
      } catch (err) {
        if (!cancelled) setError(err.message || "Failed to load analytics");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // Last 7 days query volume
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    return d;
  });

  const volumeByDay = last7Days.map((day) => {
    const count = queries.filter((q) => {
      const qDate = new Date(q.createdAt);
      return qDate.toDateString() === day.toDateString();
    }).length;
    return {
      label: day.toLocaleDateString(undefined, { weekday: "short" }),
      count,
    };
  });

  const statusCounts = queries.reduce(
    (acc, q) => {
      acc[q.status] = (acc[q.status] || 0) + 1;
      return acc;
    },
    { resolved: 0, low_confidence: 0, failed: 0 }
  );

  const regionCounts = queries.reduce((acc, q) => {
    const region = q.parsedIntent?.region || "Unidentified";
    acc[region] = (acc[region] || 0) + 1;
    return acc;
  }, {});
  const topRegions = Object.entries(regionCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  return { queries, loading, error, volumeByDay, statusCounts, topRegions };
};
