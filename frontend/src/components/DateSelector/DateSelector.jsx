// Dropdown for selecting a RINEX file date. Dates are sorted most recent first.

import { formatDate, sortDatesDescending } from '../../utils/dateUtils';
import './DateSelector.css';

const DateSelector = ({ dates, selectedDate, onChange }) => {
    const sorted = sortDatesDescending(dates);

    return (
        <div className="date-selector">
            <span className="date-selector__label">Select date:</span>
            <select
                className="date-selector__select"
                aria-label="Date selector"
                value={selectedDate || ''}
                onChange={(e) => onChange(e.target.value)}
            >
                <option value="" disabled>-- Select a date --</option>
                {sorted.map((date) => (
                    <option key={date} value={date}>
                        {formatDate(date)}
                    </option>
                ))}
            </select>
        </div>
    );
};

export default DateSelector;
