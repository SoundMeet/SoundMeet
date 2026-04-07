import React, { useState, useMemo, useEffect, useRef } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import {
  motion,
  useMotionValue,
  useTransform,
  AnimatePresence,
} from "framer-motion";
import {
  Check,
  X,
  Music,
  Filter,
  Search,
  Sliders,
  Mic2,
  Guitar,
  MapPin,
  Loader2,
  User,
  Heart,
  UserPlus,
  ExternalLink,
} from "lucide-react";
import { apiService } from "../injectables/apiCalls";

const SwipeCard = ({ profile, onSwipe, onClick, isTop, index }) => {
  const dragX = useMotionValue(0);
  const rotate = useTransform(dragX, [-200, 200], [-10, 10]);
  const peekOffset = index % 2 === 0 ? -80 : 80;
  const displayX = isTop ? dragX : peekOffset;

  const likeOpacity = useTransform(dragX, [50, 150], [0, 1]);
  const nopeOpacity = useTransform(dragX, [-50, -150], [0, 1]);

  const cardGlow = useTransform(
    dragX,
    [-200, 0, 200],
    [
      "0 0 50px rgba(251, 64, 64, 0.4)",
      "0 0 20px rgba(255, 255, 255, 0.02)",
      "0 0 50px rgba(220, 46, 115, 0.5)",
    ]
  );

  const handleDragEnd = (_, info) => {
    const threshold = 150;
    if (info.offset.x > threshold) onSwipe("right", profile.id);
    else if (info.offset.x < -threshold) onSwipe("left", profile.id);
  };

  return (
    <motion.div
      style={{
        x: displayX,
        rotate: isTop ? rotate : 0,
        scale: isTop ? 1 : 0.94,
        opacity: isTop ? 1 : 0.35,
        filter: `blur(${isTop ? 0 : 4}px)`,
        boxShadow: isTop ? cardGlow : "none",
        zIndex: index,
      }}
      exit={{
        x: dragX.get() > 0 ? 500 : -500,
        opacity: 0,
        scale: 0.5,
        transition: { duration: 0.3 },
      }}
      drag={isTop ? "x" : false}
      dragConstraints={{ left: 0, right: 0 }}
      onDragEnd={handleDragEnd}
      onTap={() => isTop && onClick(profile)}
      className="absolute w-[85vw] max-w-[380px] h-[60vh] max-h-[500px] bg-[#2A2A2A] rounded-[2rem] overflow-hidden cursor-grab active:cursor-grabbing select-none transition-all duration-500 ease-out border border-white/5"
    >
      <div className="relative h-full w-full">
        <img
          src={
            profile.avatar_url ||
            "https://images.unsplash.com/photo-1614850523459-c2f4c699c52e?auto=format&fit=crop&w=150&h=150&q=80"
          }
          alt={profile.display_name}
          className="h-full w-full object-cover pointer-events-none"
        />

        <div className="absolute inset-0 bg-gradient-to-t from-[#141414] via-[#141414]/40 to-transparent opacity-100" />

        {isTop && (
          <div className="absolute inset-0 pointer-events-none z-30">
            <motion.div
              style={{ opacity: likeOpacity }}
              className="absolute top-8 left-8 w-16 h-16 flex items-center justify-center rounded-full bg-[#DC2E73] text-white shadow-[0_0_30px_#DC2E73]"
            >
              <Check className="w-8 h-8" strokeWidth={3} />
            </motion.div>
            <motion.div
              style={{ opacity: nopeOpacity }}
              className="absolute top-8 right-8 w-16 h-16 flex items-center justify-center rounded-full bg-[#FB4040] text-white shadow-[0_0_30px_#FB4040]"
            >
              <X className="w-8 h-8" strokeWidth={3} />
            </motion.div>
          </div>
        )}

        <div
          className={`absolute bottom-0 p-8 w-full font-sora transition-opacity duration-300 ${
            isTop ? "opacity-100" : "opacity-0"
          }`}
        >
          <div className="flex items-center justify-between mb-1">
            <h2 className="text-[24px] font-bold text-white tracking-tight">
              {profile.display_name}
            </h2>
            <span className="flex items-center gap-1 text-[10px] font-black uppercase text-white/30 bg-white/5 px-2 py-1 rounded">
              <MapPin size={10} /> {profile.distance || "??"}km
            </span>
          </div>

          <div className="flex flex-col gap-1.5 mb-4 text-white/60 text-[11px] uppercase tracking-wider font-semibold">
            {profile.instruments?.length > 0 && (
              <div className="flex items-center gap-2">
                <Guitar size={12} className="text-[#DC2E73]" />
                <span>
                  {profile.instruments.map((i) => i.name).join(", ")}
                </span>
              </div>
            )}
          </div>

          <div className="flex gap-2 flex-wrap mb-3">
            {profile.genres?.map((g) => (
              <span
                key={g.id}
                className="bg-[#DC2E73]/20 text-[#DC2E73] text-[9px] font-black px-3 py-1.5 rounded-lg uppercase tracking-widest border border-[#DC2E73]/30 backdrop-blur-md"
              >
                {g.name}
              </span>
            ))}
          </div>

          <div className="flex items-center gap-2 text-[#DC2E73] text-[13px] font-medium italic">
            <Music size={14} />
            <span className="truncate">
              "{profile.vibes?.length > 0 
                ? profile.vibes[0].name 
                : (profile.current_track || "Seeking vibes")}"
            </span>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default function SoundMeetDiscovery() {
  const [profiles, setProfiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedProfile, setSelectedProfile] = useState(null);
  const [filters, setFilters] = useState({
    genres: [],
    instruments: [],
    roles: [],
  });

  const searchContainerRef = useRef(null);

  useEffect(() => {
    async function fetchProfiles() {
      try {
        const data = await apiService.getProfiles();
        setProfiles(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    fetchProfiles();
  }, []);

  useEffect(() => {
    function handleClickOutside(event) {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target)) {
        setSearchQuery("");
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const options = {
    genres: [
      "Synthwave",
      "R&B",
      "Pop",
      "Techno",
      "Indie",
      "Rock",
      "House",
      "Ambient",
    ],
    instruments: ["Synthesizer", "Guitar", "Vocals", "Drums", "Bass"],
    roles: ["Producer", "Vocalist", "Songwriter", "DJ"],
  };

  const toggleFilter = (key, value) => {
    setFilters((prev) => ({
      ...prev,
      [key]: prev[key].includes(value)
        ? prev[key].filter((i) => i !== value)
        : [...prev[key], value],
    }));
  };

  const filteredProfiles = useMemo(() => {
    return profiles.filter((p) => {
      const matchSearch = p.display_name
        .toLowerCase()
        .includes(searchQuery.toLowerCase());
      const matchGenre =
        filters.genres.length === 0 ||
        p.genres.some((g) => filters.genres.includes(g.name));
      const matchInst =
        filters.instruments.length === 0 ||
        p.instruments.some((i) => filters.instruments.includes(i.name));
      return matchSearch && matchGenre && matchInst;
    });
  }, [profiles, searchQuery, filters]);

  const handleSwipe = (direction, id) => {
    if (direction === "left") {
      console.log("left swipe");
    } else if (direction === "right") {
      console.log("right swipe");
    }
    setProfiles((prev) => prev.filter((p) => p.id !== id));
  };

  const FilterSection = ({ title, items, storageKey }) => (
    <div className="mb-6">
      <h4 className="text-[10px] uppercase tracking-[0.2em] text-white/40 font-bold mb-3">
        {title}
      </h4>
      <div className="flex flex-wrap gap-2">
        {items.map((item) => (
          <button
            key={item}
            onClick={() => toggleFilter(storageKey, item)}
            className={`px-3 py-1.5 rounded-full text-[10px] font-bold transition-all border ${
              filters[storageKey].includes(item)
                ? "bg-[#DC2E73] border-[#DC2E73] text-white shadow-[0_0_15px_rgba(220,46,115,0.3)]"
                : "bg-[#252525] border-white/5 text-white/40 hover:text-white"
            }`}
          >
            {item}
          </button>
        ))}
      </div>
    </div>
  );

  return (
    <div className="flex flex-col h-screen bg-[#0F0F0F] text-[#E5E2E1] font-sora overflow-hidden">
      <header className="h-20 flex items-center justify-center px-8 shrink-0 z-50">
        <div className="flex items-center gap-4 w-full max-w-[450px]" ref={searchContainerRef}>
          <div className="relative flex-1 group">
            <Search
              size={16}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-[#DC2E73] transition-colors"
            />
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search vibes..."
              className="bg-[#1C1B1B] rounded-full py-3 pl-12 pr-6 text-[13px] outline-none w-full border border-white/5 focus:border-[#DC2E73]/50 transition-all placeholder:text-white/10 focus:bg-[#222]"
            />

            <AnimatePresence>
              {searchQuery.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  className="absolute top-full left-0 right-0 mt-2 bg-[#141414]/95 backdrop-blur-[32px] rounded-3xl overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.5),0_0_0_1px_rgba(220,46,115,0.15)] z-[60] max-h-[300px] overflow-y-auto scrollbar-hide"
                >
                  <div className="p-2 flex flex-col gap-1">
                    {filteredProfiles.length > 0 ? (
                      filteredProfiles.slice(0, 5).map((p) => (
                        <button
                          key={p.id}
                          onClick={() => {
                            setSelectedProfile(p);
                            setSearchQuery("");
                          }}
                          className="flex items-center gap-3 p-3 rounded-2xl hover:bg-[#2A2A2A] transition-colors text-left group"
                        >
                          <div className="w-10 h-10 rounded-full bg-[#2A2A2A] overflow-hidden border border-white/5">
                            {p.avatar_url ? (
                              <img
                                src={p.avatar_url}
                                className="w-full h-full object-cover"
                                alt=""
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-white/20">
                                <User size={20} />
                              </div>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-[13px] font-bold text-white group-hover:text-[#DC2E73] transition-colors truncate">
                              {p.display_name}
                            </p>
                            <p className="text-[10px] text-white/40 uppercase tracking-wider truncate">
                              {p.genres?.[0]?.name || "Artist"}
                            </p>
                          </div>
                          <div className="text-[#DC2E73] opacity-0 group-hover:opacity-100 transition-opacity">
                            <Search size={14} />
                          </div>
                        </button>
                      ))
                    ) : (
                      <div className="p-6 text-center text-white/20 text-[12px]">
                        No matches found
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <Dialog.Root>
            <Dialog.Trigger asChild>
              <button className="relative w-12 h-12 flex items-center justify-center bg-[#1C1B1B] rounded-full border border-white/5 transition-all hover:bg-[#252525] shadow-lg">
                <Filter
                  size={18}
                  className={
                    Object.values(filters).some((a) => a.length > 0)
                      ? "text-[#DC2E73]"
                      : "text-white/30"
                  }
                />
              </button>
            </Dialog.Trigger>
            <Dialog.Portal>
              <Dialog.Overlay className="fixed inset-0 bg-black/80 backdrop-blur-md z-[100]" />
              <Dialog.Content className="fixed right-0 top-0 h-full w-full max-w-[320px] bg-[#1C1B1B] p-6 z-[101] flex flex-col focus:outline-none shadow-2xl overflow-y-auto scrollbar-hide">
                <div className="flex justify-between items-center mb-8">
                  <Dialog.Title className="text-[18px] font-bold text-white tracking-tight">
                    Filters
                  </Dialog.Title>
                  <Dialog.Description className="sr-only">
                    Adjust your discovery preferences by instrument, role, and genre.
                  </Dialog.Description>
                  <Dialog.Close asChild>
                    <button className="text-white/20 hover:text-white">
                      <X size={20} />
                    </button>
                  </Dialog.Close>
                </div>

                <FilterSection
                  title="Instruments"
                  items={options.instruments}
                  storageKey="instruments"
                />
                <FilterSection
                  title="Roles"
                  items={options.roles}
                  storageKey="roles"
                />
                <FilterSection
                  title="Genres"
                  items={options.genres}
                  storageKey="genres"
                />

                <div className="mt-auto pt-6">
                  <Dialog.Close asChild>
                    <button className="w-full py-4 rounded-2xl bg-gradient-to-r from-[#DC2E73] to-[#FB4040] text-white font-black text-[11px] uppercase tracking-widest shadow-lg active:scale-[0.98] transition-transform">
                      Apply
                    </button>
                  </Dialog.Close>
                </div>
              </Dialog.Content>
            </Dialog.Portal>
          </Dialog.Root>
        </div>
      </header>

      <Dialog.Root open={!!selectedProfile} onOpenChange={(open) => !open && setSelectedProfile(null)}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black/80 backdrop-blur-md z-[100]" />
          <Dialog.Content className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[85vw] max-w-[400px] max-h-[90vh] bg-[#141414]/95 backdrop-blur-[32px] rounded-[1.5rem] overflow-y-auto scrollbar-hide z-[101] focus:outline-none shadow-[0_0_60px_rgba(220,46,115,0.1)]">
            {selectedProfile && (
              <motion.div 
                initial={{ opacity: 0, y: 48 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                className="relative flex flex-col h-full"
              >
                <Dialog.Title className="sr-only">
                  {selectedProfile.display_name} Details
                </Dialog.Title>
                <Dialog.Description className="sr-only">
                  Detailed view of artist profile including instruments, genres, and vibes.
                </Dialog.Description>
                <div className="relative h-32 shrink-0 w-full">
                  <img 
                    src={selectedProfile.avatar_url || "https://images.unsplash.com/photo-1614850523296-d8c1af93d400?auto=format&fit=crop&q=80&w=800"} 
                    className="w-full h-full object-cover"
                    alt=""
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#141414] to-transparent" />
                  <Dialog.Close asChild>
                    <button className="absolute top-3 right-3 w-8 h-8 flex items-center justify-center bg-black/40 backdrop-blur-md rounded-full text-white/70 hover:text-white transition-all shadow-[0_0_0_1px_rgba(220,46,115,0.15)]">
                      <X size={16} />
                    </button>
                  </Dialog.Close>
                </div>

                <div className="p-5 -mt-4 relative z-10 flex flex-col flex-1 overflow-hidden">
                  <div className="flex items-end justify-between mb-3">
                    <h2 className="text-[22px] font-bold text-white tracking-tight leading-none">
                      {selectedProfile.display_name}
                    </h2>
                    <div className="bg-[#DC2E73]/10 px-2 py-1 rounded-full border border-[#DC2E73]/20 text-[#DC2E73] text-[9px] font-bold uppercase tracking-wider">
                      {selectedProfile.distance || "0"}km
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                      <h4 className="text-[9px] font-medium uppercase tracking-[0.1em] text-white/30 mb-1.5">Instruments</h4>
                      <div className="flex flex-wrap gap-1.5">
                        {selectedProfile.instruments?.map(i => (
                          <span key={i.id} className="text-[11px] text-white/80 flex items-center gap-1 bg-white/5 px-2 py-0.5 rounded-md">
                            <Guitar size={9} className="text-[#DC2E73]" /> {i.name}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div>
                      <h4 className="text-[9px] font-medium uppercase tracking-[0.1em] text-white/30 mb-1.5">Genres</h4>
                      <div className="flex flex-wrap gap-1.5">
                        {selectedProfile.genres?.map(g => (
                          <span key={g.id} className="bg-[#DC2E73]/20 text-[#DC2E73] text-[8px] font-black px-2 py-0.5 rounded-full uppercase tracking-widest">
                            {g.name}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                  
                  <div className="mb-5">
                    <h4 className="text-[9px] font-medium uppercase tracking-[0.1em] text-white/30 mb-1.5">Vibes</h4>
                    <div className="flex items-center gap-2 text-[#DC2E73] font-medium">
                      <Music size={12} />
                      <span className="text-[12px] truncate">
                        {selectedProfile.vibes?.length > 0 ? selectedProfile.vibes[0].name : (selectedProfile.current_track || "Unknown")}
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-col gap-2 mt-auto">
                    <button className="w-full py-3 rounded-full bg-gradient-to-r from-[#DC2E73] to-[#FB4040] text-white font-bold text-[12px] shadow-[0_0_20px_rgba(220,46,115,0.4)] hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2">
                      <UserPlus size={14} />
                      Add Friend
                    </button>
                    <button className="w-full py-3 rounded-full bg-[#2A2A2A] text-white/80 font-bold text-[12px] hover:bg-[#393939] hover:text-white hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2">
                      <ExternalLink size={14} />
                      View Profile
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>

      <main className="flex-1 relative flex items-center justify-center p-4">
        <div className="absolute inset-0 bg-[#DC2E73]/5 blur-[120px] rounded-full pointer-events-none" />

        <div className="relative w-full max-w-[400px] h-[60vh] flex items-center justify-center">
          {loading ? (
            <Loader2 className="w-8 h-8 text-[#DC2E73] animate-spin opacity-50" />
          ) : (
            <>
              <AnimatePresence>
                {[...filteredProfiles].reverse().map((p, i) => {
                  const actualIndex = filteredProfiles.length - 1 - i;
                  return (
                    <SwipeCard
                      key={p.id}
                      profile={p}
                      index={i}
                      isTop={actualIndex === 0}
                      onSwipe={handleSwipe}
                      onClick={setSelectedProfile}
                    />
                  );
                })}
              </AnimatePresence>
              {filteredProfiles.length === 0 && (
                <div className="text-center opacity-30">
                  <Sliders size={56} className="mx-auto mb-4" />
                  <p>Adjust filters to find more vibes.</p>
                </div>
              )}
            </>
          )}
        </div>
      </main>

      <footer className="h-28 flex items-center justify-center gap-10 shrink-0 mb-4">
        <button
          className="w-16 h-16 rounded-full bg-[#1C1B1B] flex items-center justify-center text-[#FB4040] border border-white/5 shadow-[0_10px_25px_rgba(0,0,0,0.5)] active:scale-90 transition-all"
          onClick={() =>
            filteredProfiles.length > 0 &&
            handleSwipe("left", filteredProfiles[0].id)
          }
        >
          <X size={28} />
        </button>
        <button
          className="w-16 h-16 rounded-full bg-[#1C1B1B] flex items-center justify-center text-[#DC2E73] border border-white/5 shadow-[0_10px_25px_rgba(0,0,0,0.5)] active:scale-90 transition-all"
          onClick={() =>
            filteredProfiles.length > 0 &&
            handleSwipe("right", filteredProfiles[0].id)
          }
        >
          <Check size={28} />
        </button>
      </footer>
    </div>
  );
}