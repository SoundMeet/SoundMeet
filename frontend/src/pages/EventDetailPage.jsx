import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";
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

  const isShow = item.type === 'promote_show';
  const metaTitle = item.title || (isShow ? 'Live Show' : 'Jam Session');
  const metaDesc = item.description || item.summary || `${isShow ? 'Live show' : 'Jam session'}${item.locationName ? ` at ${item.locationName}` : ''}${item.genres?.length ? ` — ${item.genres.join(', ')}` : ''}. Join on Soundmeet.`;
  const metaImage = item.coverImageUrl || 'https://www.soundmeet.app/og-banner.png';
  const metaUrl = `https://www.soundmeet.app/${isShow ? 'show' : 'jam'}/${id}`;

  return (
    <>
      <Helmet>
        <title>{metaTitle}</title>
        <meta name="description" content={metaDesc} />
        <link rel="canonical" href={metaUrl} />
        <meta property="og:title" content={metaTitle} />
        <meta property="og:description" content={metaDesc} />
        <meta property="og:image" content={metaImage} />
        <meta property="og:url" content={metaUrl} />
        <meta property="og:type" content="website" />
        <meta name="twitter:title" content={metaTitle} />
        <meta name="twitter:description" content={metaDesc} />
        <meta name="twitter:image" content={metaImage} />
      </Helmet>
      <EventDetailModal
        item={item}
        open={true}
        standalone
        viewerContext={viewerContext}
        onClose={handleClose}
        onJoin={handleJoin}
        onRsvp={handleRsvp}
      />
    </>
  );
};

export default EventDetailPage;
