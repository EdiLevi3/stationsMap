import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import StationMarker from '../StationMarker/StationMarker';

vi.mock('react-leaflet', () => ({
    Marker: ({ children, position }) => (
        <div data-testid="marker" data-position={JSON.stringify(position)}>
            {children}
        </div>
    ),
    Tooltip: ({ children }) => <div data-testid="tooltip">{children}</div>,
    Popup: ({ children }) => <div data-testid="popup">{children}</div>,
}));

const mockStation = {
    _id: '1',
    stationName: 'TELA',
    approxLocation: { lat: 32.07, lon: 34.79 },
};

describe('StationMarker', () => {
    it('renders a Marker at the station coordinates', () => {
        render(<StationMarker station={mockStation} />);
        const marker = screen.getByTestId('marker');
        expect(marker).toBeInTheDocument();
        expect(marker).toHaveAttribute('data-position', JSON.stringify([32.07, 34.79]));
    });

    it('shows station name as Tooltip', () => {
        render(<StationMarker station={mockStation} />);
        expect(screen.getByTestId('tooltip')).toHaveTextContent('TELA');
    });

    it('shows station name in Popup on click', () => {
        render(<StationMarker station={mockStation} />);
        expect(screen.getByTestId('popup')).toHaveTextContent('TELA');
    });
});
