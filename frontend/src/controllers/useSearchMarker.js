// Hook that manages the black search marker and radius circles on the map.
// Handles placing/removing markers, creating circles after flyTo, and circle visibility toggling.

import { useState, useRef, useEffect, useCallback } from 'react';
import { useMap } from 'react-leaflet';
import leaflet from 'leaflet';
import { RADIUS_CIRCLE_CONFIGS } from '../config';

const BLACK_MARKER_ICON = new leaflet.Icon({
    iconUrl: 'data:image/svg+xml,' + encodeURIComponent(`
        <svg xmlns="http://www.w3.org/2000/svg" width="25" height="41" viewBox="0 0 25 41">
            <path d="M12.5 0C5.6 0 0 5.6 0 12.5C0 21.9 12.5 41 12.5 41S25 21.9 25 12.5C25 5.6 19.4 0 12.5 0z" fill="#000000"/>
            <circle cx="12.5" cy="12.5" r="5" fill="#ffffff"/>
        </svg>
    `),
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
});

const useSearchMarker = () => {
    const map = useMap();
    const searchMarkerRef = useRef(null);
    const radiusCirclesRef = useRef([]);
    const [radiusCircleVisibility, setRadiusCircleVisibility] = useState(() =>
        Object.fromEntries(RADIUS_CIRCLE_CONFIGS.map(({ key }) => [key, true]))
    );
    const [hasRadiusCircles, setHasRadiusCircles] = useState(false);

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

    const toggleRadiusCircle = useCallback((key) => {
        setRadiusCircleVisibility((prev) => ({ ...prev, [key]: !prev[key] }));
    }, []);

    const removeSearchMarker = useCallback(() => {
        if (searchMarkerRef.current) {
            searchMarkerRef.current.remove();
            searchMarkerRef.current = null;
        }
        radiusCirclesRef.current.forEach((radiusCircle) => radiusCircle.remove());
        radiusCirclesRef.current = [];
        setHasRadiusCircles(false);
    }, []);

    const flyToGeoLocation = useCallback((lat, lon, label) => {
        removeSearchMarker();
        const geoMarker = leaflet.marker([lat, lon], { icon: BLACK_MARKER_ICON })
            .addTo(map)
            .bindPopup(label)
            .openPopup();
        searchMarkerRef.current = geoMarker;

        const largestRadiusMeters = RADIUS_CIRCLE_CONFIGS[RADIUS_CIRCLE_CONFIGS.length - 1].radiusMeters;
        const fitBounds = leaflet.latLng(lat, lon).toBounds(largestRadiusMeters * 2);
        const targetZoom = map.getBoundsZoom(fitBounds, false);

        const addCirclesAfterFly = () => {
            map.off('moveend', addCirclesAfterFly);
            const radiusCircles = RADIUS_CIRCLE_CONFIGS.map(({ radiusMeters, color, key }) => {
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
            });
            radiusCirclesRef.current = radiusCircles;
            setHasRadiusCircles(true);
        };

        map.on('moveend', addCirclesAfterFly);
        map.flyTo([lat, lon], targetZoom);
    }, [map, removeSearchMarker, radiusCircleVisibility]);

    return {
        flyToGeoLocation,
        removeSearchMarker,
        hasRadiusCircles,
        radiusCircleVisibility,
        toggleRadiusCircle,
    };
};

export default useSearchMarker;
