/**
 * jamService.js
 *
 * All Supabase queries for jam data.
 * Normalizes raw `chat_jam` rows into the discovery item shape used by
 * every component in the app (map pins, cards, modals, MyJams tabs).
 */
import { supabase } from './supaBaseClient';
import { parseEWKBPoint } from '../utils/parseGeography';
import { DISCOVERY_COLORS } from '../utils/discovery';
import { apiFetch } from './Auth'; // <-- Added for Django backend calls
import { chatService } from './chatService';
import { showService } from './showService';

// ─── Shared select clause ─────────────────────────────────────────────────────

const JAM_SELECT = `
  id, name, location, date_time, end_time, description, access, admin_id,
  location_name, location_address, location_guide,
  jam_type, skill_level, max_attendees, cover_image,
  genres:chat_jam_genre( genre:genre_id(id, name) ),
  vibes:chat_jam_vibe( vibe:vibe_id(id, name) ),
  instruments_needed:chat_jam_instruments_needed( instrument:instrument_id(id, name) ),
  roles_needed:chat_jam_roles_needed( role:role_id(id, name) ),
  gear_provided:chat_jam_gear_provided( gear:gear_id(id, name) ),
  gear_needed:chat_jam_gear_needed( gear:gear_id(id, name) )
`;

// ─── Media URL helper ─────────────────────────────────────────────────────────

// Django uses S3Boto3Storage backed by Supabase Storage.
// DB stores the raw path (e.g. "jam_images/foo.jpg"); full public URL is:
// {supabase_url}/storage/v1/object/public/media/{path}
const SUPABASE_STORAGE_BASE =
  `${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/media`;

/**
 * Resolves a stored media path to a fully-qualified public URL.
 * Returns the value unchanged if it is already an absolute URL.
 */
