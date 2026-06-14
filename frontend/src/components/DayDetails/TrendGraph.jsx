import React from "react";
import { getColor } from "../../utils/colorUtils";

const HOURS = Array.from({ length: 24 }, (_, i) => i);

const TrendGraph = ({ valuesByHour, activeMetric, activeType }) => {
  const height = 100;
  const width = 800;

  const points = HOURS.map((hour, i) => {
    const val = valuesByHour[hour]?.[activeMetric] ?? 0;
    const x = (i / 23) * width;
    const y = height - (Math.min(val, 100) / 100) * height;
    return `${x},${y}`;
  });

  return (
    <div className="dd-trend-graph">
      <svg viewBox={`-45 -15 ${width + 70} ${height + 40}`} preserveAspectRatio="none" style={{ width: "100%", height: "160px" }}>
        <defs>
          <linearGradient id="chart-grad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#1a1a2e" stopOpacity="0.15" />
            <stop offset="100%" stopColor="#1a1a2e" stopOpacity="0" />
          </linearGradient>
        </defs>

        <g fill="#64748b" fontSize="11px" fontWeight="600" textAnchor="end">
          <text x="-12" y="4">100%</text>
          <text x="-12" y={height / 2 + 4}>50%</text>
          <text x="-12" y={height + 4}>0%</text>
        </g>

        <line x1="0" y1="0" x2={width} y2="0" stroke="#f1f5f9" strokeWidth="1" strokeDasharray="4 4" />
        <line x1="0" y1={height / 2} x2={width} y2={height / 2} stroke="#f1f5f9" strokeWidth="1" strokeDasharray="4 4" />
        <line x1="0" y1={height} x2={width} y2={height} stroke="#e2e8f0" strokeWidth="1.5" />

        {HOURS.map((hour) => {
          if (hour % 2 !== 0 && hour !== 23) return null;
          const x = (hour / 23) * width;
          return (
            <g key={`axis-${hour}`}>
              <line x1={x} y1="0" x2={x} y2={height} stroke="#f1f5f9" strokeWidth="1" />
              <text x={x} y={height + 18} textAnchor="middle" fill="#64748b" fontSize="11px" fontWeight="600" style={{ fontFamily: "inherit" }}>
                {String(hour).padStart(2, "0")}:00
              </text>
            </g>
          );
        })}

        <path d={`M 0,${height} L ${points.join(" L ")} L ${width},${height} Z`} fill="url(#chart-grad)" />
        <path d={`M ${points.join(" L ")}`} fill="none" stroke="#1a1a2e" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />

        {HOURS.map((hour, i) => {
          const val = valuesByHour[hour]?.[activeMetric];
          if (val == null) return null;
          const x = (i / 23) * width;
          const y = height - (Math.min(val, 100) / 100) * height;
          return <circle key={hour} cx={x} cy={y} r="4.5" fill={getColor(val, activeType)} stroke="#fff" strokeWidth="2" />;
        })}
      </svg>
    </div>
  );
};

export default TrendGraph;
