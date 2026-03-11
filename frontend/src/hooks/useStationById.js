// Fetches a single station's full details (including records) by ID.
// Uses a cancelled flag to prevent state updates if the component unmounts.

import { useState, useEffect } from 'react';

const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:5004';

export const useStationById = (stationId) => {
    const [station, setStation] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        let cancelled = false;
        setLoading(true);
        setError(null);
        fetch(`${baseURL}/api/stations/${stationId}`)
            .then((res) => {
                if (!res.ok) throw new Error(`HTTP ${res.status}`);
                return res.json();
            })
            .then((stationData) => { if (!cancelled) setStation(stationData); })
            .catch((err) => { if (!cancelled) setError(err.message || 'Failed to load station'); })
            .finally(() => { if (!cancelled) setLoading(false); });
        return () => { cancelled = true; };
    }, [stationId]);

    return { station, loading, error };
};
