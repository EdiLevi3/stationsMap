import { useEffect } from "react";
import { useMap, useMapEvents } from "react-leaflet";
import leaflet from "leaflet";
import { getBounds, FALLBACK_CENTER, FALLBACK_ZOOM, STORAGE_KEY } from "./mapLayers";

export const FitBounds = ({ stations }) => {
  const map = useMap();
  useEffect(() => {
    const bounds = getBounds(stations);
    if (bounds) map.fitBounds(bounds, { padding: [40, 40] });
  }, [stations, map]);
  return null;
};

export const FlyToStation = ({ station }) => {
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

export const MapResizer = ({ trigger }) => {
  const map = useMap();
  useEffect(() => {
    const timer = setTimeout(() => map.invalidateSize(), 320);
    return () => clearTimeout(timer);
  }, [trigger, map]);
  return null;
};

export const CenterButton = ({ stations }) => {
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

export const ScopeBoundsTracker = ({ stations, onVisibleStationsChange }) => {
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

export const LayerChangeHandler = () => {
  useMapEvents({
    baselayerchange: (e) => localStorage.setItem(STORAGE_KEY, e.name),
  });
  return null;
};
