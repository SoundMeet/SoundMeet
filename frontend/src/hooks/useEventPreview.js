import { useState, useEffect } from 'react';
import { jamService } from '../injectables/jamService';
import { showService } from '../injectables/showService';

/**
 * Module-level cache so repeated renders of the same card never re-fetch.
 * Keyed by 'jam_123' or 'show_456'.
 */
const previewCache = {};

/**
 * Fetches and caches normalized event data for a given type + id pair.
 *
 * Returns:
 *   { status: 'idle'|'loading'|'loaded'|'error', data: Object|null }
 *
 * The cache is module-scoped so data persists across component mounts
 * within the same browser session, eliminating duplicate network requests.
 */
export function useEventPreview(type, id) {
  const cacheKey = type && id ? `${type}_${id}` : null;

  const [state, setState] = useState(() => {
    if (!cacheKey) return { status: 'idle', data: null };
    return previewCache[cacheKey] ?? { status: 'idle', data: null };
  });

  useEffect(() => {
    if (!cacheKey || !type || !id) return;

    const cached = previewCache[cacheKey];

    // Already resolved — sync state if the component just mounted
    if (cached?.status === 'loaded' || cached?.status === 'error') {
      setState(cached);
      return;
    }

    // Already in-flight — don't start a second request
    if (cached?.status === 'loading') return;

    // Start fetch
    const pending = { status: 'loading', data: null };
    previewCache[cacheKey] = pending;
    setState(pending);

    const fetcher = type === 'show'
      ? showService.getShowById(id)
      : jamService.getJamById(id);

    fetcher
      .then((data) => {
        const next = { status: 'loaded', data };
        previewCache[cacheKey] = next;
        setState(next);
      })
      .catch(() => {
        const next = { status: 'error', data: null };
        previewCache[cacheKey] = next;
        setState(next);
      });
  }, [cacheKey]); // eslint-disable-line react-hooks/exhaustive-deps

  return state;
}
