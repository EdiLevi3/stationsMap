// Hook that manages the black search marker, radius circles, and distance lines on the map.
// Handles placing/removing markers, creating circles after flyTo, fetching nearby stations,
// drawing distance lines, and visibility toggling for both layers.

import { useState, useRef, useEffect, useCallback } from "react";
import { useMap } from "react-leaflet";
import leaflet from "leaflet";
import { RADIUS_CIRCLE_CONFIGS, API_BASE_URL } from "../config";

const BLACK_MARKER_ICON = new leaflet.Icon({
  iconUrl:
    "data:image/svg+xml," +
    encodeURIComponent(`
        <svg xmlns="http://www.w3.org/2000/svg" width="25" height="41" viewBox="0 0 25 41">
            <path d="M12.5 0C5.6 0 0 5.6 0 12.5C0 21.9 12.5 41 12.5 41S25 21.9 25 12.5C25 5.6 19.4 0 12.5 0z" fill="#000000"/>
            <circle cx="12.5" cy="12.5" r="5" fill="#ffffff"/>
        </svg>
    `),
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
});

const DISTANCE_LINE_COLOR = "#555";
const DISTANCE_LINE_WEIGHT = 2;
const DISTANCE_LINE_DASH = "6, 4";

const fetchNearbyStations = async (lat, lon, maxDistanceMeters, signal) => {
  const params = new URLSearchParams({
    lat: String(lat),
    lon: String(lon),
    maxDistanceMeters: String(maxDistanceMeters),
  });
  const res = await fetch(`${API_BASE_URL}/api/stations/nearby?${params}`, {
    signal,
  });
  if (!res.ok) return [];
  return res.json();
};

