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
  const [filter, setFilter] = useState("recordPrecent");
  const [currentMonth, setCurrentMonth] = useState(new Date());

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
    const d = new Date(r.date);

    const day =
      `${d.getFullYear()}-` +
      `${String(d.getMonth() + 1).padStart(2, "0")}-` +
      `${String(d.getDate()).padStart(2, "0")}`;
      const stationData = r.stations?.find(
        (s) => String(s.stationId) === String(_id)
      );

      if (!stationData) return;

      const value = stationData?.[filter];

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
  }, [records, filter, _id]);

  // ======================
  // BUILD REAL MONTH RANGE
  // ======================
  const calendarGrid = useMemo(() => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();

    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);

    const firstWeekday = firstDay.getDay();

    const cells = [];

    // empty cells before month starts
    for (let i = 0; i < firstWeekday; i++) {
      cells.push(null);
    }

    // month days
    for (let day = 1; day <= lastDay.getDate(); day++) {
      cells.push(new Date(year, month, day));
    }

    return cells;
  }, [currentMonth]);

  // ======================
  // COLORS
  // ======================
  const getColor = (value) => {
    if (value === undefined || value === null) {
      return "#9E9E9E";
    }

    if (filter === "recordPrecent") {
      if (value >= 100) return "#4CAF50";
      if (value >= 60) return "#FFC107";
      return "#F44336";
    }

    if (filter === "spoofPrecents") {
      if (value <= 5) return "#4CAF50";
      if (value <= 20) return "#FFC107";
      return "#F44336";
    }

    if (filter === "longestSequence") {
      if (value >= 900) return "#4CAF50";
      if (value >= 500) return "#FFC107";
      return "#F44336";
    }

    if (filter === "gemPrecents") {
      if (value >= 70) return "#4CAF50";
      if (value >= 40) return "#FFC107";
      return "#F44336";
    }

    return "#999";
  };

  return (
    <div className="station-page">
    <header className="station-page__header">
      <button
        className="station-page__back-button"
        onClick={onClose}
      >
        ← Back
      </button>

      <h1>{name}</h1>
    </header>

      <main className="station-info-card">

        {/* filter SELECTOR */}
        <div className="station-filter-selector">
          <label>Filter</label>

          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          >
            <option value="recordPrecent">Record %</option>
            <option value="longestSequence">Longest Sequence</option>
            <option value="spoofPrecents">Spoof %</option>
            <option value="gemPrecents">GEM %</option>
          </select>
        </div>

              {/* CALENDAR GRID */}
      <div className="calendar-header">
        <button
          onClick={() =>
            setCurrentMonth(
              new Date(
                currentMonth.getFullYear(),
                currentMonth.getMonth() - 1,
                1
              )
            )
          }
        >
          ◀
        </button>

        <h2>
          {currentMonth.toLocaleString("default", {
            month: "long",
            year: "numeric",
          })}
        </h2>

        <button
          onClick={() =>
            setCurrentMonth(
              new Date(
                currentMonth.getFullYear(),
                currentMonth.getMonth() + 1,
                1
              )
            )
          }
        >
          ▶
        </button>
      </div>

      <div className="calendar-weekdays">
        <div>Sun</div>
        <div>Mon</div>
        <div>Tue</div>
        <div>Wed</div>
        <div>Thu</div>
        <div>Fri</div>
        <div>Sat</div>
      </div>

      <div className="calendar-grid">
        {calendarGrid.map((date, idx) => {
          if (!date) {
            return (
              <div
                key={`empty-${idx}`}
                className="calendar-empty"
              />
            );
          }

          const key =
            `${date.getFullYear()}-` +
            `${String(date.getMonth() + 1).padStart(2, "0")}-` +
            `${String(date.getDate()).padStart(2, "0")}`;          const value = valueMap[key];

          return (
            <div
              key={key}
              className="calendar-day"
              style={{
                backgroundColor: getColor(value),
              }}
            >
              <div className="day">
                {date.getDate()}
              </div>

              <div className="value">
                {value !== undefined &&
                value !== null
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