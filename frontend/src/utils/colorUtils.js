export const getColor = (value, type) => {
  if (value == null) return "#D1D5DB";
  if (type === "spoof" || type === "jam") {
    if (value <= 0) return "#4CAF50";
    if (value <= 60) return "#FFC107";
    return "#F44336";
  }
  if (value >= 80) return "#4CAF50";
  if (value >= 50) return "#FFC107";
  return "#F44336";
};

export const getCalendarDayColor = ({ spoof, jam } = {}) => {
  if (spoof === null && jam === null) return "#D1D5DB";
  if (spoof === 100 || jam >= 80) return "#F44336";
  if (jam >= 40) return "#FFC107";
  return "#4CAF50";
};

export const getDominantColor = (hourlyValues) => {
  const counts = { "#4CAF50": 0, "#FFC107": 0, "#F44336": 0, "#D1D5DB": 0 };
  hourlyValues.forEach((v) => { counts[getCalendarDayColor(v)]++; });
  if ((counts["#4CAF50"] / 24) * 100 > 75) return "#4CAF50";
  return [
    { color: "#FFC107", count: counts["#FFC107"] },
    { color: "#F44336", count: counts["#F44336"] },
    { color: "#9CA3AF", count: counts["#D1D5DB"] },
  ].reduce((h, c) => (c.count > h.count ? c : h)).color;
};
