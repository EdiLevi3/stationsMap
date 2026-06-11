import { useState } from "react";

const RINEX_VERSIONS = ["2.11", "3.05", "4.01"];

const RinexDownloadPortal = () => {
  const [showDropdown, setShowDropdown] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [selectedVersion, setSelectedVersion] = useState("");

  const handleDownloadSelect = (version) => {
    setSelectedVersion(version);
    setShowDropdown(false);
    setIsDownloading(true);
    setTimeout(() => {
      setIsDownloading(false);
      setSelectedVersion("");
    }, 5000);
  };

  return (
    <>
      {isDownloading && (
        <div className="hd-download-overlay">
          <div className="hd-download-spinner-box">
            <div className="hd-download-spinner" />
            <p className="hd-download-loading-text">Downloading RINEX {selectedVersion}...</p>
          </div>
        </div>
      )}

      <div className="hd-central-showcase">
        <div className="hd-circle-download-wrapper">
          <button
            className={`hd-circle-download-btn ${showDropdown ? "hd-circle-download-btn--active" : ""}`}
            onClick={() => setShowDropdown((prev) => !prev)}
            title="Download RINEX Data"
          >
            <svg
              className="hd-download-icon-svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3" />
            </svg>
          </button>

          {showDropdown && (
            <div className="hd-central-dropdown">
              {RINEX_VERSIONS.map((v) => (
                <button
                  key={v}
                  onClick={() => handleDownloadSelect(v)}
                  className="hd-central-dropdown-item"
                >
                  v{v}
                </button>
              ))}
            </div>
          )}
        </div>
        <span className="hd-central-download-label">Download RINEX Files</span>
      </div>
    </>
  );
};

export default RinexDownloadPortal;
