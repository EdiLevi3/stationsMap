// Hook that manages debounced station + geocode search with abort support.
// Returns combined results (stations first, then geo places).

import { useState, useMemo, useEffect, useCallback } from 'react';
import { API_BASE_URL } from '../config';

const MIN_QUERY_LENGTH = 2;
const STATION_DEBOUNCE_MS = 200;
const GEOCODE_DEBOUNCE_MS = 350;

const fetchGeocodeSuggestions = async (query, signal) => {
    if (query.trim().length < MIN_QUERY_LENGTH) return [];
    try {
        const params = new URLSearchParams({ q: query });
        const res = await fetch(`${API_BASE_URL}/api/geocode?${params}`, { signal });
        if (!res.ok) return [];
        const places = await res.json();
        return places.map((place) => ({
            _id: `geo-${place.placeId}`,
            displayName: place.displayName,
            lat: place.lat,
            lon: place.lon,
            isGeo: true,
        }));
    } catch (err) {
        if (err.name === 'AbortError') return [];
        return [];
    }
};

const fetchStationResults = async (query, signal) => {
    if (query.trim().length < MIN_QUERY_LENGTH) return [];
    try {
        const params = new URLSearchParams({ q: query });
        const res = await fetch(`${API_BASE_URL}/api/stations/search?${params}`, { signal });
        if (!res.ok) return [];
        return await res.json();
    } catch (err) {
        if (err.name === 'AbortError') return [];
        return [];
    }
};

const useGeoSearch = (query) => {
    const [geoResults, setGeoResults] = useState([]);
    const [stationResults, setStationResults] = useState([]);

    // Debounced station search
    useEffect(() => {
        const trimmed = query.trim();
        if (!trimmed) {
            setStationResults([]);
            return;
        }

        const abortController = new AbortController();
        const timerId = setTimeout(async () => {
            const results = await fetchStationResults(trimmed, abortController.signal);
            if (!abortController.signal.aborted) {
                setStationResults(results);
            }
        }, STATION_DEBOUNCE_MS);

        return () => {
            clearTimeout(timerId);
            abortController.abort();
        };
    }, [query]);

    // Debounced geocoding
    useEffect(() => {
        const trimmed = query.trim();
        if (trimmed.length < MIN_QUERY_LENGTH) {
            setGeoResults([]);
            return;
        }

        const abortController = new AbortController();
        const timerId = setTimeout(async () => {
            const results = await fetchGeocodeSuggestions(trimmed, abortController.signal);
            if (!abortController.signal.aborted) {
                setGeoResults(results);
            }
        }, GEOCODE_DEBOUNCE_MS);

        return () => {
            clearTimeout(timerId);
            abortController.abort();
        };
    }, [query]);

    const stationItems = useMemo(() =>
        stationResults.map((result) => ({
            ...result.item,
            isGeo: false,
            fuseResult: result,
        })),
        [stationResults]
    );

    const geoItems = useMemo(() =>
        geoResults.filter(
            (geoResult) => !stationItems.some(
                (station) => station.stationName?.toLowerCase() === geoResult.displayName?.toLowerCase()
            )
        ),
        [geoResults, stationItems]
    );

    const allResults = useMemo(
        () => [...stationItems, ...geoItems],
        [stationItems, geoItems]
    );

    const clearResults = useCallback(() => {
        setGeoResults([]);
        setStationResults([]);
    }, []);

    // Geocode a coordinate string (lat/lon or UTM) via the backend API
    const geocodeCoordinates = useCallback(async (coordString) => {
        const params = new URLSearchParams({ q: coordString });
        const res = await fetch(`${API_BASE_URL}/api/geocode?${params}`);
        if (!res.ok) return null;
        const places = await res.json();
        if (places.length === 0) return null;
        return places[0];
    }, []);

    return { allResults, stationItems, geoItems, clearResults, geocodeCoordinates };
};

export default useGeoSearch;
