"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";

const Navbar = () => {
  const [user, setUser] = useState(null);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  // ✅ Fetch user info from backend (/api/user/me)
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await fetch("/api/user/me", { credentials: "include" }); // cookie sent automatically
        if (res.ok) {
          const data = await res.json();
          setUser(data.user);
        } else {
          setUser(null);
        }
      } catch (error) {
        console.error("Failed to fetch user:", error);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, []);

  const handleLogout = async () => {
    try {
      await fetch("/api/user/logout", { method: "POST" });
      setUser(null);
      window.location.href = "/";
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  return (
    <header className="bg-[#121021] text-white font-sans py-4 px-8 lg:px-20 flex justify-between items-center w-full shadow-md">
      {/* Left section: Logo and Nav Links */}
      <div className="flex items-center space-x-8">
        <Link href="/" className="flex items-center space-x-2 text-xl font-bold">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-6 w-6 text-[#8B5CF6]"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m14-6h2m-2 6h2M12 3c-1.105 0-2 .895-2 2v14c0 1.105.895 2 2 2s2-.895 2-2V5c0-1.105-.895-2-2-2zM4 9c0 1.105.895 2 2 2h12c1.105 0 2-.895 2-2s-.895-2-2-2H6c-1.105 0-2 .895-2 2zm0 6c0 1.105.895 2 2 2h12c1.105 0 2-.895 2-2s-.895-2-2-2H6c-1.105 0-2 .895-2 2z"
            />
          </svg>
          <span className="hidden lg:inline">Platform</span>
        </Link>

        {/* Navigation links */}
        <nav className="hidden lg:flex items-center space-x-6">
          <NavLinkDropdown
            text="Explore Databases"
            items={["Vector Databases", "Graph Databases", "Relational Databases"]}
          />
          <NavLink text="AI Toolbox" />
          <NavLink text="Learn" />
        </nav>
      </div>

      {/* Right section: Auth buttons */}
      <div className="flex items-center space-x-4 relative">
        <Link
          className="bg-[#8B5CF6] hover:bg-[#7D49E0] text-white font-medium py-2 px-6 rounded-md transition-colors duration-200"
          href="/subscription"
        >
          Upgrade
        </Link>

        {loading ? (
          <span className="text-gray-400 text-sm">Loading...</span>
        ) : !user ? (
          <>
            {/* Logged OUT */}
            <Link
              className="bg-[#8B5CF6] hover:bg-[#7D49E0] text-white font-medium py-2 px-6 rounded-md transition-colors duration-200"
              href="/user/register"
            >
              Sign Up
            </Link>
            <Link
              className="bg-[#24223A] hover:bg-[#312E48] text-white font-medium py-2 px-6 rounded-md transition-colors duration-200"
              href="/user/login"
            >
              Login
            </Link>
          </>
        ) : (
          <>
            {/* Logged IN */}
            <Link
              className="bg-[#8B5CF6] hover:bg-[#7D49E0] text-white font-medium py-2 px-6 rounded-md transition-colors duration-200 flex items-center gap-2"
              href="/create-prompt"
            >
              <span className="text-lg">+</span> Add Prompt
            </Link>

            {/* Profile dropdown */}
            <div className="relative">
              <div
                onClick={() => setIsProfileOpen(!isProfileOpen)}
                className="bg-[#24223A] hover:bg-[#312E48] text-white font-bold py-2 px-4 rounded-md cursor-pointer"
                title={user.username || user.name}
              >
                {user.username
                  ? user.username.charAt(0).toUpperCase()
                  : user.name.charAt(0).toUpperCase()}
              </div>

              {isProfileOpen && (
                <div className="absolute right-0 mt-2 w-60 bg-[#1A192B] rounded-md shadow-lg z-20">
                  {/* Library Section */}
                  <LinkItem href="/myprompt" text="📚 My Prompts" />
                  <LinkItem href="/public-prompts" text="🔍 Browse Database" />
                  <LinkItem href="/dashboard" text="📊 Dashboard" />

                  <hr className="border-gray-700 my-2" />

                  {/* Account Section */}
                  <LinkItem href="/user/profile" text="⚙️ Account" />

                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-400 hover:bg-[#2A283D] hover:text-red-500 transition-colors duration-200 text-left"
                  >
                    <span>↩️</span> Logout
                  </button>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </header>
  );
};

const LinkItem = ({ href, text }) => (
  <Link
    href={href}
    className="flex items-center gap-2 px-4 py-2 text-sm text-gray-300 hover:bg-[#2A283D] hover:text-white transition-colors duration-200"
  >
    {text}
  </Link>
);

const NavLink = ({ text, isSpecial }) => {
  const specialClasses = isSpecial
    ? "bg-gradient-to-r from-yellow-400 via-amber-400 to-yellow-500 bg-clip-text text-transparent font-semibold"
    : "text-gray-400 hover:text-white transition-colors duration-200";

  return (
    <Link href="#" className={`text-lg py-2 ${specialClasses}`}>
      {text}
    </Link>
  );
};

const NavLinkDropdown = ({ text, items }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center text-lg text-gray-400 hover:text-white transition-colors duration-200 focus:outline-none"
      >
        {text}
        <svg
          className={`ml-2 h-4 w-4 transform transition-transform duration-200 ${isOpen ? "rotate-180" : "rotate-0"
            }`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {isOpen && (
        <div className="absolute left-0 mt-2 w-48 bg-[#24223A] rounded-md shadow-lg z-10">
          {items.map((item, index) => (
            <Link
              key={index}
              href="#"
              className="block px-4 py-2 text-sm text-gray-400 hover:bg-[#312E48] hover:text-white"
            >
              {item}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};

export default Navbar;
