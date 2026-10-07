import { Sector, type PieSectorDataItem } from 'recharts';

/**
 * How a donut slice looks while the pointer is on it: it grows outward and lifts off the page.
 * A dark copy sits a little below it (the slice's thickness) and a shadow falls under it.
 */
export function PoppedSlice(props: PieSectorDataItem) {
  const { cx = 0, cy = 0, innerRadius = 0, outerRadius = 0, startAngle, endAngle, fill } = props;
  const grown = outerRadius + 8;
  return (
    <g>
      <Sector
        cx={cx}
        cy={cy + 6}
        innerRadius={innerRadius}
        outerRadius={grown}
        startAngle={startAngle}
        endAngle={endAngle}
        fill="#000000"
        fillOpacity={0.5}
      />
      <Sector
        cx={cx}
        cy={cy - 2}
        innerRadius={innerRadius}
        outerRadius={grown}
        startAngle={startAngle}
        endAngle={endAngle}
        fill={fill}
        style={{ filter: 'drop-shadow(0 8px 8px rgba(0, 0, 0, 0.55))' }}
      />
    </g>
  );
}

/** The slices the pointer is not on, which step back a little so the popped one stands out. */
export function RestingSlice(props: PieSectorDataItem) {
  const { cx = 0, cy = 0, innerRadius = 0, outerRadius = 0, startAngle, endAngle, fill } = props;
  return (
    <Sector
      cx={cx}
      cy={cy}
      innerRadius={innerRadius}
      outerRadius={outerRadius}
      startAngle={startAngle}
      endAngle={endAngle}
      fill={fill}
      fillOpacity={0.45}
    />
  );
}
