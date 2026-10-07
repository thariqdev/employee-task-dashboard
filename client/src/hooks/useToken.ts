import { useSyncExternalStore } from 'react';
import { getToken, subscribeToAuthChanges } from '../lib/auth';

/** The current token, re-read whenever another tab or a restored cached page may have changed it. */
export function useToken() {
  return useSyncExternalStore(subscribeToAuthChanges, getToken);
}
