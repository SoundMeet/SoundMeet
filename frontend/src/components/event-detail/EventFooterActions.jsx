import { hexToRgba } from "../../utils/discovery";
import { getFooterActions } from "../../utils/eventComputed";

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
 *   onEdit        - () => void  (opens edit modal)
 *   onClose       - () => void  (closes this modal)
 */
const EventFooterActions = ({
  item,
  lifecycle,
  relationship,
  accent,
  onJoin,
  onEdit,
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
      case "edit":
      case "manage":
        onEdit?.();
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
      case "save":
        /* TODO: save to user's saved events */
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
      className="px-7 py-4 shrink-0"
      style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}
    >
      <div className="flex items-center gap-3">
        {/* Secondary actions */}
        {secondary.slice(0, 1).map((action) => (
          <button
            key={action.actionKey}
            onClick={() => dispatchAction(action.actionKey)}
            className="shrink-0 h-11 px-5 rounded-full text-sm font-semibold transition-all duration-200"
            style={{
              background:
                action.variant === "danger"
                  ? "rgba(251,64,64,0.1)"
                  : "rgba(255,255,255,0.07)",
              color:
                action.variant === "danger"
                  ? "rgba(251,64,64,0.85)"
                  : "rgba(229,226,225,0.55)",
            }}
          >
            {action.label}
          </button>
        ))}

        {/* Primary action */}
        {primary && (
          <button
            onClick={() => !primary.disabled && dispatchAction(primary.actionKey)}
            disabled={primary.disabled}
            className="flex-1 h-11 rounded-full text-sm font-bold tracking-wide transition-all duration-300 disabled:opacity-40 disabled:cursor-not-allowed"
            style={
              primary.disabled
                ? {
                    background: "rgba(255,255,255,0.07)",
                    color: "rgba(229,226,225,0.45)",
                  }
                : {
                    background: accent,
                    color: item?.type === "promote_show" ? "#111111" : "#FFFFFF",
                    boxShadow: `0 0 16px ${hexToRgba(accent, 0.4)}, 0 0 32px ${hexToRgba(accent, 0.2)}`,
                  }
            }
          >
            {primary.label}
          </button>
        )}
      </div>
    </div>
  );
};

export default EventFooterActions;
