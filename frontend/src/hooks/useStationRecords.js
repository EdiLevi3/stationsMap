import { useState, useEffect, useMemo } from "react";
import { API_BASE_URL } from "../config";

export const useStationRecords = (stationId) => {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRecords = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/records/station/${stationId}`);
        setRecords(await res.json());
      } catch (err) {
        console.error("Error fetching station records:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchRecords();
  }, [stationId]);

  const hourlyMap = useMemo(() => {
    const raw = {};
    records.forEach((r) => {
      const d = new Date(r.date);
      const day = d.toISOString().split("T")[0];
      const stationData = r.stations?.find((s) => String(s.stationId) === String(stationId));
      if (!stationData) return;
      
      const { spoofPrecents: spoof, jamPrecents: jam } = stationData;
      if (spoof === null && jam === null) return;
      
      if (!raw[day]) raw[day] = {};
      if (!raw[day][r.hour]) raw[day][r.hour] = { spoofSum: 0, jamSum: 0, spoofCount: 0, jamCount: 0 };
      
      const slot = raw[day][r.hour];
      if (spoof !== null) { slot.spoofSum += spoof; slot.spoofCount++; }
      if (jam !== null) { slot.jamSum += jam; slot.jamCount++; }
    });

    const result = {};
    Object.keys(raw).forEach((day) => {
      result[day] = Array.from({ length: 24 }, (_, h) => {
        const slot = raw[day][h];
        return slot ? {
          spoof: slot.spoofCount ? slot.spoofSum / slot.spoofCount : null,
          jam: slot.jamCount ? slot.jamSum / slot.jamCount : null,
        } : { spoof: null, jam: null };
      });
    });
    return result;
  }, [records, stationId]);

  return { records, hourlyMap, loading };
};
