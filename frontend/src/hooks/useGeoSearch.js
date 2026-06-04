// Hook that manages debounced station search with abort support.
// Returns station results.

import { useState, useMemo, useEffect, useCallback } from 'react';
import { API_BASE_URL } from '../config';

const MIN_QUERY_LENGTH = 2;
const STATION_DEBOUNCE_MS = 200;

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

    const allResults = useMemo(() =>
        stationResults.map((station) => ({
            ...station,
            stationName: station.name, // Support both name and stationName for compatibility
        })),
        [stationResults]
    );

    const clearResults = useCallback(() => {
        setStationResults([]);
    }, []);

    return { allResults, stationItems: allResults, geoItems: [], clearResults };
};

export default useGeoSearch;
