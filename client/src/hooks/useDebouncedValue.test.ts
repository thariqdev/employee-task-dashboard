import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useDebouncedValue } from './useDebouncedValue';

describe('useDebouncedValue', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it('starts with the initial value', () => {
    const { result } = renderHook(() => useDebouncedValue('a', 300));
    expect(result.current).toBe('a');
  });

  it('only updates after the value has stopped changing for the delay', () => {
    const { result, rerender } = renderHook(({ value }) => useDebouncedValue(value, 300), {
      initialProps: { value: 'a' },
    });

    rerender({ value: 'b' });
    act(() => vi.advanceTimersByTime(200));
    rerender({ value: 'c' });
    act(() => vi.advanceTimersByTime(200));
    expect(result.current).toBe('a'); // the timer was restarted by 'c'

    act(() => vi.advanceTimersByTime(100));
    expect(result.current).toBe('c'); // 'b' was skipped entirely
  });
});
