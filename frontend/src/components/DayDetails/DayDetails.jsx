import { useEffect, useState, useMemo } from "react";
import { API_BASE_URL } from "../../config";
import { getColor } from "../../utils/colorUtils";
import { METRICS } from "../../utils/metricsConfig";
import HourDetails from "../HourDetails/HourDetails";
import "../shared/station-page.css";
import "./DayDetails.css";

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

const DayDetails = ({ station, stationId, date, onBack, onClose }) => {
  const [records, setRecords] = useState([]);
  const [selectedHour, setSelectedHour] = useState(null);
  const [activeMetric, setActiveMetric] = useState(METRICS[0].key);

  const { name, location, antenna, frequency } = station || {};

  useEffect(() => {
    const fetchRecords = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/records/station/${stationId}/day/${date}`);
        setRecords(await res.json());
      } catch (err) {
        console.error("Error fetching day records:", err);
      }
    };
    fetchRecords();
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
        jamPrecents: s.jamPrecents ?? null,
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
      return nums.length ? nums.reduce((a, b) => a + b, 0) / 24 : 0;
    };
    const maxSeqVal = Math.max(...vals.map((v) => v.longestSequence ?? 0));
    const maxSeqHours = vals
      .filter((v) => (v.longestSequence ?? 0) === maxSeqVal)
      .map((v) => `${String(v.hour).padStart(2, "0")}:00`)
      .join(", ");
    return { avgRecord: avg("recordPrecent"), avgSpoof: avg("spoofPrecents"), avgJam: avg("jamPrecents"), maxSeq: maxSeqVal, maxSeqHours, hoursWithData: vals.length };
  }, [valuesByHour]);

  if (selectedHour !== null) {
    return <HourDetails station={station} stationId={stationId} date={date} hour={selectedHour} onBack={() => setSelectedHour(null)} onClose={onClose} />;
  }

  const activeType = METRICS.find((m) => m.key === activeMetric)?.type || "record";

  return (
    <div className="station-page">
      <header className="station-page__header">
        <div style={{ display: "flex", alignItems: "center", gap: "1rem", flex: 1, minWidth: 0 }}>
          <button className="station-page__back-button" onClick={onBack}>← Back</button>
          <div className="station-page__title-group">
            <div style={{ minWidth: 0 }}>
              <h1 className="station-page__title">📍Station {name || "Unknown"}</h1>
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
          <div className="station-page__temporal-info">
            <div className="station-page__temporal-row">
              <span className="station-page__temporal-label">Date:</span>
              <span className="station-page__temporal-value" style={{ backgroundColor: "#e0f2fe", color: "#0369a1" }}>{date}</span>
            </div>
          </div>
          {onClose && <button className="station-page__close-btn" onClick={onClose} title="Close" aria-label="Close">✕</button>}
        </div>
      </header>

      <main className="station-main">
        <div className="dd-content-heading">
          <h2 className="dd-section-title">24-Hour Metric Analysis</h2>
          {dailyStats && <span className="dd-hours-badge">{dailyStats.hoursWithData} / 24 hours captured</span>}
        </div>

        {dailyStats ? (
          <div className="dd-stats-row">
            {[
              { label: "Avg record % (24hr)", value: dailyStats.avgRecord, type: "record", suffix: "%" },
              { label: "Avg spoofing % (24hr)", value: dailyStats.avgSpoof, type: "spoof", suffix: "%" },
              { label: "Avg jamming % (24hr)", value: dailyStats.avgJam, type: "jam", suffix: "%" },
              { label: `Max sequence (${dailyStats.maxSeqHours})`, value: dailyStats.maxSeq, type: null, suffix: "" },
            ].map(({ label, value, type, suffix }) => (
              <div className="dd-stat-card" key={label}>
                <span className="dd-stat-label">{label}</span>
                <span className="dd-stat-value" style={{ color: type ? getColor(value, type) : "#6B7280" }}>
                  {value != null ? `${Math.round(value)}${suffix}` : "—"}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <div className="dd-no-data">No data for this day</div>
        )}

        <div className="dd-tabs">
          {METRICS.map((m) => (
            <button key={m.key} className={`dd-tab${activeMetric === m.key ? " dd-tab--active" : ""}`} onClick={() => setActiveMetric(m.key)}>
              {m.label}
            </button>
          ))}
        </div>

        {dailyStats && <TrendGraph valuesByHour={valuesByHour} activeMetric={activeMetric} activeType={activeType} />}

        <div className="dd-hour-grid">
          {HOURS.map((hour) => {
            const d = valuesByHour[hour];
            const val = d?.[activeMetric] ?? null;
            const color = getColor(val, activeType);
            const hasData = hour in valuesByHour;
            return (
              <div
                key={hour}
                className={`dd-hour-cell${hasData ? " dd-hour-cell--active" : ""}`}
                onClick={() => hasData && setSelectedHour(hour)}
                style={{ cursor: hasData ? "pointer" : "default" }}
              >
                <span className="dd-hour-time">{String(hour).padStart(2, "0")}:00</span>
                <div className="dd-hour-track">
                  {hasData && <div className="dd-hour-fill" style={{ width: `${val != null ? Math.min(val, 100) : 0}%`, background: color }} />}
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
