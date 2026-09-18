import { useEffect, useState } from "react";
import {
  listWatchedRegions,
  createWatchedRegion,
  updateWatchedRegion,
  deleteWatchedRegion,
} from "../services/alerts.api.js";

export const useAlerts = () => {
  const [regions, setRegions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const refresh = async () => {
    setLoading(true);
    try {
      const data = await listWatchedRegions();
      setRegions(data);
    } catch (err) {
      setError(err.message || "Failed to load alerts");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refresh();
  }, []);

  const addRegion = async (payload) => {
    const region = await createWatchedRegion(payload);
    setRegions((prev) => [region, ...prev]);
  };

  const toggleNotifications = async (region) => {
    const updated = await updateWatchedRegion(region._id, {
      notificationsEnabled: !region.notificationsEnabled,
    });
    setRegions((prev) => prev.map((r) => (r._id === updated._id ? updated : r)));
  };

  const removeRegion = async (id) => {
    await deleteWatchedRegion(id);
    setRegions((prev) => prev.filter((r) => r._id !== id));
  };

  return { regions, loading, error, addRegion, toggleNotifications, removeRegion, refresh };
};
