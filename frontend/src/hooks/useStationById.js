// Fetches a single station's full details (including records) by ID.
// Uses AbortController to cancel the request on unmount or ID change.

import { useState, useEffect } from "react";
import { API_BASE_URL } from "../config";

export const useStationById = (stationId) => {
  const [station, setStation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const abortController = new AbortController();
    setLoading(true);
    setError(null);

    const fetchStation = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/stations/${stationId}`, {
          signal: abortController.signal,
        });
        console.log(res)
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const stationData = await res.json();
        console.log("ststion data",stationData)
        setStation(stationData);
      } catch (err) {
        if (err.name === "AbortError") return;
        setError(err.message || "Failed to load station");
      } finally {
        if (!abortController.signal.aborted) {
          setLoading(false);
        }
      }
    };

    fetchStation();
    return () => abortController.abort();
  }, [stationId]);

  return { station, loading, error };
};
