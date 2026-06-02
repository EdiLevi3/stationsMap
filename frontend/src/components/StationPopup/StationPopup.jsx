// Popup content shown when a station marker is clicked.
// Fetches full station details, displays coordinates, and provides
// a date selector + download button for RINEX files.

import { useState, useEffect } from 'react';
import './StationPopup.css';
import { useStationById } from '../../hooks/useStationById';
import DateSelector from '../DateSelector/DateSelector';
import DownloadButton from '../DownloadButton/DownloadButton';

const StationPopup = ({ stationId, stationName, approxLocation, popupRef }) => {
    const { station, loading, error } = useStationById(stationId);
    const [selectedDate, setSelectedDate] = useState('');
    const [downloadError, setDownloadError] = useState(null);

    // Re-trigger auto-pan after async content loads so the full popup is visible
    useEffect(() => {
        if (!station || !popupRef?.current) return;
        requestAnimationFrame(() => {
            popupRef.current?.update();
        });
    }, [station, popupRef]);

    // const locationParts = [city, country].filter(Boolean);
    // const locationStr = locationParts.length
    //     ? locationParts.join(', ')
    //     : null;

    const locationStr = "hi"

    return (
        <div className="popup" aria-label="Station details" role="dialog">
            <div className="popup__header">
                <span className="popup__icon">📡</span>
                <div>
                    <h3 className="popup__name">{stationName}</h3>
                    {locationStr && (
                        <div className="popup__location">
                            {locationStr}
                            {/* {countrycode && <span className="popup__countrycode"> ({countrycode})</span>} */}
                        </div>
                    )}
                </div>
            </div>

            <div className="popup__coords">
                <span><span className="popup__coord-label">Lat: </span>{approxLocation[1]}°</span>
                <span><span className="popup__coord-label">Lon: </span>{approxLocation[0]}°</span>
            </div>

            {loading && (
                <div className="popup__loading">
                    <div className="spinner spinner--small" />
                    <span>Loading details...</span>
                </div>
            )}

            {error && <div className="popup__error" role="alert">{error}</div>}

            {station && (
                <div className="popup__actions">
                    <DateSelector
                        dates={station.records.map((record) => record.date)}
                        selectedDate={selectedDate}
                        onChange={(date) => { setSelectedDate(date); setDownloadError(null); }}
                    />
                    <DownloadButton
                        stationId={stationId}
                        date={selectedDate}
                        onError={setDownloadError}
                    />
                    {downloadError && <div className="download-error" role="alert">⚠️ {downloadError}</div>}
                </div>
            )}
        </div>
    );
};

export default StationPopup;
