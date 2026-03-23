// Calendar date picker for selecting a RINEX file date.
// Only dates with available records are selectable.
// Accepts typed input in dd/mm/yyyy, dd.mm.yy, d/m/yy, etc.

import { useMemo, useRef, useCallback } from 'react';
import DatePicker from 'react-datepicker';
import { toIsoString, parseLooseDate } from '../../utils/dateUtils';
import 'react-datepicker/dist/react-datepicker.css';
import './DateSelector.css';

const DateSelector = ({ dates, selectedDate, onChange }) => {
    const pickerRef = useRef(null);

    const availableDateObjects = useMemo(
        () => dates.map((isoDate) => new Date(isoDate + 'T00:00:00')),
        [dates],
    );

    const availableDateSet = useMemo(() => new Set(dates), [dates]);

    const selectedDateObject = selectedDate ? new Date(selectedDate + 'T00:00:00') : null;

    const handleChange = (dateObject) => {
        if (!dateObject) return;
        onChange(toIsoString(dateObject));
    };

    // Resolve parsed input to an available ISO date.
    // For full dates: exact match. For month+year: first available date in that month.
    const resolveAvailableDate = (parsed) => {
        if (!parsed) return null;
        if (parsed.type === 'full') {
            const iso = toIsoString(parsed.date);
            return availableDateSet.has(iso) ? iso : null;
        }
        // Month+year: find first available date in that month
        const prefix = `${parsed.year}-${String(parsed.month).padStart(2, '0')}-`;
        return dates.find((isoDate) => isoDate.startsWith(prefix)) || null;
    };

    // Parse typed input on Enter — supports loose formats (15.1.2020, 5-3-22, 3/22, etc.)
    const handleKeyDown = (event) => {
        if (event.key !== 'Enter') return;
        event.preventDefault();
        const iso = resolveAvailableDate(parseLooseDate(event.target.value));
        if (iso) {
            onChange(iso);
            pickerRef.current?.setOpen(false);
        }
    };

    // Stop all click/mousedown events from bubbling out to Leaflet,
    // which would otherwise close the station popup.
    const stopPropagation = useCallback((event) => {
        event.stopPropagation();
        event.nativeEvent?.stopImmediatePropagation?.();
    }, []);

    return (
        <div
            className="date-selector"
            onClick={stopPropagation}
            onMouseDown={stopPropagation}
        >
            <span className="date-selector__label">Select date:</span>
            <DatePicker
                ref={pickerRef}
                selected={selectedDateObject}
                onChange={handleChange}

                onKeyDown={handleKeyDown}
                includeDates={availableDateObjects}
                highlightDates={availableDateObjects}
                dateFormat="dd/MM/yyyy"
                placeholderText="Pick a date (dd/mm/yyyy)"
                className="date-selector__input"
                calendarClassName="date-selector__calendar"
                showPopperArrow={false}
            />
        </div>
    );
};

export default DateSelector;
