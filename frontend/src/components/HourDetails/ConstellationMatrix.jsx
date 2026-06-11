import { useState } from "react";

const CONSTELLATION_NAMES = {
  G: "GPS",
  R: "GLONASS",
  E: "Galileo",
  C: "BeiDou",
  J: "QZSS",
  I: "NavIC (IRNSS)",
  S: "SBAS Payload",
};

const ConstellationMatrix = ({ satelliteConstellation }) => {
  const [expandedConstellation, setExpandedConstellation] = useState(null);

  const entries = Object.entries(satelliteConstellation || {});

  const handleClick = (constellation) =>
    setExpandedConstellation((prev) => (prev === constellation ? null : constellation));

  if (entries.length === 0) {
    return (
      <div className="hd-no-satellites">
        No constellation payload data registered for this hour telemetry block.
      </div>
    );
  }

  return (
    <div className="hd-satellite-matrix">
      {entries.map(([constellation, satellitesObj]) => {
        const satList = Object.entries(satellitesObj || {});
        const isExpanded = expandedConstellation === constellation;
        const realName =
          CONSTELLATION_NAMES[constellation.toUpperCase()] || `Unknown (${constellation})`;

        return (
          <div
            key={constellation}
            className={`hd-satellite-box ${isExpanded ? "hd-satellite-box--active" : ""}`}
            onClick={() => handleClick(constellation)}
          >
            <div className="hd-sat-box-header">
              <span className="hd-sat-name">{realName}</span>
              <span className="hd-expand-arrow">{isExpanded ? "▼" : "▶"}</span>
            </div>
            <span className="hd-sat-count">{satList.length}</span>
            <span className="hd-sat-sublabel">Satellites Active</span>

            {isExpanded && satList.length > 0 && (
              <div className="hd-sat-mini-list" onClick={(e) => e.stopPropagation()}>
                {satList.map(([satId, seconds]) => {
                  const trackingPercent = Math.round((seconds / 3600) * 100);
                  const satColor = trackingPercent >= 80 ? "#10b981" : "#ef4444";
                  return (
                    <div key={satId} className="hd-sat-row">
                      <span className="hd-sat-id">{satId}</span>
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
  );
};

export default ConstellationMatrix;
