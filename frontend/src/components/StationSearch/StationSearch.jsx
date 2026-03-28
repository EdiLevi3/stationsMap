// Search bar overlay on the map. Supports:
// - Fuzzy station name search (via backend API)
// - Coordinate input: lat/lon pairs or UTM strings (e.g. "36 north 667000 3552000")
// - Place/address geocoding (via backend geocode API)
// - Keyboard navigation (arrows, enter, escape)

import { useState, useRef, useEffect, useCallback } from 'react';
import './StationSearch.css';
import { useMap } from 'react-leaflet';
import leaflet from 'leaflet';
import { highlightMatch } from '../../utils/highlightMatch';
import { RADIUS_CIRCLE_CONFIGS } from '../../config';
import useGeoSearch from '../../hooks/useGeoSearch';
import useSearchMarker from '../../controllers/useSearchMarker';
import CoordinateInput from '../CoordinateInput/CoordinateInput';

const StationSearch = ({ markerRefs }) => {
    const [query, setQuery] = useState('');
    const [highlightedIndex, setHighlightedIndex] = useState(-1);
    const [isOpen, setIsOpen] = useState(false);
    const [showCoordInput, setShowCoordInput] = useState(false);

    const map = useMap();
    const containerRef = useRef(null);
    const inputRef = useRef(null);

    const { allResults, stationItems, geoItems, clearResults, geocodeCoordinates } = useGeoSearch(query);
    const {
        flyToGeoLocation,
        removeSearchMarker,
        hasRadiusCircles,
        radiusCircleVisibility,
        toggleRadiusCircle,
    } = useSearchMarker();

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
        clearResults();
    }, [map, markerRefs, flyToGeoLocation, removeSearchMarker, clearResults]);

    const handleGoToLocation = useCallback(async (coordString) => {
        try {
            const place = await geocodeCoordinates(coordString);
            if (place) {
                flyToGeoLocation(place.lat, place.lon, place.displayName);
                setShowCoordInput(false);
            }
        } catch {
            // silently ignore
        }
    }, [flyToGeoLocation, geocodeCoordinates]);

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
        setQuery(e.target.value);
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
            {hasRadiusCircles && (
                <div className="radius-layers">
                    {RADIUS_CIRCLE_CONFIGS.map(({ key, label, color }) => (
                        <label key={key} className="radius-layers__item">
                            <input
                                type="checkbox"
                                checked={radiusCircleVisibility[key]}
                                onChange={() => toggleRadiusCircle(key)}
                                style={{ accentColor: color }}
                            />
                            <span className="radius-layers__color" style={{ background: color }} />
                            {label}
                        </label>
                    ))}
                </div>
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
