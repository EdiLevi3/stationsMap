import Fuse from 'fuse.js';

/**
 * Creates a Fuse.js instance configured for fuzzy station name search.
 * @param {Array<{stationName: string}>} stations
 * @returns {Fuse} Fuse instance
 */
export const createStationSearcher = (stations) => {
    return new Fuse(stations, {
        keys: ['stationName'],
        threshold: 0.4,
        includeScore: true,
        includeMatches: true,
    });
};

/**
 * Fuzzy-searches stations using a pre-built Fuse instance.
 * Returns [] for empty/whitespace-only queries.
 * @param {Fuse} fuse
 * @param {string} query - The search query
 * @returns {Array} Fuse search results
 */
export const filterStations = (fuse, query) => {
    const trimmed = query.trim();
    if (!trimmed) return [];
    return fuse.search(trimmed);
};
