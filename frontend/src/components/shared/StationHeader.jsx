import React from "react";

const StationHeader = ({ station, onBack, onClose, children, temporalInfo }) => {
  const { name, location, antenna, frequency } = station || {};

  return (
    <header className="station-page__header">
      <div style={{ display: "flex", alignItems: "center", gap: "1rem", flex: 1, minWidth: 0 }}>
        {onBack && <button className="station-page__back-button" onClick={onBack}>← Back</button>}
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
              <span className="station-page__meta-item"><strong>Freq:</strong> {frequency ? `${frequency} Hz` : "N/A"}</span>
            </div>
          </div>
        </div>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: "1.25rem", flexShrink: 0 }}>
        {temporalInfo && (
          <div className="station-page__temporal-info">
            {temporalInfo.map((item, idx) => (
              <div key={idx} className="station-page__temporal-row">
                <span className="station-page__temporal-label">{item.label}:</span>
                <span className="station-page__temporal-value" style={item.style}>{item.value}</span>
              </div>
            ))}
          </div>
        )}
        {children}
        {onClose && (
          <button className="station-page__close-btn" onClick={onClose} title="Close" aria-label="Close">✕</button>
        )}
      </div>
    </header>
  );
};

export default StationHeader;
