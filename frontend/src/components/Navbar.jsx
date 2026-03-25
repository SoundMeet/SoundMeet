<<<<<<< HEAD
<<<<<<< HEAD
import React, { useState } from "react";
=======
import React, { useEffect, useState } from "react";
>>>>>>> 2dc5f40 (Replace navbar logo+text with SVG assets, responsive swap at sm breakpoint)
=======
>>>>>>> e64aeeb (Use Logo.svg as favicon)
import LogowText from "../assets/LogowText.svg";
import LogoOnly from "../assets/Logo.svg";
import { navItems } from "../constants";
import { MdNotificationsNone } from "react-icons/md";
<<<<<<< HEAD
=======
import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { FaUser, FaBars, FaTimes } from "react-icons/fa";

const Navbar = () => {
  const [navHover, setNavHover] = useState(-1);
  const [menuOpen, setMenuOpen] = useState(false);
  const location = useLocation();
  const activePage = navItems.findIndex((item) => item.path === location.pathname);

  return (
<<<<<<< HEAD
<<<<<<< HEAD
=======
>>>>>>> e64aeeb (Use Logo.svg as favicon)
    <div className="w-full bg-none text-white px-4 md:px-8 h-16 flex items-center justify-between relative">
      {/* LEFT: LOGO */}
      <div className="flex items-center">
        <img src={LogowText} className="hidden sm:block h-8 md:h-10" />
        <img src={LogoOnly} className="block sm:hidden h-8" />
<<<<<<< HEAD
=======
    <div
      id="navbar"
      className={`flex inset-x-0 justify-between p-2 font-bold mb-8 backdrop-blur-sm items-center md:px-10 sm:px-10 top-0 transition-all ease-in-out duration-300 z-50 py-10 ${
        isScrolled ? "bg-sky-100 " : "bg-transparent"
      }`}
    >
      <div className="flex items-center gap-2 md:pr-16 pr-0">
        <Link to="/">
          <img src={LogowText} className="hidden sm:block h-8 md:h-10" />
          <img src={LogoOnly} className="block sm:hidden h-8" />
        </Link>
>>>>>>> 2dc5f40 (Replace navbar logo+text with SVG assets, responsive swap at sm breakpoint)
=======
>>>>>>> e64aeeb (Use Logo.svg as favicon)
      </div>

      {/* CENTER: NAV ITEMS (DESKTOP) */}
      <div className="hidden md:flex items-center gap-8">
        {navItems.map((ele, ind) => (
          <Link
            to={ele.path}
            key={ind}
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
              onClick={() => setMenuOpen(false)}
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