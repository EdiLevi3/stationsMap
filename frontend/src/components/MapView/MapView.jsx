// Main map component. Fetches stations, renders the Leaflet map with markers,
// search bar, layer switcher (Streets/Hybrid), and a home button.

import { useEffect, useRef } from 'react';
import { MapContainer, TileLayer, LayersControl, LayerGroup, useMap, useMapEvents } from 'react-leaflet';
import { useStations } from '../../hooks/useStations';
import StationMarker from '../StationMarker/StationMarker';
import StationSearch from '../StationSearch/StationSearch';
import 'leaflet/dist/leaflet.css';
import './MapView.css';

// Fix default marker icon issue with bundlers
import leaflet from 'leaflet';
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

delete leaflet.Icon.Default.prototype._getIconUrl;
leaflet.Icon.Default.mergeOptions({
    iconRetinaUrl: markerIcon2x,
    iconUrl: markerIcon,
    shadowUrl: markerShadow,
});

const FALLBACK_CENTER = [31.5, 34.8];
const FALLBACK_ZOOM = 8;

// Calculate the bounding box that contains all stations
const getBounds = (stations) => {
    if (!stations || stations.length === 0) return null;
    const lats = stations.map((station) => station.approxLocation.lat);
    const lons = stations.map((station) => station.approxLocation.lon);
    return [
        [Math.min(...lats), Math.min(...lons)],
        [Math.max(...lats), Math.max(...lons)],
    ];
};

// Auto-fits the map view to show all stations on initial load
const FitBounds = ({ stations }) => {
    const map = useMap();
    useEffect(() => {
        const bounds = getBounds(stations);
        if (bounds) {
            map.fitBounds(bounds, { padding: [40, 40] });
        }
    }, [stations, map]);
    return null;
};

// Button that resets the map view to show all stations
const CenterButton = ({ stations }) => {
    const map = useMap();
    const handleClick = () => {
        const bounds = getBounds(stations);
        if (bounds) {
            map.flyToBounds(bounds, { padding: [40, 40] });
        } else {
            map.flyTo(FALLBACK_CENTER, FALLBACK_ZOOM);
        }
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

const ESRI_IMAGERY = 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}';
const CARTO_LABELS = 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager_only_labels/{z}/{x}/{y}{r}.png';

// Available map tile layers (Streets = OSM, Hybrid = Esri satellite + CARTO labels)
export const TILE_LAYERS = [
    {
        name: 'Streets',
        url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    },
    {
        name: 'Hybrid',
        url: ESRI_IMAGERY,
        attribution: 'Tiles &copy; Esri',
        overlayUrl: CARTO_LABELS,
        overlayAttribution: '&copy; <a href="https://carto.com/">CARTO</a>',
    },
];

export const STORAGE_KEY = 'mapLayerPreference';
export const DEFAULT_LAYER = 'Streets';

// Read the user's saved layer preference from localStorage
export const getStoredLayer = () => {
    const stored = localStorage.getItem(STORAGE_KEY);
    const validNames = TILE_LAYERS.map((layer) => layer.name);
    if (stored && validNames.includes(stored)) return stored;
    if (stored) localStorage.removeItem(STORAGE_KEY);
    return DEFAULT_LAYER;
};

// Persists the selected map layer to localStorage when the user switches layers
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

    const storedLayer = getStoredLayer();

    return (
        <div className="map-wrapper">
            {stations.length > 0 && (
                <div className="station-count">
                    📍 {stations.length} stations
                </div>
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
                {stations.length > 0 && (
                    <StationSearch markerRefs={markerRefs} />
                )}
                {stations.map((station) => (
                    <StationMarker
                        key={station._id}
                        station={station}
                        markerRef={(marker) => {
                            if (marker) {
                                markerRefs.current.set(station._id, marker);
                            } else {
                                markerRefs.current.delete(station._id);
                            }
                        }}
                    />
                ))}
            </MapContainer>
        </div>
    );
};

export default MapView;
