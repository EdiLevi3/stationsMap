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

const HourDetails = ({ station, stationId, date, hour, onBack }) => {
  const [hourData, setHourData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [expandedConstellation, setExpandedConstellation] = useState(null);

  const { name, location } = station || {};

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

  const rawSequence = hourData.longestSequence || 0;
  const sequencePercentage = Math.min(100, (rawSequence / 3600) * 100);
  
  const formatSequenceDuration = (totalSeconds) => {
    if (!totalSeconds) return "0s";
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return mins > 0 ? `${mins}m ${secs}s` : `${secs}s`;
  };

  return (
    <div className="station-page">
      <header className="station-page__header">
        <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
          <button className="station-page__back-button" onClick={onBack}>
            ← Back
          </button>
          <div className="station-page__title-group">
            <span className="station-page__icon">📍</span>
            <div>
              <h1 className="station-page__title">Station: {name || "Unknown"}</h1>
              
              <div className="station-page__meta-group">
                {location?.coordinates && location.coordinates.length === 2 && (
                  <span className="station-page__coordinates">
                    Coordinates: {location.coordinates[1].toFixed(5)}°, {location.coordinates[0].toFixed(5)}°
                  </span>
                )}
                <span className="hd-date-highlight">{date}</span>
                <span className="hd-hour-tag-badge">{formattedHour}:00</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="station-main">
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
                {item.val != null ? `${Math.round(item.val)}%` : "—"}
              </span>
            </div>
          ))}
        </div>

        {/* ── UPDATED: CLEAN TEXT-ONLY SCORE AND NUMBER ── */}
        <div className="hd-sequence-widget">
          <div className="hd-telemetry-display-panel">
            <span className="hd-telemetry-percentage">{sequencePercentage.toFixed(0)}%</span>
            <span className="hd-telemetry-subtext">INTEGRITY SCORE</span>
          </div>
          
          <div className="hd-sequence-info">
            <span className="hd-sequence-tag">Maximum Continuous Recording Length</span>
            <h2 className="hd-sequence-time-display">{formatSequenceDuration(rawSequence)}</h2>
            <p className="hd-sequence-desc">
              ({rawSequence.toLocaleString()} consecutive frames).
            </p>
          </div>
        </div>

        {/* Dynamic Satellite Constellation Matrix */}
        <section className="hd-section">
          <h3 className="hd-section-title">Satellite Constellation Distribution</h3>
          
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
                    
                    {isExpanded && activeCount > 0 && (
                      <div className="hd-sat-mini-list" onClick={(e) => e.stopPropagation()}>
                        {satList.map(([satId, seconds]) => {
                          const trackingPercent = Math.round((seconds / 3600) * 100);
                          const satColor = trackingPercent >= 80 ? "#10b981" : "#ef4444";

                          return (
                            <div key={satId} className="hd-sat-row">
                              <span className="hd-sat-id"> {satId}</span>
                              <div className="hd-sat-metrics-wrapper">
                                <span className="hd-sat-sig" style={{ color: satColor }}>
                                  {trackingPercent}%
                                </span>
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
      </main>
    </div>
  );
};

export default HourDetails;