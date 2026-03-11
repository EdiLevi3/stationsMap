import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, cleanup, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import * as fc from 'fast-check';
import DownloadButton from '../DownloadButton/DownloadButton';

vi.mock('../../hooks/useDownloadUrl', () => ({
    useDownloadUrl: vi.fn(),
}));

import { useDownloadUrl } from '../../hooks/useDownloadUrl';

const stationIdArb = fc.stringMatching(/^[a-f0-9]{24}$/);
const dateArb = fc.tuple(
    fc.integer({ min: 2020, max: 2025 }),
    fc.integer({ min: 1, max: 12 }),
    fc.integer({ min: 1, max: 28 })
).map(([y, m, d]) => `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`);

// Feature: station-map-mvp, Property 21: Download button state lifecycle
// **Validates: Requirements 13.1, 13.2**
describe('Property 21: Download button state lifecycle', () => {
    beforeEach(() => { vi.clearAllMocks(); });

    it('button is disabled during download and re-enabled on success', async () => {
        await fc.assert(
            fc.asyncProperty(stationIdArb, dateArb, async (stationId, date) => {
                cleanup();
                let resolveDownload;
                const mockDownload = vi.fn(() => new Promise(r => { resolveDownload = r; }));
                useDownloadUrl.mockReturnValue({ download: mockDownload, loading: false });
                window.open = vi.fn();

                const { rerender } = render(<DownloadButton stationId={stationId} date={date} />);
                const btn = screen.getByRole('button', { name: /download rinex/i });
                expect(btn.disabled).toBe(false);

                useDownloadUrl.mockReturnValue({ download: mockDownload, loading: true });
                await userEvent.click(btn);
                rerender(<DownloadButton stationId={stationId} date={date} />);
                expect(btn.disabled).toBe(true);

                useDownloadUrl.mockReturnValue({ download: mockDownload, loading: false });
                await act(async () => { resolveDownload({ url: 'https://example.com/file.rnx' }); });
                rerender(<DownloadButton stationId={stationId} date={date} />);
                await waitFor(() => { expect(btn.disabled).toBe(false); });

                cleanup();
            }),
            { numRuns: 50 }
        );
    }, 60000);

    it('button is re-enabled on download failure', async () => {
        await fc.assert(
            fc.asyncProperty(stationIdArb, dateArb, async (stationId, date) => {
                cleanup();
                let rejectDownload;
                const mockDownload = vi.fn(() => new Promise((_, rej) => { rejectDownload = rej; }));
                useDownloadUrl.mockReturnValue({ download: mockDownload, loading: false });
                const onError = vi.fn();

                const { rerender } = render(<DownloadButton stationId={stationId} date={date} onError={onError} />);
                const btn = screen.getByRole('button', { name: /download rinex/i });

                useDownloadUrl.mockReturnValue({ download: mockDownload, loading: true });
                await userEvent.click(btn);
                rerender(<DownloadButton stationId={stationId} date={date} onError={onError} />);
                expect(btn.disabled).toBe(true);

                useDownloadUrl.mockReturnValue({ download: mockDownload, loading: false });
                await act(async () => { rejectDownload(new Error('S3 error')); });
                rerender(<DownloadButton stationId={stationId} date={date} onError={onError} />);
                await waitFor(() => { expect(btn.disabled).toBe(false); });

                cleanup();
            }),
            { numRuns: 50 }
        );
    }, 60000);
});
