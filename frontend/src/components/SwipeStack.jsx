import React, { useState, useMemo } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { motion, useMotionValue, useTransform, AnimatePresence } from 'framer-motion';
import { Check, X, Music, Filter, Search, Sliders, Mic2, Guitar, MapPin } from 'lucide-react';

const SwipeCard = ({ profile, onSwipe, isTop, index }) => {
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
      "0 0 50px rgba(220, 46, 115, 0.5)"
    ]
  );

  const handleDragEnd = (_, info) => {
    const threshold = 150;
    if (info.offset.x > threshold) onSwipe('right', profile.id);
    else if (info.offset.x < -threshold) onSwipe('left', profile.id);
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
        zIndex: index 
      }}
      drag={isTop ? "x" : false}
      dragConstraints={{ left: 0, right: 0 }}
      onDragEnd={handleDragEnd}
      className="absolute w-[85vw] max-w-[380px] h-[70vh] max-h-[580px] bg-[#2A2A2A] rounded-[2rem] overflow-hidden cursor-grab active:cursor-grabbing select-none transition-all duration-500 ease-out border border-white/5"
    >
      <div className="relative h-full w-full">
        <img src={profile.image} alt={profile.name} className="h-full w-full object-cover pointer-events-none" />
        
        <div className="absolute inset-0 bg-gradient-to-t from-[#141414] via-[#141414]/40 to-transparent opacity-100" />

        {isTop && (
          <div className="absolute inset-0 pointer-events-none z-30">
            <motion.div style={{ opacity: likeOpacity }} className="absolute top-8 left-8 w-16 h-16 flex items-center justify-center rounded-full bg-[#DC2E73] text-white shadow-[0_0_30px_#DC2E73]">
              <Check className="w-8 h-8" strokeWidth={3} />
            </motion.div>
            <motion.div style={{ opacity: nopeOpacity }} className="absolute top-8 right-8 w-16 h-16 flex items-center justify-center rounded-full bg-[#FB4040] text-white shadow-[0_0_30px_#FB4040]">
              <X className="w-8 h-8" strokeWidth={3} />
            </motion.div>
          </div>
        )}

        <div className={`absolute bottom-0 p-10 w-full font-sora transition-opacity duration-300 ${isTop ? 'opacity-100' : 'opacity-0'}`}>
          <div className="flex items-center justify-between mb-1">
            <h2 className="text-[28px] font-bold text-white tracking-tight">{profile.name}, {profile.age}</h2>
            <span className="flex items-center gap-1 text-[10px] font-black uppercase text-white/30 bg-white/5 px-2 py-1 rounded">
                <MapPin size={10} /> {profile.distance}km
            </span>
          </div>
          
          <div className="flex items-center gap-2 mb-4 text-[#DC2E73] text-[14px] font-medium italic">
            <Music size={14} />
            <span className="truncate">"{profile.currentTrack}"</span>
          </div>

          <div className="flex flex-col gap-1.5 mb-6 text-white/60 text-[12px] uppercase tracking-wider font-semibold">
            <div className="flex items-center gap-2">
              <Mic2 size={12} className="text-[#DC2E73]" />
              <span>{profile.roles.join(" • ")}</span>
            </div>
            <div className="flex items-center gap-2">
              <Guitar size={12} className="text-[#DC2E73]" />
              <span>{profile.instruments.join(", ")}</span>
            </div>
          </div>

          <div className="flex gap-2 flex-wrap">
            {profile.genres.map(g => (
              <span key={g} className="bg-[#DC2E73]/20 text-[#DC2E73] text-[10px] font-black px-4 py-2 rounded-lg uppercase tracking-widest border border-[#DC2E73]/30 backdrop-blur-md">
                {g}
              </span>
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default function SoundMeetDiscovery() {
  const [profiles, setProfiles] = useState([
    { id: 1, name: "Sloane", age: 23, currentTrack: "Midnight City", genres: ["Synthwave"], instruments: ["Synthesizer"], roles: ["Producer"], distance: 2, image: "https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=800" },
    { id: 2, name: "Dante", age: 26, currentTrack: "Starboy", genres: ["R&B"], instruments: ["Vocals"], roles: ["Vocalist"], distance: 8, image: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=800" },
    { id: 3, name: "Jade", age: 22, currentTrack: "Breezeblocks", genres: ["Indie", "Rock"], instruments: ["Guitar", "Bass"], roles: ["Songwriter"], distance: 5, image: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=800" },
    { id: 4, name: "Axel", age: 28, currentTrack: "Sandstorm", genres: ["Techno"], instruments: ["Synthesizer"], roles: ["DJ", "Producer"], distance: 12, image: "https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=800" },
    { id: 5, name: "Luna", age: 25, currentTrack: "Levitating", genres: ["Pop"], instruments: ["Vocals"], roles: ["Vocalist"], distance: 15, image: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=800" },
    { id: 6, name: "Mika", age: 24, currentTrack: "Around the World", genres: ["House", "Techno"], instruments: ["Drums"], roles: ["Producer"], distance: 7, image: "https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=800" },
    { id: 7, name: "Kael", age: 27, currentTrack: "Hysteria", genres: ["Rock"], instruments: ["Bass"], roles: ["Songwriter"], distance: 10, image: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=800" },
    { id: 8, name: "Elias", age: 21, currentTrack: "Weightless", genres: ["Ambient"], instruments: ["Guitar"], roles: ["Producer"], distance: 3, image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800" }
  ]);

  const [searchQuery, setSearchQuery] = useState("");
  const [filters, setFilters] = useState({ genres: [], instruments: [], roles: [] });

  const options = {
    genres: ["Synthwave", "R&B", "Pop", "Techno", "Indie", "Rock", "House", "Ambient"],
    instruments: ["Synthesizer", "Guitar", "Vocals", "Drums", "Bass"],
    roles: ["Producer", "Vocalist", "Songwriter", "DJ"]
  };

  const toggleFilter = (key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: prev[key].includes(value) 
        ? prev[key].filter(i => i !== value) 
        : [...prev[key], value]
    }));
  };

  const filteredProfiles = useMemo(() => {
    return profiles.filter(p => {
      const matchSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchGenre = filters.genres.length === 0 || p.genres.some(g => filters.genres.includes(g));
      const matchInst = filters.instruments.length === 0 || p.instruments.some(i => filters.instruments.includes(i));
      const matchRole = filters.roles.length === 0 || p.roles.some(r => filters.roles.includes(r));
      return matchSearch && matchGenre && matchInst && matchRole;
    });
  }, [profiles, searchQuery, filters]);

  const handleSwipe = (_, id) => setProfiles(prev => prev.filter(p => p.id !== id));

  const FilterSection = ({ title, items, storageKey }) => (
    <div className="mb-8">
      <h4 className="text-[10px] uppercase tracking-[0.2em] text-white/40 font-bold mb-4">{title}</h4>
      <div className="flex flex-wrap gap-2">
        {items.map(item => (
          <button
            key={item}
            onClick={() => toggleFilter(storageKey, item)}
            className={`px-4 py-2 rounded-full text-[11px] font-bold transition-all border ${
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
      <header className="h-24 flex items-center justify-center px-8 shrink-0 z-50">
        <div className="flex items-center gap-4 w-full max-w-[450px]">
          <div className="relative flex-1 group">
            <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-[#DC2E73] transition-colors" />
            <input 
              value={searchQuery} 
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search vibes..."
              className="bg-[#1C1B1B] rounded-full py-3 pl-12 pr-6 text-[13px] outline-none w-full border border-white/5 focus:border-[#DC2E73]/50 transition-all placeholder:text-white/10 focus:bg-[#222]"
            />
          </div>
          
          <Dialog.Root>
            <Dialog.Trigger asChild>
              <button className="relative w-12 h-12 flex items-center justify-center bg-[#1C1B1B] rounded-full border border-white/5 transition-all hover:bg-[#252525] shadow-lg">
                <Filter size={18} className={Object.values(filters).some(a => a.length > 0) ? "text-[#DC2E73]" : "text-white/30"} />
              </button>
            </Dialog.Trigger>
            <Dialog.Portal>
              <Dialog.Overlay className="fixed inset-0 bg-black/80 backdrop-blur-md z-[100]" />
              <Dialog.Content className="fixed right-0 top-0 h-full w-full max-w-[380px] bg-[#1C1B1B] p-8 z-[101] flex flex-col focus:outline-none shadow-2xl overflow-y-auto">
                <div className="flex justify-between items-center mb-10">
                  <Dialog.Title className="text-[22px] font-bold text-white tracking-tight">Vibe Filters</Dialog.Title>
                  <Dialog.Close asChild><button className="text-white/20 hover:text-white"><X size={24}/></button></Dialog.Close>
                </div>

                <FilterSection title="Instruments" items={options.instruments} storageKey="instruments" />
                <FilterSection title="Roles" items={options.roles} storageKey="roles" />
                <FilterSection title="Genres" items={options.genres} storageKey="genres" />

                <div className="mt-auto pt-6">
                  <Dialog.Close asChild>
                    <button className="w-full py-5 rounded-2xl bg-gradient-to-r from-[#DC2E73] to-[#FB4040] text-white font-black text-[12px] uppercase tracking-widest shadow-lg active:scale-[0.98] transition-transform">
                      Save Preferences
                    </button>
                  </Dialog.Close>
                </div>
              </Dialog.Content>
            </Dialog.Portal>
          </Dialog.Root>
        </div>
      </header>

      <main className="flex-1 relative flex items-center justify-center p-4">
        <div className="absolute inset-0 bg-[#DC2E73]/5 blur-[120px] rounded-full pointer-events-none" />
        
        <div className="relative w-full max-w-[400px] h-[70vh] flex items-center justify-center">
          <AnimatePresence>
            {[...filteredProfiles].reverse().map((p, i) => (
              <SwipeCard 
                key={p.id} 
                profile={p} 
                index={filteredProfiles.length - 1 - i} 
                isTop={i === 0} 
                onSwipe={handleSwipe} 
              />
            ))}
          </AnimatePresence>
          {filteredProfiles.length === 0 && (
            <div className="text-center opacity-30">
              <Sliders size={56} className="mx-auto mb-4" />
              <p>Adjust filters to find more vibes.</p>
            </div>
          )}
        </div>
      </main>

      <footer className="h-32 flex items-center justify-center gap-10 shrink-0 mb-4">
        <button 
          className="w-18 h-18 rounded-full bg-[#1C1B1B] flex items-center justify-center text-[#FB4040] border border-white/5 shadow-[0_10px_25px_rgba(0,0,0,0.5)] active:scale-90 transition-all" 
          onClick={() => filteredProfiles.length > 0 && handleSwipe(null, filteredProfiles[0].id)}
        >
          <X size={32} />
        </button>
        <button 
          className="w-18 h-18 rounded-full bg-[#1C1B1B] flex items-center justify-center text-[#DC2E73] border border-white/5 shadow-[0_10px_25px_rgba(0,0,0,0.5)] active:scale-90 transition-all" 
          onClick={() => filteredProfiles.length > 0 && handleSwipe(null, filteredProfiles[0].id)}
        >
          <Check size={32} />
        </button>
      </footer>
    </div>
  );
}