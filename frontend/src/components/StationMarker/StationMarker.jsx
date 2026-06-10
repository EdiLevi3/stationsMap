import { memo } from "react";
import { Marker, Tooltip, useMap } from "react-leaflet";
import leaflet from "leaflet";
import "./StationMarker.css"; // ── ADDED: Keeps marker styles self-contained!

const isUpdatedToday = (dateStr) => {
  if (!dateStr) {
    console.log("Station Marker: dateStr is missing or undefined");
    return false;
  }
  
  const updateDate = new Date(dateStr);
  const today = new Date();
  
  console.log("Comparing Dates for Station:", {
    rawDateStr: dateStr,
    parsedUpdateDate: updateDate.toString(),
    parsedToday: today.toString(),
    updateYMD: [updateDate.getFullYear(), updateDate.getMonth(), updateDate.getDate()],
    todayYMD: [today.getFullYear(), today.getMonth(), today.getDate()]
  });

  return (
    updateDate.getFullYear() === today.getFullYear() &&
    updateDate.getMonth() === today.getMonth() &&
    updateDate.getDate() === today.getDate()
  );
};

const StationMarker = memo(({ station, markerRef, onSelect, isHighlighted }) => {
  console.log("Full station data received:", station); // ◄ ADD THIS
  const { name, location, lastUpdate } = station;
  
  const position = [
    location.coordinates[1], // lat
    location.coordinates[0], // lon
  ];

  const map = useMap();

  const handleClick = () => {
    map.flyTo(position, 14);
    if (onSelect) {
      onSelect(station);
    }
  };

  const updatedToday = isUpdatedToday(lastUpdate);
  const statusColorClass = updatedToday ? "marker-circle--green" : "marker-circle--red";
  const highlightClass = isHighlighted ? "marker-circle--highlighted" : "";

  const customCircleIcon = leaflet.divIcon({
    className: "custom-circle-marker-container",
    html: `<div class="marker-circle ${statusColorClass} ${highlightClass}"></div>`,
    iconSize: [20, 20],
    iconAnchor: [10, 10],
  });

  return (
    <Marker
      position={position}
      ref={markerRef}
      icon={customCircleIcon}
      eventHandlers={{ click: handleClick }}
    >
      <Tooltip
        direction="bottom"
        offset={[0, 10]} 
        permanent
        className="station-name-label"
      >
        {name}
      </Tooltip>
    </Marker>
  );
});

StationMarker.displayName = "StationMarker";

export default StationMarker;