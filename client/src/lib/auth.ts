const TOKEN_KEY = 'taskdesk.token';

// localStorage can throw (private mode, blocked storage), so every call is guarded.
export function getToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export function setToken(token: string) {
  try {
    localStorage.setItem(TOKEN_KEY, token);
  } catch {
    // Without storage the user simply has to log in again after a refresh.
  }
}

export function clearToken() {
  try {
    localStorage.removeItem(TOKEN_KEY);
  } catch {
    // nothing to clear
  }
}

/**
 * Tells React when the token may have changed *outside* this page's own code:
 * - "storage": the user logged out (or in) in another tab.
 * - "pageshow" with persisted=true: the browser restored this page from its back/forward cache,
 *   showing the old screen exactly as it was left, without re-running any code.
 * Changes made by this page itself (login, logout) already navigate explicitly, so they do not notify.
 */
export function subscribeToAuthChanges(onChange: () => void) {
  const handler = (event: Event) => {
    if (event.type === 'pageshow' && !(event as PageTransitionEvent).persisted) return;
    if (event instanceof StorageEvent && event.key !== null && event.key !== TOKEN_KEY) return;
    onChange();
  };
  window.addEventListener('storage', handler);
  window.addEventListener('pageshow', handler);
  return () => {
    window.removeEventListener('storage', handler);
    window.removeEventListener('pageshow', handler);
  };
}
