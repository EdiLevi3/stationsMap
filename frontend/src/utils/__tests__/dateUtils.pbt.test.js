import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { formatDate, sortDatesDescending } from '../dateUtils';

// Generate a valid ISO date string YYYY-MM-DD
const isoDateArb = fc.tuple(
    fc.integer({ min: 2000, max: 2099 }),
    fc.integer({ min: 1, max: 12 }),
    fc.integer({ min: 1, max: 28 })
).map(([y, m, d]) => `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`);

// Feature: station-map-mvp, Property 19: Date formatting — ISO to DD/MM/YYYY
// **Validates: Requirements 12.1**
describe('Property 19: Date formatting — ISO to DD/MM/YYYY', () => {
    it('preserves day, month, and year components correctly', () => {
        fc.assert(
            fc.property(isoDateArb, (isoDate) => {
                const formatted = formatDate(isoDate);
                const [year, month, day] = isoDate.split('-');
                expect(formatted).toBe(`${day}/${month}/${year}`);
            }),
            { numRuns: 100 }
        );
    });
});

// Feature: station-map-mvp, Property 20: Date sorting — descending order
// **Validates: Requirements 12.2**
describe('Property 20: Date sorting — descending order', () => {
    it('each date is chronologically >= the next date in the list', () => {
        fc.assert(
            fc.property(fc.array(isoDateArb, { minLength: 0, maxLength: 20 }), (dates) => {
                const sorted = sortDatesDescending(dates);
                for (let i = 0; i < sorted.length - 1; i++) {
                    expect(sorted[i] >= sorted[i + 1]).toBe(true);
                }
            }),
            { numRuns: 100 }
        );
    });

    it('does not mutate the original array', () => {
        fc.assert(
            fc.property(fc.array(isoDateArb, { minLength: 1, maxLength: 10 }), (dates) => {
                const original = [...dates];
                sortDatesDescending(dates);
                expect(dates).toEqual(original);
            }),
            { numRuns: 100 }
        );
    });
});
