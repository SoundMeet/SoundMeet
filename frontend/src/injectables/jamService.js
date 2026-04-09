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

const JAM_SELECT = `
  id, name, location, date_time, description, access, admin_id,
  genres:chat_jam_genre( genre:genre_id(id, name) ),
  vibes:chat_jam_vibe( vibe:vibe_id(id, name) )
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
  
  const genreNames = (row.genres ?? []).map((g) => g.genre?.name).filter(Boolean);
  const vibeNames = (row.vibes ?? []).map((v) => v.vibe?.name).filter(Boolean);

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
    subtitle: [...genreNames, ...vibeNames].join(' · ') || 'Jam Session',
    neighborhood: null,
    summary: row.description ?? '',
    description: row.description ?? '',
    coordinates: coords,
    locationVisibility: coords ? 'exact' : null,
    approximateRadiusMeters: null,
    genre: genreNames[0] ?? null,
    genres: genreNames,
    vibe: vibeNames[0] ?? null,
    vibes: vibeNames,
    previewPills: [...genreNames, ...vibeNames],
    tags: [...genreNames, ...vibeNames],
    dateTime: formattedDate,
    date: formattedDate,
    metaSecondary: formattedDate ?? 'Open session',
    timeSlot,
    isLive: timeSlot === 'live',
    distanceMiles,
    metaPrimary: [
      genreNames.join(', ') || null,
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

    const endDateTime =
      form.date && form.endTime
        ? new Date(`${form.date}T${form.endTime}`).toISOString()
        : null;

    const location =
      form.selectedPlace?.latitude != null && form.selectedPlace?.longitude != null
        ? `SRID=4326;POINT(${form.selectedPlace.longitude} ${form.selectedPlace.latitude})`
        : null;

    const formData = new FormData();

    if (form.title) formData.append('name', form.title.trim());
    if (dateTime) formData.append('date_time', dateTime);
    if (endDateTime) formData.append('end_time', endDateTime);
    if (location) formData.append('location', location);
    
    if (form.placeName) formData.append('location_name', form.placeName);
    if (form.fullAddress) formData.append('location_address', form.fullAddress);
    if (form.extraDirections) formData.append('location_guide', form.extraDirections);

    formData.append('description', form.description?.trim() || '');
    formData.append('jam_type', form.jamType || 'OPEN JAM');
    formData.append('skill_level', form.skillLevel || 'ALL LEVELS');
    formData.append('access', !form.isPrivate);

    if (form.coverImage) {
      const actualFile = form.coverImage.file ? form.coverImage.file : form.coverImage;
      formData.append('cover_image', actualFile);
    }

    const genreIds = form.isOpenToAllGenres ? [] : (form.genres?.presetIds || []);
    genreIds.forEach(id => formData.append('genre_ids', id));

    const vibeIds = form.isOpenToAllVibes ? [] : (form.vibes?.presetIds || []);
    vibeIds.forEach(id => formData.append('vibe_ids', id));

    const instrumentsNeeded = form.instruments?.presetIds || [];
    instrumentsNeeded.forEach(id => formData.append('instruments_needed_ids', id));

    const rolesNeeded = form.roles?.presetIds || [];
    rolesNeeded.forEach(id => formData.append('roles_needed_ids', id));

    const gearProvided = form.gearProvided?.presetIds || [];
    gearProvided.forEach(id => formData.append('gear_provided_ids', id));

    const gearNeeded = form.gearNeeded?.presetIds || [];
    gearNeeded.forEach(id => formData.append('gear_needed_ids', id));

    const response = await apiFetch('api/jams/create/', {
      method: 'POST',
      body: formData
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

  /**
   * Invite a user to a jam. Only the jam admin should call this.
   * Django creates a JAM_INVITE notification for the target user.
   */
  async inviteUserToJam(jamId, targetUserId) {
    return await apiFetch(`api/jams/${jamId}/invite/`, {
      method: 'POST',
      body: JSON.stringify({ user_id: targetUserId }),
    });
  },
};