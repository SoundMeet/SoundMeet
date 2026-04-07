import { useState, useEffect, useMemo, useRef } from "react";
import { useNavigate } from "react-router-dom";
import MapComponent from "../components/MapComponent";
import GlowSwitch from "../components/GlowSwitch";
import { motion, AnimatePresence } from "framer-motion";
import CreateJamModal from "../components/create-jam/CreateJamModal";
import JoinJamModal from "../components/join-jam/JoinJamModal";
import PromoteShowModal from "../components/promote-show/PromoteShowModal";
import JoinBandModal from "../components/join-band/JoinBandModal";
import FindBandmateModal from "../components/find-bandmate/FindBandmateModal";
import DiscoverPreview from "../components/DiscoverPreview";
import { useAuth } from "../injectables/Auth.jsx";
import { useAuthModal } from "../context/AuthModalContext.jsx";
import DiscoverControls from "../components/discover/DiscoverControls";
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
  const { isLoggedIn, user } = useAuth();
  const { openModal } = useAuthModal();
  const navigate = useNavigate();

  // Redirect to onboarding if not yet completed
  useEffect(() => {
    if (isLoggedIn && user && !user.onboarding_complete) {
      navigate("/onboarding", { replace: true });
    }
  }, [isLoggedIn, user]);

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
  const [joinBandModalOpen, setJoinBandModalOpen] = useState(false);
  const [findBandmateModalOpen, setFindBandmateModalOpen] = useState(false);
  const [joinJamModal, setJoinJamModal] = useState({ open: false, jam: null });

  // ── Discovery interaction state ────────────────────────────────────────────
  const [hoveredDiscoveryId, setHoveredDiscoveryId] = useState(null);
  const [selectedDiscoveryId, setSelectedDiscoveryId] = useState(null);
  const [modalItem, setModalItem] = useState(null);
  const [editingJam, setEditingJam] = useState(null);

  // ── Map control state ──────────────────────────────────────────────────────
  const [userLocation, setUserLocation] = useState(null);
  const [flyToTarget, setFlyToTarget] = useState(null);

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

  // ── Real jam feed from Supabase ────────────────────────────────────────────
  // rawJamRows holds the raw DB rows; normalization (incl. distanceMiles) happens
  // in the memo below so it auto-updates when userLocation arrives.
  const [rawJamRows, setRawJamRows] = useState([]);
  const [feedLoading, setFeedLoading] = useState(true);

  const refreshFeed = () => {
    jamService.fetchRawDiscoverFeed()
      .then(setRawJamRows)
      .catch((err) => console.error("[Home] Feed refresh failed:", err));
  };

  useEffect(() => {
    let cancelled = false;
    setFeedLoading(true);
    jamService.fetchRawDiscoverFeed()
      .then((rows) => { if (!cancelled) setRawJamRows(rows); })
      .catch((err) => console.error("[Home] Failed to load jam feed:", err))
      .finally(() => { if (!cancelled) setFeedLoading(false); });
    return () => { cancelled = true; };
  }, []);

  // Normalize with live userLocation so distanceMiles updates when GPS arrives
  const discoveryFeed = useMemo(
    () => rawJamRows.map((row) => normalizeJamRow(row, userLocation)),
    [rawJamRows, userLocation]
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
    return applySort(topBarFiltered, sort);
  }, [discoveryFeed, radius, timeFilter, moreFilters, sort, activeCategories, searchQuery]);

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

  const editInitialValues = editingJam ? {
    title: editingJam.title ?? "",
    description: editingJam.description ?? "",
    isPrivate: editingJam.isPrivate ?? false,
    maxParticipants: editingJam.maxParticipants != null ? String(editingJam.maxParticipants) : "",
    locationQuery: editingJam.locationName ?? editingJam.subtitle ?? "",
  } : undefined;

  const handleDiscoveryEdit = (item) => {
    closeDiscoveryModal();
    setEditingJam(item);
    setCreateJamModalOpen(true);
  };

  const handleDiscoveryDelete = async (item) => {
    closeDiscoveryModal();
    try {
      await jamService.deleteJam(item.id);
      setRawJamRows((prev) => prev.filter((j) => String(j.id) !== String(item.id)));
    } catch (err) {
      console.error('Delete jam failed:', err);
    }
  };

  // Opens JoinJamModal from EventDetailModal footer action
  const handleDiscoveryJoin = () => {
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
  };

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
      setFlyToTarget({
        latitude: coords.latitude,
        longitude: coords.longitude,
        zoom: item?.locationVisibility === "approximate" ? 13.2 : 14,
        _ts: nextFlyToken(),
      });
    }
  };

  // ── Radius → viewport: reframe around user when radius changes ────────────
  // Skips on initial mount (no user location yet); fires on every subsequent change.
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
  const handleItemClick = (itemId) => {
    dismissWelcome();
    setHoveredDiscoveryId(null);
    setSelectedDiscoveryId(itemId);
    flyToItem(itemId);
  };

  // Double click: select + open detail modal immediately.
  const handleItemDoubleClick = (itemId) => {
    setSelectedDiscoveryId(itemId);
    openDiscoveryModal(itemId);
  };

  // CTA button inside preview card or action button inside Near You card.
  const handleItemAction = (itemId) => openDiscoveryModal(itemId);

  // ── Scroll selected card into view ─────────────────────────────────────────
  useEffect(() => {
    if (selectedDiscoveryId) {
      cardRefs.current[selectedDiscoveryId]?.scrollIntoView({
        behavior: "smooth",
        block: "nearest",
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

  // ── Click-outside: deselect jam ────────────────────────────────────────────
  useEffect(() => {
    const handler = (e) => {
      if (isDiscoveryModalOpen) return;
      const inNearYou = nearYouRef.current?.contains(e.target);
      const inPreview = previewRef.current?.contains(e.target);
      if (!inNearYou && !inPreview) setSelectedDiscoveryId(null);
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
          time={timeFilter}
          onTimeChange={setTimeFilter}
          moreFilters={moreFilters}
          onMoreFiltersChange={setMoreFilters}
        />

        {/* Main content */}
        <div className="flex w-full flex-1 min-h-0">
          {/* Left: transparent — map shows through */}
          <div className="flex-1 pointer-events-none" />

          {/* Near You panel */}
          <div
            ref={nearYouRef}
            className="w-[380px] max-w-[calc(100vw-2rem)] shrink-0 pt-2 pr-6 pointer-events-auto"
          >
            <div className="rounded-[28px] bg-neutral-900/50 backdrop-blur-2xl border border-white/10 shadow-[0_0_20px_rgba(220,46,115,0.55)] p-5">

              {/* Header */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <h2 className="text-white font-medium text-xl">
                    {activeCategories.length === 1
                      ? (CATEGORY_HEADINGS[activeCategories[0]] ?? "Near You")
                      : "Near You"}
                  </h2>
                  {filteredItems.length > 0 && (
                    <span className="text-xs text-neutral-500">{filteredItems.length}</span>
                  )}
                </div>
                <div className="flex gap-2.5 items-center">
                  <SortMenu value={sort} onChange={setSort} />
                  <GlowSwitch
                    value={isOn}
                    size="sm"
                    onChange={setIsOn}
                    className="text-sm"
                  />
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
                          {/* Session actions */}
                          {[
                            {
                              label: "Create Jam",
                              icon: (
                                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                  <circle cx="12" cy="12" r="2"/><path d="M12 1v4M12 19v4M4.22 4.22l2.83 2.83M16.95 16.95l2.83 2.83M1 12h4M19 12h4M4.22 19.78l2.83-2.83M16.95 7.05l2.83-2.83"/>
                                </svg>
                              ),
                              onClick: () => { setCreateJamModalOpen(true); setDropdownOpen(false); },
                              accent: true,
                            },
                            {
                              label: "Post Update",
                              icon: (
                                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
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

                          {/* Divider */}
                          <div className="mx-4 h-px bg-white/[0.07]" />

                          {/* Social/discovery actions */}
                          <button
                            onClick={() => { setPromoteShowModalOpen(true); setDropdownOpen(false); }}
                            className="w-full flex items-center gap-3 px-4 py-3 text-sm font-medium text-gray-300 transition-colors duration-150 hover:bg-white/[0.07] hover:text-white"
                          >
                            <span className="shrink-0 opacity-70">
                              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M2 12C2 6.48 6.48 2 12 2s10 4.48 10 10-4.48 10-10 10S2 17.52 2 12z"/><path d="M8 12l2 2 4-4"/>
                              </svg>
                            </span>
                            Promote Show
                          </button>

                          {/* Divider */}
                          <div className="mx-4 h-px bg-white/[0.07]" />

                          {/* Band — expandable inline submenu */}
                          <button
                            onClick={() => setBandSubmenuOpen((v) => !v)}
                            className="w-full flex items-center gap-3 px-4 py-3 text-sm font-medium text-gray-300 transition-colors duration-150 hover:bg-white/[0.07] hover:text-white"
                          >
                            <span className="shrink-0 opacity-70">
                              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
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
                                          <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/><polyline points="10 17 15 12 10 7"/><line x1="15" y1="12" x2="3" y2="12"/>
                                        </svg>
                                      ),
                                      onClick: () => { setJoinBandModalOpen(true); setDropdownOpen(false); },
                                    },
                                    {
                                      label: "Find a Bandmate",
                                      icon: (
                                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                          <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/><line x1="11" y1="8" x2="11" y2="14"/><line x1="8" y1="11" x2="14" y2="11"/>
                                        </svg>
                                      ),
                                      onClick: () => { setFindBandmateModalOpen(true); setDropdownOpen(false); },
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

              <div className="h-px bg-gray-800 rounded-full mb-4" />

              {/* Cards — scrollable */}
              {feedLoading ? (
                <div className="flex items-center justify-center py-10">
                  <div className="w-6 h-6 rounded-full border-2 border-[#DC2E73] border-t-transparent animate-spin" />
                </div>
              ) : filteredItems.length > 0 ? (
                <div className="flex flex-col gap-3 overflow-y-auto max-h-[480px] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                  {filteredItems.map((item) => (
                    <div key={item.id} ref={(el) => { cardRefs.current[item.id] = el; }}>
                      <DiscoveryCard
                        item={item}
                        // isActive is suppressed when something is locked —
                        // hover should never visually compete with a selection.
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
                  <p className="text-sm text-neutral-400 text-center">
                    No jams found near you yet.
                  </p>
                  <p className="text-xs text-neutral-600 text-center">
                    Create one or try expanding your radius.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Bottom-left: Jam hover/selected preview — offset right of controls */}
        <div
          ref={previewRef}
          className="fixed bottom-8 left-8 z-30 pointer-events-auto"
        >
          <AnimatePresence mode="wait">
            {previewItem ? (
              <DiscoverPreview
                key={previewItem.id}
                variant="discovery"
                item={previewItem}
                onViewItem={() => openDiscoveryModal(previewItem.id)}
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
        <PromoteShowModal open={promoteShowModalOpen} onOpenChange={setPromoteShowModalOpen} />
        <JoinBandModal
          open={joinBandModalOpen}
          onOpenChange={setJoinBandModalOpen}
          profile={user ? { name: user.display_name, city: user.city, photoUrl: user.pfp } : {}}
        />
        <FindBandmateModal open={findBandmateModalOpen} onOpenChange={setFindBandmateModalOpen} />
      </div>

      {/* Map controls — upper-left, below filter rows, above preview zone.
          Outside the z-20 UI layer so they form their own stacking context. */}
      <div className="fixed top-[220px] left-8 z-40 pointer-events-auto">
        <MapFloatingControls
          onRecenter={handleRecenter}
          onReset={handleReset}
          onZoomIn={handleZoomIn}
          onZoomOut={handleZoomOut}
        />
      </div>

      <EventDetailModal
        item={modalItem}
        open={isDiscoveryModalOpen}
        onClose={closeDiscoveryModal}
        onJoin={handleDiscoveryJoin}
        onEdit={handleDiscoveryEdit}
        onDelete={handleDiscoveryDelete}
        openedFrom="discover"
      />

      <JoinJamModal
        isOpen={joinJamModal.open}
        onClose={() => setJoinJamModal({ open: false, jam: null })}
        jam={joinJamModal.jam}
      />
    </div>
  );
};

export default Home;