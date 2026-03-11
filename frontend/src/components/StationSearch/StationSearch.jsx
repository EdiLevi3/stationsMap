// Search bar overlay on the map. Supports:
// - Fuzzy station name search (via Fuse.js)
// - Place/address geocoding (via Nominatim API, debounced)
// - Keyboard navigation (arrows, enter, escape)

import { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import './StationSearch.css';
import { useMap } from 'react-leaflet';
import leaflet from 'leaflet';
import { createStationSearcher, filterStations } from '../../utils/filterStations';
import { highlightMatch } from '../../utils/highlightMatch';

const NOMINATIM_URL = 'https://nominatim.openstreetmap.org/search';

// Fetches place suggestions from OpenStreetMap's Nominatim geocoding API
const geocodeQuery = async (query) => {
    if (query.trim().length < 2) return [];
    try {
        const params = new URLSearchParams({
            q: query,
            format: 'json',
            limit: '5',
            addressdetails: '1',
        });
        const res = await fetch(`${NOMINATIM_URL}?${params}`, {
            headers: { 'Accept-Language': 'en' },
        });
        if (!res.ok) return [];
        const data = await res.json();
        return data.map((item) => ({
            _id: `geo-${item.place_id}`,
            displayName: item.display_name.split(',').slice(0, 2).join(','),
            lat: parseFloat(item.lat),
            lon: parseFloat(item.lon),
            isGeo: true,
        }));
    } catch {
        return [];
    }
};

const StationSearch = ({ stations, markerRefs }) => {
    const [query, setQuery] = useState('');
    const [highlightedIndex, setHighlightedIndex] = useState(-1);
    const [isOpen, setIsOpen] = useState(false);
    const [geoResults, setGeoResults] = useState([]);
    const geoTimerRef = useRef(null);

    const map = useMap();
    const containerRef = useRef(null);
    const inputRef = useRef(null);

    const fuse = useMemo(() => createStationSearcher(stations), [stations]);
    const stationResults = useMemo(() => filterStations(fuse, query), [fuse, query]);

    // Combined results: stations first, then geo results
    const allResults = useMemo(() => {
        const stationItems = stationResults.map((result) => ({
            ...result.item,
            isGeo: false,
            fuseResult: result,
        }));
        const geoItems = geoResults.filter(
            (geoResult) => !stationItems.some((station) => station.stationName?.toLowerCase() === geoResult.displayName?.toLowerCase())
        );
        return [...stationItems, ...geoItems];
    }, [stationResults, geoResults]);

    // Debounced geocoding
    useEffect(() => {
        if (geoTimerRef.current) clearTimeout(geoTimerRef.current);
        const trimmed = query.trim();
        if (trimmed.length < 2) {
            setGeoResults([]);
            return;
        }
        geoTimerRef.current = setTimeout(async () => {
            const results = await geocodeQuery(trimmed);
            setGeoResults(results);
        }, 350);
        return () => { if (geoTimerRef.current) clearTimeout(geoTimerRef.current); };
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

    // Fly to the selected station/place and open its popup
    const handleSelect = useCallback((item) => {
        if (item.isGeo) {
            map.flyTo([item.lat, item.lon], 14);
        } else {
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
    }, [map, markerRefs]);

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
            } else if (query.trim() !== '') {
                // Fallback: try fresh station search
                const freshStation = filterStations(fuse, query);
                if (freshStation.length > 0) {
                    handleSelect({ ...freshStation[0].item, isGeo: false });
                } else if (geoResults.length > 0) {
                    handleSelect(geoResults[0]);
                }
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
    }, [isOpen, allResults, highlightedIndex, handleSelect, query, fuse, geoResults]);

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
    const geoStartIndex = stationResults.length;

    return (
        <div className="station-search" ref={containerRef}>
            <input
                ref={inputRef}
                className="station-search__input"
                type="text"
                placeholder="Search stations or places..."
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
                aria-label="Search stations or places"
            />
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
                            {index === geoStartIndex && geoStartIndex > 0 && geoResults.length > 0 && (
                                <div className="station-search__divider">Places</div>
                            )}
                            {item.isGeo ? (
                                <span className="station-search__geo-label">📍 {item.displayName}</span>
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
