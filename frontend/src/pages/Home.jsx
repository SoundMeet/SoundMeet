import React, { useState, useRef, useEffect } from "react";
import Navbar from "../components/Navbar";
import MapComponent from "../components/MapComponent";
import Glowbutton from "../components/Glowbutton";
import GlowSwitch from "../components/GlowSwitch";
import speaker from "../assets/speaker.png"
import AnimatedIcon from "../components/AnimatedIcon";
import { motion, AnimatePresence } from "framer-motion";
import CreateJamModal from "../components/CreateJamModal";
const filterPills = ["All", "Jams", "Musicians", "Bands", "Shows"];

const Home = () => {
  const [activePill, setActivePill] = useState(0)
  const [isOn, setIsOn] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [jamModalOpen, setJamModalOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);
  return (
    <div className="h-screen text-white flex flex-col overflow-hidden">
      {/* Search + Filter Bar */}
      <div className="flex items-center gap-3 px-6 py-3 z-10">
        <div className="flex items-center bg-neutral-800 rounded-full px-4 py-2 w-80">
          <span className="text-neutral-400 mr-2">&#128269;</span>
          <input
            type="text"
            placeholder="Search jams, musicians, bands..."
            className="bg-transparent text-sm text-white placeholder-neutral-400 outline-none w-full"
          />
        </div>
        <div className="flex gap-2">
          {filterPills.map((pill,ind) => {
            return (
              <Glowbutton
                key={ind}
                isActive={activePill === ind}
                value={pill}
                onClick={() => {setActivePill(ind)}}
              />
            );
          })}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex w-full h-[39rem]">
        <div className="w-[68%] h-full flex items-center justify-center">
          <div className="w-[95%] h-[95%] flex items-center justify-center rounded-3xl bg-neutral-900/80 backdrop-blur-md border border-white/10 shadow-[0_0_25px_rgba(255,255,255,0.08),0_0_40px_rgba(220,46,115,0.15)]">
            <h2 className="text-gray-500 text-xs font-light">Map Component</h2>
          </div>
        </div>
        <div className="w-[32%] h-full flex items-center justify-center">
          <div className="w-[95%] h-[95%] pt-2 rounded-3xl bg-neutral-900/80 backdrop-blur-md border border-white/10 shadow-[0_0_25px_rgba(255,255,255,0.08),0_0_40px_rgba(220,46,115,0.15)]">
            <div className="w-full h-14 px-6 pt-2 items-center flex justify-between">
              <h2 className="text-white font-medium text-xl">Near You</h2>
              <div className="flex gap-2 items-center">
                <GlowSwitch 
                value={isOn}
                size="sm"
                onChange={setIsOn} 
                className="text-sm"/>
                <div className="relative" ref={dropdownRef}>
                  <div
                    onClick={() => setDropdownOpen((v) => !v)}
                    className="w-7 h-7 cursor-pointer border-gray-300 flex items-center justify-center rounded-full border select-none"
                  >
                    <p className="text-xl pb-1">+</p>
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
                          { label: "Create Jam", icon: "🎵", onClick: () => { setJamModalOpen(true); setDropdownOpen(false); } },
                          { label: "Post", icon: "📢", onClick: () => setDropdownOpen(false) },
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
            <div className="w-[80%] h-[1px] mt-2 mx-auto bg-gray-800 rounded-lg"></div>
            <div className="w-[95%] h-[87%] mt-2 py-2 flex flex-col items-center mx-auto">
              <div className="w-[95%] h-40 rounded-3xl bg-neutral-900/80 backdrop-blur-md border border-white/10 shadow-[0_0_20px_rgba(255,255,255,0.05)]">
                <div className="flex gap-2 w-full h-18 px-4 justify-between items-center">
                  <div className="flex flex-col">
                    <h2 className="text-xl font-light bg-gradient-to-r from-white via-gray-200 to-gray-400 bg-clip-text text-transparent">
                      The Attio Collective
                    </h2>
                    <p className="text-xs font-medium text-gray-500"> Jazz Fusion 0.6 miles away</p>
                  </div>
                  <button className="bg-red-500 w-12 h-5 text-xs font-medium rounded-xl text-white
                    shadow-[0_0_10px_rgba(239,68,68,0.8),0_0_20px_rgba(239,68,68,0.5)]
                    animate-pulse transition-all duration-300">
                    Live
                  </button>
                </div>
                <div className="flex gap-1 px-3">
                  <div className="h-6 flex items-center justify-center rounded-xl text-xs w-max px-2 backdrop-blur-md border border-white/10 shadow-[0_0_20px_rgba(255,255,255,0.05)]">IMPOOV</div>
                  <div className="h-6 flex items-center justify-center rounded-xl text-xs w-max px-2 backdrop-blur-md border border-white/10 shadow-[0_0_20px_rgba(255,255,255,0.05)]">BEOOP</div>
                </div>
                <div className="w-full h-16 flex items-center justify-center">
                  <button className="bg-[#F7C10D] rounded-3xl font-sora text-black font-semibold w-[85%] h-10
                    shadow-[0_0_10px_rgba(247,193,13,0.8),0_0_25px_rgba(247,193,13,0.5)]
                    transition-all duration-300">
                    JOIN THE JAM 
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <CreateJamModal open={jamModalOpen} onOpenChange={setJamModalOpen} />
    </div>
  );
};

export default Home;
