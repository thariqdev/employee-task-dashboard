import { createContext, useContext } from 'react';
import { Sector, type PieSectorShapeProps } from 'recharts';

/** Which slice the pointer is on (its index), or null. The chart sets it, every slice reads it. */
export const HoveredSliceContext = createContext<number | null>(null);

const LIFT = 10; // how far the hovered slice moves outward, in pixels
const EASE = '240ms cubic-bezier(0.22, 1, 0.36, 1)';

/**
 * One slice of the donut. Every slice is drawn all the time and only its style changes on hover,
 * so the browser animates the move: the hovered slice slides outward, grows a little and lifts off the page
 * (a dark copy below it gives it thickness, a shadow falls under it), and the other slices fade back.
 */
export function DonutSlice(props: PieSectorShapeProps) {
  const hovered = useContext(HoveredSliceContext);
  const { cx = 0, cy = 0, innerRadius = 0, outerRadius = 0, startAngle, endAngle, midAngle = 0, fill, index } = props;
  const active = hovered === index;
  const dimmed = hovered !== null && !active;

  // Recharts measures angles counter-clockwise from three o'clock, while the screen's y axis points down.
  const radians = (-midAngle * Math.PI) / 180;
  const dx = Math.cos(radians) * LIFT;
  const dy = Math.sin(radians) * LIFT;

  const shared = { cx, cy, innerRadius, outerRadius, startAngle, endAngle };
  return (
    <g
      style={{
        transform: active ? `translate(${dx}px, ${dy}px)` : 'translate(0px, 0px)',
        opacity: dimmed ? 0.45 : 1,
        transition: `transform ${EASE}, opacity ${EASE}`,
      }}
    >
      {/* the thickness underneath */}
      <Sector
        {...shared}
        fill="#000000"
        style={{
          opacity: active ? 0.5 : 0,
          transform: active ? 'translateY(6px)' : 'translateY(0px)',
          transition: `transform ${EASE}, opacity ${EASE}`,
        }}
      />
      <Sector
        {...shared}
        fill={fill}
        style={{
          transform: active ? 'translateY(-2px)' : 'translateY(0px)',
          filter: active ? 'drop-shadow(0 8px 8px rgba(0, 0, 0, 0.55))' : 'drop-shadow(0 0 0 rgba(0, 0, 0, 0))',
          transition: `transform ${EASE}, filter ${EASE}`,
        }}
      />
    </g>
  );
}
