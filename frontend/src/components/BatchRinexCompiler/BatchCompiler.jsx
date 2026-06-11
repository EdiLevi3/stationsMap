import { useState, useEffect, useRef, useMemo } from "react";
import BatchStationList from "./BatchStationList";
import BatchDownloadForm from "./BatchDownloadForm";
import "./BatchCompiler.css";

const BatchCompiler = ({
  visibleStations,
  selectedStationIds,
  setSelectedStationIds,
  forceCollapsed = false,
  onForceToggle,
  onHoverStationId,
  onSelectStation,
}) => {
  const stationCacheRef = useRef({});
  useEffect(() => {
    visibleStations.forEach((s) => { stationCacheRef.current[s._id] = s; });
  }, [visibleStations]);

  const [searchQuery, setSearchQuery] = useState("");
  const [sidebarWidth, setSidebarWidth] = useState(340);
  const [isResizing, setIsResizing] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);

  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [dateError, setDateError] = useState("");
  const [startHour, setStartHour] = useState("0");
  const [endHour, setEndHour] = useState("23");
  const [hourError, setHourError] = useState("");
  const [rinexVersion, setRinexVersion] = useState("3.05");
  const [isProcessing, setIsProcessing] = useState(false);

  const todayIso = useMemo(() => new Date().toISOString().split("T")[0], []);

  const handleStartDateChange = (e) => {
    const val = e.target.value;
    setStartDate(val);
    setDateError(endDate && val > endDate ? "Start date cannot be after end date." : "");
  };
  const handleEndDateChange = (e) => {
    const val = e.target.value;
    setEndDate(val);
    setDateError(startDate && val < startDate ? "End date cannot be before start date." : "");
  };
  const handleStartHourChange = (e) => {
    const val = e.target.value;
    setStartHour(val);
    setHourError(Number(val) > Number(endHour) ? "Hours order are not valid." : "");
  };
  const handleEndHourChange = (e) => {
    const val = e.target.value;
    setEndHour(val);
    setHourError(Number(startHour) > Number(val) ? "Hours order are not valid." : "");
  };

  const sidebarRef = useRef(null);
  const widthBeforeCollapse = useRef(340);

  useEffect(() => {
    if (forceCollapsed) {
      widthBeforeCollapse.current = sidebarWidth;
      setIsCollapsed(true);
    } else {
      setIsCollapsed(false);
    }
  }, [forceCollapsed, sidebarWidth]);

  const handleCollapseToggle = () => {
    if (forceCollapsed) { onForceToggle?.(); return; }
    if (!isCollapsed) widthBeforeCollapse.current = sidebarWidth;
    onForceToggle?.();
    setIsCollapsed((prev) => !prev);
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

  const filteredStations = useMemo(() => {
    const poolMap = new Map();
    visibleStations.forEach((s) => poolMap.set(s._id, s));
    selectedStationIds.forEach((id) => {
      if (!poolMap.has(id) && stationCacheRef.current[id])
        poolMap.set(id, stationCacheRef.current[id]);
    });
    const pool = Array.from(poolMap.values());
    const query = searchQuery.toLowerCase().trim();
    return pool
      .filter((s) => {
        if (!query) return true;
        const lng = s.location?.coordinates?.[0]?.toString() || "";
        const lat = s.location?.coordinates?.[1]?.toString() || "";
        return (s.name || "").toLowerCase().includes(query) || lat.includes(query) || lng.includes(query);
      })
      .sort((a, b) => {
        const aSel = selectedStationIds.includes(a._id);
        const bSel = selectedStationIds.includes(b._id);
        if (aSel && !bSel) return -1;
        if (!aSel && bSel) return 1;
        return (a.name || "").localeCompare(b.name || "");
      });
  }, [visibleStations, selectedStationIds, searchQuery]);

  const handleStationCheck = (id) =>
    setSelectedStationIds((prev) =>
      prev.includes(id) ? prev.filter((sid) => sid !== id) : [...prev, id]
    );

  const allFilteredSelected =
    filteredStations.length > 0 &&
    filteredStations.every((s) => selectedStationIds.includes(s._id));

  const handleSelectAllFiltered = (e) => {
    const ids = filteredStations.map((s) => s._id);
    if (e.target.checked) {
      setSelectedStationIds((prev) => Array.from(new Set([...prev, ...ids])));
    } else {
      setSelectedStationIds((prev) => prev.filter((id) => !ids.includes(id)));
    }
  };

  const handleClearAll = () => setSelectedStationIds([]);

  const handleBatchConvert = (e) => {
    e.preventDefault();
    if (selectedStationIds.length === 0) { alert("Please select at least one station."); return; }
    if (!startDate || !endDate) { alert("Please enter a valid date range."); return; }
    if (dateError) { alert(dateError); return; }
    if (Number(startHour) > Number(endHour)) { alert("Start hour must be before or equal to end hour."); return; }
    setIsProcessing(true);
    setTimeout(() => {
      setIsProcessing(false);
      alert(`Done! Exported ${selectedStationIds.length} station(s).`);
    }, 5000);
  };

  if (isCollapsed) {
    return (
      <aside className="batch-download-sidebar batch-download-sidebar--collapsed">
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
      <div className="sidebar-resizer-handle" onMouseDown={(e) => { if (!isCollapsed) { e.preventDefault(); setIsResizing(true); } }} title="Drag to resize" />

      <div className="batch-sidebar__header">
        <div className="batch-sidebar__header-top">
          <div>
            <h2 className="batch-sidebar__title">RINEX Compiler</h2>
            <p className="batch-sidebar__subtitle">Batch export across stations</p>
          </div>
          <button className="sidebar-collapse-btn" onClick={handleCollapseToggle} title="Collapse sidebar" aria-label="Collapse sidebar">
            ‹
          </button>
        </div>
        {selectedStationIds.length > 0 && (
          <div className="batch-selection-pill">
            {selectedStationIds.length} station{selectedStationIds.length !== 1 ? "s" : ""} selected
            <button type="button" className="batch-selection-pill-clear" onClick={handleClearAll} title="Unselect all stations">
              ✕
            </button>
          </div>
        )}
      </div>

      <form onSubmit={handleBatchConvert} className="batch-sidebar__form">
        <BatchStationList
          filteredStations={filteredStations}
          selectedStationIds={selectedStationIds}
          visibleStations={visibleStations}
          allFilteredSelected={allFilteredSelected}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          onStationCheck={handleStationCheck}
          onSelectAllFiltered={handleSelectAllFiltered}
          onClearAll={handleClearAll}
          onHoverStationId={onHoverStationId}
          onSelectStation={onSelectStation}
        />
        <BatchDownloadForm
          startDate={startDate}
          endDate={endDate}
          startHour={startHour}
          endHour={endHour}
          rinexVersion={rinexVersion}
          dateError={dateError}
          hourError={hourError}
          todayIso={todayIso}
          isProcessing={isProcessing}
          onStartDateChange={handleStartDateChange}
          onEndDateChange={handleEndDateChange}
          onStartHourChange={handleStartHourChange}
          onEndHourChange={handleEndHourChange}
          onRinexVersionChange={(e) => setRinexVersion(e.target.value)}
        />
      </form>
    </aside>
  );
};

export default BatchCompiler;
