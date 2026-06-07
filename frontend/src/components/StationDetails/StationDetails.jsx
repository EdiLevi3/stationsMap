import { useState, useEffect, useMemo } from "react";
import "./StationDetails.css";
import { useStationById } from "../../hooks/useStationById";
import { API_BASE_URL } from "../../config";

const StationDetails = ({ station, onClose }) => {
  const { _id } = station;

  const { station: chosenStation, loading, error } =
    useStationById(_id);

  const displayStation = chosenStation || station;
  const { name, location } = displayStation;

  const [records, setRecords] = useState([]);
  const [metric, setMetric] = useState("recordPrecent");

  // ======================
  // FETCH RECORDS
  // ======================
  useEffect(() => {
    const fetchRecords = async () => {
      try {
        const res = await fetch(
          `${API_BASE_URL}/api/records/station/${_id}`
        );

        const data = await res.json();
        setRecords(data);
      } catch (err) {
        console.error(err);
      }
    };

    fetchRecords();
  }, [_id]);

  // ======================
  // VALUE EXTRACTION MAP
  // ======================
  const valueMap = useMemo(() => {
    const map = {};

    records.forEach((r) => {
      const day = new Date(r.date).toISOString().split("T")[0];

      const stationData = r.stations?.find(
        (s) => String(s.stationId) === String(_id)
      );

      if (!stationData) return;

      const value = stationData?.[metric];

      if (value === undefined || value === null) return;

      if (!map[day]) {
        map[day] = { sum: 0, count: 0 };
      }

      map[day].sum += value;
      map[day].count += 1;
    });

    Object.keys(map).forEach((d) => {
      map[d] = map[d].sum / map[d].count;
    });

    return map;
  }, [records, metric, _id]);

  // ======================
  // BUILD REAL MONTH RANGE
  // ======================
  const calendarDays = useMemo(() => {
    if (!records.length) return [];

    const dates = records.map((r) => new Date(r.date));

    const min = new Date(Math.min(...dates));

    const start = new Date(min.getFullYear(), min.getMonth(), 1);
    const end = new Date(min.getFullYear(), min.getMonth() + 1, 0);

    const days = [];
    const current = new Date(start);

    while (current <= end) {
      days.push(new Date(current));
      current.setDate(current.getDate() + 1);
    }

    return days;
  }, [records]);

  // ======================
  // ADD WEEKDAY PADDING
  // ======================
  const calendarGrid = useMemo(() => {
    if (!calendarDays.length) return [];

    const firstWeekday = calendarDays[0].getDay();

    const padded = [];

    // empty slots before month start
    for (let i = 0; i < firstWeekday; i++) {
      padded.push(null);
    }

    // actual days
    calendarDays.forEach((d) => padded.push(d));

    return padded;
  }, [calendarDays]);

  // ======================
  // COLORS
  // ======================
  const getColor = (value) => {
    if (value === undefined || value === null) {
      return "#9E9E9E";
    }

    if (metric === "recordPrecent") {
      if (value >= 100) return "#4CAF50";
      if (value >= 60) return "#FFC107";
      return "#F44336";
    }

    if (metric === "spoofPrecents") {
      if (value <= 5) return "#4CAF50";
      if (value <= 20) return "#FFC107";
      return "#F44336";
    }

    if (metric === "longestSequence") {
      if (value >= 900) return "#4CAF50";
      if (value >= 500) return "#FFC107";
      return "#F44336";
    }

    if (metric === "GemPrecents") {
      if (value >= 70) return "#4CAF50";
      if (value >= 40) return "#FFC107";
      return "#F44336";
    }

    return "#999";
  };

  return (
    <div className="station-page">
      <header className="station-page__header">
        <button onClick={onClose}>← Back</button>
        <h1>{name}</h1>
      </header>

      <main className="station-info-card">

        {/* METRIC SELECTOR */}
        <div className="station-metric-selector">
          <label>Metric</label>

          <select
            value={metric}
            onChange={(e) => setMetric(e.target.value)}
          >
            <option value="recordPrecent">Record %</option>
            <option value="longestSequence">Longest Sequence</option>
            <option value="spoofPrecents">Spoof %</option>
            <option value="GemPrecents">GEM %</option>
          </select>
        </div>

        {/* CALENDAR GRID */}
        <div className="calendar-grid">
          {calendarGrid.map((date, idx) => {
            if (!date) {
              return (
                <div key={idx} className="calendar-empty" />
              );
            }

            const key = date.toISOString().split("T")[0];
            const value = valueMap[key];

            return (
              <div
                key={key}
                className="calendar-day"
                style={{ backgroundColor: getColor(value) }}
              >
                <div className="day">
                  {date.getDate()}
                </div>

                <div className="value">
                  {value !== undefined && value !== null
                    ? value.toFixed(1)
                    : "—"}
                </div>
              </div>
            );
          })}
        </div>

        {/* STATUS */}
        {loading && <div>Loading...</div>}
        {error && <div>{error}</div>}

      </main>
    </div>
  );
};

export default StationDetails;