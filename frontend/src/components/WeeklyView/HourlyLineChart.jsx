import { useMemo, useEffect, useRef } from "react";
import {
  Chart,
  LineController,
  LineElement,
  PointElement,
  LinearScale,
  CategoryScale,
  Tooltip as ChartTooltip,
  Legend,
  Filler,
} from "chart.js";

Chart.register(LineController, LineElement, PointElement, LinearScale, CategoryScale, ChartTooltip, Legend, Filler);

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const HOURS = Array.from({ length: 24 }, (_, i) => i);

const DAY_COLORS = [
  "#6366f1",
  "#0ea5e9",
  "#10b981",
  "#f59e0b",
  "#ef4444",
  "#8b5cf6",
  "#ec4899",
];

const HourlyLineChart = ({ hourlyAvgs, activeMetric, visibleDays, onToggleDay }) => {
  const canvasRef = useRef(null);
  const chartRef = useRef(null);

  const datasets = useMemo(
    () =>
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
            ticks: { color: "#94a3b8", font: { size: 11 }, maxTicksLimit: 12, maxRotation: 0 },
          },
          y: {
            min: 0,
            max: 100,
            grid: { color: "#f1f5f9" },
            ticks: { color: "#94a3b8", font: { size: 11 }, callback: (v) => v + "%" },
          },
        },
      },
    });
    return () => { if (chartRef.current) chartRef.current.destroy(); };
  }, [datasets]);

  return (
    <div className="wv-chart-wrap">
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

export default HourlyLineChart;
