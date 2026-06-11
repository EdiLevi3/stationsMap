import { useState, useEffect, useMemo } from "react";
import "./StationDetails.css";
import { useStationById } from "../../hooks/useStationById";
import { API_BASE_URL } from "../../config";
import DayDetails from "../DayDetails/DayDetails";
import WeeklyView from "../WeeklyView/WeeklyView";

const getColor = ({ spoof, jam } = {}) => {
  if (spoof === null && jam === null) return "#D1D5DB"; // no data
  if (spoof === 100 || jam >= 80) return "#F44336";    // red
  if (jam >= 40) return "#FFC107";                     // yellow
  return "#4CAF50";                                    // green
};

const getDominantColor = (hourlyValues) => {
  const counts = { "#4CAF50": 0, "#FFC107": 0, "#F44336": 0, "#D1D5DB": 0 };
  hourlyValues.forEach((v) => {
    const color = getColor(v);
    counts[color]++;
  });

  const greenPercentage = (counts["#4CAF50"] / 24) * 100;
  if (greenPercentage > 75) return "#4CAF50";

  const fallbacks = [
    { color: "#FFC107", count: counts["#FFC107"] },
    { color: "#F44336", count: counts["#F44336"] },
    { color: "#9CA3AF", count: counts["#D1D5DB"] },
  ];
  return fallbacks.reduce((h, c) => (c.count > h.count ? c : h)).color;
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
    </svg>
  );
};

