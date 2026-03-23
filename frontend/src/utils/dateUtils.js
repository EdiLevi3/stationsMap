/**
 * Converts an ISO date string (YYYY-MM-DD) to DD/MM/YYYY format.
 */
export const formatDate = (isoDate) => {
    const [year, month, day] = isoDate.split('-');
    return `${day}/${month}/${year}`;
};

/**
 * Sorts an array of ISO date strings in descending order (most recent first).
 * Returns a new array — does not mutate the input.
 */
export const sortDatesDescending = (dates) => {
    return [...dates].sort((dateA, dateB) => (dateA < dateB ? 1 : dateA > dateB ? -1 : 0));
};

/**
 * Converts a Date object to an ISO date string (YYYY-MM-DD).
 */
export const toIsoString = (dateObject) => {
    const year = dateObject.getFullYear();
    const month = String(dateObject.getMonth() + 1).padStart(2, '0');
    const day = String(dateObject.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

/**
 * Parses loose user input into a structured result.
 * Supports separators: / . -
 *
 * Full date formats (returns { type: 'full', date: Date }):
 *   d/m/yy, dd/mm/yy, d/m/yyyy, dd/mm/yyyy
 *
 * Month+year formats (returns { type: 'month', month: 1-12, year: YYYY }):
 *   m/yy, mm/yy, m/yyyy, mm/yyyy
 *
 * Returns null if the input is invalid.
 */
export const parseLooseDate = (raw) => {
    const trimmed = raw.trim();

    // Try full date: d/m/y
    const fullMatch = trimmed.match(/^(\d{1,2})[/.\-](\d{1,2})[/.\-](\d{2,4})$/);
    if (fullMatch) {
        const day = Number(fullMatch[1]);
        const month = Number(fullMatch[2]) - 1;
        let year = Number(fullMatch[3]);
        if (year < 100) year += 2000;
        const date = new Date(year, month, day);
        if (date.getFullYear() === year && date.getMonth() === month && date.getDate() === day) {
            return { type: 'full', date };
        }
        return null;
    }

    // Try month+year: m/y
    const monthMatch = trimmed.match(/^(\d{1,2})[/.\-](\d{2,4})$/);
    if (monthMatch) {
        const month = Number(monthMatch[1]);
        let year = Number(monthMatch[2]);
        if (year < 100) year += 2000;
        if (month >= 1 && month <= 12) {
            return { type: 'month', month, year };
        }
    }

    return null;
};
