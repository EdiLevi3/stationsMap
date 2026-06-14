import { getCalendarDayColor } from "../../utils/colorUtils";
import { arcPath } from "../../utils/svgUtils";

const HourlyRing = ({ hourlyValues, size = 80 }) => {
  const cx = size / 2;
  const cy = size / 2;
  const outerR = size / 2 - 2;
  const innerR = outerR * 0.55;
  const gap = 3;
  const degPerSeg = 360 / 24;

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      {Array.from({ length: 24 }, (_, i) => (
        <path
          key={i}
          d={arcPath(cx, cy, outerR, innerR, i * degPerSeg + gap / 2, (i + 1) * degPerSeg - gap / 2)}
          fill={getCalendarDayColor(hourlyValues[i])}
        />
      ))}
    </svg>
  );
};

export default HourlyRing;
