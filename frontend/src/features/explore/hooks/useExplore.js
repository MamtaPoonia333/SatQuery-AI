import { useState } from "react";
import { submitQuery } from "../services/explore.api.js";

export const useExplore = () => {
  const [result, setResult] = useState(null); // { query, meta }
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const ask = async (rawQueryText) => {
    if (!rawQueryText.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const data = await submitQuery(rawQueryText);
      setResult(data);
    } catch (err) {
      setError(err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return { result, loading, error, ask };
};
