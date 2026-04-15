import { useState } from "react";
import LogowText from "../assets/LogowText.svg";
import { navItems } from "../constants";
import { Link, useLocation } from "react-router-dom";
import ProfileDropdown from "./ProfileDropdown";
import { NotificationsDropdown } from "./notifications/NotificationsDropdown";

const Navbar = () => {
  const [navHover, setNavHover] = useState(-1);
  const location = useLocation();
  const activePage = navItems.findIndex((item) => item.path === location.pathname);

  const isOnboarding = location.pathname === '/onboarding'

  return (
    <div className={`w-full bg-none text-white px-4 md:px-8 h-16 items-center justify-between relative ${isOnboarding ? 'hidden md:flex' : 'flex'}`}>

      {/* LEFT: LOGO — routes to home */}
      <Link to="/" className="flex items-center">
        <img src={LogowText} className="h-8 md:h-10" />
      </Link>

      {/* CENTER: NAV ITEMS (DESKTOP ONLY) */}
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

      {/* RIGHT: ICONS (BOTH MOBILE AND DESKTOP) */}
      <div className="flex items-center gap-4">
        <NotificationsDropdown />
        <ProfileDropdown />
      </div>

    </div>
  );
};

export default Navbar;