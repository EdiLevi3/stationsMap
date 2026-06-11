import { useMemo, useState, useEffect, useRef } from "react";
import { Chart, LineController, LineElement, PointElement, LinearScale, CategoryScale, Tooltip as ChartTooltip, Legend, Filler } from "chart.js";
import "./WeeklyView.css";

Chart.register(LineController, LineElement, PointElement, LinearScale, CategoryScale, ChartTooltip, Legend, Filler);

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const HOURS = Array.from({ length: 24 }, (_, i) => i);

const getColor = (val, type) => {
  if (val == null) return "#9CA3AF";
  if (type === "spoof" || type === "gam") {
    if (val <= 0) return "#4CAF50";
    if (val <= 60) return "#FFC107";
    return "#F44336";
  }
  // record
  if (val >= 80) return "#4CAF50";
  if (val >= 50) return "#FFC107";
  return "#F44336";
};

const METRICS = [
  { key: "recordPrecent", label: "Record %",    type: "record" },
  { key: "spoofPrecents", label: "Spoofing %",  type: "spoof"  },
  { key: "gamPrecents",   label: "Gamming %",   type: "gam"    },
];


// One color per weekday — distinct, readable
const DAY_COLORS = [
  "#6366f1", // Sun — indigo
  "#0ea5e9", // Mon — sky
  "#10b981", // Tue — emerald
  "#f59e0b", // Wed — amber
  "#ef4444", // Thu — red
  "#8b5cf6", // Fri — violet
  "#ec4899", // Sat — pink
];

// Line chart: 24 hours on X, one line per weekday
const HourlyLineChart = ({ hourlyAvgs, activeMetric, visibleDays, onToggleDay }) => {
  const canvasRef = useRef(null);
  const chartRef  = useRef(null);

  const datasets = useMemo(() =>
    DAYS.map((day, dow) => ({
      label: day,
      data: HOURS.map((h) => hourlyAvgs[dow][h][activeMetric.key] ?? null),
      borderColor: DAY_COLORS[dow],
      backgroundColor: DAY_COLORS[dow] + "18",
      borderWidth: 2,
      pointRadius: 3,
      pointHoverRadius: 5,
      pointBackgroundColor: DAY_COLORS[dow],
      tension: 0.35,
      spanGaps: true,
      hidden: !visibleDays[dow],
    })),
    [hourlyAvgs, activeMetric, visibleDays]
  );

  useEffect(() => {
    if (!canvasRef.current) return;
    if (chartRef.current) chartRef.current.destroy();
    chartRef.current = new Chart(canvasRef.current, {
      type: "line",
      data: {
        labels: HOURS.map((h) => String(h).padStart(2, "0") + ":00"),
        datasets,
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: { mode: "index", intersect: false },
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: (ctx) =>
                ctx.parsed.y != null
                  ? `${ctx.dataset.label}: ${ctx.parsed.y}%`
                  : `${ctx.dataset.label}: no data`,
            },
          },
        },
        scales: {
          x: {
            grid: { color: "#f1f5f9" },
            ticks: {
              color: "#94a3b8",
              font: { size: 11 },
              maxTicksLimit: 12,
              maxRotation: 0,
            },
          },
          y: {
            min: 0,
            max: 100,
            grid: { color: "#f1f5f9" },
            ticks: {
              color: "#94a3b8",
              font: { size: 11 },
              callback: (v) => v + "%",
            },
          },
        },
      },
    });
    return () => { if (chartRef.current) chartRef.current.destroy(); };
  }, [datasets]);

  return (
    <div className="wv-chart-wrap">
      {/* Custom legend — clickable to toggle lines */}
      <div className="wv-chart-legend">
        {DAYS.map((d, i) => (
          <button
            key={d}
            className={`wv-chart-legend-item${visibleDays[i] ? "" : " wv-chart-legend-item--off"}`}
            onClick={() => onToggleDay(i)}
            style={{ "--day-color": DAY_COLORS[i] }}
          >
            <span className="wv-chart-legend-dot" />
            {d}
          </button>
        ))}
      </div>
      <div style={{ position: "relative", height: "220px" }}>
        <canvas ref={canvasRef} role="img" aria-label="Hourly averages by weekday line chart" />
      </div>
    </div>
  );
};


