/**
 * utils/generateJamIcs.js
 *
 * Generates and triggers download of a .ics (iCalendar) file for a jam.
 *
 * Isolated so backend-generated calendar files can replace this later
 * without touching modal or UI code — just swap the import.
 *
 * Degrades gracefully if jam date/time data is missing or unparseable.
 */

const pad = (n) => String(n).padStart(2, "0");

/**
 * Attempts to parse a date string into UTC ICS format (YYYYMMDDTHHMMSSZ).
 * Returns null if the date is invalid or unparseable.
 *
 * @param {string} dateStr
 * @returns {string | null}
 */
const toIcsUtcStamp = (dateStr) => {
  if (!dateStr) return null;
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return null;
  return [
    d.getUTCFullYear(),
    pad(d.getUTCMonth() + 1),
    pad(d.getUTCDate()),
    "T",
    pad(d.getUTCHours()),
    pad(d.getUTCMinutes()),
    pad(d.getUTCSeconds()),
    "Z",
  ].join("");
};

/**
 * Escapes special characters for ICS text fields.
 *
 * @param {string} str
 * @returns {string}
 */
const escapeIcs = (str) =>
  String(str ?? "")
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/\n/g, "\\n");

/**
 * Generates ICS file content as a string for the given jam.
 *
 * @param {{ id, title, dateTime?, locationLabel? }} jam
 * @returns {string}
 */
export const generateJamIcsContent = (jam) => {
  const now = new Date()
    .toISOString()
    .replace(/[-:.]/g, "")
    .slice(0, 15)
    .concat("Z");

  const dtStart = toIcsUtcStamp(jam?.dateTime ?? null);

  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//SoundMeet//JamCalendar//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:jam-${jam?.id ?? "unknown"}@soundmeet.app`,
    `DTSTAMP:${now}`,
    dtStart ? `DTSTART:${dtStart}` : null,
    `SUMMARY:${escapeIcs(jam?.title ?? "Jam")}`,
    jam?.locationLabel ? `LOCATION:${escapeIcs(jam.locationLabel)}` : null,
    "END:VEVENT",
    "END:VCALENDAR",
  ].filter(Boolean);

  return lines.join("\r\n");
};

/**
 * Generates and immediately downloads a .ics file for the given jam.
 *
 * @param {{ id, title, dateTime?, locationLabel? }} jam
 */
export const downloadJamCalendarEvent = (jam) => {
  const content = generateJamIcsContent(jam);
  const blob = new Blob([content], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${
    jam?.title?.replace(/[^a-z0-9]/gi, "-").toLowerCase() ?? "jam"
  }.ics`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};
