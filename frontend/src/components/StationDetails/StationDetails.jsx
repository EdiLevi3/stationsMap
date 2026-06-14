import { useState, useMemo } from "react";
import "../shared/station-page.css";
import "./StationDetails.css";
import { useStationById } from "../../hooks/useStationById";
import { useStationRecords } from "../../hooks/useStationRecords";
import { useCalendarGrid } from "../../hooks/useCalendarGrid";
import DayDetails from "../DayDetails/DayDetails";
import WeeklyView from "../WeeklyView/WeeklyView";
import MonthlyView from "./MonthlyView";
import StationHeader from "../shared/StationHeader";

const StationDetails = ({ station, onClose }) => {
  const { _id } = station;
  const { station: chosenStation } = useStationById(_id);
  const displayStation = chosenStation || station;

  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(null);
  const [viewMode, setViewMode] = useState("monthly");

  const { records, hourlyMap, loading, error } = useStationRecords(_id);
  const calendarGrid = useCalendarGrid(currentMonth);

  const todayIso = useMemo(() => new Date().toISOString().split("T")[0], []);
  const defaultFrom = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() - 29);
    return d.toISOString().split("T")[0];
  }, []);
  
  const [weeklyFrom, setWeeklyFrom] = useState(defaultFrom);
  const [weeklyTo, setWeeklyTo] = useState(todayIso);

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

  const { lastUpdate } = displayStation;

  return (
    <div className="station-page">
      <StationHeader station={displayStation} onClose={onClose}>
        {lastUpdate && (
          <div className="station-page__last-record">
            <span className="station-page__last-record-label">Last update:</span>
            <span className="station-page__last-record-value">{new Date(lastUpdate).toLocaleString()}</span>
          </div>
        )}
      </StationHeader>

      <main className="station-main">
        <div className="sd-view-toggle">
          {["monthly", "weekly"].map((mode) => (
            <button
              key={mode}
              className={`sd-view-btn${viewMode === mode ? " sd-view-btn--active" : ""}`}
              onClick={() => setViewMode(mode)}
            >
              {mode.charAt(0).toUpperCase() + mode.slice(1)}
            </button>
          ))}
        </div>

        {viewMode === "monthly" ? (
          <MonthlyView
            currentMonth={currentMonth}
            setCurrentMonth={setCurrentMonth}
            setSelectedDate={setSelectedDate}
            todayIso={todayIso}
            calendarGrid={calendarGrid}
            hourlyMap={hourlyMap}
          />
        ) : (
          <>
            <div className="cal-search-container sd-weekly-range">
              <label className="cal-search-label">From</label>
              <input type="date" className="cal-search-input" max={weeklyTo || todayIso} value={weeklyFrom}
                onChange={(e) => e.target.value <= todayIso && setWeeklyFrom(e.target.value)} />
              <span className="sd-range-arrow">→</span>
              <label className="cal-search-label">To</label>
              <input type="date" className="cal-search-input" min={weeklyFrom} max={todayIso} value={weeklyTo}
                onChange={(e) => e.target.value <= todayIso && setWeeklyTo(e.target.value)} />
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