const StationDetails = ({ station, onClose }) => {
  const { _id } = station;

  const { station: chosenStation, loading, error } = useStationById(_id);
  const displayStation = chosenStation || station;

  const { name, lastUpdate, location, antenna, frequency } = displayStation;

  const [records, setRecords] = useState([]);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(null);

  // ── View mode: "monthly" | "weekly" ──
  const [viewMode, setViewMode] = useState("monthly");

  // ── Weekly range ──
  const todayIso = useMemo(() => new Date().toISOString().split("T")[0], []);
  const defaultFrom = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() - 29);
    return d.toISOString().split("T")[0];
  }, []);
  const [weeklyFrom, setWeeklyFrom] = useState(defaultFrom);
  const [weeklyTo,   setWeeklyTo]   = useState(todayIso);

  const handleDayClick = (date) => {
    if (date > todayIso) return;
    setSelectedDate(date);
  };

  const handleDirectDateJump = (e) => {
    const dateString = e.target.value;
    if (!dateString || dateString > todayIso) return;
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
      const jam   = stationData.jamPrecents  ?? null;
      if (spoof === null && jam === null) return;

      if (!raw[day]) raw[day] = {};
      if (!raw[day][hour]) raw[day][hour] = { spoofSum: 0, jamSum: 0, spoofCount: 0, jamCount: 0 };

      if (spoof !== null) { raw[day][hour].spoofSum += spoof; raw[day][hour].spoofCount++; }
      if (jam !== null) { raw[day][hour].jamSum += jam; raw[day][hour].jamCount++; }
    });

    const result = {};
    Object.keys(raw).forEach((day) => {
      result[day] = Array.from({ length: 24 }, (_, h) => {
        const slot = raw[day][h];
        if (!slot) return { spoof: null, jam: null };
        return {
          spoof: slot.spoofCount ? slot.spoofSum / slot.spoofCount : null,
          jam:   slot.jamCount   ? slot.jamSum   / slot.jamCount   : null,
        };
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
        onClose={onClose}
      />
    );
  }

  return (
    <div className="station-page">
      <header className="station-page__header">
        <div style={{ display: "flex", alignItems: "center", gap: "1rem", minWidth: 0 }}>
          <div className="station-page__title-group">
            <div style={{ minWidth: 0 }}>
              <h1 className="station-page__title">📍Station: {name}</h1>
              <div className="station-page__meta-group">
                {location?.coordinates && location.coordinates.length === 2 && (
                  <span className="station-page__meta-item">
                    <strong>Coords:</strong> {location.coordinates[1]}°, {location.coordinates[0]}°
                  </span>
                )}
                <span className="station-page__meta-item">
                  <strong>Antenna:</strong> {antenna || "N/A"}
                </span>
                <span className="station-page__meta-item">
                  <strong>Freq:</strong> {frequency ? `${frequency} MHz` : "N/A"}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "1.25rem", flexShrink: 0 }}>
          {lastUpdate && (
            <div className="station-page__last-record">
              <span className="station-page__last-record-label">Last update:</span>
              <span className="station-page__last-record-value">{new Date(lastUpdate).toLocaleString()}</span>
            </div>
          )}
          <button
            className="station-page__close-btn"
            onClick={onClose}
            title="Close station details"
            aria-label="Close station details"
          >
            ✕
          </button>
        </div>
      </header>

      <main className="station-main">

        {/* ── View mode toggle ── */}
        <div className="sd-view-toggle">
          <button
            className={`sd-view-btn${viewMode === "monthly" ? " sd-view-btn--active" : ""}`}
            onClick={() => setViewMode("monthly")}
          >
             Monthly
          </button>
          <button
            className={`sd-view-btn${viewMode === "weekly" ? " sd-view-btn--active" : ""}`}
            onClick={() => setViewMode("weekly")}
          >
             Weekly
          </button>
        </div>

        {/* ══════════════════════════════
            MONTHLY VIEW
        ══════════════════════════════ */}
        {viewMode === "monthly" && (
          <>
            <div className="cal-search-container">
              <label htmlFor="date-search" className="cal-search-label">
                Search a Specific Date:
              </label>
              <input
                type="date"
                id="date-search"
                className="cal-search-input"
                max={todayIso}
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
              <span className="legend-dot green" /> Good (no spoof, jam &lt; 40%)
              <span className="legend-dot yellow" /> Fair (jam 40–80)
              <span className="legend-dot red" /> Poor (spoof or jam ≥ 80%)
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
                const isFuture = key > todayIso;
                const hourly = hourlyMap[key] || Array(24).fill({ spoof: null, jam: null });
                const dominantColor = getDominantColor(hourly);
                return (
                  <div
                    key={`${key}-${idx}`}
                    className={`cal-cell${outside ? " cal-cell--outside" : ""}${isFuture ? " cal-cell--future" : ""}`}
                    onClick={() => !outside && !isFuture && handleDayClick(key)}
                    title={outside || isFuture ? undefined : `${key} — click for details`}
                    style={{ cursor: outside || isFuture ? "default" : "pointer" }}
                  >
                    <div className="cal-cell__ring">
                      <HourlyRing hourlyValues={hourly} size={84} />
                      <span
                        className="cal-cell__day-num"
                        style={{ color: (outside || isFuture) ? "#bbb" : dominantColor }}
                      >
                        {date.getDate()}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}

        {/* ══════════════════════════════
            WEEKLY VIEW
        ══════════════════════════════ */}
        {viewMode === "weekly" && (
          <>
            {/* Date range picker */}
            <div className="cal-search-container sd-weekly-range">
              <label className="cal-search-label">From</label>
              <input
                type="date"
                className="cal-search-input"
                max={todayIso}
                value={weeklyFrom}
                onChange={(e) => {
                  if (e.target.value > todayIso) return;
                  setWeeklyFrom(e.target.value);
                }}
              />
              <span className="sd-range-arrow">→</span>
              <label className="cal-search-label">To</label>
              <input
                type="date"
                className="cal-search-input"
                max={todayIso}
                value={weeklyTo}
                onChange={(e) => {
                  if (e.target.value > todayIso) return;
                  setWeeklyTo(e.target.value);
                }}
              />
              {weeklyFrom && weeklyTo && weeklyFrom <= weeklyTo && (
                <span className="sd-range-info">
                  {Math.round((new Date(weeklyTo) - new Date(weeklyFrom)) / 86400000) + 1} days
                </span>
              )}
            </div>

            {weeklyFrom && weeklyTo && weeklyFrom <= weeklyTo ? (
              <WeeklyView
                records={records}
                stationId={_id}
                fromDate={weeklyFrom}
                toDate={weeklyTo}
              />
            ) : (
              <div className="cal-status">Please select a valid date range.</div>
            )}
          </>
        )}

        {loading && <div className="cal-status">Loading…</div>}
        {error && <div className="cal-status cal-status--error">{error}</div>}
      </main>
    </div>
  );
};

export default StationDetails;