const useSearchMarker = () => {
  const map = useMap();
  const searchMarkerRef = useRef(null);
  const radiusCirclesRef = useRef([]);
  const distanceLinesRef = useRef([]);
  const [radiusCircleVisibility, setRadiusCircleVisibility] = useState(() =>
    Object.fromEntries(RADIUS_CIRCLE_CONFIGS.map(({ key }) => [key, true])),
  );
  const [hasRadiusCircles, setHasRadiusCircles] = useState(false);
  const [nearbyStations, setNearbyStations] = useState([]);
  const [distanceLineVisibility, setDistanceLineVisibility] = useState({});

  // Sync radius circle visibility with checkbox state
  useEffect(() => {
    radiusCirclesRef.current.forEach((circle) => {
      const isVisible = radiusCircleVisibility[circle._radiusKey];
      if (isVisible && !map.hasLayer(circle)) {
        circle.addTo(map);
      } else if (!isVisible && map.hasLayer(circle)) {
        circle.remove();
      }
    });
  }, [radiusCircleVisibility, map]);

  // Sync distance line visibility with checkbox state
  useEffect(() => {
    distanceLinesRef.current.forEach(({ stationId, polyline, label }) => {
      const isVisible = distanceLineVisibility[stationId];
      if (isVisible && !map.hasLayer(polyline)) {
        polyline.addTo(map);
        label.addTo(map);
      } else if (!isVisible && map.hasLayer(polyline)) {
        polyline.remove();
        label.remove();
      }
    });
  }, [distanceLineVisibility, map]);

  const toggleRadiusCircle = useCallback((key) => {
    setRadiusCircleVisibility((prev) => ({ ...prev, [key]: !prev[key] }));
  }, []);

  const toggleDistanceLine = useCallback((stationId) => {
    setDistanceLineVisibility((prev) => ({
      ...prev,
      [stationId]: !prev[stationId],
    }));
  }, []);

  const removeDistanceLines = useCallback(() => {
    distanceLinesRef.current.forEach(({ polyline, label }) => {
      polyline.remove();
      label.remove();
    });
    distanceLinesRef.current = [];
    setNearbyStations([]);
    setDistanceLineVisibility({});
  }, []);

  const removeSearchMarker = useCallback(() => {
    if (searchMarkerRef.current) {
      searchMarkerRef.current.remove();
      searchMarkerRef.current = null;
    }
    radiusCirclesRef.current.forEach((radiusCircle) => radiusCircle.remove());
    radiusCirclesRef.current = [];
    setHasRadiusCircles(false);
    removeDistanceLines();
  }, [removeDistanceLines]);

  const flyToGeoLocation = useCallback(
    (lat, lon, label) => {
      removeSearchMarker();
      const geoMarker = leaflet
        .marker([lat, lon], { icon: BLACK_MARKER_ICON })
        .addTo(map)
        .bindPopup(label)
        .openPopup();
      searchMarkerRef.current = geoMarker;

      const largestRadiusMeters =
        RADIUS_CIRCLE_CONFIGS[RADIUS_CIRCLE_CONFIGS.length - 1].radiusMeters;
      const fitBounds = leaflet
        .latLng(lat, lon)
        .toBounds(largestRadiusMeters * 2);
      const targetZoom = map.getBoundsZoom(fitBounds, false);

      const abortController = new AbortController();

      const addCirclesAfterFly = async () => {
        map.off("moveend", addCirclesAfterFly);

        // Add radius circles
        const radiusCircles = RADIUS_CIRCLE_CONFIGS.map(
          ({ radiusMeters, color, key }) => {
            const circle = leaflet.circle([lat, lon], {
              radius: radiusMeters,
              color,
              fillColor: color,
              fillOpacity: 0.1,
              weight: 1,
            });
            circle._radiusKey = key;
            if (radiusCircleVisibility[key]) circle.addTo(map);
            return circle;
          },
        );
        radiusCirclesRef.current = radiusCircles;
        setHasRadiusCircles(true);

        // Fetch nearby stations and draw distance lines
        try {
          const stations = await fetchNearbyStations(
            lat,
            lon,
            largestRadiusMeters,
            abortController.signal,
          );
          if (abortController.signal.aborted) return;

          const distanceLines = stations.map((station) => {
            const [lon, lat] = station.fuseResult.location.coordinates;
            const stationLatLon = [lat, lon];
            const distanceKm = (station.distanceMeters / 1000).toFixed(2);

            const polyline = leaflet.polyline([[lat, lon], stationLatLon], {
              color: DISTANCE_LINE_COLOR,
              weight: DISTANCE_LINE_WEIGHT,
              dashArray: DISTANCE_LINE_DASH,
              interactive: false,
            });

            const midLat = (lat + stationLatLon[0]) / 2;
            const midLon = (lon + stationLatLon[1]) / 2;
            const distanceLabel = leaflet.marker([midLat, midLon], {
              icon: leaflet.divIcon({
                className: "distance-label",
                html: `<span>${distanceKm} km</span>`,
                iconSize: [80, 20],
                iconAnchor: [40, 10],
              }),
              interactive: false,
            });

            polyline.addTo(map);
            distanceLabel.addTo(map);

            return {
              stationId: station._id,
              stationName: station.stationName,
              distanceMeters: station.distanceMeters,
              polyline,
              label: distanceLabel,
            };
          });

          distanceLinesRef.current = distanceLines;
          setNearbyStations(stations);
          setDistanceLineVisibility(
            Object.fromEntries(stations.map((s) => [s._id, true])),
          );
        } catch (err) {
          if (err.name !== "AbortError") {
            console.error("Failed to fetch nearby stations:", err);
          }
        }
      };

      map.on("moveend", addCirclesAfterFly);
      map.flyTo([lat, lon], targetZoom);

      return () => abortController.abort();
    },
    [map, removeSearchMarker, radiusCircleVisibility],
  );

  return {
    flyToGeoLocation,
    removeSearchMarker,
    hasRadiusCircles,
    radiusCircleVisibility,
    toggleRadiusCircle,
    nearbyStations,
    distanceLineVisibility,
    toggleDistanceLine,
  };
};

export default useSearchMarker;
