// Provides a download(stationId, date) function that fetches a presigned S3 URL.
// Returns { download, loading }.

import { useState, useCallback } from 'react';

const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:5004';

export const useDownloadUrl = () => {
    const [loading, setLoading] = useState(false);

    const download = useCallback(async (stationId, date) => {
        setLoading(true);
        try {
            const params = new URLSearchParams({ station: stationId, date });
            const res = await fetch(`${baseURL}/api/download?${params}`);
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            return await res.json();
        } finally {
            setLoading(false);
        }
    }, []);

    return { download, loading };
};
