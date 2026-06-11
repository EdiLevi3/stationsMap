import { useState, useEffect, useMemo } from "react";
import "../shared/station-page.css";
import "./StationDetails.css";
import { useStationById } from "../../hooks/useStationById";
import { API_BASE_URL } from "../../config";
import { getDominantColor } from "../../utils/colorUtils";
import DayDetails from "../DayDetails/DayDetails";
import WeeklyView from "../WeeklyView/WeeklyView";
import HourlyRing from "./HourlyRing";

const StationDetails = ({ station, onClose }) => {
  const { _id } = station;
  const { station: chosenStation, loading, error } = useStationById(_id);
  const displayStation = chosenStation || station;
  const { name, lastUpdate, location, antenna, frequency } = displayStation;

  const [records, setRecords] = useState([]);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(null);
  const [viewMode, setViewMode] = useState("monthly");

  const todayIso = useMemo(() => new Date().toISOString().split("T")[0], []);
  const defaultFrom = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() - 29);
    return d.toISOString().split("T")[0];
  }, []);
  const [weeklyFrom, setWeeklyFrom] = useState(defaultFrom);
  const [weeklyTo, setWeeklyTo] = useState(todayIso);

  useEffect(() => {
    const fetchRecords = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/records/station/${_id}`);
        setRecords(await res.json());
      } catch (err) {
        console.error("Error fetching station records:", err);
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
      const stationData = r.stations?.find((s) => String(s.stationId) === String(_id));
      if (!stationData) return;
      const spoof = stationData.spoofPrecents ?? null;
      const jam = stationData.jamPrecents ?? null;
      if (spoof === null && jam === null) return;
      if (!raw[day]) raw[day] = {};
      if (!raw[day][r.hour]) raw[day][r.hour] = { spoofSum: 0, jamSum: 0, spoofCount: 0, jamCount: 0 };
      if (spoof !== null) { raw[day][r.hour].spoofSum += spoof; raw[day][r.hour].spoofCount++; }
      if (jam !== null) { raw[day][r.hour].jamSum += jam; raw[day][r.hour].jamCount++; }
    });
    const result = {};
    Object.keys(raw).forEach((day) => {
      result[day] = Array.from({ length: 24 }, (_, h) => {
        const slot = raw[day][h];
        if (!slot) return { spoof: null, jam: null };
        return {
          spoof: slot.spoofCount ? slot.spoofSum / slot.spoofCount : null,
          jam: slot.jamCount ? slot.jamSum / slot.jamCount : null,
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
    const prevMonthLastDay = new Date(year, month, 0);
    const cells = [];
    for (let i = firstDay.getDay() - 1; i >= 0; i--)
      cells.push({ date: new Date(year, month - 1, prevMonthLastDay.getDate() - i), outside: true });
    for (let day = 1; day <= lastDay.getDate(); day++)
      cells.push({ date: new Date(year, month, day), outside: false });
    for (let i = 1; i <= 42 - cells.length; i++)
      cells.push({ date: new Date(year, month + 1, i), outside: true });
    return cells;
  }, [currentMonth]);

  const dateKey = (date) =>
    `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;

  if (selectedDate) {
    return (
      <DayDetails
        station={displayStation}
        stationId={_id}
        date={selectedDate}
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
                {location?.coordinates?.length === 2 && (
                  <span className="station-page__meta-item">
                    <strong>Coords:</strong> {location.coordinates[1]}°, {location.coordinates[0]}°
                  </span>
                )}
                <span className="station-page__meta-item"><strong>Antenna:</strong> {antenna || "N/A"}</span>
                <span className="station-page__meta-item"><strong>Freq:</strong> {frequency ? `${frequency} MHz` : "N/A"}</span>
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
          <button className="station-page__close-btn" onClick={onClose} title="Close" aria-label="Close">✕</button>
        </div>
      </header>

      <main className="station-main">
        <div className="sd-view-toggle">
          <button className={`sd-view-btn${viewMode === "monthly" ? " sd-view-btn--active" : ""}`} onClick={() => setViewMode("monthly")}>Monthly</button>
          <button className={`sd-view-btn${viewMode === "weekly" ? " sd-view-btn--active" : ""}`} onClick={() => setViewMode("weekly")}>Weekly</button>
        </div>

        {viewMode === "monthly" && (
          <>
            <div className="cal-search-container">
              <label htmlFor="date-search" className="cal-search-label">Search a Specific Date:</label>
              <input
                type="date" id="date-search" className="cal-search-input"
                max={todayIso} onChange={(e) => {
                  const v = e.target.value;
                  if (!v || v > todayIso) return;
                  const [year, month] = v.split("-").map(Number);
                  setCurrentMonth(new Date(year, month - 1, 1));
                  setSelectedDate(v);
                }} value=""
              />
            </div>

            <div className="cal-month-nav">
              <button className="cal-nav-btn" onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1))}>‹</button>
              <span className="cal-month-label">{currentMonth.toLocaleString("default", { month: "long", year: "numeric" })}</span>
              <button className="cal-nav-btn" onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1))}>›</button>
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
                    onClick={() => !outside && !isFuture && setSelectedDate(key)}
                    title={outside || isFuture ? undefined : `${key} — click for details`}
                    style={{ cursor: outside || isFuture ? "default" : "pointer" }}
                  >
                    <div className="cal-cell__ring">
                      <HourlyRing hourlyValues={hourly} size={84} />
                      <span className="cal-cell__day-num" style={{ color: (outside || isFuture) ? "#bbb" : dominantColor }}>
                        {date.getDate()}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}

        {viewMode === "weekly" && (
          <>
            <div className="cal-search-container sd-weekly-range">
              <label className="cal-search-label">From</label>
              <input type="date" className="cal-search-input" max={todayIso} value={weeklyFrom}
                onChange={(e) => { if (e.target.value <= todayIso) setWeeklyFrom(e.target.value); }} />
              <span className="sd-range-arrow">→</span>
              <label className="cal-search-label">To</label>
              <input type="date" className="cal-search-input" max={todayIso} value={weeklyTo}
                onChange={(e) => { if (e.target.value <= todayIso) setWeeklyTo(e.target.value); }} />
              {weeklyFrom && weeklyTo && weeklyFrom <= weeklyTo && (
                <span className="sd-range-info">
                  {Math.round((new Date(weeklyTo) - new Date(weeklyFrom)) / 86400000) + 1} days
                </span>
              )}
            </div>
            {weeklyFrom && weeklyTo && weeklyFrom <= weeklyTo ? (
              <WeeklyView records={records} stationId={_id} fromDate={weeklyFrom} toDate={weeklyTo} />
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
