import { useState } from "react";

/**
 * EventAdminActions — management controls for the event creator or admin.
 * Rendered inside the scrollable body, below the host section.
 */

const AdminButton = ({ icon, label, onClick, danger = false }) => (
  <button
    onClick={onClick}
    className="flex items-center gap-3 w-full px-4 py-3 rounded-xl text-sm font-medium transition-all duration-150 hover:bg-white/[0.06] text-left"
    style={{ color: danger ? "rgba(251,64,64,0.85)" : "rgba(229,226,225,0.65)" }}
  >
    <span className="shrink-0 opacity-70">{icon}</span>
    {label}
  </button>
);

const EditIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
  </svg>
);

const UsersIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
    <circle cx="9" cy="7" r="4"/>
    <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
    <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
  </svg>
);

const LinkIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/>
    <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
  </svg>
);

const TrashIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="3 6 5 6 21 6"/>
    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
  </svg>
);

const EventAdminActions = ({ item, onEdit, onDelete, onClose }) => {
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  return (
    <div className="px-3 pb-3">
      <div
        className="rounded-2xl overflow-hidden"
        style={{ border: "1px solid rgba(255,255,255,0.06)" }}
      >
        <div className="px-4 pt-3 pb-1">
          <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-neutral-600">
            Manage
          </p>
        </div>

        <AdminButton
          icon={<EditIcon />}
          label="Edit Event"
          onClick={() => { onEdit?.(item); onClose?.(); }}
        />
        <AdminButton
          icon={<UsersIcon />}
          label="Manage Attendees"
          onClick={() => {
            /* TODO: open attendee management panel when backend is ready */
          }}
        />
        <AdminButton
          icon={<LinkIcon />}
          label="Copy Invite Link"
          onClick={() => {
            /* TODO: copy invite link to clipboard when backend generates links */
          }}
        />

        {confirmingDelete ? (
          <div className="px-4 py-3">
            <p
              className="text-[13px] mb-2.5"
              style={{ color: "rgba(229,226,225,0.65)" }}
            >
              Are you sure? This can't be undone.
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => { onDelete?.(item); setConfirmingDelete(false); }}
                className="flex-1 py-2 rounded-xl text-[13px] font-medium transition-colors duration-150"
                style={{ background: "rgba(251,64,64,0.12)", color: "rgba(251,64,64,0.85)" }}
              >
                Yes, Cancel
              </button>
              <button
                onClick={() => setConfirmingDelete(false)}
                className="flex-1 py-2 rounded-xl text-[13px] font-medium transition-colors duration-150 hover:bg-white/[0.06]"
                style={{ color: "rgba(229,226,225,0.45)", border: "1px solid rgba(255,255,255,0.08)" }}
              >
                Nevermind
              </button>
            </div>
          </div>
        ) : (
          <AdminButton
            icon={<TrashIcon />}
            label="Cancel Event"
            danger
            onClick={() => setConfirmingDelete(true)}
          />
        )}
      </div>
    </div>
  );
};

export default EventAdminActions;
