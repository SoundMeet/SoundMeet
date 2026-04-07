/**
 * jamService.js
 *
 * All Supabase queries for jam data.
 * Normalizes raw `chat_jam` rows into the discovery item shape used by
 * every component in the app (map pins, cards, modals, MyJams tabs).
 */
import { supabase } from './supaBaseClient';
import { parseEWKBPoint, toWKTPoint } from '../utils/parseGeography';
import { DISCOVERY_COLORS } from '../utils/discovery';

// ─── Shared select clause ─────────────────────────────────────────────────────

const JAM_SELECT = `
  id, name, location, date_time, description, access, admin_id,
  genre:genre_id (id, name),
  vibe:vibe_id (id, name)
`;

// ─── Date helpers ─────────────────────────────────────────────────────────────

function formatDateTime(iso) {
  if (!iso) return null;
  const d = new Date(iso);
  return d.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * Classifies a jam's date_time into a timeSlot string used by discoverFilters.
 * live → started within the last 4 hours and no end time
 * tonight → today, after 6 pm
 * tomorrow → next calendar day
 * week → within the next 7 days
 * future → more than 7 days away
 */
function computeTimeSlot(iso) {
  if (!iso) return 'future';
  const now = new Date();
  const d = new Date(iso);
  const diffMs = d - now;
  const diffDays = diffMs / (1000 * 60 * 60 * 24);

  // Consider "live" if started less than 4 hours ago
  if (diffMs > -4 * 60 * 60 * 1000 && diffMs < 0) return 'live';

  const isToday =
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate();

  if (isToday && d.getHours() >= 18) return 'tonight';
  if (isToday) return 'tonight'; // daytime jams also bucket as tonight for filter purposes

  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const isTomorrow =
    d.getFullYear() === tomorrow.getFullYear() &&
    d.getMonth() === tomorrow.getMonth() &&
    d.getDate() === tomorrow.getDate();

  if (isTomorrow) return 'tomorrow';
  if (diffDays <= 7) return 'week';
  return 'future';
}

/**
 * Compute distance in miles between two lat/lng pairs using the Haversine formula.
 */
function haversineMiles(lat1, lng1, lat2, lng2) {
  const R = 3958.8; // Earth radius in miles
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// ─── Normalizer ───────────────────────────────────────────────────────────────

/**
 * Converts a raw Supabase chat_jam row into the discovery item shape.
 * Pass userLocation { latitude, longitude } to populate distanceMiles.
 */
export function normalizeJamRow(row, userLocation = null) {
  const coords = parseEWKBPoint(row.location);
  const isPublic = row.access === true;
  const genreName = row.genre?.name ?? null;
  const vibeName = row.vibe?.name ?? null;
  const formattedDate = formatDateTime(row.date_time);
  const timeSlot = computeTimeSlot(row.date_time);

  const distanceMiles =
    coords && userLocation
      ? haversineMiles(
          userLocation.latitude,
          userLocation.longitude,
          coords.latitude,
          coords.longitude
        )
      : null;

  return {
    // ── Identity ──────────────────────────────────────────────────────────────
    id: String(row.id),
    type: 'jam',
    entityKind: 'jam_session',

    // ── Display ───────────────────────────────────────────────────────────────
    title: row.name,
    subtitle: [genreName, vibeName].filter(Boolean).join(' · ') || 'Jam Session',
    neighborhood: null,
    summary: row.description ?? '',
    description: row.description ?? '',

    // ── Map ───────────────────────────────────────────────────────────────────
    coordinates: coords,
    locationVisibility: coords ? 'exact' : null,
    approximateRadiusMeters: null,

    // ── Taxonomy ──────────────────────────────────────────────────────────────
    genre: genreName,
    vibe: vibeName,
    vibes: vibeName ? [vibeName] : [],
    previewPills: [genreName, vibeName].filter(Boolean),

    // ── Timing ───────────────────────────────────────────────────────────────
    dateTime: formattedDate,
    date: formattedDate,
    metaSecondary: formattedDate ?? 'Open session',
    timeSlot,
    isLive: timeSlot === 'live',

    // ── Distance ─────────────────────────────────────────────────────────────
    distanceMiles,
    metaPrimary: [
      genreName,
      distanceMiles != null ? `${distanceMiles.toFixed(1)} mi` : null,
    ]
      .filter(Boolean)
      .join(' · '),

    // ── Access ────────────────────────────────────────────────────────────────
    isPrivate: !isPublic,
    access: isPublic,
    ctaLabel: isPublic ? 'Join Jam' : 'Request to Join',
    previewCtaLabel: 'View Jam',
    badgeLabel: timeSlot === 'live' ? 'Live Now' : !isPublic ? 'Private' : null,

    // ── Styling ───────────────────────────────────────────────────────────────
    accentColor: DISCOVERY_COLORS.jam,

    // ── Admin (for MyJams) ────────────────────────────────────────────────────
    admin_id: row.admin_id,
  };
}

// ─── Service ──────────────────────────────────────────────────────────────────

export const jamService = {
  /**
   * Fetch upcoming public jams as raw Supabase rows.
   * Use this when the caller wants to re-normalize (e.g. with changing userLocation).
   */
  async fetchRawDiscoverFeed() {
    const { data, error } = await supabase
      .from('chat_jam')
      .select(JAM_SELECT)
      .eq('access', true)
      .gte('date_time', new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString())
      .order('date_time', { ascending: true });
    if (error) throw error;
    return data ?? [];
  },

  /**
   * Fetch upcoming public jams, normalized.
   * Pass userLocation to populate distanceMiles.
   */
  async getDiscoverFeed(userLocation = null) {
    const rows = await this.fetchRawDiscoverFeed();
    return rows.map((row) => normalizeJamRow(row, userLocation));
  },

  /**
   * Fetch all jams where admin_id = userId (Created Jams tab).
   */
  async getMyCreatedJams(userId, userLocation = null) {
    const { data, error } = await supabase
      .from('chat_jam')
      .select(JAM_SELECT)
      .eq('admin_id', userId)
      .order('date_time', { ascending: true });
    if (error) throw error;
    return (data ?? []).map((row) => ({
      ...normalizeJamRow(row, userLocation),
      canEdit: true,
    }));
  },

  /**
   * Fetch upcoming jams the user is attending (Jams I'm Going tab).
   * Does NOT include jams the user created.
   */
  async getMyAttendingJams(userId, userLocation = null) {
    const { data: attending, error: attError } = await supabase
      .from('chat_jam_users_attending')
      .select('jam_id')
      .eq('user_id', userId);
    if (attError) throw attError;
    if (!attending?.length) return [];

    const ids = attending.map((r) => r.jam_id);
    const { data, error } = await supabase
      .from('chat_jam')
      .select(JAM_SELECT)
      .in('id', ids)
      .gte('date_time', new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString())
      .order('date_time', { ascending: true });
    if (error) throw error;
    return (data ?? []).map((row) => ({
      ...normalizeJamRow(row, userLocation),
      isAttendee: true,
    }));
  },

  /**
   * Fetch past jams the user attended or created (Past Jams tab).
   */
  async getMyPastJams(userId, userLocation = null) {
    const now = new Date().toISOString();

    // Jams user attended
    const { data: attending } = await supabase
      .from('chat_jam_users_attending')
      .select('jam_id')
      .eq('user_id', userId);
    const attendingIds = attending?.map((r) => r.jam_id) ?? [];

    // Jams user created
    const { data: created } = await supabase
      .from('chat_jam')
      .select('id')
      .eq('admin_id', userId)
      .lt('date_time', now);
    const createdIds = created?.map((r) => r.id) ?? [];

    const allIds = [...new Set([...attendingIds, ...createdIds])];
    if (!allIds.length) return [];

    const { data, error } = await supabase
      .from('chat_jam')
      .select(JAM_SELECT)
      .in('id', allIds)
      .lt('date_time', now)
      .order('date_time', { ascending: false });
    if (error) throw error;
    return (data ?? []).map((row) => normalizeJamRow(row, userLocation));
  },

  /**
   * Insert a new jam into chat_jam.
   * Returns the created row.
   */
  async createJam(form, userId) {
    const dateTime =
      form.date && form.startTime
        ? new Date(`${form.date}T${form.startTime}`).toISOString()
        : null;

    const location =
      form.selectedPlace?.latitude != null && form.selectedPlace?.longitude != null
        ? toWKTPoint(form.selectedPlace.latitude, form.selectedPlace.longitude)
        : null;

    // form.genres.presetIds are DB IDs from useFormOptions (strings) — chat_jam takes a single FK
    const genreId = form.isOpenToAllGenres
      ? null
      : form.genres?.presetIds?.[0]
        ? parseInt(form.genres.presetIds[0], 10)
        : null;

    const vibeId = form.isOpenToAllVibes
      ? null
      : form.vibes?.presetIds?.[0]
        ? parseInt(form.vibes.presetIds[0], 10)
        : null;

    const row = {
      name: form.title.trim(),
      date_time: dateTime,
      description: form.description?.trim() || null,
      access: !form.isPrivate, // true = public
      admin_id: userId,
      location,
      genre_id: genreId,
      vibe_id: vibeId,
    };

    const { data, error } = await supabase
      .from('chat_jam')
      .insert([row])
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async deleteJam(jamId) {
    const { error } = await supabase
      .from('chat_jam')
      .delete()
      .eq('id', jamId);
    if (error) throw error;
  },

  /**
   * Enrich jam thread names for the Chat page.
   * Given an array of jam IDs, returns a map { jamId → name }.
   */
  async getJamNames(jamIds) {
    if (!jamIds.length) return {};
    const { data, error } = await supabase
      .from('chat_jam')
      .select('id, name')
      .in('id', jamIds);
    if (error) return {};
    return Object.fromEntries((data ?? []).map((r) => [String(r.id), r.name]));
  },
};
