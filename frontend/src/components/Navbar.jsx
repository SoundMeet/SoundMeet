import React, { useState } from "react";
import Logo from "../assets/Logosmall.png";
import { navItems } from "../constants";
import { MdNotificationsNone } from "react-icons/md";
import { Link } from "react-router-dom";
import { FaUser, FaBars, FaTimes } from "react-icons/fa";

const Navbar = () => {
  const [navHover, setNavHover] = useState(-1);
  const [activePage, setActivePage] = useState(0);
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="w-full bg-none text-white px-4 md:px-8 h-16 flex items-center justify-between relative">
      {/* LEFT: LOGO */}
      <div className="flex items-center gap-2">
        <img src={Logo} className="w-8 h-8 md:w-10 md:h-10" />
        <h2 className="text-lg md:text-2xl font-medium">SoundMeet</h2>
      </div>

      {/* CENTER: NAV ITEMS (DESKTOP) */}
      <div className="hidden md:flex items-center gap-8">
        {navItems.map((ele, ind) => (
          <Link
            to={ele.path}
            key={ind}
            onClick={() => setActivePage(ind)}
            onMouseEnter={() => setNavHover(ind)}
            onMouseLeave={() => setNavHover(-1)}
            className="relative text-sm md:text-base font-medium"
          >
            {ele.name}
            <div
              className={`absolute mt-1 ${
                navHover === ind || activePage === ind ? "w-full" : "w-0"
              } bg-[#DC2E73] transition-all duration-300 rounded-lg h-0.5`}
            />
          </Link>
        ))}
      </div>

      {/* RIGHT: ICONS */}
      <div className="hidden md:flex items-center gap-4">
        <MdNotificationsNone className="text-xl md:text-2xl cursor-pointer" />
        <div className="w-8 h-8 md:w-9 md:h-9 rounded-full bg-gray-300 flex items-center justify-center overflow-hidden">
          <FaUser />
        </div>
      </div>

      {/* MOBILE MENU BUTTON */}
      <div className="md:hidden">
        {menuOpen ? (
          <FaTimes onClick={() => setMenuOpen(false)} className="text-xl" />
        ) : (
          <FaBars onClick={() => setMenuOpen(true)} className="text-xl" />
        )}
      </div>

      {/* MOBILE MENU */}
      {menuOpen && (
        <div className="absolute top-16 left-0 w-full flex flex-col items-center gap-6 py-6 md:hidden z-50">
          {navItems.map((ele, ind) => (
            <Link
              to={ele.path}
              key={ind}
              onClick={() => {
                setActivePage(ind);
                setMenuOpen(false);
              }}
              className="text-lg font-medium"
            >
              {ele.name}
            </Link>
          ))}

          {/* Mobile Icons */}
          <div className="flex items-center gap-6 mt-4">
            <MdNotificationsNone className="text-2xl" />
            <div className="w-9 h-9 rounded-full bg-gray-300 flex items-center justify-center">
              <FaUser />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Navbar;