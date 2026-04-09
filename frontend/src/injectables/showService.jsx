import { supabase } from './supaBaseClient';
import { parseEWKBPoint } from '../utils/parseGeography';
import { apiFetch } from './Auth';
import { DISCOVERY_COLORS } from '../utils/discovery';

// ─── Shared select clause ─────────────────────────────────────────────────────

const SHOW_SELECT = `
  id, name, date_time, end_time, location,
  location_name, location_address, location_guide,
  description, ticket_link, ticket_price, max_capacity, access,
  lineup, cover_image, admin_id,
  genres:chat_show_genres( genre:chat_genre( id, name ) )
`;

// ─── Media URL helper ─────────────────────────────────────────────────────────

const SUPABASE_STORAGE_BASE =
  `${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/media`;

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

export function normalizeShowRow(row, userLocation = null) {
  const coords = parseEWKBPoint(row.location);
  const isPublic = row.access === true;

  // Genres come back as [{ genre: { id, name } }] from the joined query
  const genreNames = (row.genres ?? [])
    .map((g) => g.genre?.name ?? g.name)
    .filter(Boolean);

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

  const lineup = Array.isArray(row.lineup) ? row.lineup : [];

  return {
    id: String(row.id),
    type: 'promote_show',
    entityKind: 'show',
    title: row.name,
    subtitle: genreNames.join(' · ') || 'Live Show',
    neighborhood: null,
    summary: row.description ?? '',
    description: row.description ?? '',
    coordinates: coords,
    locationVisibility: coords ? 'exact' : null,
    approximateRadiusMeters: null,
    // Location
    locationName: row.location_name ?? null,
    locationAddress: row.location_address ?? null,
    locationGuide: row.location_guide ?? null,
    // ShowDetailSections reads venueName
    venueName: row.location_name ?? null,
    // Taxonomy
    genre: genreNames[0] ?? null,
    genres: genreNames,
    previewPills: genreNames,
    tags: genreNames,
    // Dates
    dateTime: formattedDate,
    date: formattedDate,
    dateTimeRaw: row.date_time ?? null,
    endDateTimeRaw: row.end_time ?? null,
    endDateTime: row.end_time ? formatDateTime(row.end_time) : null,
    metaSecondary: formattedDate ?? 'Upcoming Show',
    timeSlot,
    isLive: timeSlot === 'live',
    distanceMiles,
    metaPrimary: [
      genreNames.join(', ') || null,
      distanceMiles != null ? `${distanceMiles.toFixed(1)} mi` : null,
    ]
      .filter(Boolean)
      .join(' · '),
    // Show-specific
    lineup,
    ticketPrice: row.ticket_price ?? null,
    ticketLink: row.ticket_link ?? null,
    capacity: row.max_capacity ?? null,
    coverImageUrl: resolveMediaUrl(row.cover_image),
    // Privacy / access
    isPrivate: !isPublic,
    access: isPublic,
    ctaLabel: 'View Show',
    previewCtaLabel: 'View Show',
    badgeLabel: timeSlot === 'live' ? 'Live Now' : null,
    accentColor: DISCOVERY_COLORS.promote_show,
    admin_id: row.admin_id,
  };
}

// ─── Service ──────────────────────────────────────────────────────────────────

