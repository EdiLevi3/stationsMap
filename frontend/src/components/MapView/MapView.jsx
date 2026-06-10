import { useEffect, useRef, useState } from "react";
import {
  MapContainer,
  TileLayer,
  LayersControl,
  LayerGroup,
  useMap,
  useMapEvents,
} from "react-leaflet";
import { useStations } from "../../hooks/useStations";
import StationMarker from "../StationMarker/StationMarker";
import StationSearch from "../StationSearch/StationSearch";
import NearbyStations from "../NearbyStations/NearbyStations";
import StationDetails from "../StationDetails/StationDetails";
import BatchCompiler from "../BatchRinexCompiler/BatchCompiler";
import "leaflet/dist/leaflet.css";
import "./MapView.css";

import leaflet from "leaflet";
import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";

delete leaflet.Icon.Default.prototype._getIconUrl;
leaflet.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

const FALLBACK_CENTER = [31.5, 34.8];
const FALLBACK_ZOOM = 8;

const getBounds = (stations) => {
  if (!stations || stations.length === 0) return null;
  const lats = stations.map((s) => s.location.coordinates[1]);
  const lons = stations.map((s) => s.location.coordinates[0]);
  return [
    [Math.min(...lats), Math.min(...lons)],
    [Math.max(...lats), Math.max(...lons)],
  ];
};

const FitBounds = ({ stations }) => {
  const map = useMap();
  useEffect(() => {
    const bounds = getBounds(stations);
    if (bounds) map.fitBounds(bounds, { padding: [40, 40] });
  }, [stations, map]);
  return null;
};

const FlyToStation = ({ station }) => {
  const map = useMap();
  useEffect(() => {
    if (!station) return;
    const [lng, lat] = station.location.coordinates;
    const timer = setTimeout(() => {
      map.invalidateSize();
      map.flyTo([lat, lng], 14, { duration: 0.8 });
    }, 320);
    return () => clearTimeout(timer);
  }, [station, map]);
  return null;
};

// Fires invalidateSize whenever the map panel resizes (station open/close, RINEX toggle)
const MapResizer = ({ trigger }) => {
  const map = useMap();
  useEffect(() => {
    // Small delay so the CSS transition finishes before Leaflet repaints
    const timer = setTimeout(() => {
      map.invalidateSize();
      // If no station is selected, also re-fit all bounds
      if (!trigger) {
        const container = map.getContainer();
        // fitBounds is handled by FitBounds component on mount;
        // here we just ensure the tile grid fills the new size
      }
    }, 320);
    return () => clearTimeout(timer);
  }, [trigger, map]);
  return null;
};

const CenterButton = ({ stations }) => {
  const map = useMap();
  const handleClick = () => {
    const bounds = getBounds(stations);
    if (bounds) map.flyToBounds(bounds, { padding: [40, 40] });
    else map.flyTo(FALLBACK_CENTER, FALLBACK_ZOOM);
  };
  return (
    <button
      className="center-button"
      onClick={handleClick}
      title="Reset to default view"
      aria-label="Reset to default view"
    >
      ⌂
    </button>
  );
};

const ScopeBoundsTracker = ({ stations, onVisibleStationsChange }) => {
  const map = useMap();

  const updateVisibleStations = () => {
    const mapBounds = map.getBounds();
    const visible = stations.filter((station) => {
      const [lng, lat] = station.location.coordinates;
      return mapBounds.contains(leaflet.latLng(lat, lng));
    });
    onVisibleStationsChange(visible);
  };

  useMapEvents({
    moveend: updateVisibleStations,
    zoomend: updateVisibleStations,
  });

  useEffect(() => {
    updateVisibleStations();
  }, [stations]);

  return null;
};

const ESRI_IMAGERY =
  "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}";
const CARTO_LABELS =
  "https://{s}.basemaps.cartocdn.com/rastertiles/voyager_only_labels/{z}/{x}/{y}{r}.png";

export const TILE_LAYERS = [
  {
    name: "Streets",
    url: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
    attribution:
      '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
  },
  {
    name: "Hybrid",
    url: ESRI_IMAGERY,
    attribution: "Tiles &copy; Esri",
    overlayUrl: CARTO_LABELS,
    overlayAttribution: '&copy; <a href="https://carto.com/">CARTO</a>',
  },
];

export const STORAGE_KEY = "mapLayerPreference";
export const DEFAULT_LAYER = "Streets";

