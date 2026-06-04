// Renders a single station as a Leaflet marker with a tooltip (hover)
// and triggers a selection callback on click.

import { memo } from "react";
import { Marker, Tooltip, useMap } from "react-leaflet";

const StationMarker = memo(({ station, markerRef, onSelect }) => {
  console.log("here")
  const { name, location } = station;
console.log("opo station:", station);
  const position = [
    location.coordinates[1], // lat
    location.coordinates[0], // lon
  ];
  console.log("Rendering marker for station:", name, "at position:", position);
  const map = useMap();

  const handleClick = () => {
    map.flyTo(position, 14);
    if (onSelect) {
      onSelect(station);
    }
  };

  return (
    <Marker
      position={position}
      ref={markerRef}
      eventHandlers={{ click: handleClick }}
    >
      <Tooltip
        direction="bottom"
        offset={[0, 20]}
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
