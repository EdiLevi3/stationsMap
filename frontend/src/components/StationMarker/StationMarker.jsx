// Renders a single station as a Leaflet marker with a tooltip (hover)
// and a popup (click) that shows station details and download options.

import { memo, useRef } from 'react';
import { Marker, Tooltip, Popup, useMap } from 'react-leaflet';
import StationPopup from '../StationPopup/StationPopup';

const StationMarker = memo(({ station, markerRef }) => {
    const { _id, stationName, location } = station;
    const position = [location[1], location[0]];
    const popupRef = useRef(null);
    const map = useMap();

    const handleClick = () => {
        map.flyTo(position, 14);
    };

    return (
        <Marker position={position} ref={markerRef} eventHandlers={{ click: handleClick }}>
            <Tooltip direction="bottom" offset={[0, 20]} permanent className="station-name-label">
                {stationName}
            </Tooltip>
            <Popup ref={popupRef} minWidth={250} maxWidth={350} autoPanPaddingTopLeft={[10, 80]} autoPanPaddingBottomRight={[10, 10]}>
                <StationPopup
                    stationId={_id}
                    stationName={stationName}
                    approxLocation={location}
                    popupRef={popupRef}
                />
            </Popup>
        </Marker>
    );
});

StationMarker.displayName = 'StationMarker';

export default StationMarker;
