// Fetches all stations on mount. Returns { stations, loading, error, retry }.

import { useState, useEffect, useCallback } from "react";
import { API_BASE_URL } from "../config";

export const useStations = () => {
  const [stations, setStations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadStations = useCallback(async (signal) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE_URL}/api/stations`, { signal });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setStations(data);
    } catch (err) {
      if (err.name === "AbortError") return;
      setError(err.message || "Failed to load stations");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const abortController = new AbortController();
    loadStations(abortController.signal);
    return () => abortController.abort();
  }, [loadStations]);

  return { stations, loading, error, retry: loadStations };
};
