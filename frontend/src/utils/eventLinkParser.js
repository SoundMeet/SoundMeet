/**
 * eventLinkParser.js — Detect and parse SoundMeet event links from arbitrary text.
 *
 * Supported URL shapes:
 *   https://soundmeet.app/jam/123
 *   http://localhost:5173/show/456
 *   /jam/789
 */

// Matches jam/:id or show/:id with optional origin prefix and optional query/hash suffix.
// Capture group 1 = type ('jam' | 'show'), capture group 2 = numeric id.
const EVENT_LINK_RE = /(?:https?:\/\/[^\s/]*)?\/?(jam|show)\/(\d+)(?:[/?#][^\s]*)?/i;

/**
 * Extracts the first recognized event link from text.
 * @param {string|null} text
 * @returns {{ type: 'jam'|'show', id: string } | null}
 */
export function extractEventLink(text) {
  if (!text) return null;
  const m = text.match(EVENT_LINK_RE);
  if (!m) return null;
  return { type: m[1].toLowerCase(), id: m[2] };
}

/**
 * Returns true if the entire trimmed text is nothing but an event link.
 * @param {string|null} text
 * @returns {boolean}
 */
export function isOnlyEventLink(text) {
  if (!text) return false;
  const trimmed = text.trim();
  const remainder = trimmed.replace(EVENT_LINK_RE, '').trim();
  return EVENT_LINK_RE.test(trimmed) && remainder === '';
}

/**
 * Removes the first recognized event link from text and returns the remainder.
 * Trims any leftover whitespace.
 * @param {string|null} text
 * @returns {string}
 */
export function stripEventLink(text) {
  if (!text) return '';
  return text.replace(EVENT_LINK_RE, '').trim();
}
