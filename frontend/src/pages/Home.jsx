import React, { useState, useRef, useEffect } from "react";
import MapComponent from "../components/MapComponent";
import Glowbutton from "../components/Glowbutton";
import GlowSwitch from "../components/GlowSwitch";
import { motion, AnimatePresence } from "framer-motion";
import CreateJamModal from "../components/CreateJamModal";
import JamCard from "../components/JamCard";
import JamHoverPreview from "../components/JamHoverPreview";
import JamModal from "../components/JamModal";
import { mockJams } from "../data/mockJams";

const filterPills = ["All", "Jams", "Musicians", "Bands", "Shows"];

const Home = () => {
  const [activePill, setActivePill] = useState(0);
  const [isOn, setIsOn] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [createJamModalOpen, setCreateJamModalOpen] = useState(false);

  // Jam interaction state
  const [hoveredJamId, setHoveredJamId] = useState(null);
  const [selectedJamId, setSelectedJamId] = useState(null); // single-click locks preview
  const [modalJam, setModalJam] = useState(null);           // jam currently shown in detail modal

  // Refs for click-outside detection
  const dropdownRef = useRef(null);
  const nearYouRef = useRef(null);   // Near You panel — clicks here don't deselect
  const previewRef = useRef(null);   // Hover preview — clicks here don't deselect

  // Per-card DOM refs for scrolling a card into view when its map pin is clicked
  const cardRefs = useRef({});

  // ── Derived state ──────────────────────────────────────────────────────────

  // Selected jam takes priority over hovered jam for the preview.
  // This keeps the preview locked when the user clicks a card and moves the mouse away.
  const previewJamId = selectedJamId ?? hoveredJamId;
  const previewJam = mockJams.find((j) => j.id === previewJamId) ?? null;

  const isJamModalOpen = modalJam !== null;

  // ── Helpers ───────────────────────────────────────────────────────────────

  const openJamModal = (jamId) => {
    setModalJam(mockJams.find((j) => j.id === jamId) ?? null);
  };

  const closeJamModal = () => setModalJam(null);

  // ── Card interaction handlers ─────────────────────────────────────────────

  // Single click — select jam, lock preview
  const handleCardClick = (jamId) => {
    setSelectedJamId(jamId);
  };

  // Double click — select + open detail modal.
  // onClick fires first (twice), then onDoubleClick fires — this is native browser behavior.
  // The card will already be selected when the modal opens, which is correct.
  const handleCardDoubleClick = (jamId) => {
    setSelectedJamId(jamId);
    openJamModal(jamId);
  };

  // Join button click — open detail modal directly.
  // Click also bubbles to the card div's onClick (selecting the card), which is intentional.
  const handleCardJoin = (jamId) => {
    openJamModal(jamId);
  };

  // ── Pin interaction handlers ──────────────────────────────────────────────

  // Single click on an unselected pin → select it (and scroll its card into view).
  // Single click on the already-selected pin → open detail modal.
  const handlePinSelect = (jamId) => {
    if (selectedJamId === jamId) {
      openJamModal(jamId);
    } else {
      setSelectedJamId(jamId);
    }
  };

  // ── Scroll selected card into view ───────────────────────────────────────
  // Fires on any selectedJamId change; scrollIntoView with 'nearest' is a
  // near-no-op if the card is already visible (e.g. when the user clicked it).
  useEffect(() => {
    if (selectedJamId) {
      cardRefs.current[selectedJamId]?.scrollIntoView({
        behavior: "smooth",
        block: "nearest",
      });
    }
  }, [selectedJamId]);

  // ── Click-outside: close dropdown ─────────────────────────────────────────
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // ── Click-outside: deselect jam ───────────────────────────────────────────
  // Clicking outside the Near You panel and the hover preview clears selection.
  // Modal takes precedence — selection is not cleared while a modal is open.
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (isJamModalOpen) return;
      const inNearYou = nearYouRef.current?.contains(e.target);
      const inPreview = previewRef.current?.contains(e.target);
      if (!inNearYou && !inPreview) {
        setSelectedJamId(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isJamModalOpen]);

  return (
    <div className="fixed inset-0 text-white">
      {/* Full-screen map background */}
      <div className="fixed inset-x-0 bottom-0 top-16 z-0">
        <MapComponent
          jams={mockJams}
          selectedJamId={selectedJamId}
          hoveredJamId={hoveredJamId}
          onPinSelect={handlePinSelect}
          onPinHover={setHoveredJamId}
          onPinLeave={() => setHoveredJamId(null)}
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
        {/* Search + Filter Bar */}
        <div className="flex items-center px-6 py-3 pointer-events-auto">
          <div className="flex items-center gap-3 bg-neutral-900/50 backdrop-blur-2xl rounded-full px-3 py-2 border border-white/10 shadow-[0_0_20px_rgba(220,46,115,0.55)]">
            <div className="flex items-center bg-neutral-800 rounded-full px-4 py-2 w-80">
              <span className="text-neutral-400 mr-2">&#128269;</span>
              <input
                type="text"
                placeholder="Search jams, musicians, bands..."
                className="bg-transparent text-sm text-white placeholder-neutral-400 outline-none w-full"
              />
            </div>
            <div className="flex gap-2">
              {filterPills.map((pill, ind) => (
                <Glowbutton
                  key={ind}
                  isActive={activePill === ind}
                  value={pill}
                  onClick={() => setActivePill(ind)}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex w-full flex-1">
          {/* Left: transparent — map shows through */}
          <div className="flex-1 pointer-events-none" />

          {/* Near You panel — ref'd so click-outside detection ignores it */}
          <div
            ref={nearYouRef}
            className="w-[380px] max-w-[calc(100vw-2rem)] shrink-0 pt-2 pr-6 pointer-events-auto"
          >
            <div className="rounded-[28px] bg-neutral-900/50 backdrop-blur-2xl border border-white/10 shadow-[0_0_20px_rgba(220,46,115,0.55)] p-5">

              {/* Header */}
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-white font-medium text-xl">Near You</h2>
                <div className="flex gap-2 items-center">
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
                          className="absolute right-0 top-9 z-50 w-36 rounded-2xl bg-neutral-900/90 backdrop-blur-md border border-white/10 shadow-[0_0_20px_rgba(220,46,115,0.25),0_0_40px_rgba(0,0,0,0.5)] overflow-hidden"
                        >
                          {[
                            {
                              label: "Create Jam",
                              icon: "🎵",
                              onClick: () => {
                                setCreateJamModalOpen(true);
                                setDropdownOpen(false);
                              },
                            },
                            {
                              label: "Post",
                              icon: "📢",
                              onClick: () => setDropdownOpen(false),
                            },
                          ].map(({ label, icon, onClick }) => (
                            <button
                              key={label}
                              onClick={onClick}
                              className="w-full flex items-center gap-2 px-4 py-3 text-sm text-gray-200 hover:bg-white/10 hover:text-white transition-colors duration-150 font-medium"
                            >
                              <span>{icon}</span>
                              {label}
                            </button>
                          ))}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
              </div>

              <div className="h-px bg-gray-800 rounded-full mb-4" />

              {/* Cards — scrollable */}
              <div className="flex flex-col gap-3 overflow-y-auto max-h-[520px] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                {mockJams.map((jam) => (
                  // Wrapper div captures the ref for scroll-to-card when a map pin is clicked
                  <div key={jam.id} ref={(el) => { cardRefs.current[jam.id] = el; }}>
                    <JamCard
                      title={jam.title}
                      genre={jam.genre}
                      distanceMiles={jam.distanceMiles}
                      isLive={jam.isLive}
                      tags={jam.tags}
                      isPrivate={jam.isPrivate}
                      isActive={hoveredJamId === jam.id}
                      isSelected={selectedJamId === jam.id}
                      onClick={() => handleCardClick(jam.id)}
                      onDoubleClick={() => handleCardDoubleClick(jam.id)}
                      onJoin={() => handleCardJoin(jam.id)}
                      onMouseEnter={() => setHoveredJamId(jam.id)}
                      onMouseLeave={() => setHoveredJamId(null)}
                    />
                  </div>
                ))}
              </div>

            </div>
          </div>
        </div>

        {/* Hover/selected preview — ref'd so click-outside detection ignores it */}
        <div ref={previewRef} className="fixed bottom-8 left-8 z-30 pointer-events-auto">
          <AnimatePresence>
            {previewJam && (
              <JamHoverPreview
                jam={previewJam}
                onViewJam={() => openJamModal(previewJam.id)}
              />
            )}
          </AnimatePresence>
        </div>

        <CreateJamModal open={createJamModalOpen} onOpenChange={setCreateJamModalOpen} />
      </div>

      {/* Jam detail modal — rendered outside the UI layer for correct z-index stacking */}
      <JamModal
        jam={modalJam}
        open={isJamModalOpen}
        onClose={closeJamModal}
        onJoin={() => {
          // TODO: wire up real join functionality — call API with modalJam.id + user auth
          closeJamModal();
        }}
      />
    </div>
  );
};

export default Home;
