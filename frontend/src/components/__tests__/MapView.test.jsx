import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import MapView from '../MapView/MapView';

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
            <div data-testid="map-container" aria-label={props['aria-label']}>
                {children}
            </div>
        ),
        TileLayer: (props) => <div data-testid="tile-layer" data-url={props.url} data-attribution={props.attribution} />,
        LayersControl,
        LayerGroup: ({ children }) => <div data-testid="layer-group">{children}</div>,
        useMap: () => ({ flyTo: vi.fn(), fitBounds: vi.fn(), flyToBounds: vi.fn() }),
        useMapEvents: () => null,
    };
});

vi.mock('../StationMarker/StationMarker', () => ({
    default: ({ station }) => (
        <div
            data-testid="marker"
            data-position={JSON.stringify([station.approxLocation.lat, station.approxLocation.lon])}
        >
            <div data-testid="tooltip">{station.stationName}</div>
            <div data-testid="popup">{station.stationName}</div>
        </div>
    ),
}));

vi.mock('../StationSearch/StationSearch', () => ({
    default: ({ stations, markerRefs }) => (
        <div data-testid="station-search" data-station-count={stations.length} />
    ),
}));

vi.mock('leaflet/dist/images/marker-icon-2x.png', () => ({ default: 'marker-icon-2x.png' }));
vi.mock('leaflet/dist/images/marker-icon.png', () => ({ default: 'marker-icon.png' }));
vi.mock('leaflet/dist/images/marker-shadow.png', () => ({ default: 'marker-shadow.png' }));
vi.mock('leaflet/dist/leaflet.css', () => ({}));
vi.mock('leaflet', () => {
    const Icon = { Default: { prototype: { _getIconUrl: null }, mergeOptions: vi.fn() } };
    return { default: { Icon } };
});

vi.mock('../../hooks/useStations', () => ({
    useStations: vi.fn(),
}));

import { useStations } from '../../hooks/useStations';

const mockStations = [
    { _id: '1', stationName: 'TELA', approxLocation: { lat: 32.07, lon: 34.79 } },
    { _id: '2', stationName: 'RAMO', approxLocation: { lat: 31.89, lon: 34.76 } },
    { _id: '3', stationName: 'KABR', approxLocation: { lat: 32.87, lon: 35.14 } },
];

describe('MapView', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        localStorage.clear();
    });

    it('shows loading indicator while fetching stations', () => {
        useStations.mockReturnValue({ stations: [], loading: true, error: null, retry: vi.fn() });
        render(<MapView />);
        const loading = screen.getByRole('status');
        expect(loading).toBeInTheDocument();
        expect(loading).toHaveTextContent('Loading stations...');
    });

    it('renders map with markers after successful fetch', async () => {
        useStations.mockReturnValue({ stations: mockStations, loading: false, error: null, retry: vi.fn() });
        render(<MapView />);
        expect(screen.getByTestId('map-container')).toBeInTheDocument();
        expect(screen.getAllByTestId('marker')).toHaveLength(3);
        expect(screen.getAllByTestId('marker')[0]).toHaveAttribute('data-position', JSON.stringify([32.07, 34.79]));
    });

    it('renders station name in tooltip and popup for each marker', async () => {
        useStations.mockReturnValue({ stations: mockStations, loading: false, error: null, retry: vi.fn() });
        render(<MapView />);
        expect(screen.getAllByTestId('tooltip')).toHaveLength(3);
        expect(screen.getAllByTestId('tooltip')[0]).toHaveTextContent('TELA');
        expect(screen.getAllByTestId('tooltip')[1]).toHaveTextContent('RAMO');
        expect(screen.getAllByTestId('tooltip')[2]).toHaveTextContent('KABR');
    });

    it('shows error banner with retry button on fetch failure', async () => {
        useStations.mockReturnValue({ stations: [], loading: false, error: 'Network error', retry: vi.fn() });
        render(<MapView />);
        expect(screen.getByRole('alert')).toBeInTheDocument();
        expect(screen.getByText(/Network error/)).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /retry/i })).toBeInTheDocument();
    });

    it('retries fetching stations when retry button is clicked', async () => {
        const mockRetry = vi.fn();
        useStations.mockReturnValue({ stations: [], loading: false, error: 'Network error', retry: mockRetry });
        render(<MapView />);
        expect(screen.getByRole('alert')).toBeInTheDocument();
        await userEvent.click(screen.getByRole('button', { name: /retry/i }));
        expect(mockRetry).toHaveBeenCalledTimes(1);
    });

    it('has ARIA label on map container', async () => {
        useStations.mockReturnValue({ stations: mockStations, loading: false, error: null, retry: vi.fn() });
        render(<MapView />);
        expect(screen.getByTestId('map-container')).toHaveAttribute('aria-label', 'Station map');
    });

    it('renders empty map when no stations returned', async () => {
        useStations.mockReturnValue({ stations: [], loading: false, error: null, retry: vi.fn() });
        render(<MapView />);
        expect(screen.getByTestId('map-container')).toBeInTheDocument();
        expect(screen.queryAllByTestId('marker')).toHaveLength(0);
    });

    it('renders two base layer options', async () => {
        useStations.mockReturnValue({ stations: mockStations, loading: false, error: null, retry: vi.fn() });
        render(<MapView />);
        const baseLayers = screen.getAllByTestId('base-layer');
        expect(baseLayers).toHaveLength(2);
        expect(baseLayers[0]).toHaveAttribute('data-name', 'Streets');
        expect(baseLayers[1]).toHaveAttribute('data-name', 'Hybrid');
    });

    it('defaults to Streets layer when no preference stored', async () => {
        useStations.mockReturnValue({ stations: mockStations, loading: false, error: null, retry: vi.fn() });
        render(<MapView />);
        const baseLayers = screen.getAllByTestId('base-layer');
        const streets = baseLayers.find((el) => el.getAttribute('data-name') === 'Streets');
        expect(streets).toHaveAttribute('data-checked', 'true');
    });

    it('renders OpenStreetMap attribution for Streets layer', async () => {
        useStations.mockReturnValue({ stations: mockStations, loading: false, error: null, retry: vi.fn() });
        render(<MapView />);
        const baseLayers = screen.getAllByTestId('base-layer');
        const streets = baseLayers.find((el) => el.getAttribute('data-name') === 'Streets');
        const tile = streets.querySelector('[data-testid="tile-layer"]');
        expect(tile.getAttribute('data-attribution')).toContain('OpenStreetMap');
    });

    it('renders both Esri and CARTO attribution for Hybrid layer', async () => {
        useStations.mockReturnValue({ stations: mockStations, loading: false, error: null, retry: vi.fn() });
        render(<MapView />);
        const baseLayers = screen.getAllByTestId('base-layer');
        const hybrid = baseLayers.find((el) => el.getAttribute('data-name') === 'Hybrid');
        const tiles = hybrid.querySelectorAll('[data-testid="tile-layer"]');
        expect(tiles).toHaveLength(2);
        expect(tiles[0].getAttribute('data-attribution')).toContain('Esri');
        expect(tiles[1].getAttribute('data-attribution')).toContain('CARTO');
    });

    it('renders a center button to reset the map view', async () => {
        useStations.mockReturnValue({ stations: mockStations, loading: false, error: null, retry: vi.fn() });
        render(<MapView />);
        const btn = screen.getByRole('button', { name: /reset to default view/i });
        expect(btn).toBeInTheDocument();
    });
});
