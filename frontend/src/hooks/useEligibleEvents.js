import { useState, useEffect } from 'react';
import { jamService } from '../injectables/jamService';
import { showService } from '../injectables/showService';

// Events within 4 hours in the past are still considered "live/upcoming"
const LIVE_CUTOFF_MS = 4 * 60 * 60 * 1000;

function isUpcoming(item) {
  if (!item.dateTimeRaw) return true; // no date = treat as upcoming
  return new Date(item.dateTimeRaw) > new Date(Date.now() - LIVE_CUTOFF_MS);
}

/**
 * useEligibleEvents — fetches upcoming events the current user is allowed to
 * invite/promote from the feed composer.
 *
 * eventType: 'jam' | 'show'
 *
 * Returns:
 *   {
 *     loading: boolean,
 *     yours:     NormalizedItem[],  // events the user created
 *     attending: NormalizedItem[],  // events the user is attending (not creator)
 *   }
 *
 * Deduplication: attending never includes items already in yours.
 * Filtering: only upcoming / live events (cutoff = 4h in the past).
 */
export function useEligibleEvents(userId, eventType) {
  const [loading,   setLoading]   = useState(true);
  const [yours,     setYours]     = useState([]);
  const [attending, setAttending] = useState([]);

  useEffect(() => {
    if (!userId || !eventType) {
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setYours([]);
    setAttending([]);

    if (eventType === 'jam') {
      Promise.all([
        jamService.getMyCreatedJams(userId),
        jamService.getMyAttendingJams(userId),
      ])
        .then(([created, attendingAll]) => {
          if (cancelled) return;

          // getMyAttendingJams returns mixed jam+show rows — keep only jams
          const attendingJams = attendingAll.filter(
            (i) => i.type === 'jam' || i.entityKind === 'jam_session',
          );

          const createdUpcoming = created.filter(isUpcoming);
          const createdIds = new Set(createdUpcoming.map((i) => String(i.id)));

          // De-duplicate: attending must not include events the user created
          const attendingUpcoming = attendingJams.filter(
            (i) => !createdIds.has(String(i.id)) && isUpcoming(i),
          );

          setYours(createdUpcoming);
          setAttending(attendingUpcoming);
        })
        .catch((err) => {
          if (!cancelled) console.error('[useEligibleEvents] jam fetch error:', err);
        })
        .finally(() => {
          if (!cancelled) setLoading(false);
        });
    } else {
      // eventType === 'show'
      Promise.all([
        showService.getMyCreatedShows(userId),
        showService.getMyRsvpdShows(userId),
      ])
        .then(([created, rsvpd]) => {
          if (cancelled) return;

          const createdUpcoming = created.filter(isUpcoming);
          const createdIds = new Set(createdUpcoming.map((i) => String(i.id)));

          const attendingUpcoming = rsvpd.filter(
            (i) => !createdIds.has(String(i.id)),
          );
          // getMyRsvpdShows already filters to upcoming via cutoff in the query

          setYours(createdUpcoming);
          setAttending(attendingUpcoming);
        })
        .catch((err) => {
          if (!cancelled) console.error('[useEligibleEvents] show fetch error:', err);
        })
        .finally(() => {
          if (!cancelled) setLoading(false);
        });
    }

    return () => { cancelled = true; };
  }, [userId, eventType]);

  return { loading, yours, attending };
}
