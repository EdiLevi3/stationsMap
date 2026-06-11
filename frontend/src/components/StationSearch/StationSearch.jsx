import { useState, useRef, useEffect, useCallback } from "react";
import "./StationSearch.css";
import { useMap } from "react-leaflet";
import leaflet from "leaflet";
import { highlightMatch } from "../../utils/highlightMatch";
import useGeoSearch from "../../hooks/useGeoSearch";
import useSearchMarker from "../../controllers/useSearchMarker";

const StationSearch = () => {
  const [query, setQuery] = useState("");
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const [isOpen, setIsOpen] = useState(false);

  const map = useMap();
  const containerRef = useRef(null);
  const inputRef = useRef(null);

  const {
    allResults,
    clearResults,
  } = useGeoSearch(query);
  const {
    removeSearchMarker,
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
    document.addEventListener("mousedown", handleMouseDown);
    return () => document.removeEventListener("mousedown", handleMouseDown);
  }, []);

  const handleSelect = useCallback(
    (item) => {
      removeSearchMarker();
      const [lon, lat] = item.location.coordinates;
      map.flyTo([lat, lon], 14);
      
      setQuery("");
      setIsOpen(false);
      setHighlightedIndex(-1);
      clearResults();
    },
    [map, removeSearchMarker, clearResults],
  );

  const handleKeyDown = useCallback(
    (e) => {
      if (e.key === "Escape") {
        setIsOpen(false);
        setHighlightedIndex(-1);
        return;
      }

      if (e.key === "Enter") {
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
        case "ArrowDown":
          e.preventDefault();
          setHighlightedIndex((prev) =>
            prev < allResults.length - 1 ? prev + 1 : 0,
          );
          break;
        case "ArrowUp":
          e.preventDefault();
          setHighlightedIndex((prev) =>
            prev > 0 ? prev - 1 : allResults.length - 1,
          );
          break;
        default:
          break;
      }
    },
    [isOpen, allResults, highlightedIndex, handleSelect],
  );

  const handleInputChange = (e) => {
    setQuery(e.target.value);
    setIsOpen(true);
    setHighlightedIndex(-1);
  };

  const handleBlur = (e) => {
    if (
      containerRef.current &&
      containerRef.current.contains(e.relatedTarget)
    ) {
      return;
    }
    setIsOpen(false);
    setHighlightedIndex(-1);
  };

  const showList = isOpen && allResults.length > 0;
  const showNoResults =
    isOpen && query.trim() !== "" && allResults.length === 0;

  return (
    <div className="station-search" ref={containerRef}>
      <div className="station-search__bar">
        <input
          ref={inputRef}
          className="station-search__input"
          type="text"
          placeholder="Search stations..."
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
          aria-label="Search stations"
        />
      </div>
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
              className={`station-search__item${
                index === highlightedIndex
                  ? " station-search__item--highlighted"
                  : ""
              }`}
              tabIndex={-1}
              onClick={() => handleSelect(item)}
              onMouseEnter={() => setHighlightedIndex(index)}
            >
              {highlightMatch(item.stationName, query)}
            </li>
          ))}
        </ul>
      )}
      {showNoResults && (
        <div className="station-search__no-results">No results found</div>
      )}
    </div>
  );
};

export default StationSearch;
