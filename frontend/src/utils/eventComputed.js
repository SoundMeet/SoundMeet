/**
 * eventComputed.js — Centralized computed state logic for EventDetailModal.
 *
 * All conditional rendering decisions (lifecycle, relationship, location,
 * footer actions) are derived here — not scattered across JSX files.
 *
 * @module eventComputed
 */

// ─── Lifecycle ──────────────────────────────────────────────────────────────

/**
 * Returns the current lifecycle state of an event.
 * @param {Object} item - Discovery item
 * @param {{ isPastEvent?: boolean }} viewerContext
 * @returns {'live'|'upcoming'|'ended'|'cancelled'}
 */
export function getEventLifecycleState(item, viewerContext = {}) {
  if (!item) return "upcoming";
  if (item.status === "cancelled") return "cancelled";
  if (viewerContext.isPastEvent === true) return "ended";

  const now = new Date();
  const start = item.dateTimeRaw ? new Date(item.dateTimeRaw) : null;
  const end   = item.endDateTimeRaw ? new Date(item.endDateTimeRaw) : null;

  if (start && end) {
    if (now >= end)   return "ended";
    if (now >= start) return "live";
  } else if (start) {
    // No explicit end — treat as live for 4 h after start, then ended
    if (now >= new Date(start.getTime() + 4 * 60 * 60 * 1000)) return "ended";
    if (now >= start) return "live";
  }

  // Legacy fallback for items normalised before dateTimeRaw was added
  if (item.isLive === true) return "live";
  return "upcoming";
}

// ─── User relationship ───────────────────────────────────────────────────────

/**
 * Returns the viewer's relationship to the event.
 * @param {Object} item - Discovery item
 * @param {{ isCreator?: boolean, isAdmin?: boolean, isAttendee?: boolean, joinState?: string|null }} viewerContext
 * @returns {'creator'|'admin'|'approved'|'pending'|'waitlisted'|'not_joined'}
 */
export function getUserEventRelationship(_item, viewerContext = {}) {
  if (viewerContext.isCreator) return "creator";
  if (viewerContext.isAdmin) return "admin";
  if (viewerContext.joinState === "approved" || viewerContext.isAttendee) return "approved";
  if (viewerContext.joinState === "pending") return "pending";
  if (viewerContext.joinState === "waitlisted") return "waitlisted";
  return "not_joined";
}

// ─── Location visibility ─────────────────────────────────────────────────────

/**
 * Returns whether the exact location should be revealed to this viewer.
 * @param {Object} item - Discovery item
 * @param {{ isCreator?: boolean, isAdmin?: boolean, isAttendee?: boolean, joinState?: string|null }} viewerContext
 * @returns {boolean}
 */
export function canRevealExactLocation(item, viewerContext = {}) {
  if (!item) return false;
  // Always show exact for public events or venue-based shows
  if (item.locationVisibility === "exact") return true;
  // Approximate items (band/musician) — only show approximation regardless of relationship
  if (item.locationVisibility === "approximate") return false;
  // Private jam: approved attendees and above see exact location
  const relationship = getUserEventRelationship(item, viewerContext);
  return ["creator", "admin", "approved"].includes(relationship);
}

// ─── Capacity ────────────────────────────────────────────────────────────────

/**
 * Returns a human-readable capacity state.
 * @param {Object} item
 * @returns {{ state: 'open'|'filling'|'almost_full'|'full'|'unknown', spotsLeft: number|null, label: string|null }}
 */
export function getCapacityState(item) {
  const count = item?.attendeeCount != null ? Number(item.attendeeCount) : null;
  const cap = item?.capacity != null ? Number(item.capacity) : null;

  if (count === null || cap === null) return { state: "unknown", spotsLeft: null, label: null };

  const spotsLeft = cap - count;
  const fillRatio = count / cap;

  if (spotsLeft <= 0) return { state: "full", spotsLeft: 0, label: "Full" };
  if (fillRatio >= 0.8) return { state: "almost_full", spotsLeft, label: `${spotsLeft} spot${spotsLeft === 1 ? "" : "s"} left` };
  if (fillRatio >= 0.5) return { state: "filling", spotsLeft, label: `${spotsLeft} spots left` };
  return { state: "open", spotsLeft, label: `${spotsLeft} spots open` };
}

// ─── Privacy notice ───────────────────────────────────────────────────────────

/**
 * Returns a human-readable notice for hidden location, or null.
 * @param {Object} item
 * @param {Object} viewerContext
 * @returns {string|null}
 */
export function getLocationNotice(item, viewerContext = {}) {
  if (canRevealExactLocation(item, viewerContext)) return null;

  if (item?.locationVisibility === "approximate") {
    return "Exact location is kept private for this listing — only a general area is shown.";
  }
  if (item?.isPrivate) {
    const relationship = getUserEventRelationship(item, viewerContext);
    if (relationship === "pending") {
      return "Exact address will be shared once your request is approved.";
    }
    return "Exact address is visible to approved attendees only.";
  }
  return null;
}

