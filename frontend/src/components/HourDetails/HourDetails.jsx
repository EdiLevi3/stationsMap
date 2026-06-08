import { useEffect, useState } from "react";
import { API_BASE_URL } from "../../config";
import "./HourDetails.css";

const CONSTELLATION_NAMES = {
  G: "GPS",
  R: "GLONASS",
  E: "Galileo",
  C: "BeiDou",
  J: "QZSS",
  I: "NavIC (IRNSS)",
  S: "SBAS Payload"
};

const getMetricColor = (val, type) => {
  if (val == null) return "#64748b";
  if (type === "spoof" || type === "gem") {
    return val <= 0 ? "#10b981" : val <= 60 ? "#f59e0b" : "#ef4444";
  }
  return val >= 80 ? "#10b981" : val >= 50 ? "#f59e0b" : "#ef4444";
};

const HourDetails = ({ stationId, date, hour, onBack }) => {
  const [hourData, setHourData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [expandedConstellation, setExpandedConstellation] = useState(null);

  useEffect(() => {
    const fetchHourData = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/records/station/${stationId}/day/${date}/hour/${hour}`);
        const data = await res.json();
        setHourData(data);
        setLoading(false);
      } catch (err) {
        console.error("Error fetching hour details:", err);
        setLoading(false);
      }
    };
    fetchHourData();
  }, [stationId, date, hour]);

  if (loading) return <div className="hd-loading">Loading hour data...</div>;
  if (!hourData) return <div className="hd-no-data">No data found for this hour.</div>;

  const formattedHour = String(hour).padStart(2, "0");
  const constellationEntries = Object.entries(hourData.satelliteConstellation || {});

  const handleConstellationClick = (constellation) => {
    setExpandedConstellation(prev => prev === constellation ? null : constellation);
  };

  // --- New Sequence Formatting Utilities ---
  const rawSequence = hourData.longestSequence || 0;
  const sequencePercentage = Math.min(100, (rawSequence / 3600) * 100);
  
  const formatSequenceDuration = (totalSeconds) => {
    if (!totalSeconds) return "0s";
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return mins > 0 ? `${mins}m ${secs}s` : `${secs}s`;
  };

  // SVG Gauge calculations
  const radius = 35;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (sequencePercentage / 100) * circumference;

  return (
    <div className="hd-page">
      <header className="hd-header">
        <button className="hd-back-btn" onClick={onBack}>← Back to Day</button>
        <div>
          <h1 className="hd-title">Hour {formattedHour}:00</h1>
          <span className="hd-subtitle">{date}</span>
        </div>
      </header>

      <div className="hd-body">
        {/* Core Stats Overview */}
        <div className="hd-stats-grid">
          {[
            { label: "Record Rate", val: hourData.recordPrecent, type: "record" },
            { label: "Spoofing Level", val: hourData.spoofPrecents, type: "spoof" },
            { label: "GEM Deviation", val: hourData.gemPrecents, type: "gem" },
          ].map((item) => (
            <div className="hd-stat-card" key={item.label}>
              <span className="hd-card-label">{item.label}</span>
              <span 
                className="hd-card-value" 
                style={{ color: getMetricColor(item.val, item.type) }}
              >
                {item.val != null ? `${item.val.toFixed(1)}%` : "—"}
              </span>
            </div>
          ))}
        </div>

        {/* ── NEW VISUAL: Radial/Circular Sequence Widget ── */}
        <div className="hd-sequence-widget">
          <div className="hd-sequence-gauge-box">
            <svg className="hd-radial-svg" viewBox="0 0 80 80">
              {/* Background Track Circle */}
              <circle className="hd-radial-track" cx="40" cy="40" r={radius} />
              {/* Animated Progress Arc */}
              <circle 
                className="hd-radial-progress" 
                cx="40" 
                cy="40" 
                r={radius} 
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
              />
            </svg>
            <div className="hd-gauge-percentage">{sequencePercentage.toFixed(0)}%</div>
          </div>
          
          <div className="hd-sequence-info">
            <span className="hd-sequence-tag">Signal Lock Integrity</span>
            <h2 className="hd-sequence-time-display">{formatSequenceDuration(rawSequence)}</h2>
            <p className="hd-sequence-desc">
              Longest continuous window held without dropping carrier packets ({rawSequence.toLocaleString()} consecutive frames).
            </p>
          </div>
        </div>

        {/* Dynamic Satellite Constellation Matrix */}
        <section className="hd-section">
          <h3 className="hd-section-title">Satellite Constellation Distribution</h3>
          <p className="hd-section-hint">Click a family card below to inspect internal satellite metrics.</p>
          
          {constellationEntries.length > 0 ? (
            <div className="hd-satellite-matrix">
              {constellationEntries.map(([constellation, satellitesObj]) => {
                const satList = Object.entries(satellitesObj || {});
                const activeCount = satList.length;
                const isExpanded = expandedConstellation === constellation;
                const realName = CONSTELLATION_NAMES[constellation.toUpperCase()] || `Unknown (${constellation})`;

                return (
                  <div 
                    className={`hd-satellite-box ${isExpanded ? "hd-satellite-box--active" : ""}`} 
                    key={constellation}
                    onClick={() => handleConstellationClick(constellation)}
                  >
                    <div className="hd-sat-box-header">
                      <span className="hd-sat-name">{realName}</span>
                      <span className="hd-expand-arrow">{isExpanded ? "▼" : "▶"}</span>
                    </div>
                    <span className="hd-sat-count">{activeCount}</span>
                    <span className="hd-sat-sublabel">Satellites Active</span>
                    
                    {/* Nested breakdown list with percentage calculation */}
                    {isExpanded && activeCount > 0 && (
                      <div className="hd-sat-mini-list" onClick={(e) => e.stopPropagation()}>
                        {satList.map(([satId, seconds]) => {
                          const trackingPercent = ((seconds / 3600) * 100).toFixed(1);

                          return (
                            <div key={satId} className="hd-sat-row">
                              <span className="hd-sat-id">Satellite {satId}</span>
                              <div className="hd-sat-metrics-wrapper">
                                <span className="hd-sat-sig">{trackingPercent}%</span>
                                <span className="hd-sat-sec">({seconds}s)</span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="hd-no-satellites">
              No constellation payload data registered for this hour telemetry block.
            </div>
          )}
        </section>
      </div>
    </div>
  );
};

export default HourDetails;