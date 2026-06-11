const BatchStationList = ({
  filteredStations,
  selectedStationIds,
  visibleStations,
  allFilteredSelected,
  searchQuery,
  setSearchQuery,
  onStationCheck,
  onSelectAllFiltered,
  onClearAll,
  onHoverStationId,
  onSelectStation,
}) => {
  return (
    <>
      <div className="batch-form-section">
        <label className="batch-section-label">Filter Viewport</label>
        <div className="batch-search-wrapper">
          <span className="batch-search-icon">⌕</span>
          <input
            type="text"
            placeholder="Name or coordinates…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="batch-input-field batch-search-input"
          />
          {searchQuery && (
            <button
              type="button"
              className="batch-search-clear"
              onClick={() => setSearchQuery("")}
              aria-label="Clear search"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      <div className="batch-form-section batch-form-section--grow">
        <div className="batch-section-title-row">
          <label className="batch-section-label">
            Stations&nbsp;
            <span className="batch-count-chip">
              {filteredStations.length}
              {filteredStations.length !== visibleStations.length && (
                <> / {visibleStations.length}</>
              )}
            </span>
          </label>
          <div className="batch-selection-actions">
            {filteredStations.length > 0 && (
              <label className="batch-select-all">
                <input
                  type="checkbox"
                  onChange={onSelectAllFiltered}
                  checked={allFilteredSelected}
                />
                <span>Select all</span>
              </label>
            )}
            {selectedStationIds.length > 0 && (
              <button type="button" className="batch-clear-btn" onClick={onClearAll}>
                Clear all
              </button>
            )}
          </div>
        </div>

        <div className="batch-station-scrollbox">
          {filteredStations.length === 0 ? (
            <div className="batch-empty-scope">
              {visibleStations.length === 0
                ? "Pan the map to load stations into view."
                : "No stations match your search."}
            </div>
          ) : (
            filteredStations.map((station) => {
              const isChecked = selectedStationIds.includes(station._id);
              const lat = station.location?.coordinates?.[1];
              const lng = station.location?.coordinates?.[0];
              return (
                <label
                  key={station._id}
                  className={`batch-station-row ${isChecked ? "batch-station-row--checked" : ""}`}
                  onMouseEnter={() => onHoverStationId?.(station._id)}
                  onMouseLeave={() => onHoverStationId?.(null)}
                >
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={() => onStationCheck(station._id)}
                  />
                  <div className="batch-station-info-block">
                    <span className="batch-station-name-text">
                      {station.name || "Unnamed Station"}
                    </span>
                    {lat != null && lng != null && (
                      <span className="batch-station-coords-subtext">
                        {lat}°&thinsp;N &nbsp;{lng}°&thinsp;E
                      </span>
                    )}
                  </div>
                  {isChecked && <span className="batch-station-check-tick">✓</span>}
                  <button
                    type="button"
                    className="batch-station-details-btn"
                    title="View station details"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      onSelectStation?.(station);
                    }}
                  >
                    ⓘ
                  </button>
                </label>
              );
            })
          )}
        </div>
      </div>
    </>
  );
};

export default BatchStationList;
