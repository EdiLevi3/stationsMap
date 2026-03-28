// Search bar overlay on the map. Supports:
// - Fuzzy station name search (via backend API)
// - Coordinate input: lat/lon pairs or UTM strings (e.g. "36 north 667000 3552000")
// - Place/address geocoding (via backend geocode API)
// - Keyboard navigation (arrows, enter, escape)

import { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import './StationSearch.css';
import { useMap } from 'react-leaflet';
import leaflet from 'leaflet';
import { highlightMatch } from '../../utils/highlightMatch';

const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:5004';

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

// Fetches place suggestions via backend geocode API
const geocodeQuery = async (query, signal) => {
    if (query.trim().length < 2) return [];
    try {
        const params = new URLSearchParams({ q: query });
        const res = await fetch(`${baseURL}/api/geocode?${params}`, { signal });
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

// Searches stations via backend fuzzy search API
const searchStationsAPI = async (query, signal) => {
    if (query.trim().length < 2) return [];
    try {
        const params = new URLSearchParams({ q: query });
        const res = await fetch(`${baseURL}/api/stations/search?${params}`, { signal });
        if (!res.ok) return [];
        return await res.json();
    } catch (err) {
        if (err.name === 'AbortError') return [];
        return [];
    }
};

// Coordinate input panel for direct lat/lon or UTM entry
const CoordinateInput = ({ onGoToLocation }) => {
    const [mode, setMode] = useState('utm'); // 'latlon' or 'utm'
    const [lat, setLat] = useState('');
    const [lon, setLon] = useState('');
    const [zone, setZone] = useState('36');
    const [hemisphere, setHemisphere] = useState('N');
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

const StationSearch = ({ markerRefs }) => {
    const [query, setQuery] = useState('');
    const [highlightedIndex, setHighlightedIndex] = useState(-1);
    const [isOpen, setIsOpen] = useState(false);
    const [geoResults, setGeoResults] = useState([]);
    const [stationResults, setStationResults] = useState([]);
    const [showCoordInput, setShowCoordInput] = useState(false);
    const stationAbortRef = useRef(null);
    const geoAbortRef = useRef(null);
    const searchMarkerRef = useRef(null);

    const map = useMap();
    const containerRef = useRef(null);
    const inputRef = useRef(null);

    // Combined results: stations first, then geo results (memoized)
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

    // Debounced station search via backend (with abort on new query)
    useEffect(() => {
        const trimmed = query.trim();
        if (!trimmed) {
            setStationResults([]);
            return;
        }

        const abortController = new AbortController();
        stationAbortRef.current?.abort();
        stationAbortRef.current = abortController;

        const timerId = setTimeout(async () => {
            const results = await searchStationsAPI(trimmed, abortController.signal);
            if (!abortController.signal.aborted) {
                setStationResults(results);
            }
        }, 200);

        return () => {
            clearTimeout(timerId);
            abortController.abort();
        };
    }, [query]);

    // Debounced geocoding (with abort on new query)
    useEffect(() => {
        const trimmed = query.trim();
        if (trimmed.length < 2) {
            setGeoResults([]);
            return;
        }

        const abortController = new AbortController();
        geoAbortRef.current?.abort();
        geoAbortRef.current = abortController;

        const timerId = setTimeout(async () => {
            const results = await geocodeQuery(trimmed, abortController.signal);
            if (!abortController.signal.aborted) {
                setGeoResults(results);
            }
        }, 350);

        return () => {
            clearTimeout(timerId);
            abortController.abort();
        };
    }, [query]);

    // Stop Leaflet event propagation on the container
    useEffect(() => {
        const el = containerRef.current;
        if (!el) return;
        leaflet.DomEvent.disableClickPropagation(el);
        leaflet.DomEvent.disableScrollPropagation(el);
    }, []);

    // Dismiss dropdown on outside click
    useEffect(() => {
        const handleMouseDown = (e) => {
            if (containerRef.current && !containerRef.current.contains(e.target)) {
                setIsOpen(false);
                setHighlightedIndex(-1);
            }
        };
        document.addEventListener('mousedown', handleMouseDown);
        return () => document.removeEventListener('mousedown', handleMouseDown);
    }, []);

    // Remove any previous search marker from the map
    const removeSearchMarker = useCallback(() => {
        if (searchMarkerRef.current) {
            searchMarkerRef.current.remove();
            searchMarkerRef.current = null;
        }
    }, []);

    // Place a black marker and fly to the given coordinates
    const flyToGeoLocation = useCallback((lat, lon, label) => {
        removeSearchMarker();
        const geoMarker = leaflet.marker([lat, lon], { icon: BLACK_MARKER_ICON })
            .addTo(map)
            .bindPopup(label)
            .openPopup();
        searchMarkerRef.current = geoMarker;
        map.flyTo([lat, lon], 14);
    }, [map, removeSearchMarker]);

    // Fly to the selected station/place and open its popup
    const handleSelect = useCallback((item) => {
        if (item.isGeo) {
            flyToGeoLocation(item.lat, item.lon, item.displayName);
        } else {
            removeSearchMarker();
            const { lat, lon } = item.approxLocation;
            map.flyTo([lat, lon], 14);
            const marker = markerRefs.current?.get(item._id);
            if (marker) {
                setTimeout(() => marker.openPopup(), 300);
            }
        }
        setQuery('');
        setIsOpen(false);
        setHighlightedIndex(-1);
        setGeoResults([]);
        setStationResults([]);
    }, [map, markerRefs, flyToGeoLocation, removeSearchMarker]);

    // Handle "Go to Location" from the coordinate input panel
    const handleGoToLocation = useCallback(async (coordString) => {
        try {
            const params = new URLSearchParams({ q: coordString });
            const res = await fetch(`${baseURL}/api/geocode?${params}`);
            if (!res.ok) return;
            const places = await res.json();
            if (places.length > 0) {
                const { lat, lon, displayName } = places[0];
                flyToGeoLocation(lat, lon, displayName);
                setShowCoordInput(false);
            }
        } catch {
            // silently ignore
        }
    }, [flyToGeoLocation]);

    const handleKeyDown = useCallback((e) => {
        if (e.key === 'Escape') {
            setIsOpen(false);
            setHighlightedIndex(-1);
            return;
        }

        if (e.key === 'Enter') {
            e.preventDefault();
            if (highlightedIndex >= 0 && highlightedIndex < allResults.length) {
                handleSelect(allResults[highlightedIndex]);
            } else if (allResults.length > 0) {
                handleSelect(allResults[0]);
            }
            return;
        }

        if (!isOpen || allResults.length === 0) return;

        switch (e.key) {
            case 'ArrowDown':
                e.preventDefault();
                setHighlightedIndex((prev) =>
                    prev < allResults.length - 1 ? prev + 1 : 0
                );
                break;
            case 'ArrowUp':
                e.preventDefault();
                setHighlightedIndex((prev) =>
                    prev > 0 ? prev - 1 : allResults.length - 1
                );
                break;
            default:
                break;
        }
    }, [isOpen, allResults, highlightedIndex, handleSelect]);

    const handleInputChange = (e) => {
        const value = e.target.value;
        setQuery(value);
        setIsOpen(true);
        setHighlightedIndex(-1);
    };

    const handleBlur = (e) => {
        if (containerRef.current && containerRef.current.contains(e.relatedTarget)) {
            return;
        }
        setIsOpen(false);
        setHighlightedIndex(-1);
    };

    const showList = isOpen && allResults.length > 0;
    const showNoResults = isOpen && query.trim() !== '' && allResults.length === 0;

    // Find where geo results start in the combined list
    const geoStartIndex = stationItems.length;

    return (
        <div className="station-search" ref={containerRef}>
            <div className="station-search__bar">
                <input
                    ref={inputRef}
                    className="station-search__input"
                    type="text"
                    placeholder="Search stations, places, or coordinates..."
                    value={query}
                    onChange={handleInputChange}
                    onKeyDown={handleKeyDown}
                    onBlur={handleBlur}
                    role="combobox"
                    aria-expanded={showList}
                    aria-controls="station-search-listbox"
                    aria-activedescendant={
                        highlightedIndex >= 0
                            ? `station-option-${highlightedIndex}`
                            : undefined
                    }
                    aria-autocomplete="list"
                    aria-label="Search stations, places, or coordinates"
                />
                <button
                    type="button"
                    className={`station-search__coord-toggle${showCoordInput ? ' station-search__coord-toggle--active' : ''}`}
                    onClick={() => setShowCoordInput((prev) => !prev)}
                    title="Enter coordinates"
                    aria-label="Toggle coordinate input"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 512 512" fill="currentColor">
                        <path d="M256 0C167.6 0 96 71.6 96 160c0 124.8 160 352 160 352s160-227.2 160-352C416 71.6 344.4 0 256 0zm0 240c-44.2 0-80-35.8-80-80s35.8-80 80-80 80 35.8 80 80-35.8 80-80 80z"/>
                        <ellipse cx="256" cy="472" rx="96" ry="40" fillOpacity="0.3"/>
                    </svg>
                </button>
            </div>
            {showCoordInput && (
                <CoordinateInput onGoToLocation={handleGoToLocation} />
            )}
            {showList && (
                <ul
                    className="station-search__list"
                    role="listbox"
                    id="station-search-listbox"
                >
                    {allResults.map((item, index) => (
                        <li
                            key={item._id}
                            id={`station-option-${index}`}
                            role="option"
                            aria-selected={index === highlightedIndex}
                            className={`station-search__item${index === highlightedIndex
                                ? ' station-search__item--highlighted'
                                : ''}${item.isGeo ? ' station-search__item--geo' : ''}`}
                            tabIndex={-1}
                            onClick={() => handleSelect(item)}
                            onMouseEnter={() => setHighlightedIndex(index)}
                        >
                            {index === geoStartIndex && geoStartIndex > 0 && geoItems.length > 0 && (
                                <div className="station-search__divider">Places</div>
                            )}
                            {item.isGeo ? (
                                <span className="station-search__geo-label">{item.displayName}</span>
                            ) : (
                                highlightMatch(item.stationName, query)
                            )}
                        </li>
                    ))}
                </ul>
            )}
            {showNoResults && (
                <div className="station-search__no-results">
                    No results found
                </div>
            )}
        </div>
    );
};

export default StationSearch;
