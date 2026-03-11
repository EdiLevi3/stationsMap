import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import * as fc from 'fast-check';
import MapView from '../MapView/MapView';
import StationMarker from '../StationMarker/StationMarker';

vi.mock('react-leaflet', () => {
    const BaseLayer = ({ children, ...props }) => (
        <div data-testid="base-layer" data-name={props.name} data-checked={props.checked}>
            {children}
        </div>
    );
    const LayersControl = ({ children, ...props }) => (
        <div data-testid="layers-control" data-position={props.position}>
            {children}
        </div>
    );
    LayersControl.BaseLayer = BaseLayer;
    return {
        MapContainer: ({ children, ...props }) => (
            <div data-testid="map-container" aria-label={props['aria-label']}>{children}</div>
        ),
        TileLayer: (props) => <div data-testid="tile-layer" data-url={props.url} data-attribution={props.attribution} />,
        LayersControl,
        LayerGroup: ({ children }) => <div data-testid="layer-group">{children}</div>,
        useMap: () => ({ flyTo: vi.fn(), fitBounds: vi.fn(), flyToBounds: vi.fn() }),
        useMapEvents: () => null,
        Marker: ({ children, position }) => (
            <div data-testid="marker" data-position={JSON.stringify(position)}>{children}</div>
        ),
        Tooltip: ({ children }) => <div data-testid="tooltip">{children}</div>,
        Popup: ({ children }) => <div data-testid="popup">{children}</div>,
    };
});

vi.mock('leaflet/dist/images/marker-icon-2x.png', () => ({ default: 'marker-icon-2x.png' }));
vi.mock('leaflet/dist/images/marker-icon.png', () => ({ default: 'marker-icon.png' }));
vi.mock('leaflet/dist/images/marker-shadow.png', () => ({ default: 'marker-shadow.png' }));
vi.mock('leaflet/dist/leaflet.css', () => ({}));
vi.mock('leaflet', () => {
    const Icon = { Default: { prototype: { _getIconUrl: null }, mergeOptions: vi.fn() } };
    return { default: { Icon } };
});

vi.mock('../StationSearch/StationSearch', () => ({
    default: () => <div data-testid="station-search" />,
}));

vi.mock('../../hooks/useStations', () => ({
    useStations: vi.fn(),
}));

import { useStations } from '../../hooks/useStations';

const stationArb = fc.record({
    _id: fc.stringMatching(/^[a-f0-9]{24}$/),
    stationName: fc.stringMatching(/^[A-Za-z0-9]{1,10}$/),
    approxLocation: fc.record({
        lat: fc.double({ min: -90, max: 90, noNaN: true, noDefaultInfinity: true }),
        lon: fc.double({ min: -180, max: 180, noNaN: true, noDefaultInfinity: true }),
    }),
});

const stationArrayArb = fc.array(stationArb, { minLength: 1, maxLength: 10 })
    .map(stations => {
        const seen = new Set();
        return stations.filter(s => { if (seen.has(s._id)) return false; seen.add(s._id); return true; });
    })
    .filter(arr => arr.length >= 1);

// Feature: station-map-mvp, Property 8: Map renders one marker per station
// **Validates: Requirements 5.1**
describe('Property 8: Map renders one marker per station', () => {
    beforeEach(() => { vi.clearAllMocks(); });

    it('renders exactly as many markers as stations in the array', async () => {
        await fc.assert(
            fc.asyncProperty(stationArrayArb, async (stations) => {
                cleanup();
                useStations.mockReturnValue({ stations, loading: false, error: null, retry: vi.fn() });
                render(<MapView />);
                expect(screen.getByTestId('map-container')).toBeInTheDocument();
                expect(screen.getAllByTestId('marker')).toHaveLength(stations.length);
                cleanup();
            }),
            { numRuns: 100 }
        );
    }, 60000);
});

// Feature: station-map-mvp, Property 9: Station marker tooltip shows station name
// **Validates: Requirements 5.3**
describe('Property 9: Station marker tooltip shows station name', () => {
    it('renders a tooltip whose text matches the station name', async () => {
        await fc.assert(
            fc.asyncProperty(stationArb, async (station) => {
                cleanup();
                const { container } = render(<StationMarker station={station} />);
                const tooltip = container.querySelector('[data-testid="tooltip"]');
                expect(tooltip).not.toBeNull();
                expect(tooltip.textContent).toBe(station.stationName);
                cleanup();
            }),
            { numRuns: 100 }
        );
    }, 30000);
});
