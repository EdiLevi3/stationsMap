import { useState, useEffect, useMemo } from "react";
import "./StationDetails.css";
import { useStationById } from "../../hooks/useStationById";
import { API_BASE_URL } from "../../config";
import DayDetails from "../DayDetails/DayDetails";

// ─── Hourly Ring (24 arc segments) ───────────────────────────────────────────
const getColor = (value) => {
  if (value === undefined || value === null) return "#D1D5DB";
  if (value <= 0) return "#4CAF50";
  if (value <= 60) return "#FFC107";
  return "#F44336";
};

const getDominantColor = (hourlyValues) => {
  const counts = { "#4CAF50": 0, "#FFC107": 0, "#F44336": 0, "#D1D5DB": 0 };
  
  let activeDataCount = 0;
  hourlyValues.forEach((v) => {
    const color = getColor(v);
    counts[color]++;
    if (v !== null && v !== undefined) {
      activeDataCount++;
    }
  });

  const greenPercentage = (counts["#4CAF50"] / 24) * 100;
  if (greenPercentage > 75) {
    return "#4CAF50";
  }

  const fallbacks = [
    { color: "#FFC107", count: counts["#FFC107"] }, // Yellow
    { color: "#F44336", count: counts["#F44336"] }, // Red
    { color: "#9CA3AF", count: counts["#D1D5DB"] }  // Grey label styling
  ];

  const bestFallback = fallbacks.reduce((highest, current) => 
    current.count > highest.count ? current : highest
  );

  return bestFallback.color;
};

const HourlyRing = ({ hourlyValues, size = 80 }) => {
  const cx = size / 2;
  const cy = size / 2;
  const outerR = size / 2 - 2;
  const innerR = outerR * 0.55;
  const segments = 24;
  const gap = 3;
  const degPerSeg = 360 / segments;

  const polarToCartesian = (cx, cy, r, angleDeg) => {
    const rad = ((angleDeg - 90) * Math.PI) / 180;
    return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
  };

  const arcPath = (startDeg, endDeg, outerR, innerR) => {
    const s1 = polarToCartesian(cx, cy, outerR, startDeg);
    const e1 = polarToCartesian(cx, cy, outerR, endDeg);
    const s2 = polarToCartesian(cx, cy, innerR, endDeg);
    const e2 = polarToCartesian(cx, cy, innerR, startDeg);
    const large = endDeg - startDeg > 180 ? 1 : 0;
    return [
      `M ${s1.x} ${s1.y}`,
      `A ${outerR} ${outerR} 0 ${large} 1 ${e1.x} ${e1.y}`,
      `L ${s2.x} ${s2.y}`,
      `A ${innerR} ${innerR} 0 ${large} 0 ${e2.x} ${e2.y}`,
      "Z",
    ].join(" ");
  };

  const dominantColor = getDominantColor(hourlyValues);

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      {Array.from({ length: segments }, (_, i) => {
        const startDeg = i * degPerSeg + gap / 2;
        const endDeg = (i + 1) * degPerSeg - gap / 2;
        return (
          <path
            key={i}
            d={arcPath(startDeg, endDeg, outerR, innerR)}
            fill={getColor(hourlyValues[i])}
          />
        );
      })}
      <text
        x={cx}
        y={cy}
        textAnchor="middle"
        dominantBaseline="central"
        fontSize={size * 0.22}
        fontWeight="700"
        fill={dominantColor}
      />
    </svg>
  );
};

