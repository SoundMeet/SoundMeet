import React, { useEffect, useState } from "react";
import reactLogo from "../assets/react.svg";
import { navItems } from "../constants";
import { Link, useLocation } from "react-router-dom";
console.log(navItems);
const Navbar = () => {
  const [open, setOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const location = useLocation();
  const toggleNavbar = () => {
    setOpen(!open);
  };
  const closeNavbar = () => {
    setOpen(false);
  };

  const handleScroll = () => {
    if (window.scrollY > 100) {
      setIsScrolled(true);
    } else {
      setIsScrolled(false);
    }
  };

  useEffect(() => {
    window.addEventListener("scroll", handleScroll);
    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);
  return (
    <div
      id="navbar"
      className={`flex inset-x-0 justify-between p-2 font-bold mb-8 backdrop-blur-sm items-center md:px-10 sm:px-10 top-0 transition-all ease-in-out duration-300 z-50 py-10 ${
        isScrolled ? "bg-sky-100 " : "bg-transparent"
      }`}
    >
      <div className="flex items-center gap-2 md:pr-16 pr-0">
        <Link
          to="/"
          className="flex text-lg font-semiboldflex items-center gap-2 "
        >
          <img src={reactLogo} alt="" className="h-8 w-8" />
          <span>Soundmeet</span>
        </Link>
      </div>

      <div className="md:hidden">
        <button
          className="text-neutral-600 focus:outline-none"
          onClick={toggleNavbar}
        >
          <i className="fa-solid fa-bars"></i>
        </button>
      </div>

      <div
        className={`fixed md:static top-0 right-0  h-screen md:h-auto w-full md:w-auto bg-gray-950 border-l md:border-none border-neutral-300 md:bg-transparent md:shallow-none ease-in-out duration-300 transition-transform flex-1 ${
          open ? "translate-x-0" : "translate-x-full"
        } md:translate-x-0 z-60`}
      >
        <div className="w full md:hidden flex items-center justify-between px-4">
          <Link
            to="/"
            className="flex text-lg font-semiboldflex items-center gap-2 "
          >
            <img src={reactLogo} alt="" className="h-8 w-8" />
            <span>Soundmeet</span>
          </Link>
          <div className="md:hidden flex justify-end py-6">
            <button onClick={closeNavbar} className="text-red-500">
              <i className="fa-solid fa-x"></i>
            </button>
          </div>
        </div>
        {/* <div className="border-b border-neutral-300 md:hidden"></div> */}
        <div className="flex-1 flex flex-col md:flex-row items-center justify-between gap-6 p-6 md:p-0">
          <ul className="flex flex-col md:flex-row items-center gap-6 text-base text-neutral-700 font-normal">
            {navItems.map((navItem) => (
              <li
                key={navItem.id}
                onClick={closeNavbar}
                className={`cursor-pointer transition-colors font-sora ${
                  location.pathname === navItem.path
                    ? "text-brand-red"
                    : "md:text-neutral-200 text-light"
                } hover:text-brand-red`}
              >
                <Link to={navItem.path}>{navItem.name}</Link>
              </li>
            ))}
          </ul>
        </div>
      </div>
        <div className="flex gap-2">
        <i className="fa-regular fa-bell bg-blue-500 p-2 rounded-full"></i>
        <i className="fa-solid fa-user bg-purple-500 p-2 rounded-full"></i>
      </div>
      {/* <div className="flex gap-2">
        <img src={reactLogo} alt="" className="h-8 w-8" />
        <div className="text-lg">Soundmeet</div>
      </div>
      <div className="flex gap-2">
        <div>Discover</div>
        <div>Meet</div>
        <div>My Jams</div>
        <div>Chat</div>
        <div>Friends</div>
      </div>
      <div className="flex gap-2">
        <i className="fa-regular fa-bell bg-blue-500 p-2 rounded-full"></i>
        <i className="fa-solid fa-user bg-purple-500 p-2 rounded-full"></i>
      </div> */}
    </div>
  );
};

export default Navbar;
