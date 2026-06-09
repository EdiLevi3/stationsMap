import { useState, useEffect, useRef } from "react";
import "./BatchCompiler.css";

const BatchCompiler = ({ visibleStations, selectedStationIds, setSelectedStationIds }) => {
  // New States for Sidebar UI behavior
  const [searchQuery, setSearchQuery] = useState("");
  const [sidebarWidth, setSidebarWidth] = useState(340); // default width in pixels
  const [isResizing, setIsResizing] = useState(false);

  // Core configuration form states
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [startHour, setStartHour] = useState("0");
  const [endHour, setEndHour] = useState("23");
  const [rinexVersion, setRinexVersion] = useState("3.05");
  const [isProcessing, setIsProcessing] = useState(false);

  const sidebarRef = useRef(null);

  // ── RESIZING ENGINE (DRAG-TO-RESIZE) ──
  const startResizing = (e) => {
    e.preventDefault();
    setIsResizing(true);
  };

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!isResizing) return;
      // Get distance from the left edge of screen to mouse pointer
      let newWidth = e.clientX;
      
      // Set bounds limits so the user can't accidentally break the layout
      if (newWidth < 260) newWidth = 260;
      if (newWidth > 600) newWidth = 600;
      
      setSidebarWidth(newWidth);
    };

    const handleMouseUp = () => {
      setIsResizing(false);
    };

    if (isResizing) {
      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", handleMouseUp);
    }

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isResizing]);


  // ── SEARCH & FILTER ENGINE ──
  // Filters visible stations by matching name OR coordinates strings
  const filteredStations = visibleStations.filter((station) => {
    const query = searchQuery.toLowerCase().trim();
    if (!query) return true;

    const nameMatch = (station.name || "").toLowerCase().includes(query);
    
    // Coordinates mapping safe checks [lng, lat]
    const lng = station.location?.coordinates?.[0]?.toString() || "";
    const lat = station.location?.coordinates?.[1]?.toString() || "";
    const coordMatch = lat.includes(query) || lng.includes(query);

    return nameMatch || coordMatch;
  });


  // ── SELECTION LOGIC ──
  const handleStationCheck = (id) => {
    setSelectedStationIds((prev) =>
      prev.includes(id) ? prev.filter((sid) => sid !== id) : [...prev, id]
    );
  };

  const handleSelectAllFiltered = (e) => {
    if (e.target.checked) {
      const allFilteredIds = filteredStations.map((s) => s._id);
      setSelectedStationIds((prev) => Array.from(new Set([...prev, ...allFilteredIds])));
    } else {
      const filteredIds = filteredStations.map((s) => s._id);
      setSelectedStationIds((prev) => prev.filter((id) => !filteredIds.includes(id)));
    }
  };

  const handleBatchConvert = (e) => {
    e.preventDefault();
    if (selectedStationIds.length === 0) {
      alert("Please select at least one station from the checklist container.");
      return;
    }
    if (!startDate || !endDate) {
      alert("Please enter a valid timeline range configuration.");
      return;
    }

    setIsProcessing(true);
    setTimeout(() => {
      setIsProcessing(false);
      alert(`Success! Compiled batch processing loop completed for ${selectedStationIds.length} stations.`);
    }, 5000);
  };

  return (
    <aside 
      className={`batch-download-sidebar ${isResizing ? "is-resizing" : ""}`}
      ref={sidebarRef}
      style={{ width: `${sidebarWidth}px` }}
    >
      {/* DRAG HANDLE RESIZER STRIP */}
      <div className="sidebar-resizer-handle" onMouseDown={startResizing} />

      <div className="batch-sidebar__header">
        <h2>Batch RINEX Compiler</h2>
        <p className="batch-sidebar__subtitle">Extract datasets across multiple scopes</p>
      </div>

      <form onSubmit={handleBatchConvert} className="batch-sidebar__form">
        
        {/* NEW SEARCH & FILTER SUB-CONTAINER */}
        <div className="batch-form-section">
          <label className="batch-section-label">Filter Current Viewport</label>
          <div className="batch-search-wrapper">
            <input
              type="text"
              placeholder="Search by name or coordinates..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="batch-input-field batch-search-input"
            />
            {searchQuery && (
              <button 
                type="button" 
                className="batch-search-clear" 
                onClick={() => setSearchQuery("")}
              >
                ✕
              </button>
            )}
          </div>
        </div>

        {/* Dynamic Station Scope Checkbox Listing */}
        <div className="batch-form-section">
          <div className="batch-section-title-row">
            <label className="batch-section-label">
              Results ({filteredStations.length}/{visibleStations.length})
            </label>
            {filteredStations.length > 0 && (
              <label className="batch-select-all">
                <input
                  type="checkbox"
                  onChange={handleSelectAllFiltered}
                  checked={filteredStations.every((s) => selectedStationIds.includes(s._id))}
                />
                <span>Select Page</span>
              </label>
            )}
          </div>

          <div className="batch-station-scrollbox">
            {filteredStations.length === 0 ? (
              <div className="batch-empty-scope">
                {visibleStations.length === 0 
                  ? "No stations found within your current map scope view." 
                  : "No stations match your query search filter parameters."}
              </div>
            ) : (
              filteredStations.map((station) => (
                <label key={station._id} className="batch-station-row">
                  <input
                    type="checkbox"
                    checked={selectedStationIds.includes(station._id)}
                    onChange={() => handleStationCheck(station._id)}
                  />
                  <div className="batch-station-info-block">
                    <span className="batch-station-name-text">{station.name || "Unnamed Station"}</span>
                    {station.location?.coordinates && (
                      <span className="batch-station-coords-subtext">
                        {station.location.coordinates[1].toFixed(3)}°, {station.location.coordinates[0].toFixed(3)}°
                      </span>
                    )}
                  </div>
                </label>
              ))
            )}
          </div>
        </div>

        {/* Date Ranges Inputs */}
        <div className="batch-form-section">
          <label className="batch-section-label">Timeline Range</label>
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

        {/* Hourly Selection Framework */}
        <div className="batch-form-section">
          <label className="batch-section-label">Hour Interval Window</label>
          <div className="batch-grid-row">
            <div>
              <span className="batch-input-sublabel">Start Hour</span>
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
              <span className="batch-input-sublabel">End Hour</span>
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

        {/* Engine Version Selection Dropdown */}
        <div className="batch-form-section">
          <label className="batch-section-label">RINEX Version</label>
          <select
            value={rinexVersion}
            onChange={(e) => setRinexVersion(e.target.value)}
            className="batch-input-field"
          >
            <option value="2.11">v2.11 (Legacy Navigation Log)</option>
            <option value="3.05">v3.05 (Standard Multi-GNSS)</option>
            <option value="4.01">v4.01 (Modern High-Rate Phase)</option>
          </select>
        </div>

        {/* Huge Bottom Trigger Compilation System Action Block */}
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
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v4M7 10l5 5 5-5M12 15V3" />
              </svg>
            )}
          </button>
          <span className="batch-action-label-text">
            {isProcessing ? `Processing RINEX v${rinexVersion}...` : "Convert & Export Bundle"}
          </span>
        </div>
      </form>
    </aside>
  );
};

export default BatchCompiler;