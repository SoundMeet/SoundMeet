import React from "react";
import Navbar from "../components/Navbar";

const filterPills = ["All", "Jams", "Musicians", "Bands", "Shows"];

const Home = () => {
  return (
    <div className="h-screen bg-neutral-950 text-white flex flex-col overflow-hidden">
      <Navbar />

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
          {filterPills.map((pill) => (
            <button
              key={pill}
              className={`px-4 py-1.5 rounded-full text-sm font-medium border transition-colors ${
                pill === "All"
                  ? "bg-pink-600 border-pink-600 text-white"
                  : "border-neutral-600 text-neutral-300 hover:border-pink-500 hover:text-white"
              }`}
            >
              {pill}
            </button>
          ))}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex flex-1 overflow-hidden">

        {/* Map Area */}
        <div className="relative flex-1 bg-neutral-900">
          {/* Map will go here */}
          <div className="w-full h-full bg-neutral-800 flex items-center justify-center text-neutral-600 text-sm">
            Map Component
          </div>
        </div>

        {/* Sidebar */}
        <div className="w-80 bg-neutral-900 border-l border-neutral-800 flex flex-col overflow-y-auto">
          {/* Sidebar Header */}
          <div className="flex items-center justify-between px-4 py-4 border-b border-neutral-800">
            <h2 className="text-base font-semibold">Near You</h2>
            <div className="flex items-center gap-2">
              {/* Toggle */}
              <div className="w-10 h-5 bg-pink-600 rounded-full relative cursor-pointer">
                <div className="w-4 h-4 bg-white rounded-full absolute right-0.5 top-0.5" />
              </div>
              <button className="w-7 h-7 rounded-full border border-neutral-600 text-neutral-400 hover:text-white flex items-center justify-center text-lg leading-none">
                +
              </button>
            </div>
          </div>

          {/* Cards will go here */}
          <div className="flex flex-col gap-3 p-4">
            <div className="bg-neutral-800 rounded-xl p-4 text-neutral-500 text-sm text-center">
              Jam card
            </div>
            <div className="bg-neutral-800 rounded-xl p-4 text-neutral-500 text-sm text-center">
              Musician card
            </div>
            <div className="bg-neutral-800 rounded-xl p-4 text-neutral-500 text-sm text-center">
              Event card
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default Home;
