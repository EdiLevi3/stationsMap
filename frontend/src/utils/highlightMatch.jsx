/**
 * Returns JSX with the matching substring wrapped in <mark>.
 * If no match is found, returns the original stationName.
 * @param {string} stationName - The full station name
 * @param {string} query - The search query
 * @returns {JSX.Element|string}
 */
export const highlightMatch = (stationName, query) => {
    if (!query || !stationName) return stationName;
    const idx = stationName.toLowerCase().indexOf(query.toLowerCase());
    if (idx === -1) return stationName;
    return (
        <>
            {stationName.slice(0, idx)}
            <mark className="station-search__match">{stationName.slice(idx, idx + query.length)}</mark>
            {stationName.slice(idx + query.length)}
        </>
    );
};
