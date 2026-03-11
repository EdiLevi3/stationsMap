// Button that fetches a presigned S3 URL and opens it in a new tab to download a RINEX file.

import { useDownloadUrl } from '../../hooks/useDownloadUrl';
import './DownloadButton.css';

const DownloadButton = ({ stationId, date, onError }) => {
    const { download, loading } = useDownloadUrl();

    const handleDownload = async () => {
        if (!date) return;
        try {
            const { url } = await download(stationId, date);
            window.open(url, '_blank');
        } catch (err) {
            if (onError) onError(err.message || 'Download failed');
        }
    };

    return (
        <button
            className="download-btn"
            aria-label="Download RINEX file"
            disabled={loading || !date}
            onClick={handleDownload}
        >
            {loading ? (
                <>
                    <div className="download-btn__spinner spinner spinner--small spinner--light" />
                    <span>Downloading...</span>
                </>
            ) : (
                <>
                    <span>⬇️</span>
                    <span>Download RINEX</span>
                </>
            )}
        </button>
    );
};

export default DownloadButton;