function resolveMediaUrl(path) {
  if (!path) return null;
  if (path.startsWith('http://') || path.startsWith('https://')) return path;
  return `${SUPABASE_STORAGE_BASE}/${path}`;
}

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
  
  const genreNames          = (row.genres ?? []).map((g) => g.genre?.name).filter(Boolean);
  const vibeNames           = (row.vibes ?? []).map((v) => v.vibe?.name).filter(Boolean);
  const instrumentNames     = (row.instruments_needed ?? []).map((i) => i.instrument?.name).filter(Boolean);
  const roleNames           = (row.roles_needed ?? []).map((r) => r.role?.name).filter(Boolean);
  const gearProvidedNames   = (row.gear_provided ?? []).map((g) => g.gear?.name).filter(Boolean);
  const gearNeededNames     = (row.gear_needed ?? []).map((g) => g.gear?.name).filter(Boolean);

  // IDs — needed to pre-populate the edit form's TagGroup presetIds
  const genreIds        = (row.genres ?? []).map((g) => g.genre?.id).filter(Boolean).map(String);
  const vibeIds         = (row.vibes ?? []).map((v) => v.vibe?.id).filter(Boolean).map(String);
  const instrumentIds   = (row.instruments_needed ?? []).map((i) => i.instrument?.id).filter(Boolean).map(String);
  const roleIds         = (row.roles_needed ?? []).map((r) => r.role?.id).filter(Boolean).map(String);
  const gearProvidedIds = (row.gear_provided ?? []).map((g) => g.gear?.id).filter(Boolean).map(String);
  const gearNeededIds   = (row.gear_needed ?? []).map((g) => g.gear?.id).filter(Boolean).map(String);

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
    // Location detail fields
    locationName: row.location_name ?? null,
    locationAddress: row.location_address ?? null,
    locationGuide: row.location_guide ?? null,
    // Taxonomy
    genre: genreNames[0] ?? null,
    genres: genreNames,
    vibe: vibeNames[0] ?? null,
    vibes: vibeNames,
    previewPills: [...genreNames, ...vibeNames],
    tags: [...genreNames, ...vibeNames],
    // Dates
    dateTime: formattedDate,
    date: formattedDate,
    dateTimeRaw: row.date_time ?? null,
    endDateTimeRaw: row.end_time ?? null,
    endDateTime: row.end_time ? formatDateTime(row.end_time) : null,
    metaSecondary: formattedDate ?? 'Open session',
    timeSlot,
    isLive: timeSlot === 'live',
    distanceMiles,
    metaPrimary: distanceMiles != null ? `${distanceMiles.toFixed(1)} mi away` : null,
    // Jam-specific attributes
    jamType: row.jam_type ?? null,
    skillLevel: row.skill_level ?? null,
    capacity: row.max_attendees ?? null,
    coverImageUrl: resolveMediaUrl(row.cover_image),
    // Looking for
    instrumentsNeeded: instrumentNames,
    rolesNeeded: roleNames,
    // Gear
    gearProvidedItems: gearProvidedNames,
    gearNeededItems: gearNeededNames,
    // IDs for edit form pre-population
    genreIds,
    vibeIds,
    instrumentIds,
    roleIds,
    gearProvidedIds,
    gearNeededIds,
    // Privacy / access
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
    const cutoff = new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString();

    // Attending jams
    const { data: attending, error: attError } = await supabase
      .from('chat_jam_users_attending')
      .select('jam_id')
      .eq('user_id', userId);
    if (attError) throw attError;

    let jamItems = [];
    if (attending?.length) {
      const ids = attending.map((r) => r.jam_id);
      const { data, error } = await supabase
        .from('chat_jam')
        .select(JAM_SELECT)
        .in('id', ids)
        .gte('date_time', cutoff)
        .order('date_time', { ascending: true });
      if (error) throw error;
      jamItems = (data ?? []).map((row) => ({
        ...normalizeJamRow(row, userLocation),
        isAttendee: true,
      }));
    }

    // RSVPd shows
    const showItems = await showService.getMyRsvpdShows(userId, userLocation);

    // Merge and sort by date ascending
    return [...jamItems, ...showItems].sort((a, b) => {
      const aDate = a.dateTimeRaw ? new Date(a.dateTimeRaw) : new Date(0);
      const bDate = b.dateTimeRaw ? new Date(b.dateTimeRaw) : new Date(0);
      return aDate - bDate;
    });
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

  async createJam(form) {
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
    
    if (form.selectedPlace?.placeName) formData.append('location_name', form.selectedPlace.placeName);
    if (form.selectedPlace?.address)   formData.append('location_address', form.selectedPlace.address);
    if (form.locationGuide)            formData.append('location_guide', form.locationGuide.trim());

    formData.append('description', form.description?.trim() || '');

    const jamType = form.jamTypes?.presetIds?.[0] ?? form.jamTypes?.customValues?.[0] ?? 'OPEN JAM';
    formData.append('jam_type', jamType);
    formData.append('skill_level', form.skillLevel || 'ALL LEVELS');
    formData.append('access', !form.isPrivate);

    if (form.maxParticipants) formData.append('max_attendees', parseInt(form.maxParticipants, 10));

    if (form.coverImage?.file) formData.append('cover_image', form.coverImage.file);

    const genreIds = form.isOpenToAllGenres ? [] : (form.genres?.presetIds || []);
    genreIds.forEach(id => formData.append('genre_ids', id));

    const vibeIds = form.isOpenToAllVibes ? [] : (form.vibes?.presetIds || []);
    vibeIds.forEach(id => formData.append('vibe_ids', id));

    const instrumentsNeeded = form.isOpenToAllInstruments ? [] : (form.instrumentsNeeded?.presetIds || []);
    instrumentsNeeded.forEach(id => formData.append('instruments_needed_ids', id));

    const rolesNeeded = form.rolesNeeded?.presetIds || [];
    rolesNeeded.forEach(id => formData.append('roles_needed_ids', id));

    const gearProvided = form.equipmentAvailable?.presetIds || [];
    gearProvided.forEach(id => formData.append('gear_provided_ids', id));

    const gearNeeded = form.equipmentNeeded?.presetIds || [];
    gearNeeded.forEach(id => formData.append('gear_needed_ids', id));

    const response = await apiFetch('api/jams/create/', {
      method: 'POST',
      body: formData
    });

    return response;
  },

  async updateJam(jamId, form) {
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

    if (form.title)                       formData.append('name', form.title.trim());
    if (dateTime)                         formData.append('date_time', dateTime);
    formData.append('end_time', endDateTime ?? '');
    if (location)                         formData.append('location', location);
    if (form.selectedPlace?.placeName)    formData.append('location_name', form.selectedPlace.placeName);
    if (form.selectedPlace?.address)      formData.append('location_address', form.selectedPlace.address);
    formData.append('location_guide', form.locationGuide?.trim() || '');
    formData.append('description', form.description?.trim() || '');

    const jamType = form.jamTypes?.presetIds?.[0] ?? form.jamTypes?.customValues?.[0] ?? 'OPEN JAM';
    formData.append('jam_type', jamType);
    formData.append('skill_level', form.skillLevel || 'ALL LEVELS');
    formData.append('access', !form.isPrivate);
    formData.append('max_attendees', form.maxParticipants ? parseInt(form.maxParticipants, 10) : '');

    if (form.coverImage?.file) formData.append('cover_image', form.coverImage.file);

    const genreIds = form.isOpenToAllGenres ? [] : (form.genres?.presetIds || []);
    genreIds.forEach(id => formData.append('genre_ids', id));

    const vibeIds = form.isOpenToAllVibes ? [] : (form.vibes?.presetIds || []);
    vibeIds.forEach(id => formData.append('vibe_ids', id));

    const instrumentsNeeded = form.isOpenToAllInstruments ? [] : (form.instrumentsNeeded?.presetIds || []);
    instrumentsNeeded.forEach(id => formData.append('instruments_needed_ids', id));

    const rolesNeeded = form.rolesNeeded?.presetIds || [];
    rolesNeeded.forEach(id => formData.append('roles_needed_ids', id));

    const gearProvided = form.equipmentAvailable?.presetIds || [];
    gearProvided.forEach(id => formData.append('gear_provided_ids', id));

    const gearNeeded = form.equipmentNeeded?.presetIds || [];
    gearNeeded.forEach(id => formData.append('gear_needed_ids', id));

    return await apiFetch(`api/jams/${jamId}/update/`, {
      method: 'PATCH',
      body: formData,
    });
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

  /**
   * Remove the current user from a jam's attendee list.
   */
  async leaveJam(jamId, userId) {
    const { error } = await supabase
      .from('chat_jam_users_attending')
      .delete()
      .eq('jam_id', Number(jamId))
      .eq('user_id', userId);
    if (error) throw error;
  },

  /**
   * Returns the IDs (as strings) of upcoming jams the user is currently attending.
   * Lightweight — only fetches the junction table, no full jam rows.
   */
  async getMyAttendingJamIds(userId) {
    const { data, error } = await supabase
      .from('chat_jam_users_attending')
      .select('jam_id')
      .eq('user_id', userId);
    if (error) throw error;
    return (data ?? []).map((r) => String(r.jam_id));
  },

  /**
   * Join a public jam: add the user to the attendees list and the jam's chat.
   * Returns the conversation ID so callers can navigate to the chat if needed.
   */
  async joinJam(jamId, userId) {
    const { error } = await supabase
      .from('chat_jam_users_attending')
      .upsert({ jam_id: Number(jamId), user_id: userId }, { onConflict: 'jam_id,user_id' });
    if (error) throw error;

    const conversationId = await chatService.getOrCreateJamChat(Number(jamId), userId);
    return conversationId;
  },

  /**
   * Fetch the attendee list for a jam, enriched with profile data.
   * Returns an array of attendee objects shaped for the ManageAttendeesModal.
   *
   * gearBringing is stubbed as [] until a per-attendee gear table exists.
   */
  async getJamAttendees(jamId) {
    // 1. Get user IDs attending this jam
    const { data: rows, error: attErr } = await supabase
      .from('chat_jam_users_attending')
      .select('user_id')
      .eq('jam_id', Number(jamId));
    if (attErr) throw attErr;
    if (!rows?.length) return [];

    const userIds = rows.map((r) => r.user_id);

    // 2. Fetch profiles for those users
    const { data: profiles, error: profErr } = await supabase
      .from('chat_profile')
      .select('user_id, display_name, pfp')
      .in('user_id', userIds);
    if (profErr) throw profErr;

    const profileMap = Object.fromEntries(
      (profiles ?? []).map((p) => [String(p.user_id), p])
    );

    return userIds.map((uid) => {
      const p = profileMap[String(uid)];
      return {
        userId:      String(uid),
        displayName: p?.display_name ?? `User #${uid}`,
        pfp:         p?.pfp ?? null,
        // Stub: no per-attendee gear table yet — wire up when backend is ready
        gearBringing: [],
      };
    });
  },

  /**
   * Fetch a single jam by ID and normalize it.
   * Used after an update to refresh local modal state immediately.
   */
  async getJamById(jamId, userLocation = null) {
    const { data, error } = await supabase
      .from('chat_jam')
      .select(JAM_SELECT)
      .eq('id', Number(jamId))
      .single();
    if (error) throw error;
    return normalizeJamRow(data, userLocation);
  },

  /**
   * Update an existing jam. Mirrors createJam but sends PATCH.
   * Only sends cover_image when a new File is provided.
   */
  async updateJam(jamId, form) {
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

    if (form.title)     formData.append('name', form.title.trim());
    if (dateTime)       formData.append('date_time', dateTime);
    if (endDateTime)    formData.append('end_time', endDateTime);
    if (location)       formData.append('location', location);

    if (form.selectedPlace?.placeName) formData.append('location_name', form.selectedPlace.placeName);
    if (form.selectedPlace?.address)   formData.append('location_address', form.selectedPlace.address);
    if (form.locationGuide)            formData.append('location_guide', form.locationGuide.trim());

    formData.append('description', form.description?.trim() || '');

    const jamType = form.jamTypes?.presetIds?.[0] ?? form.jamTypes?.customValues?.[0] ?? '';
    if (jamType) formData.append('jam_type', jamType);

    if (form.skillLevel) formData.append('skill_level', form.skillLevel);
    formData.append('access', !form.isPrivate);

    if (form.maxParticipants) formData.append('max_attendees', parseInt(form.maxParticipants, 10));

    // Only upload a new image if the user chose one; null means keep existing.
    if (form.coverImage?.file) formData.append('cover_image', form.coverImage.file);

    const genreIds = form.isOpenToAllGenres ? [] : (form.genres?.presetIds || []);
    genreIds.forEach(id => formData.append('genre_ids', id));

    const vibeIds = form.isOpenToAllVibes ? [] : (form.vibes?.presetIds || []);
    vibeIds.forEach(id => formData.append('vibe_ids', id));

    const instrumentsNeeded = form.isOpenToAllInstruments ? [] : (form.instrumentsNeeded?.presetIds || []);
    instrumentsNeeded.forEach(id => formData.append('instruments_needed_ids', id));

    const rolesNeeded = form.rolesNeeded?.presetIds || [];
    rolesNeeded.forEach(id => formData.append('roles_needed_ids', id));

    const gearProvided = form.equipmentAvailable?.presetIds || [];
    gearProvided.forEach(id => formData.append('gear_provided_ids', id));

    const gearNeeded = form.equipmentNeeded?.presetIds || [];
    gearNeeded.forEach(id => formData.append('gear_needed_ids', id));

    return await apiFetch(`api/jams/${jamId}/update/`, {
      method: 'PATCH',
      body: formData,
    });
  },
};