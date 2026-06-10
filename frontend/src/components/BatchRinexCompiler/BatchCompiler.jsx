import { useState, useEffect, useRef, useMemo } from "react";
import "./BatchCompiler.css";

const BatchCompiler = ({
  visibleStations,
  selectedStationIds,
  setSelectedStationIds,
  forceCollapsed = false,
  onForceToggle,            // called when user clicks ‹/› while force-collapsed
  onHoverStationId,         // Callback for station hover highlighting on map
}) => {
  const stationCacheRef = useRef({});

  useEffect(() => {
    visibleStations.forEach((s) => {
      stationCacheRef.current[s._id] = s;
    });
  }, [visibleStations]);

  const [searchQuery, setSearchQuery] = useState("");
  const [sidebarWidth, setSidebarWidth] = useState(340);
  const [isResizing, setIsResizing] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);

  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [startHour, setStartHour] = useState("0");
  const [endHour, setEndHour] = useState("23");
  const [rinexVersion, setRinexVersion] = useState("3.05");
  const [isProcessing, setIsProcessing] = useState(false);

  const sidebarRef = useRef(null);
  const widthBeforeCollapse = useRef(340);

  useEffect(() => {
    if (forceCollapsed) {
      widthBeforeCollapse.current = sidebarWidth;
      setIsCollapsed(true);
    } else {
      setIsCollapsed(false);
    }
  }, [forceCollapsed]);

  const handleCollapseToggle = () => {
    if (forceCollapsed) {
      // Delegate to MapView to toggle rinexUserOpen
      onForceToggle?.();
      return;
    }
    if (!isCollapsed) widthBeforeCollapse.current = sidebarWidth;
    setIsCollapsed((prev) => !prev);
  };

  // ── RESIZING ENGINE ──
  const startResizing = (e) => {
    if (isCollapsed) return;
    e.preventDefault();
    setIsResizing(true);
  };

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!isResizing) return;
      let newWidth = e.clientX;
      if (newWidth < 260) newWidth = 260;
      if (newWidth > 680) newWidth = 680;
      setSidebarWidth(newWidth);
    };
    const handleMouseUp = () => setIsResizing(false);
    if (isResizing) {
      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", handleMouseUp);
    }
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isResizing]);

  // ── COMBINED & PINNED STATION POOL ──
  const filteredStations = useMemo(() => {
    const poolMap = new Map();
    visibleStations.forEach((s) => poolMap.set(s._id, s));
    selectedStationIds.forEach((id) => {
      if (!poolMap.has(id) && stationCacheRef.current[id]) {
        poolMap.set(id, stationCacheRef.current[id]);
      }
    });
    
    const pool = Array.from(poolMap.values());
    const query = searchQuery.toLowerCase().trim();

    return pool
      .filter((station) => {
        if (!query) return true;
        const nameMatch = (station.name || "").toLowerCase().includes(query);
        const lng = station.location?.coordinates?.[0]?.toString() || "";
        const lat = station.location?.coordinates?.[1]?.toString() || "";
        return nameMatch || lat.includes(query) || lng.includes(query);
      })
      .sort((a, b) => {
        const aSel = selectedStationIds.includes(a._id);
        const bSel = selectedStationIds.includes(b._id);
        if (aSel && !bSel) return -1;
        if (!aSel && bSel) return 1;
        return (a.name || "").localeCompare(b.name || "");
      });
  }, [visibleStations, selectedStationIds, searchQuery]);

  const handleStationCheck = (id) => {
    setSelectedStationIds((prev) =>
      prev.includes(id) ? prev.filter((sid) => sid !== id) : [...prev, id]
    );
  };

  const allFilteredSelected =
    filteredStations.length > 0 &&
    filteredStations.every((s) => selectedStationIds.includes(s._id));

  const handleSelectAllFiltered = (e) => {
    const filteredIds = filteredStations.map((s) => s._id);
    if (e.target.checked) {
      setSelectedStationIds((prev) => Array.from(new Set([...prev, ...filteredIds])));
    } else {
      setSelectedStationIds((prev) => prev.filter((id) => !filteredIds.includes(id)));
    }
  };

  const handleBatchConvert = (e) => {
    e.preventDefault();
    if (selectedStationIds.length === 0) {
      alert("Please select at least one station.");
      return;
    }
    if (!startDate || !endDate) {
      alert("Please enter a valid date range.");
      return;
    }
    setIsProcessing(true);
    setTimeout(() => {
      setIsProcessing(false);
      alert(`Done! Exported ${selectedStationIds.length} station(s).`);
    }, 5000);
  };

  // ── COLLAPSED RAIL VIEW ──
  if (isCollapsed) {
    return (
      <aside className="batch-download-sidebar batch-download-sidebar--collapsed">
        {/* Always show the expand arrow — if force-collapsed it calls onForceToggle */}
        <button
          className="sidebar-collapse-btn sidebar-collapse-btn--rail"
          onClick={handleCollapseToggle}
          title="Expand RINEX sidebar"
          aria-label="Expand RINEX sidebar"
        >
          ›
        </button>
        <div className="sidebar-rail-label">RINEX Files</div>
        {selectedStationIds.length > 0 && (
          <div className="sidebar-rail-badge">{selectedStationIds.length}</div>
        )}
      </aside>
    );
  }

  return (
    <aside
      className={`batch-download-sidebar ${isResizing ? "is-resizing" : ""}`}
      ref={sidebarRef}
      style={{ width: `${sidebarWidth}px` }}
    >
      <div
        className="sidebar-resizer-handle"
        onMouseDown={startResizing}
        title="Drag to resize"
      />

      <div className="batch-sidebar__header">
        <div className="batch-sidebar__header-top">
          <div>
            <h2 className="batch-sidebar__title">RINEX Compiler</h2>
            <p className="batch-sidebar__subtitle">Batch export across stations</p>
          </div>
          <button
            className="sidebar-collapse-btn"
            onClick={handleCollapseToggle}
            title="Collapse sidebar"
            aria-label="Collapse sidebar"
          >
            ‹
          </button>
        </div>
        {selectedStationIds.length > 0 && (
          <div className="batch-selection-pill">
            {selectedStationIds.length} station{selectedStationIds.length !== 1 ? "s" : ""} selected
          </div>
        )}
      </div>

      <form onSubmit={handleBatchConvert} className="batch-sidebar__form">

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
            {filteredStations.length > 0 && (
              <label className="batch-select-all">
                <input
                  type="checkbox"
                  onChange={handleSelectAllFiltered}
                  checked={allFilteredSelected}
                />
                <span>Select all</span>
              </label>
            )}
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
                      onChange={() => handleStationCheck(station._id)}
                    />
                    <div className="batch-station-info-block">
                      <span className="batch-station-name-text">
                        {station.name || "Unnamed Station"}
                      </span>
                      {lat != null && lng != null && (
                        <span className="batch-station-coords-subtext">
                          {lat.toFixed(4)}°&thinsp;N &nbsp;{lng.toFixed(4)}°&thinsp;E
                        </span>
                      )}
                    </div>
                    {isChecked && <span className="batch-station-check-tick">✓</span>}
                  </label>
                );
              })
            )}
          </div>
        </div>

        <div className="batch-form-section">
          <label className="batch-section-label">Date Range</label>
          <div className="batch-grid-row">
            <div>
              <span className="batch-input-sublabel">From</span>
              <input
                type="date"
                required
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="batch-input-field"
              />
            </div>
            <div>
              <span className="batch-input-sublabel">To</span>
              <input
                type="date"
                required
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="batch-input-field"
              />
            </div>
          </div>
        </div>

        <div className="batch-form-section">
          <label className="batch-section-label">Hour Window</label>
          <div className="batch-grid-row">
            <div>
              <span className="batch-input-sublabel">Start</span>
              <select
                value={startHour}
                onChange={(e) => setStartHour(e.target.value)}
                className="batch-input-field"
              >
                {Array.from({ length: 24 }).map((_, h) => (
                  <option key={h} value={h}>{String(h).padStart(2, "0")}:00</option>
                ))}
              </select>
            </div>
            <div>
              <span className="batch-input-sublabel">End</span>
              <select
                value={endHour}
                onChange={(e) => setEndHour(e.target.value)}
                className="batch-input-field"
              >
                {Array.from({ length: 24 }).map((_, h) => (
                  <option key={h} value={h}>{String(h).padStart(2, "0")}:00</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className="batch-form-section">
          <label className="batch-section-label">RINEX Version</label>
          <select
            value={rinexVersion}
            onChange={(e) => setRinexVersion(e.target.value)}
            className="batch-input-field"
          >
            <option value="2.11">v2.11 — Legacy Navigation</option>
            <option value="3.05">v3.05 — Multi-GNSS Standard</option>
            <option value="4.01">v4.01 — High-Rate Phase</option>
          </select>
        </div>

        <div className="batch-action-center-wrapper">
          <button
            type="submit"
            disabled={isProcessing}
            className={`batch-giant-circle-btn ${isProcessing ? "batch-giant-circle-btn--loading" : ""}`}
          >
            {isProcessing ? (
              <div className="batch-btn-spinner" />
            ) : (
              <svg
                className="batch-btn-icon"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3" />
              </svg>
            )}
          </button>
          <span className="batch-action-label-text">
            {isProcessing
              ? `Compiling RINEX v${rinexVersion}…`
              : "Download Files"}
          </span>
        </div>
      </form>
    </aside>
  );
};

export default BatchCompiler;