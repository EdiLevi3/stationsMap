import { useState, useRef, useEffect, useCallback } from "react";
import "./NearbyStations.css";
import { useMap } from "react-leaflet";
import leaflet from "leaflet";
import useSearchMarker from "../../controllers/useSearchMarker";
import CoordinateInput from "../CoordinateInput/CoordinateInput";
import { RADIUS_CIRCLE_CONFIGS } from "../../config";
import { parseLocationToLatLon } from "../../utils/parseLocation";

const NearbyStations = () => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [limit, setLimit] = useState(3);
  const [lastSearchCoords, setLastSearchCoords] = useState(null);
  const containerRef = useRef(null);
  const {
    flyToGeoLocation,
    removeSearchMarker,
    hasRadiusCircles,
    radiusCircleVisibility,
    toggleRadiusCircle,
    nearbyStations,
    distanceLineVisibility,
    toggleDistanceLine,
  } = useSearchMarker();

  // Stop Leaflet event propagation
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    leaflet.DomEvent.disableClickPropagation(el);
    leaflet.DomEvent.disableScrollPropagation(el);
  }, []);

  const handleGoToLocation = useCallback((coordsText) => {
    const result = parseLocationToLatLon(coordsText);
    if (result) {
      const { lat, lon } = result;
      setLastSearchCoords({ lat, lon });
      flyToGeoLocation(lat, lon, `Search: ${lat.toFixed(4)}, ${lon.toFixed(4)}`, limit);
    }
  }, [flyToGeoLocation, limit]);

  const handleIncreaseLimit = () => {
    const newLimit = limit + 3;
    setLimit(newLimit);
    if (lastSearchCoords) {
      const { lat, lon } = lastSearchCoords;
      flyToGeoLocation(lat, lon, `Search: ${lat.toFixed(4)}, ${lon.toFixed(4)}`, newLimit);
    }
  };

  const handleClear = () => {
    removeSearchMarker();
    setLastSearchCoords(null);
    setLimit(3);
  };

  return (
    <div className="nearby-stations" ref={containerRef}>
      <button 
        className={`nearby-stations__toggle ${isExpanded ? 'nearby-stations__toggle--active' : ''}`}
        onClick={() => setIsExpanded(!isExpanded)}
        title="Find nearby stations by coordinates"
      >
        <span className="nearby-stations__icon">📍</span>
        <span className="nearby-stations__label">Add Coordinates</span>
      </button>

      {isExpanded && (
        <div className="nearby-stations__panel">
          <CoordinateInput onGoToLocation={handleGoToLocation} />
          
          {hasRadiusCircles && (
            <div className="nearby-stations__radius-layers">
              <div className="nearby-stations__results-title">Radius Circles</div>
              <div className="nearby-stations__radius-grid">
                {RADIUS_CIRCLE_CONFIGS.map(({ key, label, color }) => (
                  <label key={key} className="nearby-stations__radius-item">
                    <input
                      type="checkbox"
                      checked={radiusCircleVisibility[key]}
                      onChange={() => toggleRadiusCircle(key)}
                      style={{ accentColor: color }}
                    />
                    <span
                      className="nearby-stations__radius-color"
                      style={{ background: color }}
                    />
                    {label}
                  </label>
                ))}
              </div>
            </div>
          )}

          {nearbyStations.length > 0 && (
            <div className="nearby-stations__results">
              <div className="nearby-stations__results-header">
                <div className="nearby-stations__results-title">{nearbyStations.length} Closest Stations</div>
                <button 
                  className="nearby-stations__plus-btn"
                  onClick={handleIncreaseLimit}
                  title="Show more stations"
                >
                  +
                </button>
              </div>
              <div className="nearby-stations__list">
                {nearbyStations.map((station) => (
                  <label key={station._id} className="nearby-stations__item">
                    <input
                      type="checkbox"
                      checked={!!distanceLineVisibility[station._id]}
                      onChange={() => toggleDistanceLine(station._id)}
                    />
                    <div className="nearby-stations__info">
                      <span className="nearby-stations__name">{station.name}</span>
                      <span className="nearby-stations__distance">
                        {(station.distanceMeters / 1000).toFixed(2)} km
                      </span>
                    </div>
                  </label>
                ))}
              </div>
              <button 
                className="nearby-stations__clear" 
                onClick={handleClear}
              >
                Clear Search
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default NearbyStations;
