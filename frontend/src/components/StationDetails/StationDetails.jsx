import "./StationDetails.css";
import { useStationById } from "../../hooks/useStationById";

const StationDetails = ({ station, onClose }) => {
  const { _id } = station;

  // Fetch the full station from the API
  const {
    station: chosenStation,
    loading,
    error,
  } = useStationById(_id);

  // Use fetched station when available, otherwise fallback to prop
  const displayStation = chosenStation || station;

  const { name, location, lastUpdate } = displayStation;

  return (
    <div className="station-page">
      <header className="station-page__header">
        <button
          className="station-page__back"
          onClick={onClose}
          aria-label="Back to map"
        >
          ← Back to Map
        </button>

        <h1 className="station-page__title">
          Station Details
        </h1>
      </header>

      <main className="station-page__content">
        <div className="station-info-card">
          <div className="station-info-card__header">
            <span className="station-info-card__icon">📡</span>

            <div>
              <h2 className="station-info-card__name">
                {name}
              </h2>
            </div>
          </div>

          <div className="station-info-card__coords">
            <div className="station-info-card__coord">
              <span className="station-info-card__coord-label">
                Latitude
              </span>

              <span className="station-info-card__coord-value">
                {location.coordinates[1]}°
              </span>
            </div>

            <div className="station-info-card__coord">
              <span className="station-info-card__coord-label">
                Longitude
              </span>

              <span className="station-info-card__coord-value">
                {location.coordinates[0]}°
              </span>
            </div>

            <div className="station-info-card__coord">
              <span className="station-info-card__coord-label">
                Last Record
              </span>

              <span className="station-info-card__coord-value">
                {lastUpdate
                  ? new Date(lastUpdate).toLocaleString()
                  : loading
                  ? "Loading..."
                  : "No data"}
              </span>
            </div>
          </div>

          {loading && (
            <div className="station-info-card__status">
              <div className="spinner spinner--small" />
              <span>Loading additional details...</span>
            </div>
          )}

          {error && (
            <div
              className="station-info-card__status error"
              role="alert"
            >
              {error}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};
export default StationDetails;
