import { useEffect, useState, useMemo } from "react";
import { API_BASE_URL } from "../../config";
import HourDetails from "../HourDetails/HourDetails"; 

import "./DayDetails.css";

const getColor = (value, type) => {
  if (value == null) return "#D1D5DB";
  if (type === "spoof" || type === "jam") {
    if (value <= 0)  return "#4CAF50";
    if (value <= 60) return "#FFC107";
    return "#F44336";
  }
  if (type === "record") {
    if (value >= 80) return "#4CAF50";
    if (value >= 50) return "#FFC107";
    return "#F44336";
  }
  return "#D1D5DB";
};

const HOURS = Array.from({ length: 24 }, (_, i) => i);

const metrics = [
  { key: "recordPrecent", label: "Record %",       colorType: "record"   },
  { key: "spoofPrecents", label: "Spoofing %",        colorType: "spoof"    },
  { key: "jamPrecents",   label: "Jamming %",          colorType: "jam"      },
];

const TrendGraph = ({ valuesByHour, activeMetric, activeColorType }) => {
  const height = 100;
  const width = 800;

  const points = HOURS.map((hour, i) => {
    const val = valuesByHour[hour]?.[activeMetric] ?? 0;
    const x = (i / 23) * width;
    const y = height - (Math.min(val, 100) / 100) * height;
    return `${x},${y}`;
  });

  const pathD = `M 0,${height} L ${points.join(" L ")} L ${width},${height} Z`;
  const lineD = `M ${points.join(" L ")}`;

  return (
    <div className="dd-trend-graph">
      <svg viewBox={`-45 -15 ${width + 70} ${height + 40}`} preserveAspectRatio="none" style={{ width: "100%", height: "160px" }}>
        <defs>
          <linearGradient id="chart-grad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#1a1a2e" stopOpacity="0.15" />
            <stop offset="100%" stopColor="#1a1a2e" stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* ── Y-AXIS PERCENTAGE LABELS ── */}
        <g fill="#64748b" fontSize="11px" fontWeight="600" textAnchor="end">
          <text x="-12" y="4">100%</text>
          <text x="-12" y={height / 2 + 4}>50%</text>
          <text x="-12" y={height + 4}>0%</text>
        </g>

        {/* Horizontal Background Guidelines */}
        <line x1="0" y1="0" x2={width} y2="0" stroke="#f1f5f9" strokeWidth="1" strokeDasharray="4 4" />
        <line x1="0" y1={height / 2} x2={width} y2={height / 2} stroke="#f1f5f9" strokeWidth="1" strokeDasharray="4 4" />
        <line x1="0" y1={height} x2={width} y2={height} stroke="#e2e8f0" strokeWidth="1.5" />

        {/* Vertical Hour Guidelines & X-Axis Time Labels */}
        {HOURS.map((hour) => {
          if (hour % 2 !== 0 && hour !== 23) return null;
          const x = (hour / 23) * width;
          return (
            <g key={`axis-${hour}`}>
              <line x1={x} y1="0" x2={x} y2={height} stroke="#f1f5f9" strokeWidth="1" />
              <text 
                x={x} 
                y={height + 18} 
                textAnchor="middle" 
                fill="#64748b" 
                fontSize="11px" 
                fontWeight="600"
                style={{ fontFamily: 'inherit' }}
              >
                {String(hour).padStart(2, "0")}:00
              </text>
            </g>
          );
        })}

        {/* Graph Render Shapes */}
        <path d={pathD} fill="url(#chart-grad)" />
        <path d={lineD} fill="none" stroke="#1a1a2e" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />
        
        {/* Metric Node Circles */}
        {HOURS.map((hour, i) => {
          const val = valuesByHour[hour]?.[activeMetric];
          if (val == null) return null;
          const x = (i / 23) * width;
          const y = height - (Math.min(val, 100) / 100) * height;
          const color = getColor(val, activeColorType);
          return (
            <circle key={hour} cx={x} cy={y} r="4.5" fill={color} stroke="#fff" strokeWidth="2" />
          );
        })}
      </svg>
    </div>
  );
};

