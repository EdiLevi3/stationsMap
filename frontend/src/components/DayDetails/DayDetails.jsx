import { useEffect, useState, useMemo } from "react";
import { API_BASE_URL } from "../../config";
import "./DayDetails.css";

const DayDetails = ({ stationId, date, onBack }) => {
  const [records, setRecords] = useState([]);

  useEffect(() => {
    const fetchDayRecords = async () => {
      try {
        const res = await fetch(
          `${API_BASE_URL}/api/records/station/${stationId}/day/${date}`
        );
        const data = await res.json();
        setRecords(data);
      } catch (err) {
        console.error(err);
      }
    };

    fetchDayRecords();
  }, [stationId, date]);

  const hours = Array.from({ length: 24 }, (_, i) => i);

  // =========================
  // Extract station values
  // =========================
  const values = useMemo(() => {
    const all = [];

    records.forEach((r) => {
      const s = r.stations?.find(
        (x) => String(x.stationId) === String(stationId)
      );

      if (!s) return;

      all.push({
        hour: r.hour,
        recordPrecent: s.recordPrecent ?? 0,
        spoofPrecents: s.spoofPrecents ?? 0,
        gemPrecents: s.GemPrecents ?? 0,
        longestSequence: s.longestSequence ?? 0,
      });
    });

    return all;
  }, [records, stationId]);

  // =========================
  // Daily statistics (AVG)
  // =========================
  const dailyStats = useMemo(() => {
    if (!values.length) return null;

    const sum = (key) =>
      values.reduce((acc, v) => acc + (v[key] ?? 0), 0);

    const len = values.length;

    return {
      avgRecord: sum("recordPrecent") / len,
      avgSpoof: sum("spoofPrecents") / len,
      avgGem: sum("gemPrecents") / len,
      maxSequence: Math.max(...values.map((v) => v.longestSequence)),
    };
  }, [values]);

  // =========================
  // Hour map
  // =========================
  const recordByHour = useMemo(() => {
    const map = {};

    values.forEach((v) => {
      map[v.hour] = v;
    });

    return map;
  }, [values]);

  // =========================
  // Color logic
  // =========================
  const getColor = (v) => {
    if (v == null) return "#9E9E9E";
    if (v >= 80) return "#4CAF50";
    if (v >= 50) return "#FFC107";
    return "#F44336";
  };

  return (
    <div className="day-details-page">

      {/* HEADER */}
      <header className="day-details-header">
        <button onClick={onBack}>← Back</button>
        <h1>{date}</h1>
      </header>

      {/* MAIN LAYOUT */}
      <div className="day-layout">

        {/* LEFT SIDE - STATS */}
        <div className="day-stats">
          <h2>Daily Statistics</h2>

          {!dailyStats ? (
            <p>No data</p>
          ) : (
            <>
              <div>Avg Record: {dailyStats.avgRecord.toFixed(1)}</div>
              <div>Avg Spoof: {dailyStats.avgSpoof.toFixed(1)}</div>
              <div>Avg GEM: {dailyStats.avgGem.toFixed(1)}</div>
              <div>Max Sequence: {dailyStats.maxSequence}</div>
            </>
          )}
        </div>

        {/* RIGHT SIDE - HOURS */}
        <div className="hours-grid">
          {hours.map((hour) => {
            const data = recordByHour[hour];

            const value = data?.recordPrecent;

            return (
              <div
                key={hour}
                className="hour-cell"
                style={{ backgroundColor: getColor(value) }}
              >
                <div className="hour-label">
                  {String(hour).padStart(2, "0")}:00
                </div>

                <div className="hour-value">
                  {value != null ? value.toFixed(1) : "—"}
                </div>
              </div>
            );
          })}
        </div>

      </div>
    </div>
  );
};

export default DayDetails;