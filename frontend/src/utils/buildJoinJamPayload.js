/**
 * utils/buildJoinJamPayload.js
 *
 * Centralizes the logic for deriving join status and building the
 * backend-ready payload from JoinJamModal form state.
 *
 * When the real endpoint is wired up, update field names here only —
 * the rest of the form code stays unchanged.
 */

/**
 * Derives join status from jam privacy.
 * Kept here so this mapping is never scattered across the codebase.
 *
 * @param {boolean} isPrivate
 * @returns {"confirmed" | "pending"}
 */
export const deriveJoinStatus = (isPrivate) =>
  isPrivate ? "pending" : "confirmed";

/**
 * Builds a clean backend-ready payload from JoinJamModal form state.
 *
 * @param {string}  jamId
 * @param {boolean} isPrivate
 * @param {object}  form       — JoinJamModal internal form state
 * @returns {JoinJamSubmissionPayload}
 */
export const buildJoinJamPayload = (jamId, isPrivate, form) => ({
  jamId,
  attendanceType: form.attendanceType,

  // Instrument selections
  instrumentIds:     form.instruments.selectedIds,
  customInstruments: form.instruments.customValues,

  // Role selections
  roleIds:     form.roles.selectedIds,
  customRoles: form.roles.customValues,

  // Equipment the attendee is willing to bring
  equipmentOfferingIds:     form.equipmentOfferings.selectedIds,
  customEquipmentOfferings: form.equipmentOfferings.customValues,

  // Derived from jam.isPrivate — centralized here, not scattered across UI
  derivedJoinStatus: deriveJoinStatus(isPrivate),
});
