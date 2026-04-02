/**
 * validateJamCoreDetails — centralized Step 1 validation for Create Jam.
 *
 * All date/time comparisons are done with real Date objects in local time
 * to avoid string-comparison bugs and timezone edge cases.
 *
 * Overnight support: if end time (HH:MM) is numerically earlier than start
 * time, the end datetime is resolved to the following calendar day. Equal
 * times are invalid (ambiguous — treated as 0-minute duration).
 *
 * Exported helpers:
 *   parseLocalDate(dateStr)                   "YYYY-MM-DD" → Date | null
 *   parseTime(timeStr)                        "HH:MM"      → { hours, minutes } | null
 *   timeToMinutes(timeStr)                    "HH:MM"      → number | null
 *   combineDateAndTime(dateStr, timeStr)      → Date | null
 *   isOvernightEnd(startTimeStr, endTimeStr)  → boolean
 *   resolveEndDateTime(dateStr, startTimeStr, endTimeStr)
 *                                             → { endDt: Date, isOvernight: boolean } | null
 *   validateJamCoreDetails(values)            → { errors, isValid }
 *   validateJamField(field, values)           → string | null
 */

// ─── Duration caps ─────────────────────────────────────────────────────────────

const MIN_DURATION_MINS  = 30;
const MAX_DURATION_HOURS = 16;
const MAX_DURATION_MINS  = MAX_DURATION_HOURS * 60;

// ─── Low-level parsers ─────────────────────────────────────────────────────────

/**
 * Parse "YYYY-MM-DD" into a local Date at midnight.
 * Returns null for empty, malformed, or impossible calendar dates (e.g. Feb 31).
 */
export const parseLocalDate = (dateStr) => {
  if (!dateStr) return null;
  const parts = dateStr.split("-").map(Number);
  if (parts.length !== 3) return null;
  const [y, m, d] = parts;
  if (!y || !m || !d) return null;
  const dt = new Date(y, m - 1, d);
  // Detect JS silent rollover: new Date(2026, 1, 31) → March 3
  if (dt.getFullYear() !== y || dt.getMonth() !== m - 1 || dt.getDate() !== d) return null;
  return dt;
};

/**
 * Parse "HH:MM" into { hours, minutes }.
 * Returns null for empty or out-of-range values.
 */
export const parseTime = (timeStr) => {
  if (!timeStr) return null;
  const parts = timeStr.split(":").map(Number);
  if (parts.length < 2) return null;
  const [h, m] = parts;
  if (isNaN(h) || isNaN(m) || h < 0 || h > 23 || m < 0 || m > 59) return null;
  return { hours: h, minutes: m };
};

/**
 * Convert "HH:MM" to total minutes from midnight.
 * Returns null if the string is missing or malformed.
 */
export const timeToMinutes = (timeStr) => {
  const t = parseTime(timeStr);
  if (!t) return null;
  return t.hours * 60 + t.minutes;
};

/**
 * Combine a "YYYY-MM-DD" date string and "HH:MM" time string into a local Date.
 * Returns null if either component is missing or invalid.
 */
export const combineDateAndTime = (dateStr, timeStr) => {
  const date = parseLocalDate(dateStr);
  const time = parseTime(timeStr);
  if (!date || !time) return null;
  return new Date(date.getFullYear(), date.getMonth(), date.getDate(), time.hours, time.minutes);
};

// ─── Overnight helpers ─────────────────────────────────────────────────────────

/**
 * Returns true when the end time (HH:MM) is numerically earlier than the start
 * time, meaning the jam crosses midnight and ends on the following day.
 * Returns false for equal times (treated as invalid, not 24-hour).
 */
export const isOvernightEnd = (startTimeStr, endTimeStr) => {
  const startMins = timeToMinutes(startTimeStr);
  const endMins   = timeToMinutes(endTimeStr);
  if (startMins === null || endMins === null) return false;
  if (startMins === endMins) return false; // same → invalid, not overnight
  return endMins < startMins;
};

