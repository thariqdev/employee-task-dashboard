import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { PoppedSlice, RestingSlice } from './PoppedSlice';

const slice = { cx: 100, cy: 100, innerRadius: 50, outerRadius: 80, startAngle: 0, endAngle: 120, fill: '#38bdf8' };

const draw = (element: React.ReactElement) => render(<svg>{element}</svg>).container.querySelectorAll('path');

describe('PoppedSlice', () => {
  it('draws two layers: a dark base for thickness, and the colored slice on top with a shadow', () => {
    const [base, top] = draw(<PoppedSlice {...slice} />);
    expect(base).toHaveAttribute('fill', '#000000');
    expect(top).toHaveAttribute('fill', '#38bdf8');
    expect(top!.getAttribute('style')).toContain('drop-shadow');
  });

  it('grows beyond the resting size', () => {
    const resting = draw(<RestingSlice {...slice} />)[0]!.getAttribute('d')!;
    const popped = draw(<PoppedSlice {...slice} />)[1]!.getAttribute('d')!;
    expect(popped).not.toBe(resting);
  });
});

describe('RestingSlice', () => {
  it('is drawn paler than a normal slice, so the popped one stands out', () => {
    const [path] = draw(<RestingSlice {...slice} />);
    expect(path).toHaveAttribute('fill', '#38bdf8');
    expect(path).toHaveAttribute('fill-opacity', '0.45');
  });
});
