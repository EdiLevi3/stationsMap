const HOURS_LIST = Array.from({ length: 24 });

const BatchDownloadForm = ({
  startDate,
  endDate,
  startHour,
  endHour,
  rinexVersion,
  dateError,
  hourError,
  todayIso,
  isProcessing,
  onStartDateChange,
  onEndDateChange,
  onStartHourChange,
  onEndHourChange,
  onRinexVersionChange,
}) => {
  return (
    <>
      <div className="batch-form-section">
        <label className="batch-section-label">Date Range</label>
        <div className="batch-grid-row">
          <div>
            <span className="batch-input-sublabel">From</span>
            <input
              type="date"
              required
              value={startDate}
              max={todayIso}
              onChange={onStartDateChange}
              className={`batch-input-field ${dateError ? "batch-input-field--error" : ""}`}
            />
          </div>
          <div>
            <span className="batch-input-sublabel">To</span>
            <input
              type="date"
              required
              value={endDate}
              max={todayIso}
              onChange={onEndDateChange}
              className={`batch-input-field ${dateError ? "batch-input-field--error" : ""}`}
            />
          </div>
        </div>
        {dateError && <p className="batch-field-error">{dateError}</p>}
      </div>

      <div className="batch-form-section">
        <label className="batch-section-label">Hour Window</label>
        <div className="batch-grid-row">
          <div>
            <span className="batch-input-sublabel">Start</span>
            <select
              value={startHour}
              onChange={onStartHourChange}
              className={`batch-input-field ${hourError ? "batch-input-field--error" : ""}`}
            >
              {HOURS_LIST.map((_, h) => (
                <option key={h} value={h}>{String(h).padStart(2, "0")}:00</option>
              ))}
            </select>
          </div>
          <div>
            <span className="batch-input-sublabel">End</span>
            <select
              value={endHour}
              onChange={onEndHourChange}
              className={`batch-input-field ${hourError ? "batch-input-field--error" : ""}`}
            >
              {HOURS_LIST.map((_, h) => (
                <option key={h} value={h}>{String(h).padStart(2, "0")}:00</option>
              ))}
            </select>
          </div>
        </div>
        {hourError && <p className="batch-field-error">{hourError}</p>}
      </div>

      <div className="batch-form-section">
        <label className="batch-section-label">RINEX Version</label>
        <select
          value={rinexVersion}
          onChange={onRinexVersionChange}
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
          disabled={isProcessing || !!hourError || !!dateError}
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
          {isProcessing ? `Compiling RINEX v${rinexVersion}…` : "Download Files"}
        </span>
      </div>
    </>
  );
};

export default BatchDownloadForm;
