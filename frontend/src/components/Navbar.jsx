import { useState } from "react";
import LogowText from "../assets/LogowText.svg";
import LogoOnly from "../assets/Logo.svg";
import { navItems } from "../constants";
import { Link, useLocation } from "react-router-dom";
import { FaBars, FaTimes } from "react-icons/fa";
import ProfileDropdown from "./ProfileDropdown";
import { NotificationsDropdown } from "./notifications/NotificationsDropdown";
import { useNotifications } from "../context/NotificationsContext";

const Navbar = () => {
  const [navHover, setNavHover] = useState(-1);
  const [menuOpen, setMenuOpen] = useState(false);
  const location = useLocation();
  const { unreadCount } = useNotifications();
  const activePage = navItems.findIndex((item) => item.path === location.pathname);

  return (
    <div className="w-full bg-none text-white px-4 md:px-8 h-16 flex items-center justify-between relative">
      {/* LEFT: LOGO */}
      <div className="flex items-center">
        <img src={LogowText} className="hidden sm:block h-8 md:h-10" />
        <img src={LogoOnly} className="block sm:hidden h-8" />
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
        <NotificationsDropdown />
        <ProfileDropdown />
      </div>

      {/* MOBILE MENU BUTTON */}
      <div className="md:hidden">
        {menuOpen ? (
          <FaTimes onClick={() => setMenuOpen(false)} className="text-xl" />
        ) : (
          <div className="relative inline-block">
            <FaBars onClick={() => setMenuOpen(true)} className="text-xl cursor-pointer" />
            {unreadCount > 0 && (
              <span
                className="absolute -top-1.5 -right-1.5 min-w-[15px] h-[15px] px-0.5 rounded-full flex items-center justify-center text-[8px] font-bold text-white pointer-events-none"
                style={{ background: '#ef4444', lineHeight: 1 }}
              >
                {unreadCount > 99 ? '99+' : unreadCount}
              </span>
            )}
          </div>
        )}
      </div>

      {/* MOBILE MENU */}
      {menuOpen && (
        <div className="absolute top-16 left-0 w-full flex flex-col items-center gap-6 py-6 md:hidden z-40"
          style={{ background: 'rgba(18,18,18,0.97)', backdropFilter: 'blur(20px)' }}
        >
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
            <NotificationsDropdown />
            <ProfileDropdown />
          </div>
        </div>
      )}
    </div>
  );
};

export default Navbar;
