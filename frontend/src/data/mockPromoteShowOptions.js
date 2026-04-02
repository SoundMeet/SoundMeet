/**
 * mockPromoteShowOptions.js
 *
 * Option sets for the Promote Show form.
 * All options follow the OptionItem shape: { id, label, value }
 *
 * Future: replace with a backend fetch call inside a usePromoteShowOptions() hook.
 *
 * Genres are shared — imported from mockCreateJamOptions, not duplicated here.
 */

import { genres } from "./mockCreateJamOptions";

// ─── Re-export shared lists so callers can import from one place ──────────────
export { genres };

// ─── Aggregated option set ────────────────────────────────────────────────────

export const promoteShowOptions = {
  genres,
};
