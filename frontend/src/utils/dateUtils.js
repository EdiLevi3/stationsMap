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
