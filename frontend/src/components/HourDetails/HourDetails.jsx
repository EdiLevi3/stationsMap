import { useEffect, useState } from "react";
import { API_BASE_URL } from "../../config";
import { getColor } from "../../utils/colorUtils";
import "../shared/station-page.css";
import "./HourDetails.css";
import ConstellationMatrix from "./ConstellationMatrix";
import RinexDownloadPortal from "./RinexDownloadPortal";

const formatSequenceDuration = (totalSeconds) => {
  if (!totalSeconds) return "0s";
  const mins = Math.floor(totalSeconds / 60);
  const secs = totalSeconds % 60;
  return mins > 0 ? `${mins}m ${secs}s` : `${secs}s`;
};

const HourDetails = ({ station, stationId, date, hour, onBack, onClose }) => {
  const [hourData, setHourData] = useState(null);
  const [loading, setLoading] = useState(true);

  const { name, location, antenna, frequency } = station || {};

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
  const rawSequence = hourData.longestSequence || 0;

  return (
    <div className="station-page">
      <header className="station-page__header">
        <div style={{ display: "flex", alignItems: "center", gap: "1rem", flex: 1, minWidth: 0 }}>
          <button className="station-page__back-button" onClick={onBack}>← Back</button>
          <div className="station-page__title-group">
            <div style={{ minWidth: 0 }}>
              <h1 className="station-page__title">📍Station {name || "Unknown"}</h1>
              <div className="station-page__meta-group">
                {location?.coordinates && location.coordinates.length === 2 && (
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
              <span className="station-page__temporal-value">{date}</span>
            </div>
            <div className="station-page__temporal-row">
              <span className="station-page__temporal-label">Hour:</span>
              <span className="station-page__temporal-value" style={{ backgroundColor: "#e0f2fe", color: "#0369a1" }}>
                {formattedHour}:00
              </span>
            </div>
          </div>
          {onClose && (
            <button className="station-page__close-btn" onClick={onClose} title="Close station" aria-label="Close station">
              ✕
            </button>
          )}
        </div>
      </header>

      <main className="station-main">
        <div className="hd-stats-grid">
          {[
            { label: "Record Rate",        val: hourData.recordPrecent, type: "record" },
            { label: "Spoofing Level",     val: hourData.spoofPrecents, type: "spoof"  },
            { label: "Jamming Deviation",  val: hourData.jamPrecents,   type: "jam"    },
          ].map((item) => (
            <div className="hd-stat-card" key={item.label}>
              <span className="hd-card-label">{item.label}</span>
              <span className="hd-card-value" style={{ color: getColor(item.val, item.type) }}>
                {item.val != null ? `${Math.round(item.val)}%` : "—"}
              </span>
            </div>
          ))}
        </div>

        <div className="hd-sequence-widget">
          <div className="hd-sequence-info" style={{ width: "100%", textAlign: "center" }}>
            <span className="hd-sequence-tag">Maximum Continuous Recording Length</span>
            <h2 className="hd-sequence-time-display">{formatSequenceDuration(rawSequence)}</h2>
            <p className="hd-sequence-desc">({rawSequence.toLocaleString()} consecutive frames)</p>
          </div>
        </div>

        <section className="hd-section">
          <h3 className="hd-section-title">Satellite Constellation Distribution</h3>
          <ConstellationMatrix satelliteConstellation={hourData.satelliteConstellation} />
        </section>

        <RinexDownloadPortal />
      </main>
    </div>
  );
};

export default HourDetails;
