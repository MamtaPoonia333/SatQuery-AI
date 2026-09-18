import { useEffect, useState } from "react";
import { listReports, generateReport } from "../services/reports.api.js";

export const useReports = () => {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState(null);

  const refresh = async () => {
    setLoading(true);
    try {
      const data = await listReports();
      setReports(data);
    } catch (err) {
      setError(err.message || "Failed to load reports");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refresh();
  }, []);

  const create = async (regionName) => {
    setGenerating(true);
    setError(null);
    try {
      const report = await generateReport({ regionName, type: "csv" });
      setReports((prev) => [report, ...prev]);
      return report;
    } catch (err) {
      setError(err.message || "Failed to generate report");
      throw err;
    } finally {
      setGenerating(false);
    }
  };

  return { reports, loading, generating, error, create, refresh };
};
