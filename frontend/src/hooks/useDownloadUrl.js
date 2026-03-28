// Provides a download(stationId, date) function that fetches a presigned S3 URL.
// Returns { download, loading, error }.

import { useState, useCallback } from 'react';
import { API_BASE_URL } from '../config';

export const useDownloadUrl = () => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const download = useCallback(async (stationId, date) => {
        setLoading(true);
        setError(null);
        try {
            const params = new URLSearchParams({ station: stationId, date });
            const res = await fetch(`${API_BASE_URL}/api/download?${params}`);
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            return await res.json();
        } catch (err) {
            setError(err.message || 'Failed to download');
            return null;
        } finally {
            setLoading(false);
        }
    }, []);

    return { download, loading, error };
};