// ─── Main Component ───────────────────────────────────────────────────────────
const StationDetails = ({ station, onClose }) => {
  const { _id } = station;

  const { station: chosenStation, loading, error } = useStationById(_id);
  const displayStation = chosenStation || station;
  
  const { name, lastUpdate, location } = displayStation;

  const [records, setRecords] = useState([]);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(null);

  const handleDayClick = (date) => setSelectedDate(date);

  const handleDirectDateJump = (e) => {
    const dateString = e.target.value;
    if (!dateString) return;

    const [year, month] = dateString.split("-").map(Number);
    setCurrentMonth(new Date(year, month - 1, 1));
    setSelectedDate(dateString);
  };

  useEffect(() => {
    const fetchRecords = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/records/station/${_id}`);
        const data = await res.json();
        setRecords(data);
      } catch (err) {
        console.error(err);
      }
    };
    fetchRecords();
  }, [_id]);

  const hourlyMap = useMemo(() => {
    const raw = {};
    records.forEach((r) => {
      const d = new Date(r.date);
      const day =
        `${d.getUTCFullYear()}-` +
        `${String(d.getUTCMonth() + 1).padStart(2, "0")}-` +
        `${String(d.getUTCDate()).padStart(2, "0")}`;
      const hour = r.hour;
      const stationData = r.stations?.find(
        (s) => String(s.stationId) === String(_id)
      );
      if (!stationData) return;
      const spoof = stationData.spoofPrecents ?? null;
      const gem = stationData.gemPrecents ?? null;
      if (spoof === null && gem === null) return;
      const vals = [spoof, gem].filter((v) => v !== null);
      const avg = vals.reduce((a, b) => a + b, 0) / vals.length;
      if (!raw[day]) raw[day] = {};
      if (!raw[day][hour]) raw[day][hour] = { sum: 0, count: 0 };
      raw[day][hour].sum += avg;
      raw[day][hour].count += 1;
    });
    const result = {};
    Object.keys(raw).forEach((day) => {
      result[day] = Array.from({ length: 24 }, (_, h) => {
        const slot = raw[day][h];
        return slot ? slot.sum / slot.count : null;
      });
    });
    return result;
  }, [records, _id]);

  const calendarGrid = useMemo(() => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const cells = [];

    const prevMonthLastDay = new Date(year, month, 0);
    for (let i = firstDay.getDay() - 1; i >= 0; i--) {
      cells.push({ date: new Date(year, month - 1, prevMonthLastDay.getDate() - i), outside: true });
    }

    for (let day = 1; day <= lastDay.getDate(); day++) {
      cells.push({ date: new Date(year, month, day), outside: false });
    }

    const remaining = 42 - cells.length;
    for (let i = 1; i <= remaining; i++) {
      cells.push({ date: new Date(year, month + 1, i), outside: true });
    }

    return cells;
  }, [currentMonth]);

  const dateKey = (date) =>
    `${date.getFullYear()}-` +
    `${String(date.getMonth() + 1).padStart(2, "0")}-` +
    `${String(date.getDate()).padStart(2, "0")}`;

  if (selectedDate) {
    return (
      <DayDetails
        station={displayStation}
        stationId={_id}
        date={selectedDate}
        filter="spoofPrecents"
        onBack={() => setSelectedDate(null)}
      />
    );
  }

  return (
    <div className="station-page">
      <header className="station-page__header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <button className="station-page__back-button" onClick={onClose}>
            ← Back
          </button>
          <div className="station-page__title-group">
            <span className="station-page__icon">📍</span>
            <div>
              <h1 className="station-page__title">Station: {name}</h1>
              <div className="station-page__meta-group">
                {location?.coordinates && location.coordinates.length === 2 && (
                  <span className="station-page__coordinates">
                    Coordinates: {location.coordinates[1].toFixed(5)}°, {location.coordinates[0].toFixed(5)}°
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {lastUpdate && (
          <div className="station-page__last-record" style={{ textAlign: 'right', opacity: 0.8, fontSize: '0.9rem' }}>
            <strong>Last record:</strong> {new Date(lastUpdate).toLocaleString()}
          </div>
        )}
      </header>

      <main className="station-main">
        <div className="cal-search-container">
          <label htmlFor="date-search" className="cal-search-label">
            Search a Specific Date:
          </label>
          <input 
            type="date" 
            id="date-search" 
            className="cal-search-input"
            onChange={handleDirectDateJump}
            value=""
          />
        </div>

        <div className="cal-month-nav">
          <button
            className="cal-nav-btn"
            onClick={() =>
              setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1))
            }
          >
            ‹
          </button>
          <span className="cal-month-label">
            {currentMonth.toLocaleString("default", { month: "long", year: "numeric" })}
          </span>
          <button
            className="cal-nav-btn"
            onClick={() =>
              setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1))
            }
          >
            ›
          </button>
        </div>

        <div className="cal-legend">
          <span className="legend-dot green" /> 0 (Good)
          <span className="legend-dot yellow" /> 0 – 60 (Fair)
          <span className="legend-dot red" /> 60+ (Poor)
          <span className="legend-dot gray" /> No Data
        </div>

        <div className="cal-weekdays">
          {["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"].map((d) => (
            <div key={d} className="cal-weekday">{d}</div>
          ))}
        </div>

        <div className="cal-grid">
          {calendarGrid.map(({ date, outside }, idx) => {
            const key = dateKey(date);
            const hourly = hourlyMap[key] || Array(24).fill(null);
            const dominantColor = getDominantColor(hourly);

            return (
              <div
                key={`${key}-${idx}`}
                className={`cal-cell${outside ? " cal-cell--outside" : ""}`}
                onClick={() => !outside && handleDayClick(key)}
                title={outside ? undefined : `${key} — click for details`}
              >
                <div className="cal-cell__ring">
                  <HourlyRing hourlyValues={hourly} size={84} />
                  <span
                    className="cal-cell__day-num"
                    style={{ color: outside ? "#bbb" : dominantColor }}
                  >
                    {date.getDate()}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {loading && <div className="cal-status">Loading…</div>}
        {error && <div className="cal-status cal-status--error">{error}</div>}
      </main>
    </div>
  );
};

export default StationDetails;