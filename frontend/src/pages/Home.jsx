import React, { useState, useRef, useEffect } from "react";
import MapComponent from "../components/MapComponent";
import Glowbutton from "../components/Glowbutton";
import GlowSwitch from "../components/GlowSwitch";
import { motion, AnimatePresence } from "framer-motion";
import CreateJamModal from "../components/CreateJamModal";
const filterPills = ["All", "Jams", "Musicians", "Bands", "Shows"];

const Home = () => {
  const [activePill, setActivePill] = useState(0);
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
    <div className="fixed inset-0 text-white">
      {/* Full-screen map background */}
      <div className="fixed inset-x-0 bottom-0 top-16 z-0">
        <MapComponent />
        {/* Vignette overlay — sits above map, below all UI. pointer-events-none keeps map fully interactive.
            Tune the radial-gradient stop positions/opacities to adjust:
              - Darker corners:   raise the last rgba opacity (currently 0.46)
              - Wider clear center: raise the first stop % (currently 34%)
              - Softer overall:   lower all rgba opacities proportionally
            Tune the linear-gradient to adjust:
              - Darker top fade:  raise the first stop opacity (currently 0.34)
              - Lighter bottom:   lower the last stop opacity (currently 0.16)
        */}
        {/* Top navbar-to-map gradient — separate from vignette.
            Tune to adjust:
              - Darker top:     raise the first stop opacity (currently 0.68)
              - Longer fade:    increase h-40 (e.g. h-56) or raise the mid stop %s
              - Softer fade:    lower the first stop opacity (e.g. 0.50)
              - More subtle:    lower all stop opacities proportionally
        */}
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

      {/* Top blur — covers navbar, fades 16px below it */}
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
              {filterPills.map((pill, ind) => {
                return (
                  <Glowbutton
                    key={ind}
                    isActive={activePill === ind}
                    value={pill}
                    onClick={() => {
                      setActivePill(ind);
                    }}
                  />
                );
              })}
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex w-full flex-1">
          {/* Left: transparent — map shows through */}
          <div className="w-[68%] h-full pointer-events-none" />

          {/* Right: sidebar */}
          <div className="w-[32%] h-full flex items-center justify-center pointer-events-auto">
            <div className="w-[95%] h-[95%] pt-2 rounded-3xl bg-neutral-900/50 backdrop-blur-2xl border border-white/10 shadow-[0_0_20px_rgba(220,46,115,0.55)]">
              <div className="w-full h-14 px-6 pt-2 items-center flex justify-between">
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
                            {
                              label: "Create Jam",
                              icon: "🎵",
                              onClick: () => {
                                setJamModalOpen(true);
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
              <div className="w-[80%] h-[1px] mt-2 mx-auto bg-gray-800 rounded-lg"></div>
              <div className="w-[95%] h-[87%] mt-2 py-2 flex flex-col items-center mx-auto">
                <div className="w-[95%] h-40 rounded-3xl bg-neutral-900/80 backdrop-blur-md border border-white/10 shadow-[0_0_20px_rgba(255,255,255,0.05)]">
                  <div className="flex gap-2 w-full h-18 px-4 justify-between items-center">
                    <div className="flex flex-col">
                      <h2 className="text-xl font-light bg-gradient-to-r from-white via-gray-200 to-gray-400 bg-clip-text text-transparent">
                        The Jam Collective
                      </h2>
                      <p className="text-xs font-medium text-gray-500">
                        {" "}
                        Jazz Fusion 0.6 miles away
                      </p>
                    </div>
                    <button
                      className="bg-red-500 w-12 h-5 text-xs font-medium rounded-xl text-white
                    shadow-[0_0_10px_rgba(239,68,68,0.8),0_0_20px_rgba(239,68,68,0.5)]
                    animate-pulse transition-all duration-300"
                    >
                      Live
                    </button>
                  </div>
                  <div className="flex gap-1 px-3">
                    <div className="h-6 flex items-center justify-center rounded-xl text-xs w-max px-2 backdrop-blur-md border border-white/10 shadow-[0_0_20px_rgba(255,255,255,0.05)]">
                      IMPOOV
                    </div>
                    <div className="h-6 flex items-center justify-center rounded-xl text-xs w-max px-2 backdrop-blur-md border border-white/10 shadow-[0_0_20px_rgba(255,255,255,0.05)]">
                      BEOOP
                    </div>
                  </div>
                  <div className="w-full h-16 flex items-center justify-center">
                    <button
                      className="bg-[#F7C10D] rounded-3xl font-sora text-black font-semibold w-[85%] h-10
                    shadow-[0_0_10px_rgba(247,193,13,0.8),0_0_25px_rgba(247,193,13,0.5)]
                    transition-all duration-300"
                    >
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
    </div>
  );
};

export default Home;
