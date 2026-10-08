import { render } from '@testing-library/react';
import type { PieSectorShapeProps } from 'recharts';
import { describe, expect, it } from 'vitest';
import { DonutSlice, HoveredSliceContext } from './DonutSlice';

const slice = {
  cx: 100,
  cy: 100,
  innerRadius: 50,
  outerRadius: 72,
  startAngle: 0,
  endAngle: 120,
  midAngle: 60,
  fill: '#38bdf8',
  index: 1,
} as PieSectorShapeProps;

function draw(hovered: number | null) {
  const { container } = render(
    <svg>
      <HoveredSliceContext.Provider value={hovered}>
        <DonutSlice {...slice} />
      </HoveredSliceContext.Provider>
    </svg>,
  );
  const group = container.querySelector('g')!;
  const [base, top] = Array.from(container.querySelectorAll('path'));
  return { group, base: base!, top: top! };
}

describe('DonutSlice', () => {
  it('sits still, fully visible and shadowless, when nothing is hovered', () => {
    const { group, base, top } = draw(null);
    expect(group.style.transform).toBe('translate(0px, 0px)');
    expect(group.style.opacity).toBe('1');
    expect(base.style.opacity).toBe('0');
    expect(top.style.filter).toContain('rgba(0, 0, 0, 0)');
  });

  it('moves outward along the middle of the slice, and lifts, when it is the hovered one', () => {
    const { group, base, top } = draw(1);
    // Middle angle 60 degrees counter-clockwise from three o'clock: right and up (up is negative y on screen).
    const [dx, dy] = group.style.transform.match(/-?\d+(\.\d+)?/g)!.map(Number) as [number, number];
    expect(dx).toBeGreaterThan(0);
    expect(dy).toBeLessThan(0);
    expect(Math.hypot(dx, dy)).toBeCloseTo(10, 0);
    expect(group.style.opacity).toBe('1');
    expect(base.style.opacity).toBe('0.5'); // the thickness shows
    expect(top.style.filter).toContain('drop-shadow(0 8px 8px');
  });

  it('fades back, without moving, when another slice is hovered', () => {
    const { group, base } = draw(0);
    expect(group.style.transform).toBe('translate(0px, 0px)');
    expect(group.style.opacity).toBe('0.45');
    expect(base.style.opacity).toBe('0');
  });

  it('animates with a CSS transition, so the change is smooth, not a jump', () => {
    const { group, top } = draw(1);
    expect(group.style.transition).toContain('transform');
    expect(group.style.transition).toContain('opacity');
    expect(top.style.transition).toContain('filter');
  });
});