/**
 * Resolve the absolute end datetime, rolling over to +1 day when overnight.
 *
 * @returns {{ endDt: Date, isOvernight: boolean } | null}
 *   null when any input is missing or unparseable.
 */
export const resolveEndDateTime = (dateStr, startTimeStr, endTimeStr) => {
  const endDtBase = combineDateAndTime(dateStr, endTimeStr);
  if (!endDtBase) return null;

  const overnight = isOvernightEnd(startTimeStr, endTimeStr);
  const endDt = overnight
    ? new Date(endDtBase.getTime() + 24 * 60 * 60 * 1000)
    : endDtBase;

  return { endDt, isOvernight: overnight };
};

// ─── Core validator ────────────────────────────────────────────────────────────

/**
 * Validate all core details for Step 1.
 *
 * @param {{ title: string, date: string, startTime: string, endTime: string }} values
 * @returns {{ errors: { title?, date?, startTime?, endTime? }, isValid: boolean }}
 */
export const validateJamCoreDetails = (values) => {
  const errors = {};
  const now = new Date();

  // ── Title ──────────────────────────────────────────────────────────────────
  const trimmedTitle = String(values.title ?? "").trim();
  if (!trimmedTitle) {
    errors.title = "Jam title is required";
  } else if (trimmedTitle.length < 3) {
    errors.title = "Title must be at least 3 characters";
  } else if (trimmedTitle.length > 80) {
    errors.title = "Title must be 80 characters or fewer";
  }

  // ── Date ───────────────────────────────────────────────────────────────────
  const parsedDate = parseLocalDate(values.date);
  if (!values.date) {
    errors.date = "Date is required";
  } else if (!parsedDate) {
    errors.date = "Please enter a valid date";
  } else {
    const todayMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    if (parsedDate < todayMidnight) {
      errors.date = "Date must be today or in the future";
    }
  }

  // ── Start Time ─────────────────────────────────────────────────────────────
  if (!values.startTime) {
    errors.startTime = "Start time is required";
  } else if (!parseTime(values.startTime)) {
    errors.startTime = "Please enter a valid start time";
  } else if (!errors.date && values.date) {
    const startDt = combineDateAndTime(values.date, values.startTime);
    if (startDt && startDt <= now) {
      errors.startTime = "Start time must be in the future";
    }
  }

  // ── End Time (optional, overnight-aware) ───────────────────────────────────
  if (values.endTime) {
    if (!parseTime(values.endTime)) {
      errors.endTime = "Please enter a valid end time";
    } else if (!errors.startTime && values.startTime && values.date) {
      const startMins = timeToMinutes(values.startTime);
      const endMins   = timeToMinutes(values.endTime);

      if (startMins === endMins) {
        // Equal times → 0-minute jam; do not silently treat as 24 hours
        errors.endTime = "Start and end time cannot be the same";
      } else {
        // Resolve the actual end datetime (same day or next day)
        const startDt  = combineDateAndTime(values.date, values.startTime);
        const resolved = resolveEndDateTime(values.date, values.startTime, values.endTime);

        if (startDt && resolved) {
          const durationMins = (resolved.endDt - startDt) / 60000;

          if (durationMins < MIN_DURATION_MINS) {
            errors.endTime = `Jam must be at least ${MIN_DURATION_MINS} minutes long`;
          } else if (durationMins > MAX_DURATION_MINS) {
            errors.endTime = `Jam cannot be longer than ${MAX_DURATION_HOURS} hours`;
          }
          // No error needed for overnight when duration is valid — the "+1 day"
          // badge in the UI handles communicating the rollover to the user.
        }
      }
    }
  }

  return { errors, isValid: Object.keys(errors).length === 0 };
};

// ─── Single-field blur helper ──────────────────────────────────────────────────

/**
 * Run full validation but return only the error for the requested field.
 * Pass complete form values so cross-field rules (end vs. start) work.
 *
 * @param {string} field
 * @param {{ title: string, date: string, startTime: string, endTime: string }} values
 * @returns {string | null}
 */
export const validateJamField = (field, values) => {
  const { errors } = validateJamCoreDetails(values);
  return errors[field] ?? null;
};
