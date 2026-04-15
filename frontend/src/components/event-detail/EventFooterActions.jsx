import { hexToRgba } from "../../utils/discovery";
import { getFooterActions } from "../../utils/eventComputed";

const CheckIcon = () => (
  <svg
    width="13"
    height="13"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.8"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

/**
 * EventFooterActions — sticky bottom CTA bar.
 * Reads computed actions from eventComputed.getFooterActions and dispatches
 * to the appropriate handler passed via props.
 *
 * Props:
 *   item          - discovery item
 *   lifecycle     - 'live'|'upcoming'|'ended'|'cancelled'
 *   relationship  - 'creator'|'admin'|'approved'|'pending'|'waitlisted'|'not_joined'
 *   accent        - hex colour string
 *   onJoin        - () => void  (opens JoinJamModal)
 *   onRsvp        - () => void  (opens RSVPShowModal)
 *   onEdit        - () => void  (opens edit modal)
 *   onLeave       - () => void  (opens leave confirm sheet)
 *   onDelete      - () => void  (opens delete confirm sheet)
 *   onClose       - () => void  (closes this modal)
 *   onRate        - () => void  (opens RateJamSheet)
 */
const EventFooterActions = ({
  item,
  lifecycle,
  relationship,
  accent,
  onJoin,
  onRsvp,
  onEdit,
  onEnterEdit,
  onLeave,
  onDelete,
  onClose,
  onRate,
}) => {
  const { primary, secondary } = getFooterActions(item, {
    isCreator: relationship === "creator",
    isAdmin: relationship === "admin",
    isAttendee: relationship === "approved",
    joinState:
      relationship === "pending"
        ? "pending"
        : relationship === "waitlisted"
        ? "waitlisted"
        : relationship === "approved"
        ? "approved"
        : null,
    isPastEvent: lifecycle === "ended",
  });

  const dispatchAction = (actionKey) => {
    switch (actionKey) {
      case "join":
      case "waitlist":
        onJoin?.();
        break;
      case "rsvp":
        onRsvp?.();
        break;
      case "edit":
        if (onEnterEdit) {
          onEnterEdit();
        } else {
          onEdit?.();
          onClose?.();
        }
        break;
      case "leave":
        onLeave?.();
        break;
      case "delete":
        onDelete?.();
        break;
      case "going":
        // Confirmation state — clicking closes the modal
        onClose?.();
        break;
      case "chat":
        /* TODO: open chat when chat integration is ready */
        break;
      case "calendar":
        /* TODO: download ICS when item has a proper date */
        break;
      case "share":
        /* TODO: copy share link */
        break;
      case "rate":
        onRate?.();
        break;
      default:
        break;
    }
  };

  if (!primary && secondary.length === 0) return null;

  return (
    <div
      className="px-7 py-3 shrink-0"
      style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}
    >
      <div className="flex items-center gap-3">
        {/* Secondary action (first one only) */}
        {secondary.slice(0, 1).map((action) => (
          <button
            key={action.actionKey}
            onClick={() => dispatchAction(action.actionKey)}
            className="shrink-0 h-11 md:h-9 px-4 rounded-full text-[13px] font-semibold transition-all duration-200"
            style={{
              background:
                action.variant === "danger"
                  ? "rgba(251,64,64,0.10)"
                  : "rgba(255,255,255,0.07)",
              color:
                action.variant === "danger"
                  ? "rgba(251,64,64,0.85)"
                  : "rgba(229,226,225,0.55)",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background =
                action.variant === "danger"
                  ? "rgba(251,64,64,0.16)"
                  : "rgba(255,255,255,0.11)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background =
                action.variant === "danger"
                  ? "rgba(251,64,64,0.10)"
                  : "rgba(255,255,255,0.07)";
            }}
          >
            {action.label}
          </button>
        ))}

        {/* Primary action — full-width when no secondary */}
        {primary && (() => {
          const isJoined = primary.actionKey === "going";
          const isDarkText = item?.type === "promote_show";
          return (
            <button
              onClick={() => !primary.disabled && dispatchAction(primary.actionKey)}
              disabled={primary.disabled}
              className="flex-1 h-10 rounded-full text-sm font-bold tracking-wide transition-all duration-300 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              style={
                primary.disabled
                  ? {
                      background: "rgba(255,255,255,0.07)",
                      color: "rgba(229,226,225,0.45)",
                    }
                  : {
                      background: accent,
                      color: isDarkText ? "#111111" : "#FFFFFF",
                      boxShadow: `0 0 16px ${hexToRgba(accent, isJoined ? 0.28 : 0.4)}, 0 0 32px ${hexToRgba(accent, isJoined ? 0.12 : 0.2)}`,
                    }
              }
            >
              {isJoined && <CheckIcon />}
              {primary.label}
            </button>
          );
        })()}
      </div>
    </div>
  );
};

export default EventFooterActions;