// ─── Footer actions ───────────────────────────────────────────────────────────

/**
 * @typedef {Object} FooterAction
 * @property {string} label
 * @property {string} [description]
 * @property {boolean} [disabled]
 * @property {'primary'|'secondary'|'danger'|'ghost'} variant
 * @property {string} actionKey - Used by caller to dispatch the right handler
 */

/**
 * Returns the primary and secondary footer actions for the current viewer context.
 * @param {Object} item
 * @param {Object} viewerContext
 * @returns {{ primary: FooterAction|null, secondary: FooterAction[] }}
 */
export function getFooterActions(item, viewerContext = {}) {
  const relationship = getUserEventRelationship(item, viewerContext);
  const lifecycle = getEventLifecycleState(item, viewerContext);
  const type = item?.type ?? "jam";

  // ── Ended events ──────────────────────────────────────────────────────────
  if (lifecycle === "ended") {
    const alreadyRated = item?.rating != null;
    return {
      primary: {
        label: alreadyRated ? "Edit Review" : "Rate this Jam",
        variant: "primary",
        actionKey: "rate",
      },
      secondary: [{ label: "View History", variant: "ghost", actionKey: "history" }],
    };
  }

  // ── Cancelled events ──────────────────────────────────────────────────────
  if (lifecycle === "cancelled") {
    return { primary: null, secondary: [] };
  }

  // ── Creator / admin ───────────────────────────────────────────────────────
  if (relationship === "creator" || relationship === "admin") {
    // Shows don't have an edit flow yet — only show delete
    if (type === "promote_show") {
      return {
        primary: null,
        secondary: [{ label: "Delete Event", variant: "danger", actionKey: "delete" }],
      };
    }
    return {
      primary:   { label: "Edit Event",    variant: "primary", actionKey: "edit" },
      secondary: [{ label: "Delete Event", variant: "danger",  actionKey: "delete" }],
    };
  }

  // ── Already approved / attendee ───────────────────────────────────────────
  if (relationship === "approved") {
    if (lifecycle === "live") {
      return {
        primary: { label: "Open Chat", variant: "primary", actionKey: "chat" },
        secondary: [{ label: "Leave Event", variant: "danger", actionKey: "leave" }],
      };
    }
    // Type-aware label: shows say "Registered", jams say "You're Going"
    const primaryLabel = type === "promote_show" ? "Registered" : "You're Going";
    return {
      primary: { label: primaryLabel, variant: "primary", actionKey: "going" },
      secondary: [{ label: "Leave Event", variant: "danger", actionKey: "leave" }],
    };
  }

  // ── Pending ───────────────────────────────────────────────────────────────
  if (relationship === "pending") {
    return {
      primary: { label: "Request Pending", variant: "primary", actionKey: "pending", disabled: true },
      secondary: [{ label: "Cancel Request", variant: "ghost", actionKey: "cancel_request" }],
    };
  }

  // ── Waitlisted ────────────────────────────────────────────────────────────
  if (relationship === "waitlisted") {
    return {
      primary: { label: "On Waitlist", variant: "primary", actionKey: "waitlisted", disabled: true },
      secondary: [{ label: "Leave Waitlist", variant: "ghost", actionKey: "leave_waitlist" }],
    };
  }

  // ── Not joined — derive CTA from event type ───────────────────────────────
  const capacityState = getCapacityState(item);

  if (type === "jam") {
    const isFull = capacityState.state === "full";
    const isPrivate = item?.isPrivate;

    if (isFull) {
      return {
        primary: { label: "Join Waitlist", variant: "primary", actionKey: "waitlist" },
        secondary: [],
      };
    }
    return {
      primary: { label: isPrivate ? "Request to Join" : "Join Jam", variant: "primary", actionKey: "join" },
      secondary: [],
    };
  }

  if (type === "promote_show") {
    return {
      primary: { label: "RSVP", variant: "primary", actionKey: "rsvp" },
      secondary: [],
    };
  }

  if (type === "join_band") {
    return {
      primary: { label: "View Profile", variant: "primary", actionKey: "view_profile" },
      secondary: [],
    };
  }

  if (type === "find_bandmate") {
    return {
      primary: { label: item?.ctaLabel ?? "Apply", variant: "primary", actionKey: "apply" },
      secondary: [],
    };
  }

  return { primary: null, secondary: [] };
}

// ─── Host label ───────────────────────────────────────────────────────────────

/**
 * Returns the host name extracted from any event type.
 * @param {Object} item
 * @returns {string|null}
 */
export function extractHostDisplay(item) {
  if (!item) return null;
  return item.hostName ?? item.musicianName ?? item.bandName ?? item.venueName ?? null;
}

/**
 * Generate two-letter initials from a display name.
 * @param {string|null} name
 * @returns {string}
 */
export function nameToInitials(name) {
  if (!name) return "?";
  return name
    .split(" ")
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}
