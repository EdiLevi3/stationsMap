// Fetches all stations on mount. Returns { stations, loading, error, retry }.

import { useState, useEffect, useCallback } from 'react';

const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:5004';

export const useStations = () => {
    const [stations, setStations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const loadStations = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await fetch(`${baseURL}/api/stations`);
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            const data = await res.json();
            setStations(data);
        } catch (err) {
            setError(err.message || 'Failed to load stations');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadStations();
    }, [loadStations]);

    return { stations, loading, error, retry: loadStations };
};
