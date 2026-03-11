import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { highlightMatch } from '../highlightMatch';

describe('highlightMatch', () => {
    it('wraps the matched substring in a <mark> tag', () => {
        const { container } = render(highlightMatch('Central Station', 'central'));
        const mark = container.querySelector('mark');
        expect(mark).toBeInTheDocument();
        expect(mark.textContent).toBe('Central');
        expect(mark).toHaveClass('station-search__match');
    });

    it('performs case-insensitive matching while preserving original casing', () => {
        const { container } = render(highlightMatch('Grand Central', 'GRAND'));
        const mark = container.querySelector('mark');
        expect(mark.textContent).toBe('Grand');
    });

    it('matches in the middle of the string', () => {
        const { container } = render(highlightMatch('Grand Central Terminal', 'central'));
        const mark = container.querySelector('mark');
        expect(mark.textContent).toBe('Central');
        expect(container.textContent).toBe('Grand Central Terminal');
    });

    it('returns the original text when query is empty', () => {
        const result = highlightMatch('Central Station', '');
        expect(result).toBe('Central Station');
    });

    it('returns the original text when text is empty', () => {
        const result = highlightMatch('', 'query');
        expect(result).toBe('');
    });

    it('returns the original text when there is no match', () => {
        const result = highlightMatch('Central Station', 'xyz');
        expect(result).toBe('Central Station');
    });

    it('returns text as-is when query is null/undefined', () => {
        expect(highlightMatch('Central Station', null)).toBe('Central Station');
        expect(highlightMatch('Central Station', undefined)).toBe('Central Station');
    });

    it('returns falsy text as-is when text is null/undefined', () => {
        expect(highlightMatch(null, 'query')).toBe(null);
        expect(highlightMatch(undefined, 'query')).toBe(undefined);
    });

    it('preserves all text parts when concatenated', () => {
        const { container } = render(highlightMatch('ABC DEF GHI', 'def'));
        expect(container.textContent).toBe('ABC DEF GHI');
    });
});
