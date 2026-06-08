import { useEffect, useState, useMemo } from "react";
import { API_BASE_URL } from "../../config";
import "./DayDetails.css";

const getColor = (value, type) => {
  if (value == null) return "#D1D5DB";
  if (type === "spoof" || type === "gem" || type === "combined") {
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
  { key: "combined",      label: "Spoof+GEM avg", colorType: "combined" },
  { key: "spoofPrecents", label: "Spoof %",        colorType: "spoof"    },
  { key: "gemPrecents",   label: "GEM %",          colorType: "gem"      },
  { key: "recordPrecent", label: "Record %",       colorType: "record"   },
];

// --- New Native SVG Trend Graph Component ---
const TrendGraph = ({ valuesByHour, activeMetric, activeColorType }) => {
  const height = 100;
  const width = 800; // ViewBox width

  // Map 24 hours to X and Y coordinates
  const points = HOURS.map((hour, i) => {
    const val = valuesByHour[hour]?.[activeMetric] ?? 0; // Default to 0 if missing for the line flow
    const x = (i / 23) * width;
    const y = height - (Math.min(val, 100) / 100) * height;
    return `${x},${y}`;
  });

  const pathD = `M 0,${height} L ${points.join(" L ")} L ${width},${height} Z`;
  const lineD = `M ${points.join(" L ")}`;

  return (
    <div className="dd-trend-graph">
      <svg viewBox={`0 -10 ${width} ${height + 20}`} preserveAspectRatio="none" style={{ width: "100%", height: "140px" }}>
        <defs>
          <linearGradient id="chart-grad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#1a1a2e" stopOpacity="0.2" />
            <stop offset="100%" stopColor="#1a1a2e" stopOpacity="0" />
          </linearGradient>
        </defs>
        
        {/* Shaded Area */}
        <path d={pathD} fill="url(#chart-grad)" />
        {/* Trend Line */}
        <path d={lineD} fill="none" stroke="#1a1a2e" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />
        
        {/* Data Dots */}
        {HOURS.map((hour, i) => {
          const val = valuesByHour[hour]?.[activeMetric];
          if (val == null) return null; // Only draw dots where we actually have data
          
          const x = (i / 23) * width;
          const y = height - (Math.min(val, 100) / 100) * height;
          const color = getColor(val, activeColorType);
          
          return (
            <circle key={hour} cx={x} cy={y} r="5" fill={color} stroke="#fff" strokeWidth="2" />
          );
        })}
      </svg>
    </div>
  );
};

const DayDetails = ({ stationId, date, onBack }) => {
  const [records, setRecords] = useState([]);
  const [activeMetric, setActiveMetric] = useState("combined");

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
        gemPrecents:   s.gemPrecents   ?? null,
        longestSequence: s.longestSequence ?? null,
        combined:
          s.spoofPrecents != null && s.gemPrecents != null
            ? (s.spoofPrecents + s.gemPrecents) / 2
            : s.spoofPrecents ?? s.gemPrecents ?? null,
      };
    });
    return map;
  }, [records, stationId]);

  const dailyStats = useMemo(() => {
    const vals = Object.values(valuesByHour);
    if (!vals.length) return null;

    // 1. Fixed Average Calculation (Always divide by 24)
    const avg = (key) => {
      const nums = vals.map((v) => v[key]).filter((v) => v != null);
      if (!nums.length) return 0;
      const sum = nums.reduce((a, b) => a + b, 0);
      return sum / 24; 
    };

    // 2. Fixed Max Sequence Calculation (Get all hours matching max)
    const maxSeqVal = Math.max(...vals.map((v) => v.longestSequence ?? 0));
    const maxSeqHoursArr = vals
      .filter((v) => (v.longestSequence ?? 0) === maxSeqVal)
      .map((v) => `${String(v.hour).padStart(2, "0")}:00`);
      
    // Format the hours beautifully (e.g., "02:00, 14:00, 15:00")
    const maxSeqHoursString = maxSeqHoursArr.join(", ");

    return {
      avgRecord:   avg("recordPrecent"),
      avgSpoof:    avg("spoofPrecents"),
      avgGem:      avg("gemPrecents"),
      avgCombined: avg("combined"),
      maxSeq:      maxSeqVal,
      maxSeqHours: maxSeqHoursString,
      hoursWithData: vals.length,
    };
  }, [valuesByHour]);

  const activeColorType = metrics.find((m) => m.key === activeMetric)?.colorType || "combined";

  return (
    <div className="dd-page">
      <header className="dd-header">
        <button className="dd-back-btn" onClick={onBack}>← Back</button>
        <div>
          <h1 className="dd-title">{date}</h1>
          {dailyStats && (
            <span className="dd-subtitle">{dailyStats.hoursWithData} hours with data</span>
          )}
        </div>
      </header>

      <div className="dd-body">
        {/* ── STAT CARDS ── */}
        {dailyStats ? (
          <div className="dd-stats-row">
            {[
              { label: "Avg record % (24hr)",    value: dailyStats.avgRecord,   type: "record",   suffix: "%" },
              { label: "Avg spoof % (24hr)",     value: dailyStats.avgSpoof,    type: "spoof",    suffix: "%" },
              { label: "Avg GEM % (24hr)",       value: dailyStats.avgGem,      type: "gem",      suffix: "%" },
              { label: "Spoof+GEM avg (24hr)",   value: dailyStats.avgCombined, type: "combined", suffix: "%" },
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
                      ? `${Number.isInteger(value) ? value : value.toFixed(1)}${suffix}`
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

        {/* ── THE INTERESTING GRAPH ── */}
        {dailyStats && (
           <TrendGraph 
             valuesByHour={valuesByHour} 
             activeMetric={activeMetric} 
             activeColorType={activeColorType} 
           />
        )}

        {/* ── HOUR GRID (horizontal) ── */}
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
                  {val != null ? `${val.toFixed(1)}%` : hasData ? "—" : ""}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default DayDetails;