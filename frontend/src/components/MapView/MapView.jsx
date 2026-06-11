import { useEffect, useState } from "react";
import { MapContainer, TileLayer, LayersControl, LayerGroup } from "react-leaflet";
import { useStations } from "../../hooks/useStations";
import StationMarker from "../StationMarker/StationMarker";
import StationSearch from "../StationSearch/StationSearch";
import NearbyStations from "../NearbyStations/NearbyStations";
import StationDetails from "../StationDetails/StationDetails";
import BatchCompiler from "../BatchRinexCompiler/BatchCompiler";
import {
  FitBounds,
  FlyToStation,
  MapResizer,
  CenterButton,
  ScopeBoundsTracker,
  LayerChangeHandler,
} from "./MapControls";
import { TILE_LAYERS, FALLBACK_CENTER, FALLBACK_ZOOM, getStoredLayer } from "./mapLayers";
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

const MapView = () => {
  const { stations, loading, error, retry: loadStations } = useStations();
  const [selectedStation, setSelectedStation] = useState(null);
  const [rinexUserOpen, setRinexUserOpen] = useState(false);
  const [visibleStations, setVisibleStations] = useState([]);
  const [selectedStationIds, setSelectedStationIds] = useState([]);
  const [hoveredStationId, setHoveredStationId] = useState(null);

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
        <button className="map-error__retry" onClick={loadStations}>Retry</button>
      </div>
    );
  }

  const stationOpen = !!selectedStation;
  const rinexForceCollapsed = stationOpen && !rinexUserOpen;

  let mapClass = "map-wrapper";
  if (stationOpen && !rinexUserOpen) mapClass += " map-wrapper--narrow";
  if (stationOpen && rinexUserOpen)  mapClass += " map-wrapper--hidden";

  return (
    <div className="map-dashboard-container">
      <BatchCompiler
        visibleStations={visibleStations}
        selectedStationIds={selectedStationIds}
        setSelectedStationIds={setSelectedStationIds}
        forceCollapsed={rinexForceCollapsed}
        onForceToggle={() => setRinexUserOpen((prev) => !prev)}
        onHoverStationId={setHoveredStationId}
        onSelectStation={(station) => setSelectedStation(station)}
      />

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
                checked={getStoredLayer() === layer.name}
                name={layer.name}
              >
                {layer.overlayUrl ? (
                  <LayerGroup>
                    <TileLayer url={layer.url} attribution={layer.attribution} />
                    <TileLayer url={layer.overlayUrl} attribution={layer.overlayAttribution} />
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
          <MapResizer trigger={stationOpen || rinexUserOpen} />

          {stations.length > 0 && (
            <div className="map-search-controls">
              <StationSearch />
              <NearbyStations />
            </div>
          )}

          <ScopeBoundsTracker stations={stations} onVisibleStationsChange={setVisibleStations} />

          {stations.map((station) => (
            <StationMarker
              key={station._id}
              station={station}
              isHighlighted={hoveredStationId === station._id}
              onSelect={() => {
                setSelectedStation(station);
                setRinexUserOpen(false);
              }}
            />
          ))}
        </MapContainer>
      </div>

      {selectedStation && (
        <div className="station-sidebar">
          <StationDetails station={selectedStation} onClose={handleCloseStation} />
        </div>
      )}
    </div>
  );
};

export default MapView;
