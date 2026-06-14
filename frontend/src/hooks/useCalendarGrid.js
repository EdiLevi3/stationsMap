import { useMemo } from "react";

export const useCalendarGrid = (currentMonth) => {
  return useMemo(() => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const prevMonthLastDay = new Date(year, month, 0);
    const cells = [];
    
    // Previous month's days
    for (let i = firstDay.getDay() - 1; i >= 0; i--)
      cells.push({ date: new Date(year, month - 1, prevMonthLastDay.getDate() - i), outside: true });
    
    // Current month's days
    for (let day = 1; day <= lastDay.getDate(); day++)
      cells.push({ date: new Date(year, month, day), outside: false });
    
    // Next month's days
    for (let i = 1; i <= 42 - cells.length; i++)
      cells.push({ date: new Date(year, month + 1, i), outside: true });
    
    return cells;
  }, [currentMonth]);
};
