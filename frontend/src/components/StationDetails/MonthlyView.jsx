import React from "react";
import HourlyRing from "./HourlyRing";
import { getDominantColor } from "../../utils/colorUtils";

const MonthlyView = ({
  currentMonth,
  setCurrentMonth,
  setSelectedDate,
  todayIso,
  calendarGrid,
  hourlyMap,
}) => {
  const dateKey = (date) =>
    `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;

  return (
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
  );
};

export default MonthlyView;
