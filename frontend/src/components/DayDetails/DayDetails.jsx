import { useEffect, useState, useMemo } from "react";
import { API_BASE_URL } from "../../config";
import { getColor } from "../../utils/colorUtils";
import { METRICS } from "../../utils/metricsConfig";
import HourDetails from "../HourDetails/HourDetails";
import StationHeader from "../shared/StationHeader";
import TrendGraph from "./TrendGraph";
import "../shared/station-page.css";
import "./DayDetails.css";

const HOURS = Array.from({ length: 24 }, (_, i) => i);

const DayDetails = ({ station, stationId, date, onBack, onClose }) => {
  const [records, setRecords] = useState([]);
  const [selectedHour, setSelectedHour] = useState(null);
  const [activeMetric, setActiveMetric] = useState(METRICS[0].key);

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
      <StationHeader
        station={station}
        onBack={onBack}
        onClose={onClose}
        temporalInfo={[{ label: "Date", value: date, style: { backgroundColor: "#e0f2fe", color: "#0369a1" } }]}
      />

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