// onClose: closes the entire station panel (back to map)
// onBack:  goes back to StationDetails day list
const DayDetails = ({ station, stationId, date, onBack, onClose }) => {
  const [records, setRecords] = useState([]);
  const [selectedHour, setSelectedHour] = useState(null); 
  const [activeMetric, setActiveMetric] = useState("recordPrecent");

  const { name, location, antenna, frequency } = station || {};

  useEffect(() => {
    const fetch_ = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/records/station/${stationId}/day/${date}`);
        const data = await res.json();
        setRecords(data);
      } catch (err) {
        console.error(err);
      }
    };
    fetch_();
  }, [stationId, date]);

  const valuesByHour = useMemo(() => {
    const map = {};
    records.forEach((r) => {
      const s = r.stations?.find((x) => String(x.stationId) === String(stationId));
      if (!s) return;
      map[r.hour] = {
        hour: r.hour,
        recordPrecent: s.recordPrecent ?? null,
        spoofPrecents: s.spoofPrecents ?? null,
        jamPrecents:   s.jamPrecents   ?? null,
        longestSequence: s.longestSequence ?? null,
      };
    });
    return map;
  }, [records, stationId]);

  const dailyStats = useMemo(() => {
    const vals = Object.values(valuesByHour);
    if (!vals.length) return null;

    const avg = (key) => {
      const nums = vals.map((v) => v[key]).filter((v) => v != null);
      if (!nums.length) return 0;
      const sum = nums.reduce((a, b) => a + b, 0);
      return sum / 24; 
    };

    const maxSeqVal = Math.max(...vals.map((v) => v.longestSequence ?? 0));
    const maxSeqHoursArr = vals
      .filter((v) => (v.longestSequence ?? 0) === maxSeqVal)
      .map((v) => `${String(v.hour).padStart(2, "0")}:00`);
      
    const maxSeqHoursString = maxSeqHoursArr.join(", ");

    return {
      avgRecord:   avg("recordPrecent"),
      avgSpoof:    avg("spoofPrecents"),
      avgJam:      avg("jamPrecents"),
      maxSeq:      maxSeqVal,
      maxSeqHours: maxSeqHoursString,
      hoursWithData: vals.length,
    };
  }, [valuesByHour]);

  if (selectedHour !== null) {
    return (
      <HourDetails
        station={station}
        stationId={stationId}
        date={date}
        hour={selectedHour}
        onBack={() => setSelectedHour(null)}
        onClose={onClose}
      />
    );
  }

  const activeColorType = metrics.find((m) => m.key === activeMetric)?.colorType || "record";

  return (
    <div className="station-page">
      <header className="station-page__header">
        <div style={{ display: "flex", alignItems: "center", gap: "1rem", flex: 1, minWidth: 0 }}>
          <button className="station-page__back-button" onClick={onBack}>
            ← Back
          </button>
          <div className="station-page__title-group">
            <div style={{ minWidth: 0 }}>
              <h1 className="station-page__title">📍Station {name || "Unknown"}</h1>
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
          <div className="station-page__temporal-info">
            <div className="station-page__temporal-row">
              <span className="station-page__temporal-label">Date:</span>
              <span className="station-page__temporal-value" style={{ backgroundColor: "#e0f2fe", color: "#0369a1" }}>
                {date}
              </span>
            </div>
          </div>
          {onClose && (
            <button
              className="station-page__close-btn"
              onClick={onClose}
              title="Close station"
              aria-label="Close station"
            >
              ✕
            </button>
          )}
        </div>
      </header>

      <main className="station-main">
        <div className="dd-content-heading">
          <h2 className="dd-section-title">24-Hour Metric Analysis</h2>
          {dailyStats && (
            <span className="dd-hours-badge">
              {dailyStats.hoursWithData} / 24 hours captured
            </span>
          )}
        </div>

        {/* ── STAT CARDS ── */}
        {dailyStats ? (
          <div className="dd-stats-row">
            {[
              { label: "Avg record % (24hr)",    value: dailyStats.avgRecord,   type: "record",   suffix: "%" },
              { label: "Avg spoofing % (24hr)",     value: dailyStats.avgSpoof,    type: "spoof",    suffix: "%" },
              { label: "Avg Jamming % (24hr)",       value: dailyStats.avgJam,      type: "jam",      suffix: "%" },
              {
                label: `Max sequence (${dailyStats.maxSeqHours})`,
                value: dailyStats.maxSeq,
                type: null,
                suffix: "",
              },
            ].map(({ label, value, type, suffix }) => {
              const color = type ? getColor(value, type) : "#6B7280";
              return (
                <div className="dd-stat-card" key={label}>
                  <span className="dd-stat-label">{label}</span>
                  <span className="dd-stat-value" style={{ color }}>
                    {value != null
                      ? `${Math.round(value)}${suffix}`
                      : "—"}
                  </span>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="dd-no-data">No data for this day</div>
        )}

        {/* ── METRIC TABS ── */}
        <div className="dd-tabs">
          {metrics.map((m) => (
            <button
              key={m.key}
              className={`dd-tab${activeMetric === m.key ? " dd-tab--active" : ""}`}
              onClick={() => setActiveMetric(m.key)}
            >
              {m.label}
            </button>
          ))}
        </div>

        {/* ── THE TREND GRAPH ── */}
        {dailyStats && (
           <TrendGraph 
             valuesByHour={valuesByHour} 
             activeMetric={activeMetric} 
             activeColorType={activeColorType} 
           />
        )}

        {/* ── HOUR GRID ── */}
        <div className="dd-hour-grid">
          {HOURS.map((hour) => {
            const d = valuesByHour[hour];
            const val = d?.[activeMetric] ?? null;
            const color = getColor(val, activeColorType);
            const hasData = hour in valuesByHour;
            const barPct = val != null ? Math.min(val, 100) : 0;

            return (
              <div
                key={hour}
                className={`dd-hour-cell${hasData ? " dd-hour-cell--active" : ""}`}
                onClick={() => hasData && setSelectedHour(hour)} 
                style={{ cursor: hasData ? "pointer" : "default" }} 
              >
                <span className="dd-hour-time">
                  {String(hour).padStart(2, "0")}:00
                </span>
                <div className="dd-hour-track">
                  {hasData && (
                    <div
                      className="dd-hour-fill"
                      style={{ width: `${barPct}%`, background: color }}
                    />
                  )}
                </div>
                <span className="dd-hour-val" style={{ color: hasData ? color : "#ccc" }}>
                  {val != null ? `${Math.round(val)}%` : hasData ? "—" : ""}
                </span>
              </div>
            );
          })}
        </div>
      </main>
    </div>
  );
};

export default DayDetails;