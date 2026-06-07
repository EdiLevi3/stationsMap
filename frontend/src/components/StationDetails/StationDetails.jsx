import { useState, useEffect } from "react";
import "./StationDetails.css";
import { useStationById } from "../../hooks/useStationById";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { API_BASE_URL } from '../../config';

const StationDetails = ({ station, onClose }) => {
  const { _id } = station;

  const {
    station: chosenStation,
    loading,
    error,
  } = useStationById(_id);

  const displayStation = chosenStation || station;

  const { name, location, lastUpdate } = displayStation;

  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [records, setRecords] = useState([]);

  useEffect(() => {
    if (!startDate || !endDate) {
      return;
    }

    const fetchRecords = async () => {
      try {
        const res = await fetch(
          `${API_BASE_URL}/api/records/station/${_id}` +
          `?startDate=${startDate.toISOString()}` +
          `&endDate=${endDate.toISOString()}`
        );

        if (!res.ok) {
          throw new Error(`HTTP ${res.status}`);
        }

        const data = await res.json();

        console.log("Records for selected range:", data);

        setRecords(data);
      } catch (err) {
        console.error(err);
      }
    };

    fetchRecords();
  }, [_id, startDate, endDate]);

  
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

          <div className="station-date-range">
            <label>Date Range</label>

            <DatePicker
              selectsRange
              startDate={startDate}
              endDate={endDate}
              onChange={(dates) => {
                const [start, end] = dates;
                setStartDate(start);
                setEndDate(end);
              }}
              isClearable
              dateFormat="yyyy-MM-dd"
              placeholderText="Select date range"
            />

            {startDate && endDate && (
              <div className="selected-range">
                {startDate.toLocaleDateString()} -{" "}
                {endDate.toLocaleDateString()}
              </div>
            )}
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