// Count how many times each weekday (0=Sun..6=Sat) appears between fromDate and toDate (inclusive)
const countWeekdaysInRange = (fromDate, toDate) => {
  const counts = [0, 0, 0, 0, 0, 0, 0];
  if (!fromDate || !toDate) return counts;
  const cur = new Date(fromDate + "T00:00:00Z");
  const end = new Date(toDate   + "T00:00:00Z");
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

  // Count of each weekday in the selected range — this is the denominator
  const dowCounts = useMemo(
    () => countWeekdaysInRange(fromDate, toDate),
    [fromDate, toDate]
  );

  // Build [dow][hour] -> sums + sample counts, then divide sum by dowCounts[dow]
  const hourlyAvgs = useMemo(() => {
    // buckets[dow][hour][metric] = { sum, samplesWithData }
    const buckets = Array.from({ length: 7 }, () =>
      Array.from({ length: 24 }, () => ({
        spoofPrecents: { sum: 0, n: 0 },
        gamPrecents:   { sum: 0, n: 0 },
        recordPrecent: { sum: 0, n: 0 },
      }))
    );

    records.forEach((r) => {
      const d = new Date(r.date); // works whether r.date is Date object or ISO string

      // Build UTC date string for range comparison
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
      // spoofPrecents and gamPrecents default to 0 in schema, so they always exist
      // treat them as always present (no null check needed for spoof/gam)
      bucket.spoofPrecents.sum += s.spoofPrecents ?? 0;
      bucket.spoofPrecents.n++;
      bucket.gamPrecents.sum   += s.gamPrecents   ?? 0;
      bucket.gamPrecents.n++;
      if (s.recordPrecent != null) {
        bucket.recordPrecent.sum += s.recordPrecent;
        bucket.recordPrecent.n++;
      }
    });

    // Divide each sum by the total number of that weekday in range (not just days with data)
    return buckets.map((day, dow) => {
      const totalDays = dowCounts[dow]; // e.g. 4 Sundays in range
      return day.map((h) => {
        // If no data at all for this slot, return null (truly unknown)
        // If there is at least 1 sample, sum / totalDays gives the "diluted" avg
        const calc = (slot) =>
          slot.n === 0 || totalDays === 0
            ? null
            : Math.round(slot.sum / totalDays);

        return {
          spoofPrecents: calc(h.spoofPrecents),
          gamPrecents:   calc(h.gamPrecents),
          recordPrecent: calc(h.recordPrecent),
          // keep both for tooltip: how many had data vs total possible
          samplesWithData: Math.max(h.spoofPrecents.n, h.gamPrecents.n, h.recordPrecent.n),
          totalDays,
        };
      });
    });
  }, [records, stationId, fromDate, toDate, dowCounts]);

  // Per-day avg: sum all 24 hour values (null = 0) and divide by 24
  const dayAvgs = useMemo(() =>
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
      {/* Metric tabs */}
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
          {/* Overview strip */}
          <div className="wv-overview">
            {DAYS.map((d, i) => {
              const val = dayAvgs[i];
              const color = getColor(val, activeMetric.type);
              return (
                <div className="wv-ov-card" key={d}>
                  <span className="wv-ov-day">{d}</span>
                  <span className="wv-ov-val" style={{ color }}>
                    {val != null ? `${val}%` : "—"}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Line chart */}
          <HourlyLineChart
            hourlyAvgs={hourlyAvgs}
            activeMetric={activeMetric}
            visibleDays={visibleDays}
            onToggleDay={handleToggleDay}
          />

          {/* One row per weekday board */}
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
                      const slot = dayHours[h];
                      const val  = slot[activeMetric.key];
                      const color = getColor(val, activeMetric.type);
                      const barH = val != null ? Math.max(Math.round((val / 100) * 44), 2) : 2;
                      const noData = val == null;

                      return (
                        <div
                          key={h}
                          className="wv-h-cell"
                          onMouseEnter={(e) => {
                            const rect = e.currentTarget.getBoundingClientRect();
                            const parentRect = e.currentTarget.closest(".wv-wrap").getBoundingClientRect();
                            setTooltip({
                              dow,
                              hour: h,
                              val,
                              samplesWithData: slot.samplesWithData,
                              totalDays: slot.totalDays,
                              color,
                              x: rect.left - parentRect.left + rect.width / 2,
                              y: rect.top  - parentRect.top,
                            });
                          }}
                          onMouseLeave={() => setTooltip(null)}
                        >
                          <div className="wv-bar-wrap">
                            <div
                              className="wv-bar"
                              style={{
                                height: `${barH}px`,
                                background: noData ? "#E5E7EB" : color,
                              }}
                            />
                          </div>
                          <div
                            className="wv-h-line"
                            style={{ background: noData ? "#E5E7EB" : color }}
                          />
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

          {/* Legend */}
          <div className="wv-legend">
            <span><span className="wv-dot wv-dot--green" />Good</span>
            <span><span className="wv-dot wv-dot--yellow" />Fair</span>
            <span><span className="wv-dot wv-dot--red" />Poor</span>
            <span><span className="wv-dot wv-dot--gray" />No data</span>
            <span className="wv-legend-hint">hover a bar for details</span>
          </div>
        </>
      )}

      {/* Tooltip */}
      {tooltip && (
        <div
          className="wv-tooltip"
          style={{ left: tooltip.x, top: tooltip.y - 8 }}
        >
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