import { getCalendarDayColor } from "../../utils/colorUtils";

const HourlyRing = ({ hourlyValues, size = 80 }) => {
  const cx = size / 2;
  const cy = size / 2;
  const outerR = size / 2 - 2;
  const innerR = outerR * 0.55;
  const gap = 3;
  const degPerSeg = 360 / 24;

  const polarToCartesian = (cx, cy, r, angleDeg) => {
    const rad = ((angleDeg - 90) * Math.PI) / 180;
    return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
  };

  const arcPath = (startDeg, endDeg) => {
    const s1 = polarToCartesian(cx, cy, outerR, startDeg);
    const e1 = polarToCartesian(cx, cy, outerR, endDeg);
    const s2 = polarToCartesian(cx, cy, innerR, endDeg);
    const e2 = polarToCartesian(cx, cy, innerR, startDeg);
    const large = endDeg - startDeg > 180 ? 1 : 0;
    return [
      `M ${s1.x} ${s1.y}`,
      `A ${outerR} ${outerR} 0 ${large} 1 ${e1.x} ${e1.y}`,
      `L ${s2.x} ${s2.y}`,
      `A ${innerR} ${innerR} 0 ${large} 0 ${e2.x} ${e2.y}`,
      "Z",
    ].join(" ");
  };

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      {Array.from({ length: 24 }, (_, i) => (
        <path
          key={i}
          d={arcPath(i * degPerSeg + gap / 2, (i + 1) * degPerSeg - gap / 2)}
          fill={getCalendarDayColor(hourlyValues[i])}
        />
      ))}
    </svg>
  );
};

export default HourlyRing;
