// Coordinate input panel for direct lat/lon or UTM entry

import { useState } from 'react';
import { DEFAULT_UTM_ZONE, DEFAULT_UTM_HEMISPHERE } from '../../config';

const CoordinateInput = ({ onGoToLocation }) => {
    const [mode, setMode] = useState('utm'); // 'latlon' or 'utm'
    const [lat, setLat] = useState('');
    const [lon, setLon] = useState('');
    const [zone, setZone] = useState(DEFAULT_UTM_ZONE);
    const [hemisphere, setHemisphere] = useState(DEFAULT_UTM_HEMISPHERE);
    const [easting, setEasting] = useState('');
    const [northing, setNorthing] = useState('');

    const handleSubmit = (e) => {
        e.preventDefault();
        if (mode === 'latlon') {
            const latNum = parseFloat(lat);
            const lonNum = parseFloat(lon);
            if (Number.isFinite(latNum) && Number.isFinite(lonNum)) {
                onGoToLocation(`${latNum}, ${lonNum}`);
            }
        } else {
            const trimmedEasting = easting.trim();
            const trimmedNorthing = northing.trim();
            const trimmedZone = zone.trim();
            if (trimmedEasting && trimmedNorthing && trimmedZone) {
                onGoToLocation(`${trimmedZone} ${hemisphere} ${trimmedEasting} ${trimmedNorthing}`);
            }
        }
    };

    return (
        <div className="coord-input">
            <div className="coord-input__tabs">
                <button
                    type="button"
                    className={`coord-input__tab${mode === 'latlon' ? ' coord-input__tab--active' : ''}`}
                    onClick={() => setMode('latlon')}
                >
                    Lat / Lon
                </button>
                <button
                    type="button"
                    className={`coord-input__tab${mode === 'utm' ? ' coord-input__tab--active' : ''}`}
                    onClick={() => setMode('utm')}
                >
                    UTM
                </button>
            </div>
            <form className="coord-input__form" onSubmit={handleSubmit}>
                {mode === 'latlon' ? (
                    <div className="coord-input__fields">
                        <label className="coord-input__label">
                            Lat
                            <input
                                type="text"
                                className="coord-input__field"
                                value={lat}
                                onChange={(e) => setLat(e.target.value)}
                                placeholder=""
                            />
                        </label>
                        <label className="coord-input__label">
                            Lon
                            <input
                                type="text"
                                className="coord-input__field"
                                value={lon}
                                onChange={(e) => setLon(e.target.value)}
                                placeholder=""
                            />
                        </label>
                    </div>
                ) : (
                    <div className="coord-input__fields">
                        <label className="coord-input__label">
                            Zone
                            <input
                                type="text"
                                className="coord-input__field coord-input__field--small"
                                value={zone}
                                onChange={(e) => setZone(e.target.value)}
                                placeholder="36"
                            />
                        </label>
                        <label className="coord-input__label">
                            Hemi
                            <select
                                className="coord-input__field coord-input__field--small"
                                value={hemisphere}
                                onChange={(e) => setHemisphere(e.target.value)}
                            >
                                <option value="N">N</option>
                                <option value="S">S</option>
                            </select>
                        </label>
                        <label className="coord-input__label">
                            Easting
                            <input
                                type="text"
                                className="coord-input__field"
                                value={easting}
                                onChange={(e) => setEasting(e.target.value)}
                                placeholder=""
                            />
                        </label>
                        <label className="coord-input__label">
                            Northing
                            <input
                                type="text"
                                className="coord-input__field"
                                value={northing}
                                onChange={(e) => setNorthing(e.target.value)}
                                placeholder=""
                            />
                        </label>
                    </div>
                )}
                <button type="submit" className="coord-input__submit">
                    Go to Location
                </button>
            </form>
        </div>
    );
};

export default CoordinateInput;
