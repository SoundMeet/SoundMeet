import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import MapComponent from "../components/MapComponent";
import GlowSwitch from "../components/GlowSwitch";
import { motion, AnimatePresence } from "framer-motion";
import CreateJamModal from "../components/create-jam/CreateJamModal";
import JoinJamModal from "../components/join-jam/JoinJamModal";
import RSVPShowModal from "../components/rsvp-show/RSVPShowModal";
import PromoteShowModal from "../components/promote-show/PromoteShowModal";
import JoinBandModal from "../components/join-band/JoinBandModal";
import FindBandmateModal from "../components/find-bandmate/FindBandmateModal";
import MobileCreateFAB from "../components/MobileCreateFAB";
import DiscoverPreview from "../components/DiscoverPreview";
import { useAuth } from "../injectables/Auth.jsx";
import { useAuthModal } from "../context/AuthModalContext.jsx";
import { useToast } from "../context/ToastContext.jsx";
import { useRequireAuth } from "../hooks/useRequireAuth.js";
import DiscoverControls from "../components/discover/DiscoverControls";
import MobileFiltersSheet from "../components/discover/MobileFiltersSheet";
import SortMenu from "../components/discover/SortMenu";
import MapFloatingControls from "../components/discover/MapControls";
import {
  applyFilters,
  applySort,
  getRadiusBounds,
  DEFAULT_RADIUS,
  DEFAULT_TIME,
  DEFAULT_SORT,
  DEFAULT_MORE_FILTERS,
} from "../utils/discoverFilters";
import { jamService, normalizeJamRow } from "../injectables/jamService";
import { showService, normalizeShowRow } from "../injectables/showService";
import { chatService } from "../injectables/chatService";
import DiscoveryCard from "../components/discover/DiscoveryCard";
import EventDetailModal from "../components/event-detail/EventDetailModal";
import {
  getDiscoveryCoordinates,
  matchesDiscoveryCategories,
  matchesDiscoverySearch,
} from "../utils/discovery";

const FALLBACK_VIEW = { latitude: 25.775, longitude: -80.200, zoom: 12 };
const CATEGORY_HEADINGS = {
  jams: "Jams Near You",
  musicians: "Musicians Nearby",
  bands: "Band Opportunities",
  shows: "Shows Nearby",
};

