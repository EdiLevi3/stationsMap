import { useMemo, useState } from "react";
import { getColor } from "../../utils/colorUtils";
import { METRICS } from "../../utils/metricsConfig";
import HourlyLineChart from "./HourlyLineChart";
import "./WeeklyView.css";

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const HOURS = Array.from({ length: 24 }, (_, i) => i);

const countWeekdaysInRange = (fromDate, toDate) => {
  const counts = [0, 0, 0, 0, 0, 0, 0];
  if (!fromDate || !toDate) return counts;
  const cur = new Date(fromDate + "T00:00:00Z");
  const end = new Date(toDate + "T00:00:00Z");
  while (cur <= end) {
    counts[cur.getUTCDay()]++;
    cur.setUTCDate(cur.getUTCDate() + 1);
  }
  return counts;
};

const WeeklyView = ({ records, stationId, fromDate, toDate }) => {
  const [activeMetric, setActiveMetric] = useState(METRICS[0]);
  const [tooltip, setTooltip] = useState(null);
  const [visibleDays, setVisibleDays] = useState([true, true, true, true, true, true, true]);

  const handleToggleDay = (dow) =>
    setVisibleDays((prev) => prev.map((v, i) => (i === dow ? !v : v)));

  const dowCounts = useMemo(
    () => countWeekdaysInRange(fromDate, toDate),
    [fromDate, toDate]
  );

  const hourlyAvgs = useMemo(() => {
    const buckets = Array.from({ length: 7 }, () =>
      Array.from({ length: 24 }, () => ({
        spoofPrecents: { sum: 0, n: 0 },
        jamPrecents:   { sum: 0, n: 0 },
        recordPrecent: { sum: 0, n: 0 },
      }))
    );

    records.forEach((r) => {
      const d = new Date(r.date);
      const dayStr =
        `${d.getUTCFullYear()}-` +
        `${String(d.getUTCMonth() + 1).padStart(2, "0")}-` +
        `${String(d.getUTCDate()).padStart(2, "0")}`;
      if (dayStr < fromDate || dayStr > toDate) return;
      const dow  = d.getUTCDay();
      const hour = r.hour;
      if (hour == null || hour < 0 || hour > 23) return;
      const s = r.stations?.find(
        (x) => String(x.stationId).trim() === String(stationId).trim()
      );
      if (!s) return;
      const bucket = buckets[dow][hour];
      bucket.spoofPrecents.sum += s.spoofPrecents ?? 0; bucket.spoofPrecents.n++;
      bucket.jamPrecents.sum   += s.jamPrecents   ?? 0; bucket.jamPrecents.n++;
      if (s.recordPrecent != null) {
        bucket.recordPrecent.sum += s.recordPrecent;
        bucket.recordPrecent.n++;
      }
    });

    return buckets.map((day, dow) => {
      const totalDays = dowCounts[dow];
      return day.map((h) => {
        const calc = (slot) =>
          slot.n === 0 || totalDays === 0 ? null : Math.round(slot.sum / totalDays);
        return {
          spoofPrecents: calc(h.spoofPrecents),
          jamPrecents:   calc(h.jamPrecents),
          recordPrecent: calc(h.recordPrecent),
          samplesWithData: Math.max(h.spoofPrecents.n, h.jamPrecents.n, h.recordPrecent.n),
          totalDays,
        };
      });
    });
  }, [records, stationId, fromDate, toDate, dowCounts]);

  const dayAvgs = useMemo(
    () =>
      hourlyAvgs.map((dayHours) => {
        const hasAny = dayHours.some((h) => h[activeMetric.key] != null);
        if (!hasAny) return null;
        const sum = dayHours.reduce((a, h) => a + (h[activeMetric.key] ?? 0), 0);
        return Math.round(sum / 24);
      }),
    [hourlyAvgs, activeMetric]
  );

  const hasAnyData = hourlyAvgs.some((day) => day.some((h) => h.samplesWithData > 0));

  return (
    <div className="wv-wrap">
      <div className="wv-tabs">
        {METRICS.map((m) => (
          <button
            key={m.key}
            className={`wv-tab${activeMetric.key === m.key ? " wv-tab--active" : ""}`}
            onClick={() => setActiveMetric(m)}
          >
            {m.label}
          </button>
        ))}
      </div>

      {!hasAnyData ? (
        <div className="wv-empty">No data for the selected range.</div>
      ) : (
        <>
          <div className="wv-overview">
            {DAYS.map((d, i) => {
              const val = dayAvgs[i];
              return (
                <div className="wv-ov-card" key={d}>
                  <span className="wv-ov-day">{d}</span>
                  <span className="wv-ov-val" style={{ color: getColor(val, activeMetric.type) }}>
                    {val != null ? `${val}%` : "—"}
                  </span>
                </div>
              );
            })}
          </div>

          <HourlyLineChart
            hourlyAvgs={hourlyAvgs}
            activeMetric={activeMetric}
            visibleDays={visibleDays}
            onToggleDay={handleToggleDay}
          />

          <div className="wv-board">
            {DAYS.map((dayName, dow) => {
              const dayHours = hourlyAvgs[dow];
              const da = dayAvgs[dow];
              const daColor = getColor(da, activeMetric.type);
              return (
                <div className="wv-day-row" key={dow}>
                  <div className="wv-day-label">
                    <span className="wv-day-name">{dayName}</span>
                    <span className="wv-day-avg" style={{ color: daColor }}>
                      {da != null ? `${da}%` : "—"}
                    </span>
                  </div>
                  <div className="wv-hours">
                    {HOURS.map((h) => {
                      const slot  = dayHours[h];
                      const val   = slot[activeMetric.key];
                      const color = getColor(val, activeMetric.type);
                      const barH  = val != null ? Math.max(Math.round((val / 100) * 44), 2) : 2;
                      const noData = val == null;
                      return (
                        <div
                          key={h}
                          className="wv-h-cell"
                          onMouseEnter={(e) => {
                            const rect = e.currentTarget.getBoundingClientRect();
                            const parentRect = e.currentTarget.closest(".wv-wrap").getBoundingClientRect();
                            setTooltip({
                              dow, hour: h, val, color,
                              samplesWithData: slot.samplesWithData,
                              totalDays: slot.totalDays,
                              x: rect.left - parentRect.left + rect.width / 2,
                              y: rect.top  - parentRect.top,
                            });
                          }}
                          onMouseLeave={() => setTooltip(null)}
                        >
                          <div className="wv-bar-wrap">
                            <div
                              className="wv-bar"
                              style={{ height: `${barH}px`, background: noData ? "#E5E7EB" : color }}
                            />
                          </div>
                          <div className="wv-h-line" style={{ background: noData ? "#E5E7EB" : color }} />
                          <span className="wv-h-num">
                            {h % 6 === 0 ? String(h).padStart(2, "0") : ""}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="wv-legend">
            <span><span className="wv-dot wv-dot--green" />Good</span>
            <span><span className="wv-dot wv-dot--yellow" />Fair</span>
            <span><span className="wv-dot wv-dot--red" />Poor</span>
            <span><span className="wv-dot wv-dot--gray" />No data</span>
            <span className="wv-legend-hint">hover a bar for details</span>
          </div>
        </>
      )}

      {tooltip && (
        <div className="wv-tooltip" style={{ left: tooltip.x, top: tooltip.y - 8 }}>
          <div className="wv-tooltip-time">
            {DAYS[tooltip.dow]} {String(tooltip.hour).padStart(2, "0")}:00
          </div>
          <div className="wv-tooltip-val" style={{ color: tooltip.color }}>
            {tooltip.val != null ? `${tooltip.val}%` : "no data"}
          </div>
          <div className="wv-tooltip-n">
            {tooltip.samplesWithData} / {tooltip.totalDays} {DAYS[tooltip.dow]}s had data
          </div>
        </div>
      )}
    </div>
  );
};

export default WeeklyView;
