/**
 * utils/normalizeSearchQuery.js
 *
 * Lightweight query normalization for venue/place name matching.
 * Strips noise so "The Boombox", "the boombox", and "boombox" all
 * resolve to the same normalized form for comparison.
 *
 * The original string is always preserved for display.
 */

const LEADING_ARTICLES = /^(the|a|an)\s+/i;

/**
 * Normalize a raw search string for comparison.
 *
 * Steps:
 *   1. lowercase + trim
 *   2. collapse repeated whitespace
 *   3. strip leading articles (the, a, an)
 *   4. remove apostrophes / smart-quotes
 *   5. replace hyphens/dashes with spaces
 *   6. strip remaining non-word punctuation
 *   7. final whitespace collapse
 *
 * @param {string} raw
 * @returns {string}
 */
export function normalizeQuery(raw) {
  let q = (raw ?? "").toLowerCase().trim();
  q = q.replace(/\s+/g, " ");
  q = q.replace(LEADING_ARTICLES, "");
  q = q.replace(/[''`]/g, "");
  q = q.replace(/[-–—]/g, " ");
  q = q.replace(/[^\w\s]/g, "");
  q = q.replace(/\s+/g, " ").trim();
  return q;
}

/**
 * Parse a raw query into its normalized form plus discrete tokens.
 * Tokens are single words of at least 2 characters after normalization.
 *
 * @param {string} rawQuery
 * @returns {{ original: string, normalized: string, tokens: string[] }}
 */
export function parseQuery(rawQuery) {
  const original   = (rawQuery ?? "").trim();
  const normalized = normalizeQuery(original);
  const tokens     = normalized.split(" ").filter((t) => t.length >= 2);
  return { original, normalized, tokens };
}