export const showService = {

  async fetchRawShowFeed() {
    const { data, error } = await supabase
      .from('chat_show')
      .select(SHOW_SELECT)
      .eq('access', true)
      .gte('date_time', new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString())
      .order('date_time', { ascending: true });
    if (error) throw error;
    return data ?? [];
  },

  async getUpcomingShows(userLocation = null) {
    const rows = await this.fetchRawShowFeed();
    return rows.map((row) => normalizeShowRow(row, userLocation));
  },

  async createShow(form) {
    const formData = new FormData();

    if (form.title) formData.append('name', form.title.trim());
    if (form.description) formData.append('description', form.description.trim());
    if (form.ticketLink) {
      const link = form.ticketLink.trim();
      formData.append('ticket_link', /^https?:\/\//i.test(link) ? link : `https://${link}`);
    }

    if (form.date && form.startTime) {
      const dateTime = new Date(`${form.date}T${form.startTime}`).toISOString();
      formData.append('date_time', dateTime);
    }

    if (form.date && form.endTime) {
      const endDateTime = new Date(`${form.date}T${form.endTime}`).toISOString();
      formData.append('end_time', endDateTime);
    }

    if (form.selectedPlace?.latitude != null && form.selectedPlace?.longitude != null) {
      const wkt = `SRID=4326;POINT(${form.selectedPlace.longitude} ${form.selectedPlace.latitude})`;
      formData.append('location', wkt);
    }

    if (form.selectedPlace?.placeName) formData.append('location_name', form.selectedPlace.placeName);
    if (form.selectedPlace?.address)   formData.append('location_address', form.selectedPlace.address);
    if (form.locationGuide)            formData.append('location_guide', form.locationGuide.trim());

    if (form.ticketPrice) formData.append('ticket_price', form.ticketPrice);
    if (form.maxCapacity) formData.append('max_capacity', form.maxCapacity);
    if (form.isPrivate !== undefined) formData.append('access', !form.isPrivate);

    if (form.lineup?.length) {
      // Strip frontend-only `id` (React key) before persisting to the DB
      const lineupPayload = form.lineup.map(({ name, role }) => ({ name, role: role || null }));
      formData.append('lineup', JSON.stringify(lineupPayload));
    }

    // genres uses selectedIds (show form TagGroup shape)
    const genreIds = form.genres?.selectedIds || [];
    genreIds.forEach((id) => formData.append('genre_ids', id));

    if (form.coverImage?.file instanceof File) {
      formData.append('cover_image', form.coverImage.file);
    }

    const response = await apiFetch('api/shows/create/', {
      method: 'POST',
      body: formData,
    });

    return response;
  },

  // ── RSVP — uses Django's auto-created chat_show_users_attending junction table ──

  async rsvpShow(showId, userId) {
    const { error } = await supabase
      .from('chat_show_users_attending')
      .insert({ show_id: Number(showId), user_id: Number(userId) });
    if (error) throw error;
  },

  async deleteShow(showId) {
    const { error } = await supabase
      .from('chat_show')
      .delete()
      .eq('id', showId);
    if (error) throw error;
  },

  async cancelShowRsvp(showId, userId) {
    const { error } = await supabase
      .from('chat_show_users_attending')
      .delete()
      .eq('show_id', Number(showId))
      .eq('user_id', Number(userId));
    if (error) throw error;
  },

  /**
   * Returns the IDs (as strings) of upcoming shows the user has RSVPd to.
   * Lightweight — only fetches the junction table, no full show rows.
   */
  async getMyRsvpdShowIds(userId) {
    const { data, error } = await supabase
      .from('chat_show_users_attending')
      .select('show_id')
      .eq('user_id', Number(userId));
    if (error) throw error;
    return (data ?? []).map((r) => String(r.show_id));
  },

  async getMyRsvpdShows(userId, userLocation = null) {
    const { data: rsvps, error: rsvpError } = await supabase
      .from('chat_show_users_attending')
      .select('show_id')
      .eq('user_id', Number(userId));
    if (rsvpError) throw rsvpError;
    if (!rsvps?.length) return [];

    const ids = rsvps.map((r) => r.show_id);
    const { data, error } = await supabase
      .from('chat_show')
      .select(SHOW_SELECT)
      .in('id', ids)
      .gte('date_time', new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString())
      .order('date_time', { ascending: true });
    if (error) throw error;
    return (data ?? []).map((row) => ({
      ...normalizeShowRow(row, userLocation),
      isAttendee: true,
    }));
  },

  /**
   * Fetch the attendee list for a show, enriched with profile data.
   * Returns the same attendee shape as getJamAttendees but without
   * instrument/role/gear fields (shows don't track those).
   */
  async getShowAttendees(showId) {
    const { data: rows, error: attErr } = await supabase
      .from('chat_show_users_attending')
      .select('user_id')
      .eq('show_id', Number(showId));
    if (attErr) throw attErr;
    if (!rows?.length) return [];

    const userIds = rows.map((r) => r.user_id);

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
        userId:              String(uid),
        displayName:         p?.display_name ?? `User #${uid}`,
        pfp:                 p?.pfp ?? null,
        instrumentsBringing: [],
        rolesBringing:       [],
        gearBringing:        [],
      };
    });
  },

  /**
   * Remove any attendee from a show (organizer action).
   */
  async removeShowAttendee(showId, userId) {
    const { error } = await supabase
      .from('chat_show_users_attending')
      .delete()
      .eq('show_id', Number(showId))
      .eq('user_id', userId);
    if (error) throw error;
  },

  async getShowById(showId) {
    const { data, error } = await supabase
      .from('chat_show')
      .select(`
        *,
        admin:admin_id ( id, username ),
        genres:chat_show_genres ( genre:chat_genre ( id, name ) )
      `)
      .eq('id', showId)
      .single();

    if (error) throw error;

    return normalizeShowRow({
      ...data,
      genres: data.genres, // still in nested { genre: { id, name } } shape
    });
  },
};