export const getStoredLayer = () => {
  const stored = localStorage.getItem(STORAGE_KEY);
  const validNames = TILE_LAYERS.map((layer) => layer.name);
  if (stored && validNames.includes(stored)) return stored;
  if (stored) localStorage.removeItem(STORAGE_KEY);
  return DEFAULT_LAYER;
};

const LayerChangeHandler = () => {
  useMapEvents({
    baselayerchange: (e) => {
      localStorage.setItem(STORAGE_KEY, e.name);
    },
  });
  return null;
};

const MapView = () => {
  const { stations, loading, error, retry: loadStations } = useStations();
  const markerRefs = useRef(new Map());
  const [selectedStation, setSelectedStation] = useState(null);
  const [rinexUserOpen, setRinexUserOpen] = useState(false);
  const [visibleStations, setVisibleStations] = useState([]);
  const [selectedStationIds, setSelectedStationIds] = useState([]);

  const handleCloseStation = () => {
    setSelectedStation(null);
    setRinexUserOpen(false);
  };

  useEffect(() => {
    if (!selectedStation) setRinexUserOpen(false);
  }, [selectedStation]);

  if (loading) {
    return (
      <div role="status" className="map-loading">
        <div className="spinner" />
        <span>Loading stations...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div role="alert" className="map-error">
        <span className="map-error__icon">⚠️</span>
        <p className="map-error__message">Failed to load stations: {error}</p>
        <button className="map-error__retry" onClick={loadStations}>
          Retry
        </button>
      </div>
    );
  }

  const storedLayer = getStoredLayer();
  const stationOpen = !!selectedStation;
  // RINEX rail is force-collapsed whenever a station is open and the user hasn't toggled it
  const rinexForceCollapsed = stationOpen && !rinexUserOpen;

  // Map is narrow (30%) when station open; hidden when RINEX is also open
  let mapClass = "map-wrapper";
  if (stationOpen && !rinexUserOpen) mapClass += " map-wrapper--narrow";
  if (stationOpen && rinexUserOpen)  mapClass += " map-wrapper--hidden";

  return (
    <div className="map-dashboard-container">
      {/* RINEX sidebar — shows a ‹/› rail toggle when force-collapsed */}
      <BatchCompiler
        visibleStations={visibleStations}
        selectedStationIds={selectedStationIds}
        setSelectedStationIds={setSelectedStationIds}
        forceCollapsed={rinexForceCollapsed}
        onForceToggle={() => setRinexUserOpen((prev) => !prev)}
      />

      {/* Map panel */}
      <div className={mapClass}>
        {stations.length > 0 && (
          <div className="station-count">📍 {stations.length} stations total</div>
        )}

        <MapContainer
          center={FALLBACK_CENTER}
          zoom={FALLBACK_ZOOM}
          className="map-container"
          aria-label="Station map"
        >
          <LayersControl position="topright">
            {TILE_LAYERS.map((layer) => (
              <LayersControl.BaseLayer
                key={layer.name}
                checked={storedLayer === layer.name}
                name={layer.name}
              >
                {layer.overlayUrl ? (
                  <LayerGroup>
                    <TileLayer url={layer.url} attribution={layer.attribution} />
                    <TileLayer
                      url={layer.overlayUrl}
                      attribution={layer.overlayAttribution}
                    />
                  </LayerGroup>
                ) : (
                  <TileLayer url={layer.url} attribution={layer.attribution} />
                )}
              </LayersControl.BaseLayer>
            ))}
          </LayersControl>
          <LayerChangeHandler />
          <FitBounds stations={stations} />
          <CenterButton stations={stations} />
          <FlyToStation station={selectedStation} />
          {/* Repaints map whenever layout changes */}
          <MapResizer trigger={stationOpen || rinexUserOpen} />
          
          {stations.length > 0 && (
            <div className="map-search-controls">
              <StationSearch markerRefs={markerRefs} />
              <NearbyStations />
            </div>
          )}

          <ScopeBoundsTracker
            stations={stations}
            onVisibleStationsChange={setVisibleStations}
          />

          {stations.map((station) => (
            <StationMarker
              key={station._id}
              station={station}
              onSelect={() => {
                setSelectedStation(station);
                setRinexUserOpen(false);
              }}
              markerRef={(marker) => {
                if (marker) markerRefs.current.set(station._id, marker);
                else markerRefs.current.delete(station._id);
              }}
            />
          ))}
        </MapContainer>
      </div>

      {/* Station detail sidebar — ✕ is rendered inside StationDetails only */}
      {selectedStation && (
        <div className="station-sidebar">
          <StationDetails
            station={selectedStation}
            onClose={handleCloseStation}
          />
        </div>
      )}
    </div>
  );
};

export default MapView;