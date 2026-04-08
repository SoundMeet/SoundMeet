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
import { apiFetch } from './Auth'; // <-- Added for Django backend calls

// ─── Shared select clause ─────────────────────────────────────────────────────

// NOTE: Since you upgraded Genre and Vibe to ManyToMany fields in Django, 
// after you migrate, you may need to update this select to fetch through the M2M tables 
// e.g., `genres:chat_jam_genre( genre:chat_genre(id, name) )`
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

function computeTimeSlot(iso) {
  if (!iso) return 'future';
  const now = new Date();
  const d = new Date(iso);
  const diffMs = d - now;
  const diffDays = diffMs / (1000 * 60 * 60 * 24);

  if (diffMs > -4 * 60 * 60 * 1000 && diffMs < 0) return 'live';

  const isToday =
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate();

  if (isToday && d.getHours() >= 18) return 'tonight';
  if (isToday) return 'tonight'; 

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

function haversineMiles(lat1, lng1, lat2, lng2) {
  const R = 3958.8; 
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

export function normalizeJamRow(row, userLocation = null) {
  const coords = parseEWKBPoint(row.location);
  const isPublic = row.access === true;
  
  // Note: If you update JAM_SELECT for the M2M arrays, you'll need to map the first item here
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
    id: String(row.id),
    type: 'jam',
    entityKind: 'jam_session',
    title: row.name,
    subtitle: [genreName, vibeName].filter(Boolean).join(' · ') || 'Jam Session',
    neighborhood: null,
    summary: row.description ?? '',
    description: row.description ?? '',
    coordinates: coords,
    locationVisibility: coords ? 'exact' : null,
    approximateRadiusMeters: null,
    genre: genreName,
    vibe: vibeName,
    vibes: vibeName ? [vibeName] : [],
    previewPills: [genreName, vibeName].filter(Boolean),
    tags: [genreName, vibeName].filter(Boolean),
    dateTime: formattedDate,
    date: formattedDate,
    metaSecondary: formattedDate ?? 'Open session',
    timeSlot,
    isLive: timeSlot === 'live',
    distanceMiles,
    metaPrimary: [
      genreName,
      distanceMiles != null ? `${distanceMiles.toFixed(1)} mi` : null,
    ]
      .filter(Boolean)
      .join(' · '),
    isPrivate: !isPublic,
    access: isPublic,
    ctaLabel: isPublic ? 'Join Jam' : 'Request to Join',
    previewCtaLabel: 'View Jam',
    badgeLabel: timeSlot === 'live' ? 'Live Now' : !isPublic ? 'Private' : null,
    accentColor: DISCOVERY_COLORS.jam,
    admin_id: row.admin_id,
  };
}

// ─── Service ──────────────────────────────────────────────────────────────────

export const jamService = {
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

  async getDiscoverFeed(userLocation = null) {
    const rows = await this.fetchRawDiscoverFeed();
    return rows.map((row) => normalizeJamRow(row, userLocation));
  },

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

  async getMyPastJams(userId, userLocation = null) {
    const now = new Date().toISOString();

    const { data: attending } = await supabase
      .from('chat_jam_users_attending')
      .select('jam_id')
      .eq('user_id', userId);
    const attendingIds = attending?.map((r) => r.jam_id) ?? [];

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

  async createJam(form, userId) {
    const dateTime =
      form.date && form.startTime
        ? new Date(`${form.date}T${form.startTime}`).toISOString()
        : null;

    const location =
      form.selectedPlace?.latitude != null && form.selectedPlace?.longitude != null
        ? `SRID=4326;POINT(${form.selectedPlace.longitude} ${form.selectedPlace.latitude})`
        : null;

    const payload = {
      name: form.title?.trim(),
      date_time: dateTime,
      location: location,
      description: form.description?.trim() || '',
      jam_type: form.jamType || 'OPEN JAM',
      skill_level: form.skillLevel || 'ALL LEVELS',
      access: !form.isPrivate, 
      
      genre_ids: form.isOpenToAllGenres ? [] : (form.genres?.presetIds || []),
      vibe_ids: form.isOpenToAllVibes ? [] : (form.vibes?.presetIds || []),
      instruments_needed_ids: form.instruments?.presetIds || [],
      roles_needed_ids: form.roles?.presetIds || [],
      gear_provided_ids: form.gearProvided?.presetIds || [],
      gear_needed_ids: form.gearNeeded?.presetIds || []
    };

    const response = await apiFetch('api/jams/create/', {
      method: 'POST',
      body: JSON.stringify(payload)
    });

    return response;
  },

  async deleteJam(jamId) {
    const { error } = await supabase
      .from('chat_jam')
      .delete()
      .eq('id', jamId);
    if (error) throw error;
  },

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