const Home = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { isLoggedIn, user } = useAuth();
  const { openModal } = useAuthModal();
  const { showToast } = useToast();
  const requireAuth = useRequireAuth();

  // ── Category filter ────────────────────────────────────────────────────────
  // Empty array = "All" (no restriction). Populated = specific categories selected.
  const [activeCategories, setActiveCategories] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");

  const handleCategoryToggle = (categoryId) => {
    if (categoryId === "all") {
      setActiveCategories([]);
      return;
    }
    setActiveCategories((prev) =>
      prev.includes(categoryId)
        ? prev.filter((c) => c !== categoryId)
        : [...prev, categoryId]
    );
  };

  // ── Discovery filter state ─────────────────────────────────────────────────
  const [radius, setRadius] = useState(DEFAULT_RADIUS);
  const [timeFilter, setTimeFilter] = useState(DEFAULT_TIME);
  const [moreFilters, setMoreFilters] = useState(DEFAULT_MORE_FILTERS);
  const [sort, setSort] = useState(DEFAULT_SORT);

  // ── Near You panel ─────────────────────────────────────────────────────────
  const [isOn, setIsOn] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [bandSubmenuOpen, setBandSubmenuOpen] = useState(false);
  const [createJamModalOpen, setCreateJamModalOpen] = useState(false);
  const [promoteShowModalOpen, setPromoteShowModalOpen] = useState(false);
  const [editingShow, setEditingShow] = useState(null);
  const [joinBandModalOpen, setJoinBandModalOpen] = useState(false);
  const [findBandmateModalOpen, setFindBandmateModalOpen] = useState(false);
  const [joinJamModal, setJoinJamModal] = useState({ open: false, jam: null });
  const [rsvpShowModal, setRsvpShowModal] = useState({ open: false, show: null });
  const [nearYouCollapsed, setNearYouCollapsed] = useState(
    () => typeof window !== "undefined" && window.innerWidth < 768
  );
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  // ── Discovery interaction state ────────────────────────────────────────────
  const [hoveredDiscoveryId, setHoveredDiscoveryId] = useState(null);
  const [selectedDiscoveryId, setSelectedDiscoveryId] = useState(null);
  const [modalItem, setModalItem] = useState(null);
  const [editingJam, setEditingJam] = useState(null);

  // ── Map control state ──────────────────────────────────────────────────────
  const [userLocation, setUserLocation] = useState(null);
  const [flyToTarget, setFlyToTarget] = useState(null);
  const [radiusOpen, setRadiusOpen] = useState(false);
  const [locationDenied, setLocationDenied] = useState(false);
  const [recenterKey, setRecenterKey] = useState(0);
  const [recentering, setRecentering] = useState(false);

  // ── Welcome preview state ──────────────────────────────────────────────────
  // Shown once per session for unauthenticated users before any jam interaction.
  // sessionStorage keeps it dismissed for the current tab visit only.
  const [welcomeDismissed, setWelcomeDismissed] = useState(
    () => !!sessionStorage.getItem("sm_welcome_dismissed")
  );
  const dismissWelcome = () => {
    sessionStorage.setItem("sm_welcome_dismissed", "1");
    setWelcomeDismissed(true);
  };

  // ── Refs ───────────────────────────────────────────────────────────────────
  const dropdownRef = useRef(null);
  const nearYouRef = useRef(null);
  const previewRef = useRef(null);
  const cardRefs = useRef({});
  const flyRequestRef = useRef(0);
  const nextFlyToken = () => {
    flyRequestRef.current += 1;
    return flyRequestRef.current;
  };

  // ── Participation: IDs the current user has joined/RSVPd to ──────────────
  // A lightweight Set of string IDs fetched once on login and refreshed after
  // join / leave / RSVP actions. Used to derive the card participation state
  // without touching the discover feed itself.
  const [myJoinedIds, setMyJoinedIds] = useState(new Set());

  const refreshMyJoinedIds = useCallback(async () => {
    if (!user?.id) return setMyJoinedIds(new Set());
    try {
      const [jamIds, showIds] = await Promise.all([
        jamService.getMyAttendingJamIds(user.id),
        showService.getMyRsvpdShowIds(user.id),
      ]);
      setMyJoinedIds(new Set([...jamIds, ...showIds]));
    } catch (err) {
      console.error("[Home] Failed to load joined IDs:", err);
    }
  }, [user?.id]);

  useEffect(() => { refreshMyJoinedIds(); }, [refreshMyJoinedIds]);
  useEffect(() => { if (!isLoggedIn) setIsOn(false); }, [isLoggedIn]);

  // ── Real feed from Supabase (jams + shows) ───────────────────────────────
  // Raw rows are stored separately; normalization (incl. distanceMiles) happens
  // in the memo below so it auto-updates when userLocation arrives.
  const [rawJamRows,  setRawJamRows]  = useState([]);
  const [rawShowRows, setRawShowRows] = useState([]);
  const [feedLoading, setFeedLoading] = useState(true);

  const refreshFeed = () => {
    jamService.fetchRawDiscoverFeed()
      .then(setRawJamRows)
      .catch((err) => console.error("[Home] Jam feed refresh failed:", err));
    showService.fetchRawShowFeed()
      .then(setRawShowRows)
      .catch((err) => console.error("[Home] Show feed refresh failed:", err));
  };

  useEffect(() => {
    let cancelled = false;
    setFeedLoading(true);
    Promise.all([
      jamService.fetchRawDiscoverFeed(),
      showService.fetchRawShowFeed(),
    ])
      .then(([jams, shows]) => {
        if (!cancelled) {
          setRawJamRows(jams);
          setRawShowRows(shows);
        }
      })
      .catch((err) => console.error("[Home] Failed to load feed:", err))
      .finally(() => { if (!cancelled) setFeedLoading(false); });
    return () => { cancelled = true; };
  }, []);

  // Normalize with live userLocation so distanceMiles updates when GPS arrives
  const discoveryFeed = useMemo(
    () => [
      ...rawJamRows.map((row) => normalizeJamRow(row, userLocation)),
      ...rawShowRows.map((row) => normalizeShowRow(row, userLocation)),
    ],
    [rawJamRows, rawShowRows, userLocation]
  );

  const discoveryById = useMemo(
    () => Object.fromEntries(discoveryFeed.map((item) => [item.id, item])),
    [discoveryFeed]
  );

  // ── Derived: filtered + sorted discovery feed ─────────────────────────────
  const filteredItems = useMemo(() => {
    const utilityFiltered = applyFilters(discoveryFeed, {
      radius,
      time: timeFilter,
      ...moreFilters,
    });
    const topBarFiltered = utilityFiltered.filter(
      (item) =>
        matchesDiscoveryCategories(item, activeCategories) &&
        matchesDiscoverySearch(item, searchQuery)
    );
    const activityFiltered = isOn
      ? topBarFiltered.filter((item) => {
          if (!user) return false;
          if (item.admin_id != null && String(item.admin_id) === String(user.id)) return true;
          return myJoinedIds.has(item.id);
        })
      : topBarFiltered;
    return applySort(activityFiltered, sort);
  }, [discoveryFeed, radius, timeFilter, moreFilters, sort, activeCategories, searchQuery, isOn, myJoinedIds, user]);

  // Clear selection when the selected item is filtered out
  useEffect(() => {
    if (selectedDiscoveryId && !filteredItems.find((item) => item.id === selectedDiscoveryId)) {
      setSelectedDiscoveryId(null);
    }
  }, [filteredItems, selectedDiscoveryId]);

  // ── Derived state ──────────────────────────────────────────────────────────
  // Priority: selected > hovered > nothing. Never falls back to a featuredItem
  // so the welcome card can appear for guests when nothing is active.
  const previewItemId = selectedDiscoveryId ?? hoveredDiscoveryId;
  const previewItem = previewItemId ? (discoveryById[previewItemId] ?? null) : null;
  const isDiscoveryModalOpen = modalItem !== null;

  // ── Helpers ────────────────────────────────────────────────────────────────
  const openDiscoveryModal = (itemId) => setModalItem(discoveryById[itemId] ?? null);
  const closeDiscoveryModal = () => setModalItem(null);

  /**
   * Derives the card participation state for a given discovery item.
   * 'creator'  — current user owns the event
   * 'joined'   — current user is an approved attendee / has RSVPd
   * 'default'  — no relationship (or not logged in)
   */
  const getParticipationState = (item) => {
    if (!user) return "default";
    if (item.admin_id != null && String(item.admin_id) === String(user.id)) return "creator";
    if (myJoinedIds.has(item.id)) return "joined";
    return "default";
  };

  // ── Deep-link: open EventDetailModal when navigated here from a notification ──
  // Triggered by navigate('/', { state: { openJamId: id } }) in NotificationItem.
  useEffect(() => {
    const jamId = location.state?.openJamId
    if (!jamId || feedLoading) return
    const item = discoveryById[String(jamId)] ?? discoveryById[jamId]
    if (item) {
      setModalItem(item)
      // Clear the state so back-navigation doesn't re-open the modal
      navigate(location.pathname, { replace: true, state: {} })
    }
  }, [feedLoading, location.state?.openJamId]); // eslint-disable-line react-hooks/exhaustive-deps

  const editInitialValues = (() => {
    if (!editingJam) return undefined;
    const dt  = editingJam.dateTimeRaw    ? new Date(editingJam.dateTimeRaw)    : null;
    const edt = editingJam.endDateTimeRaw ? new Date(editingJam.endDateTimeRaw) : null;
    const pad = (n) => String(n).padStart(2, '0');
    const toDate = (d) => d ? `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}` : '';
    const toTime = (d) => d ? `${pad(d.getHours())}:${pad(d.getMinutes())}` : '';
    return {
      jamId:           editingJam.id,
      title:           editingJam.title ?? '',
      description:     editingJam.description ?? '',
      isPrivate:       editingJam.isPrivate ?? false,
      maxParticipants: editingJam.capacity != null ? String(editingJam.capacity) : '',
      date:            toDate(dt),
      startTime:       toTime(dt),
      endTime:         toTime(edt),
      locationQuery:   editingJam.locationName ?? '',
      selectedPlace:   editingJam.coordinates
        ? {
            placeName: editingJam.locationName ?? '',
            address:   editingJam.locationAddress ?? '',
            latitude:  editingJam.coordinates.latitude,
            longitude: editingJam.coordinates.longitude,
          }
        : editingJam.locationName
          ? {
              id:           `custom-edit-${editingJam.id}`,
              placeName:    editingJam.locationName,
              address:      editingJam.locationAddress ?? null,
              latitude:     null,
              longitude:    null,
              featureType:  'custom',
              isCustom:     true,
              providerName: 'manual',
            }
          : null,
      locationGuide:          editingJam.locationGuide ?? '',
      genres:                 { presetIds: editingJam.genreIds ?? [],        customValues: [] },
      vibes:                  { presetIds: editingJam.vibeIds ?? [],         customValues: [] },
      instrumentsNeeded:      { presetIds: editingJam.instrumentIds ?? [],   customValues: [] },
      rolesNeeded:            { presetIds: editingJam.roleIds ?? [],         customValues: [] },
      equipmentAvailable:     { presetIds: editingJam.gearProvidedIds ?? [], customValues: [] },
      equipmentNeeded:        { presetIds: editingJam.gearNeededIds ?? [],   customValues: [] },
      jamTypes:               { presetIds: editingJam.jamType ? [editingJam.jamType] : [], customValues: [] },
      skillLevel:             editingJam.skillLevel ?? null,
      isOpenToAllGenres:      false,
      isOpenToAllVibes:       false,
      isOpenToAllInstruments: false,
      coverImage:             null,
    };
  })();

  const editShowInitialValues = (() => {
    if (!editingShow) return undefined;
    const dt  = editingShow.dateTimeRaw    ? new Date(editingShow.dateTimeRaw)    : null;
    const edt = editingShow.endDateTimeRaw ? new Date(editingShow.endDateTimeRaw) : null;
    const pad = (n) => String(n).padStart(2, '0');
    const toDate = (d) => d ? `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}` : '';
    const toTime = (d) => d ? `${pad(d.getHours())}:${pad(d.getMinutes())}` : '';
    return {
      showId:        editingShow.id,
      title:         editingShow.title ?? '',
      description:   editingShow.description ?? '',
      isPrivate:     editingShow.isPrivate ?? false,
      maxCapacity:   editingShow.capacity != null ? String(editingShow.capacity) : '',
      date:          toDate(dt),
      startTime:     toTime(dt),
      endTime:       toTime(edt),
      locationQuery: editingShow.locationName ?? '',
      selectedPlace: editingShow.coordinates ? {
        placeName: editingShow.locationName ?? '',
        address:   editingShow.locationAddress ?? '',
        latitude:  editingShow.coordinates.latitude,
        longitude: editingShow.coordinates.longitude,
      } : null,
      locationGuide: editingShow.locationGuide ?? '',
      genres:        { selectedIds: editingShow.genreIds ?? [], customValues: [] },
      ticketPrice:   editingShow.ticketPrice != null ? String(editingShow.ticketPrice) : '',
      ticketLink:    editingShow.ticketLink ?? '',
      lineup:        editingShow.lineup ?? [],
      coverImage:    editingShow.coverImageUrl ? { file: null, previewUrl: editingShow.coverImageUrl } : null,
    };
  })();

  // ── viewerContext for EventDetailModal ─────────────────────────────────────
  // Creator is derived from admin_id match. Attendee state is derived from
  // myJoinedIds, which is fetched and kept in sync with join/leave/rsvp actions.
  const modalViewerContext = useMemo(() => {
    if (!modalItem || !user) return {};
    const isCreator =
      modalItem.admin_id != null &&
      String(modalItem.admin_id) === String(user.id);
    if (isCreator) return { isCreator: true };
    return myJoinedIds.has(modalItem.id) ? { isAttendee: true } : {};
  }, [modalItem, user, myJoinedIds]);

  const handleDiscoveryEdit = (item) => {
    closeDiscoveryModal();
    if (item?.type === "promote_show") {
      setEditingShow(item);
      setPromoteShowModalOpen(true);
      return;
    }
    setEditingJam(item);
    setCreateJamModalOpen(true);
  };

  const handleDiscoveryDelete = async (item) => {
    try {
      if (item?.type === "jam") {
        await jamService.deleteJam(item.id);
        // Best-effort: delete the jam conversation (cascades in DB but frontend
        // chat list won't know until next navigation — this speeds it up).
        chatService.deleteJamConversation(item.id).catch(() => {});
        setRawJamRows((prev) => prev.filter((j) => String(j.id) !== String(item.id)));
        setSelectedDiscoveryId(null);
        showToast("Jam and chat deleted", "success");
      } else if (item?.type === "promote_show") {
        await showService.deleteShow(item.id);
        setRawShowRows((prev) => prev.filter((s) => String(s.id) !== String(item.id)));
        setSelectedDiscoveryId(null);
        showToast("Event deleted", "success");
      }
    } catch (err) {
      console.error("[Home] Delete failed:", err);
      showToast("Failed to delete event. Please try again.", "error");
      throw err; // let EventDetailModal reset loading state
    }
  };

  const handleDiscoveryLeave = async (item) => {
    if (!user?.id) return;
    try {
      if (item?.type === "jam") {
        await jamService.leaveJam(item.id, user.id);
        showToast("You left the jam", "success");
      } else if (item?.type === "promote_show") {
        await showService.cancelShowRsvp(item.id, user.id);
        showToast("You left the event", "success");
      }
      refreshMyJoinedIds();
    } catch (err) {
      console.error("[Home] Leave failed:", err);
      showToast("Failed to leave event. Please try again.", "error");
      throw err; // let EventDetailModal reset loading state
    }
  };

  // Opens JoinJamModal from EventDetailModal footer action
  const handleDiscoveryJoin = requireAuth(() => {
    if (modalItem?.type === "jam") {
      setJoinJamModal({
        open: true,
        jam: {
          id: modalItem.id,
          title: modalItem.title,
          isPrivate: !!modalItem.isPrivate,
          dateTime: modalItem.dateTime ?? modalItem.metaSecondary ?? null,
          locationLabel: modalItem.locationName ?? modalItem.subtitle ?? null,
        },
      });
    }
    closeDiscoveryModal();
  });

  // Opens RSVPShowModal from EventDetailModal footer action
  const handleDiscoveryRsvp = requireAuth(() => {
    if (modalItem?.type === "promote_show") {
      setRsvpShowModal({ open: true, show: modalItem });
    }
    closeDiscoveryModal();
  });

  // ── Search result select: fly map to entity or location ───────────────────
  const handleSearchResultSelect = (result) => {
    if (result.sourcePinId && discoveryById[result.sourcePinId]) {
      // Known entity on the map — select + fly to it
      handleItemClick(result.sourcePinId);
    } else if (result.coordinates) {
      // Location — fly to coordinates without selecting a pin
      setFlyToTarget({
        latitude: result.coordinates.latitude,
        longitude: result.coordinates.longitude,
        zoom: 14.5,
        _ts: nextFlyToken(),
      });
    }
  };

  const flyToItem = (itemId) => {
    const item = discoveryById[itemId];
    const coords = getDiscoveryCoordinates(item);
    if (coords) {
      const isMobile = typeof window !== "undefined" && window.innerWidth < 768;
      setFlyToTarget({
        latitude: coords.latitude,
        longitude: coords.longitude,
        zoom: item?.locationVisibility === "approximate" ? 13.2 : 14,
        // On mobile, offset the camera so the selected pin lands in the visible
        // zone above the expanded Near You sheet rather than hidden behind it.
        // Top: clears the search + chip controls (~96px).
        // Bottom: clears the expanded sheet (55dvh) + bottom nav (60px) + buffer.
        ...(isMobile && {
          padding: {
            top: 56,
            bottom: Math.round(window.innerHeight * 0.48) + 60,
            left: 20,
            right: 20,
          },
        }),
        _ts: nextFlyToken(),
      });
    }
  };

  // ── Radius → viewport: reframe around user when radius changes ────────────
  // Also fires once when GPS first resolves so the initial 25mi radius is framed.
  const isFirstRadiusRender = useRef(true);
  useEffect(() => {
    if (isFirstRadiusRender.current) { isFirstRadiusRender.current = false; return; }
    if (!userLocation) return;
    const bounds = getRadiusBounds(userLocation.latitude, userLocation.longitude, radius);
    setFlyToTarget({ bounds, padding: 60, _ts: nextFlyToken() });
  }, [radius]);

  // ── Map controls ───────────────────────────────────────────────────────────
  const handleRecenter = () => {
    const coords = userLocation ?? FALLBACK_VIEW;
    setFlyToTarget({ ...coords, zoom: 14, _ts: nextFlyToken() });
    setRecenterKey((k) => k + 1);
    setRecentering(true);
    setTimeout(() => setRecentering(false), 700);
  };

  const handleReset = () => {
    setFlyToTarget({ ...FALLBACK_VIEW, _ts: nextFlyToken() });
  };

  const handleZoomIn = () => setFlyToTarget({ zoomDelta: 1, _ts: nextFlyToken() });
  const handleZoomOut = () => setFlyToTarget({ zoomDelta: -1, _ts: nextFlyToken() });

  // ── Unified discovery interaction handlers ─────────────────────────────────
  // Single source of truth for all card, pin, and preview interactions.

  // Hover only updates when nothing is locked — selected always wins.
  const handleItemHover = (itemId) => {
    if (!selectedDiscoveryId) setHoveredDiscoveryId(itemId);
  };
  const handleItemLeave = () => {
    if (!selectedDiscoveryId) setHoveredDiscoveryId(null);
  };

  // Single click: lock selection, clear any stale hover, fly map to item.
  // On mobile: also expand Near You so the selected card is immediately visible.
  const handleItemClick = (itemId) => {
    // Tapping the already-selected pin/card opens the modal (two-tap-to-open pattern).
    // First tap selects; second tap on the same item commits and opens detail.
    if (itemId === selectedDiscoveryId) {
      openDiscoveryModal(itemId);
      return;
    }
    dismissWelcome();
    setHoveredDiscoveryId(null);
    setSelectedDiscoveryId(itemId);
    flyToItem(itemId);
    if (typeof window !== "undefined" && window.innerWidth < 768) {
      setNearYouCollapsed(false);
    }
  };

  // Double click: select + open detail modal — desktop only.
  // On mobile the two-tap pattern in handleItemClick handles this;
  // dblclick is unreliable on touch and conflicts with iOS zoom gestures.
  const handleItemDoubleClick = (itemId) => {
    if (typeof window !== "undefined" && window.innerWidth < 768) return;
    setSelectedDiscoveryId(itemId);
    openDiscoveryModal(itemId);
  };

  // CTA button inside preview card or action button inside Near You card.
  const handleItemAction = (itemId) => openDiscoveryModal(itemId);

  // ── Scroll selected card into view ─────────────────────────────────────────
  // requestAnimationFrame ensures the card list is visible (sheet just expanded)
  // before scrollIntoView fires — avoids scrolling into a hidden element.
  useEffect(() => {
    if (selectedDiscoveryId) {
      requestAnimationFrame(() => {
        cardRefs.current[selectedDiscoveryId]?.scrollIntoView({
          behavior: "smooth",
          block: "nearest",
        });
      });
    }
  }, [selectedDiscoveryId]);

  // ── Click-outside: close dropdown ─────────────────────────────────────────
  useEffect(() => {
    const handler = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // ── Click-outside: deselect jam + collapse sheet on mobile ────────────────
  useEffect(() => {
    const handler = (e) => {
      if (isDiscoveryModalOpen) return;
      const inNearYou = nearYouRef.current?.contains(e.target);
      const inPreview = previewRef.current?.contains(e.target);
      if (!inNearYou && !inPreview) {
        setSelectedDiscoveryId(null);
        // On mobile: tapping the map collapses the Near You sheet
        if (typeof window !== "undefined" && window.innerWidth < 768) {
          setNearYouCollapsed(true);
        }
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [isDiscoveryModalOpen]);

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="fixed inset-0 text-white">
      {/* Full-screen map background */}
      <div className="fixed inset-x-0 bottom-0 top-16 z-0">
        <MapComponent
          items={filteredItems}
          selectedItemId={selectedDiscoveryId}
          hoveredItemId={hoveredDiscoveryId}
          onItemSelect={handleItemClick}
          onItemDoubleClick={handleItemDoubleClick}
          onItemHover={handleItemHover}
          onItemLeave={handleItemLeave}
          flyToTarget={flyToTarget}
          userLocation={userLocation}
          onUserLocation={setUserLocation}
          onLocationDenied={() => setLocationDenied(true)}
          radius={radius}
          recenterKey={recenterKey}
        />

        {/* Top navbar-to-map gradient */}
        <div
          className="absolute top-0 left-0 w-full h-40 pointer-events-none z-[2]"
          style={{
            background: `linear-gradient(to bottom,
              rgba(0,0,0,0.68)  0%,
              rgba(0,0,0,0.48) 22%,
              rgba(0,0,0,0.28) 45%,
              rgba(0,0,0,0.12) 70%,
              rgba(0,0,0,0.00) 100%
            )`,
          }}
        />

        {/* Vignette overlay */}
        <div
          className="absolute inset-0 pointer-events-none z-[1]"
          style={{
            background: `
              radial-gradient(circle at center,
                rgba(0,0,0,0)    30%,
                rgba(0,0,0,0.18) 55%,
                rgba(0,0,0,0.38) 80%,
                rgba(0,0,0,0.55) 100%
              ),
              linear-gradient(to bottom,
                rgba(0,0,0,0.42)  0%,
                rgba(0,0,0,0.20) 15%,
                rgba(0,0,0,0.08) 30%,
                rgba(0,0,0,0.14) 70%,
                rgba(0,0,0,0.18) 100%
              )
            `,
          }}
        />
      </div>

      {/* Top blur — covers navbar, fades below it */}
      <div
        className="fixed inset-x-0 top-0 z-10 pointer-events-none"
        style={{
          height: "calc(4rem + 72px)",
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
          maskImage:
            "linear-gradient(to bottom, black 0px, black 74px, transparent calc(4rem + 72px))",
          WebkitMaskImage:
            "linear-gradient(to bottom, black 0px, black 74px, transparent calc(4rem + 72px))",
        }}
      />

      {/* Location denied banner */}
      <AnimatePresence>
        {locationDenied && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="fixed top-[4.5rem] left-1/2 -translate-x-1/2 z-30 pointer-events-auto"
          >
            <div
              className="flex items-center gap-3 px-4 py-2.5 rounded-2xl text-[13px] font-medium text-white/80"
              style={{
                background: "rgba(18,18,18,0.88)",
                backdropFilter: "blur(16px)",
                WebkitBackdropFilter: "blur(16px)",
                border: "1px solid rgba(220,46,115,0.25)",
                boxShadow: "0 4px 20px rgba(0,0,0,0.5), 0 0 12px rgba(220,46,115,0.1)",
              }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="rgba(220,46,115,0.8)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
                <circle cx="12" cy="12" r="3" fill="rgba(220,46,115,0.8)" strokeWidth="0" />
                <path d="M12 2v3M12 19v3M2 12h3M19 12h3" />
              </svg>
              <span>Enable location to see jams near you</span>
              <button
                onClick={() => setLocationDenied(false)}
                aria-label="Dismiss"
                className="ml-1 opacity-40 hover:opacity-80 transition-opacity"
              >
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <path d="M1 1l10 10M11 1L1 11" />
                </svg>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* UI layer */}
      <div className="fixed inset-x-0 bottom-0 top-16 z-20 flex flex-col pointer-events-none">

        <DiscoverControls
          activeCategories={activeCategories}
          onCategoryToggle={handleCategoryToggle}
          searchQuery={searchQuery}
          onSearchQueryChange={setSearchQuery}
          onSearchResultSelect={handleSearchResultSelect}
          allItems={discoveryFeed}
          radius={radius}
          onRadiusChange={setRadius}
          onRadiusOpenChange={setRadiusOpen}
          time={timeFilter}
          onTimeChange={setTimeFilter}
          moreFilters={moreFilters}
          onMoreFiltersChange={setMoreFilters}
          onMobileFiltersOpen={() => setMobileFiltersOpen(true)}
        />

        {/* Main content */}
        <div className="flex w-full flex-1 min-h-0">
          {/* Left: transparent — map shows through */}
          <div className="flex-1 pointer-events-none" />

          {/* Near You panel */}
          <div
            ref={nearYouRef}
            className="w-full md:w-[380px] md:max-w-[calc(100vw-2rem)] shrink-0 md:pt-2 md:pr-6 pointer-events-auto fixed md:relative bottom-[calc(60px+env(safe-area-inset-bottom))] md:bottom-auto left-0 right-0 md:left-auto md:right-auto z-30 md:z-auto px-4 md:px-0 pb-1 md:pb-0"
          >
            <div className="rounded-tl-[20px] rounded-tr-[20px] rounded-bl-[10px] rounded-br-[10px] md:rounded-[28px] bg-[#1c1c1e]/70 md:bg-neutral-900/50 backdrop-blur-2xl border border-white/[0.08] md:border md:border-white/10 shadow-[0_-6px_24px_rgba(220,46,115,0.10),0_-2px_12px_rgba(0,0,0,0.35),inset_0_1px_0_rgba(255,255,255,0.05)] md:shadow-[0_0_20px_rgba(220,46,115,0.55)] px-4 pt-2.5 pb-2.5 md:p-5">

              {/* Mobile drag handle — tappable to expand/collapse (mirrors header click) */}
              <div
                className="md:hidden w-8 h-[3px] rounded-full bg-white/[0.22] mx-auto mb-1.5 shrink-0 cursor-pointer"
                onClick={() => {
                  setNearYouCollapsed(prev => {
                    const nextCollapsed = !prev;
                    if (nextCollapsed && typeof window !== "undefined" && window.innerWidth < 768) {
                      setSelectedDiscoveryId(null);
                    }
                    return nextCollapsed;
                  });
                }}
              ></div>

              {/* Header — tappable on mobile to collapse/expand */}
              <div
                className="flex items-center justify-between mb-0 md:mb-4 cursor-pointer md:cursor-default"
                onClick={() => {
                  setNearYouCollapsed(prev => {
                    const nextCollapsed = !prev;
                    // Collapsing the sheet on mobile: clear selection so the
                    // highlighted pin and open sheet always reflect the same state
                    if (nextCollapsed && typeof window !== "undefined" && window.innerWidth < 768) {
                      setSelectedDiscoveryId(null);
                    }
                    return nextCollapsed;
                  });
                }}
              >
                <div className="flex items-center gap-2">
                  <h2 className="text-[13px] tracking-[0.06em] md:text-xl font-semibold md:font-medium text-white">
                    {activeCategories.length === 1
                      ? (CATEGORY_HEADINGS[activeCategories[0]] ?? "Near You")
                      : "Near You"}
                  </h2>
                  {filteredItems.length > 0 && (
                    <span className="md:hidden inline-flex items-center px-2 py-0.5 rounded-full bg-white/[0.06] border border-white/[0.08] text-[11px] font-medium text-neutral-400">{filteredItems.length}</span>
                  )}
                  {filteredItems.length > 0 && (
                    <span className="hidden md:inline text-xs text-neutral-500">{filteredItems.length}</span>
                  )}
                </div>
                <div className="flex gap-2.5 items-center">
                  {/* Mobile chevron */}
                  <svg
                    className="md:hidden"
                    width="14" height="14" viewBox="0 0 24 24" fill="none"
                    stroke="currentColor" strokeWidth="2" strokeLinecap="round"
                    style={{
                      color: 'rgba(255,255,255,0.5)',
                      transform: nearYouCollapsed ? 'rotate(180deg)' : 'rotate(0deg)',
                      transition: 'transform 0.2s ease',
                    }}
                  >
                    <path d="M19 9l-7 7-7-7" />
                  </svg>
                  {/* Desktop controls — always visible, click won't trigger collapse */}
                  <div
                    className="hidden md:flex gap-2.5 items-center"
                    onClick={e => e.stopPropagation()}
                  >
                    <SortMenu value={sort} onChange={setSort} />
                    <div className="relative group">
                      <GlowSwitch value={isOn} size="sm" onChange={setIsOn} />
                      <div className="pointer-events-none absolute bottom-full right-0 mb-2 px-2.5 py-1.5 rounded-lg bg-neutral-900/95 border border-white/10 text-[11px] text-neutral-300 whitespace-nowrap shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-150">
                        Show only events you've joined or created
                      </div>
                    </div>
                    <div className="relative" ref={dropdownRef}>
                      <div
                        onClick={() => setDropdownOpen((v) => !v)}
                        className="w-8 h-8 cursor-pointer bg-neutral-800 hover:bg-neutral-700 active:scale-95 flex items-center justify-center rounded-xl select-none transition-all duration-150"
                      >
                        <span className="text-white text-lg leading-none">+</span>
                      </div>
                      <AnimatePresence>
                        {dropdownOpen && (
                          <motion.div
                            initial={{ opacity: 0, scale: 0.9, y: -6 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: -6 }}
                            transition={{ duration: 0.15, ease: "easeOut" }}
                            className="absolute right-0 top-9 z-50 w-52 rounded-2xl bg-neutral-900/95 backdrop-blur-xl border border-white/10 shadow-[0_0_20px_rgba(220,46,115,0.25),0_8px_40px_rgba(0,0,0,0.6)] overflow-hidden"
                          >
                            {[
                              {
                                label: "Create Jam",
                                icon: (
                                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <circle cx="12" cy="12" r="2" /><path d="M12 1v4M12 19v4M4.22 4.22l2.83 2.83M16.95 16.95l2.83 2.83M1 12h4M19 12h4M4.22 19.78l2.83-2.83M16.95 7.05l2.83-2.83" />
                                  </svg>
                                ),
                                onClick: requireAuth(() => { setCreateJamModalOpen(true); setDropdownOpen(false); }),
                                accent: true,
                              },
                              {
                                label: "Post Update",
                                icon: (
                                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                                  </svg>
                                ),
                                onClick: () => setDropdownOpen(false),
                              },
                            ].map(({ label, icon, onClick, accent }) => (
                              <button
                                key={label}
                                onClick={onClick}
                                className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-medium transition-colors duration-150 hover:bg-white/[0.07] hover:text-white ${accent ? "text-[#f07aaa]" : "text-gray-300"}`}
                              >
                                <span className="shrink-0 opacity-70">{icon}</span>
                                {label}
                              </button>
                            ))}
                            <div className="mx-4 h-px bg-white/[0.07]" />
                            <button
                              onClick={requireAuth(() => { setPromoteShowModalOpen(true); setDropdownOpen(false); })}
                              className="w-full flex items-center gap-3 px-4 py-3 text-sm font-medium text-gray-300 transition-colors duration-150 hover:bg-white/[0.07] hover:text-white"
                            >
                              <span className="shrink-0 opacity-70">
                                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                  <path d="M2 12C2 6.48 6.48 2 12 2s10 4.48 10 10-4.48 10-10 10S2 17.52 2 12z" /><path d="M8 12l2 2 4-4" />
                                </svg>
                              </span>
                              Promote Show
                            </button>
                            <div className="mx-4 h-px bg-white/[0.07]" />
                            <button
                              onClick={() => setBandSubmenuOpen((v) => !v)}
                              className="w-full flex items-center gap-3 px-4 py-3 text-sm font-medium text-gray-300 transition-colors duration-150 hover:bg-white/[0.07] hover:text-white"
                            >
                              <span className="shrink-0 opacity-70">
                                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
                                </svg>
                              </span>
                              <span className="flex-1 text-left">Band</span>
                              <svg
                                className={`w-3 h-3 opacity-50 transition-transform duration-200 ${bandSubmenuOpen ? "rotate-180" : ""}`}
                                fill="none" viewBox="0 0 24 24" stroke="currentColor"
                              >
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M19 9l-7 7-7-7" />
                              </svg>
                            </button>
                            <AnimatePresence>
                              {bandSubmenuOpen && (
                                <motion.div
                                  initial={{ height: 0, opacity: 0 }}
                                  animate={{ height: "auto", opacity: 1 }}
                                  exit={{ height: 0, opacity: 0 }}
                                  transition={{ duration: 0.18, ease: "easeOut" }}
                                  className="overflow-hidden"
                                >
                                  <div className="bg-white/[0.03] border-t border-white/[0.06]">
                                    {[
                                      {
                                        label: "Join a Band",
                                        icon: (
                                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" /><polyline points="10 17 15 12 10 7" /><line x1="15" y1="12" x2="3" y2="12" />
                                          </svg>
                                        ),
                                        onClick: () => { setDropdownOpen(false); showToast("Coming soon!", "info"); },
                                      },
                                      {
                                        label: "Find a Bandmate",
                                        icon: (
                                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" /><line x1="11" y1="8" x2="11" y2="14" /><line x1="8" y1="11" x2="14" y2="11" />
                                          </svg>
                                        ),
                                        onClick: () => { setDropdownOpen(false); showToast("Coming soon!", "info"); },
                                      },
                                    ].map(({ label, icon, onClick }) => (
                                      <button
                                        key={label}
                                        onClick={onClick}
                                        className="w-full flex items-center gap-3 pl-9 pr-4 py-2.5 text-[13px] font-medium text-gray-400 transition-colors duration-150 hover:bg-white/[0.07] hover:text-white"
                                      >
                                        <span className="shrink-0 opacity-60">{icon}</span>
                                        {label}
                                      </button>
                                    ))}
                                  </div>
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </div>
                </div>
              </div>

              {/* Cards — always visible on desktop, hidden on mobile when collapsed */}
              <div className={`${nearYouCollapsed ? 'hidden md:block' : 'block'}`}>
                <div className="h-px bg-white/[0.07] rounded-full mt-3 mb-3 md:mt-4 md:mb-4" />
                {feedLoading ? (
                  <div className="flex items-center justify-center py-10">
                    <div className="w-6 h-6 rounded-full border-2 border-[#DC2E73] border-t-transparent animate-spin" />
                  </div>
                ) : filteredItems.length > 0 ? (
                  <div className="flex flex-col gap-2.5 md:gap-3 overflow-y-auto overscroll-contain max-h-[calc(55dvh-90px)] md:max-h-[480px] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                    {filteredItems.map((item) => (
                      <div key={item.id} ref={(el) => { cardRefs.current[item.id] = el; }}>
                        <DiscoveryCard
                          item={item}
                          participationState={getParticipationState(item)}
                          isActive={!selectedDiscoveryId && hoveredDiscoveryId === item.id}
                          isSelected={selectedDiscoveryId === item.id}
                          onClick={() => handleItemClick(item.id)}
                          onDoubleClick={() => handleItemDoubleClick(item.id)}
                          onAction={() => handleItemAction(item.id)}
                          onMouseEnter={() => handleItemHover(item.id)}
                          onMouseLeave={handleItemLeave}
                        />
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-10 gap-2">
                    <span className="text-2xl">🎵</span>
                    {isOn ? (
                      <>
                        <p className="text-sm text-neutral-400 text-center">
                          No events yet.
                        </p>
                        <p className="text-xs text-neutral-600 text-center">
                          Create a jam or join one to see it here.
                        </p>
                      </>
                    ) : (
                      <>
                        <p className="text-sm text-neutral-400 text-center">
                          No jams found near you yet.
                        </p>
                        <p className="text-xs text-neutral-600 text-center">
                          Create one or try expanding your radius.
                        </p>
                      </>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Bottom-left: Jam hover/selected preview — desktop only */}
        {/* On mobile: tapping a pin expands Near You and scrolls to the card instead */}
        <div
          ref={previewRef}
          className="hidden md:block fixed md:left-8 md:right-auto z-30 pointer-events-auto md:bottom-8"
        >
          <AnimatePresence mode="wait">
            {previewItem ? (
              <DiscoverPreview
                key={previewItem.id}
                variant="discovery"
                item={previewItem}
                onViewItem={() => openDiscoveryModal(previewItem.id)}
                onDismiss={() => setSelectedDiscoveryId(null)}
              />
            ) : !isLoggedIn && !welcomeDismissed ? (
              <DiscoverPreview
                key="welcome"
                variant="welcome"
                onSignUp={() => openModal("signup")}
                onLogIn={() => openModal("login")}
              />
            ) : null}
          </AnimatePresence>
        </div>


        <CreateJamModal
          open={createJamModalOpen}
          onOpenChange={(open) => { setCreateJamModalOpen(open); if (!open) { setEditingJam(null); refreshFeed(); } }}
          initialValues={editInitialValues}
        />
        <PromoteShowModal
          open={promoteShowModalOpen}
          onOpenChange={(open) => { setPromoteShowModalOpen(open); if (!open) { setEditingShow(null); refreshFeed(); } }}
          initialValues={editShowInitialValues}
        />
        <JoinBandModal
          open={joinBandModalOpen}
          onOpenChange={setJoinBandModalOpen}
          profile={user ? { name: user.display_name, city: user.city, photoUrl: user.pfp } : {}}
        />
        <FindBandmateModal open={findBandmateModalOpen} onOpenChange={setFindBandmateModalOpen} />
      </div>

      {/* Mobile-only filters bottom sheet — rendered outside z-20 UI layer so it
          sits in the root stacking context and is above the bottom nav (z-50) */}
      <MobileFiltersSheet
        open={mobileFiltersOpen}
        onClose={() => setMobileFiltersOpen(false)}
        radius={radius}
        onRadiusChange={setRadius}
        onRadiusOpenChange={setRadiusOpen}
        time={timeFilter}
        onTimeChange={setTimeFilter}
        moreFilters={moreFilters}
        onMoreFiltersChange={setMoreFilters}
      />

      {/* Map controls — desktop only, touch devices use pinch-to-zoom */}
      <div className="hidden md:block fixed top-[220px] left-8 z-10 pointer-events-auto">
        <MapFloatingControls
          onRecenter={handleRecenter}
          onReset={handleReset}
          onZoomIn={handleZoomIn}
          onZoomOut={handleZoomOut}
          radiusOpen={radiusOpen}
          recentering={recentering}
        />
      </div>

      {/* Mobile map controls — recenter only (pinch-to-zoom handles zoom natively) */}
      {/* Hidden when Near You is expanded — the user is in browse mode, not map-navigation mode */}
      {nearYouCollapsed && (
        <button
          onClick={handleRecenter}
          aria-label="Recenter map"
          className="md:hidden fixed left-4 z-30 w-11 h-11 flex items-center justify-center rounded-full bg-neutral-900/80 backdrop-blur-xl border border-white/10 shadow-[0_4px_16px_rgba(0,0,0,0.5),0_0_10px_rgba(220,46,115,0.18)] active:scale-95 transition-all duration-150 bottom-[calc(60px+env(safe-area-inset-bottom)+80px)]"
          style={{
            color: recentering ? "#f07aaa" : "rgba(255,255,255,0.75)",
            filter: recentering ? "drop-shadow(0 0 6px rgba(220,46,115,0.5))" : "none",
          }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="3" fill="currentColor" strokeWidth="0" opacity="0.7" />
            <circle cx="12" cy="12" r="3" />
            <path d="M12 2v3M12 19v3M2 12h3M19 12h3" />
          </svg>
        </button>
      )}

      <EventDetailModal
        item={modalItem}
        open={isDiscoveryModalOpen}
        onClose={closeDiscoveryModal}
        viewerContext={modalViewerContext}
        onJoin={handleDiscoveryJoin}
        onRsvp={handleDiscoveryRsvp}
        onEdit={handleDiscoveryEdit}
        onDelete={handleDiscoveryDelete}
        onLeave={handleDiscoveryLeave}
        openedFrom="discover"
      />

      <JoinJamModal
        isOpen={joinJamModal.open}
        onClose={() => { setJoinJamModal({ open: false, jam: null }); refreshMyJoinedIds(); }}
        jam={joinJamModal.jam}
        onSubmit={async (payload) => {
          console.log('[Home] joinJam start — jamId:', joinJamModal.jam.id, 'userId:', user?.id);
          const conversationId = await jamService.joinJam(
            joinJamModal.jam.id,
            user?.id,
            {
              instrumentIds:        payload?.instrumentIds ?? [],
              customInstruments:    payload?.customInstruments ?? [],
              roleIds:              payload?.roleIds ?? [],
              customRoles:          payload?.customRoles ?? [],
              gearIds:              payload?.equipmentOfferingIds ?? [],
              customGear:           payload?.customEquipmentOfferings ?? [],
            }
          );
          console.log('[Home] joinJam success — conversationId:', conversationId);
          // Refresh immediately so EventDetailModal reflects joined state
          // without waiting for the JoinJamModal close animation.
          refreshMyJoinedIds();
          return conversationId;
        }}
        onSuccessNavigateToMyJams={() => navigate("/jams")}
        onSuccessNavigateToGroupChat={() => navigate("/chat", { state: { openJamId: joinJamModal.jam?.id } })}
      />

      <RSVPShowModal
        isOpen={rsvpShowModal.open}
        onClose={() => { setRsvpShowModal({ open: false, show: null }); refreshMyJoinedIds(); }}
        show={rsvpShowModal.show}
        accentColor={rsvpShowModal.show?.accentColor}
        onSubmit={() => showService.rsvpShow(rsvpShowModal.show?.id, user?.id)}
        onSuccessNavigateToMyJams={() => navigate("/jams")}
      />

      {/* Mobile-only create FAB — desktop is untouched (+ dropdown in Near You panel) */}
      <MobileCreateFAB
        onCreateJam={requireAuth(() => setCreateJamModalOpen(true))}
        onPromoteShow={requireAuth(() => setPromoteShowModalOpen(true))}
        suppress={mobileFiltersOpen || isDiscoveryModalOpen}
      />
    </div>
  );
};

export default Home;