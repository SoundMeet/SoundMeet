import React, { useState } from 'react';
import { motion, useMotionValue, useTransform, AnimatePresence } from 'framer-motion';
import { Check, X, Music, Filter } from 'lucide-react';

const SwipeCard = ({ profile, onSwipe, isTop, index, total }) => {
  const x = useMotionValue(0);
  const rotate = useTransform(x, [-200, 200], [-10, 10]);
  
  // Dynamic scale for the "Stack" look: cards further back are slightly smaller
  const stackScale = isTop ? 1 : 1 - (total - index) * 0.05;
  const stackY = isTop ? 0 : (total - index) * 12;

  const cardGlow = useTransform(
    x,
    [-200, 0, 200],
    [
      "0 0 40px rgba(251, 64, 64, 0.4)", 
      "0 0 25px rgba(255, 255, 255, 0.05)", 
      "0 0 40px rgba(220, 46, 115, 0.5)"
    ]
  );

  const handleDragEnd = (event, info) => {
    // Responsive threshold: smaller on mobile
    const threshold = window.innerWidth < 640 ? 100 : 150;
    if (info.offset.x > threshold) onSwipe('right', profile.id);
    else if (info.offset.x < -threshold) onSwipe('left', profile.id);
  };

  return (
    <motion.div
      style={{ 
        x, 
        rotate, 
        boxShadow: cardGlow, 
        scale: stackScale,
        y: stackY,
        zIndex: index 
      }}
      drag={isTop ? "x" : false}
      dragConstraints={{ left: 0, right: 0 }}
      onDragEnd={handleDragEnd}
      // Responsive Widths: 90% of screen on mobile, max 400px on desktop
      className="absolute w-[90vw] max-w-[400px] h-[70vh] max-h-[600px] bg-[#2A2A2A] rounded-[1.5rem] overflow-hidden cursor-grab active:cursor-grabbing select-none transition-shadow duration-300"
    >
      <div className="relative h-full w-full">
        <img src={profile.image} alt={profile.name} className="h-full w-full object-cover pointer-events-none" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#141414] via-transparent to-transparent" />

        {/* Floating Choice Indicators - Scaled for mobile */}
        <motion.div 
          style={{ opacity: useTransform(x, [20, 80], [0, 1]) }}
          className="absolute top-4 left-4 sm:top-6 sm:left-6 w-12 h-12 sm:w-16 sm:h-16 flex items-center justify-center rounded-full bg-[#DC2E73] text-white shadow-[0_0_20px_rgba(220,46,115,0.8)]"
        >
          <Check className="w-6 h-6 sm:w-8 sm:h-8" strokeWidth={3} />
        </motion.div>

        <motion.div 
          style={{ opacity: useTransform(x, [-20, -80], [0, 1]) }}
          className="absolute top-4 right-4 sm:top-6 sm:right-6 w-12 h-12 sm:w-16 sm:h-16 flex items-center justify-center rounded-full bg-[#FB4040] text-white shadow-[0_0_20px_rgba(251,64,64,0.8)]"
        >
          <X className="w-6 h-6 sm:w-8 sm:h-8" strokeWidth={3} />
        </motion.div>

        {/* Info Area - Lower 40% */}
        <div className="absolute bottom-0 p-6 sm:p-8 w-full font-sora">
          <h2 className="text-[18px] sm:text-[22px] font-bold text-white">{profile.name}, {profile.age}</h2>
          <div className="flex items-center gap-2 mt-2 mb-4 text-[#E5E2E1]/70 text-[11px] sm:text-[13px]">
            <Music size={14} className="text-[#DC2E73]" />
            <span className="truncate">{profile.currentTrack}</span>
          </div>
          <div className="flex gap-2 flex-wrap">
            {profile.genres.map(g => (
              <span key={g} className="bg-[#DC2E73]/20 text-[#DC2E73] text-[9px] sm:text-[10px] font-bold px-3 py-1 rounded-full uppercase">
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
    { id: 1, name: "Sloane", age: 23, currentTrack: "Midnight City", genres: ["Synthwave"], image: "https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=800" },
    { id: 2, name: "Dante", age: 26, currentTrack: "Starboy", genres: ["R&B"], image: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=800" },
  ]);

  return (
    <div className="flex flex-col h-screen bg-[#141414] text-[#E5E2E1] font-sora overflow-hidden">
      {/* Responsive Navigation Header */}
      <header className="h-16 flex items-center justify-between px-6 shrink-0">
        <div className="text-[14px] font-bold tracking-tighter text-white">SOUNDMEET</div>
        <Filter size={18} className="text-[#E5E2E1]/50 cursor-pointer hover:text-[#DC2E73] transition-colors" />
      </header>

      {/* Main Swipe Area */}
      <main className="flex-1 relative flex items-center justify-center p-4">
        <div className="relative w-full max-w-[400px] h-[70vh] max-h-[600px] flex items-center justify-center">
          <AnimatePresence>
            {profiles.map((profile, index) => (
              <SwipeCard 
                key={profile.id} 
                profile={profile} 
                index={index}
                total={profiles.length}
                isTop={index === profiles.length - 1}
                onSwipe={(dir, id) => setProfiles(prev => prev.filter(p => p.id !== id))} 
              />
            ))}
          </AnimatePresence>

          {profiles.length === 0 && (
            <div className="text-center animate-in fade-in duration-500">
              <p className="text-[14px] text-[#E5E2E1]/40 mb-6">No more tracks in your range.</p>
              <button 
                onClick={() => window.location.reload()}
                className="px-8 py-3 bg-gradient-to-r from-[#DC2E73] to-[#FB4040] rounded-full text-[12px] font-bold uppercase tracking-widest"
              >
                Refresh
              </button>
            </div>
          )}
        </div>
      </main>

      {/* Footer Controls - Visible primarily for desktop or for clarity */}
      <footer className="h-24 flex items-center justify-center gap-8 shrink-0">
        <button className="w-12 h-12 rounded-full bg-[#1C1B1B] flex items-center justify-center text-[#FB4040] shadow-sm hover:shadow-[0_0_15px_rgba(251,64,64,0.3)] transition-all">
          <X size={20} />
        </button>
        <button className="w-12 h-12 rounded-full bg-[#1C1B1B] flex items-center justify-center text-[#DC2E73] shadow-sm hover:shadow-[0_0_20px_rgba(220,46,115,0.4)] transition-all">
          <Check size={20} />
        </button>
      </footer>
    </div>
  );
}