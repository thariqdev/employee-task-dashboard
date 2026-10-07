import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { clearToken, getToken, setToken, subscribeToAuthChanges } from './auth';

describe('token storage', () => {
  beforeEach(() => localStorage.clear());
  afterEach(() => vi.restoreAllMocks());

  it('stores, reads and clears the token', () => {
    expect(getToken()).toBeNull();
    setToken('abc');
    expect(getToken()).toBe('abc');
    clearToken();
    expect(getToken()).toBeNull();
  });

  it('does not throw when storage is blocked', () => {
    const blocked = () => {
      throw new Error('blocked');
    };
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(blocked);
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(blocked);
    vi.spyOn(Storage.prototype, 'removeItem').mockImplementation(blocked);
    expect(getToken()).toBeNull();
    expect(() => setToken('abc')).not.toThrow();
    expect(() => clearToken()).not.toThrow();
  });
});

describe('subscribeToAuthChanges', () => {
  it('notifies on a storage event for the token key, or a full clear', () => {
    const onChange = vi.fn();
    const unsubscribe = subscribeToAuthChanges(onChange);
    window.dispatchEvent(new StorageEvent('storage', { key: 'taskdesk.token' }));
    window.dispatchEvent(new StorageEvent('storage', { key: null }));
    expect(onChange).toHaveBeenCalledTimes(2);
    unsubscribe();
  });

  it('ignores storage events for other keys', () => {
    const onChange = vi.fn();
    const unsubscribe = subscribeToAuthChanges(onChange);
    window.dispatchEvent(new StorageEvent('storage', { key: 'something.else' }));
    expect(onChange).not.toHaveBeenCalled();
    unsubscribe();
  });

  it('notifies on pageshow only when the page was restored from the back/forward cache', () => {
    const onChange = vi.fn();
    const unsubscribe = subscribeToAuthChanges(onChange);
    window.dispatchEvent(new PageTransitionEvent('pageshow', { persisted: false }));
    expect(onChange).not.toHaveBeenCalled();
    window.dispatchEvent(new PageTransitionEvent('pageshow', { persisted: true }));
    expect(onChange).toHaveBeenCalledTimes(1);
    unsubscribe();
  });

  it('stops notifying after unsubscribe', () => {
    const onChange = vi.fn();
    subscribeToAuthChanges(onChange)();
    window.dispatchEvent(new StorageEvent('storage', { key: 'taskdesk.token' }));
    expect(onChange).not.toHaveBeenCalled();
  });
});
