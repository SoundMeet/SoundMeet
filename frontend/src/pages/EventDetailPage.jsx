import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { jamService } from "../injectables/jamService";
import { showService } from "../injectables/showService";
import EventDetailModal from "../components/event-detail/EventDetailModal";
import { useAuth } from "../injectables/Auth";
import { useAuthModal } from "../context/AuthModalContext";

/**
 * EventDetailPage — standalone shareable page for a single jam or show.
 * Mounted at /jam/:id and /show/:id.
 *
 * Unauthenticated visitors see the full event preview. Join/RSVP CTAs
 * trigger the auth modal if the viewer is not logged in.
 *
 * When the viewer is logged in, their attendee status is resolved in parallel
 * with the event fetch so the modal shows the correct "You're Going" state.
 */
const EventDetailPage = ({ type }) => {
  const { id }        = useParams();
  const navigate      = useNavigate();
  const { user }      = useAuth();
  const { openModal } = useAuthModal();

  const [item,          setItem]          = useState(null);
  const [viewerContext, setViewerContext] = useState({});
  const [loading,       setLoading]       = useState(true);
  const [error,         setError]         = useState(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    setItem(null);
    setViewerContext({});

    const fetchEvent = type === "show"
      ? showService.getShowById(id)
      : jamService.getJamById(id);

    // If logged in, check attendee status in parallel so the modal
    // shows "You're Going" / "Registered" immediately on load.
    const fetchAttendeeIds = user?.id
      ? (type === "show"
          ? showService.getMyRsvpdShowIds(user.id)
          : jamService.getMyAttendingJamIds(user.id))
      : Promise.resolve([]);

    Promise.all([fetchEvent, fetchAttendeeIds])
      .then(([eventItem, attendedIds]) => {
        setItem(eventItem);
        const isAttendee = attendedIds.includes(Number(id)) || attendedIds.includes(String(id));
        setViewerContext(isAttendee ? { isAttendee: true } : {});
      })
      .catch(() => setError("Event not found."))
      .finally(() => setLoading(false));
  }, [id, type, user?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleClose = () => {
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate("/");
    }
  };

  const handleJoin = () => {
    if (!user) { openModal("login"); return; }
    navigate("/");
  };

  const handleRsvp = () => {
    if (!user) { openModal("login"); return; }
    navigate("/");
  };

  if (loading) {
    return (
      <div className="min-h-[calc(100dvh-64px)] flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-[#DC2E73] border-t-transparent animate-spin" />
      </div>
    );
  }

  if (error || !item) {
    return (
      <div className="min-h-[calc(100dvh-64px)] flex flex-col items-center justify-center gap-3">
        <p className="text-neutral-400 text-sm">{error ?? "Event not found."}</p>
        <button
          onClick={() => navigate("/")}
          className="text-xs text-neutral-500 underline underline-offset-2"
        >
          Go to home
        </button>
      </div>
    );
  }

  return (
    <EventDetailModal
      item={item}
      open={true}
      standalone
      viewerContext={viewerContext}
      onClose={handleClose}
      onJoin={handleJoin}
      onRsvp={handleRsvp}
    />
  );
};

export default EventDetailPage;
