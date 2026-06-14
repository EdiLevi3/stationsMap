import { useEffect, useState } from "react";
import { API_BASE_URL } from "../../config";
import { getColor } from "../../utils/colorUtils";
import StationHeader from "../shared/StationHeader";
import ConstellationMatrix from "./ConstellationMatrix";
import RinexDownloadPortal from "./RinexDownloadPortal";
import "../shared/station-page.css";
import "./HourDetails.css";

const formatSequenceDuration = (totalSeconds) => {
  if (!totalSeconds) return "0s";
  const mins = Math.floor(totalSeconds / 60);
  const secs = totalSeconds % 60;
  return mins > 0 ? `${mins}m ${secs}s` : `${secs}s`;
};

const HourDetails = ({ station, stationId, date, hour, onBack, onClose }) => {
  const [hourData, setHourData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHourData = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/records/station/${stationId}/day/${date}/hour/${hour}`);
        setHourData(await res.json());
      } catch (err) {
        console.error("Error fetching hour details:", err);
      } finally {
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
      <StationHeader
        station={station}
        onBack={onBack}
        onClose={onClose}
        temporalInfo={[
          { label: "Date", value: date },
          { label: "Hour", value: `${formattedHour}:00`, style: { backgroundColor: "#e0f2fe", color: "#0369a1" } }
        ]}
      />

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
