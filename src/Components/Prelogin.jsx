import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import BakeHouse from "../assets/BakeHouse.png";

const PreLoginNavbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  // Handle scroll effect for navbar
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 20) {
        setScrolled(true);
      } else {
        setScrolled(false);
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  return (
    <nav
      className={`fixed w-full z-50 transition-all duration-300 ${
        scrolled
          ? "bg-white text-[#5e3023] shadow-md py-2"
          : "bg-transparent py-4"
      }`}
    >
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center">
          {/* Logo */}
          <Link to="/" className="flex items-center">
            <img src={BakeHouse} alt="Bake House Logo" className="h-20 w-20" />
          </Link>
          
          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-6">
            <Link
              to="/home"
              className={`${
                scrolled ? "text-[#5e3023]" : "text-white"
              } hover:text-[#d3756b] transition-colors`}
            >
              Home
            </Link>
            <Link
              to="/about"
              className={`${
                scrolled ? "text-[#5e3023]" : "text-white"
              } hover:text-[#d3756b] transition-colors`}
            >
              About
            </Link>
            <Link
              to="/contact"
              className={`${
                scrolled ? "text-[#5e3023]" : "text-white"
              } hover:text-[#d3756b] transition-colors`}
            >
              Contact
            </Link>
            <Link
              to="/login"
              className={`px-4 py-2 rounded-full ${
                scrolled
                  ? "bg-[#e7dcca] text-[#5e3023] hover:bg-[#d3c2a8]"
                  : "bg-[#e7dcca] text-[#5e3023] hover:bg-[#d3c2a8]"
              } transition-colors`}
            >
              Login
            </Link>
            <Link
              to="/signup"
              className={`px-4 py-2 rounded-full ${
                scrolled
                  ? "bg-[#d3756b] text-white hover:bg-[#c25d52]"
                  : "bg-[#d3756b] text-white hover:bg-[#c25d52]"
              } transition-colors`}
            >
              Sign Up
            </Link>
          </div>

          {/* Mobile menu button */}
          <button
            onClick={toggleMenu}
            className={`md:hidden ${
              scrolled ? "text-[#5e3023]" : "text-white"
            } focus:outline-none`}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              {isMenuOpen ? (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              ) : (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              )}
            </svg>
          </button>
        </div>

        {/* Mobile Navigation Menu */}
        {isMenuOpen && (
          <div className="md:hidden mt-4 pb-4">
            <Link
              to="/home"
              className={`block py-2 ${
                scrolled ? "text-[#5e3023]" : "text-white"
              } hover:text-[#d3756b]`}
              onClick={() => setIsMenuOpen(false)}
            >
              Home
            </Link>
            <Link
              to="/about"
              className={`block py-2 ${
                scrolled ? "text-[#5e3023]" : "text-white"
              } hover:text-[#d3756b]`}
              onClick={() => setIsMenuOpen(false)}
            >
              About
            </Link>
            <Link
              to="/contact"
              className={`block py-2 ${
                scrolled ? "text-[#5e3023]" : "text-white"
              } hover:text-[#d3756b]`}
              onClick={() => setIsMenuOpen(false)}
            >
              Contact
            </Link>
            <Link
              to="/login"
              className={`block py-2 ${
                scrolled ? "text-[#5e3023]" : "text-white"
              } hover:text-[#d3756b]`}
              onClick={() => setIsMenuOpen(false)}
            >
              Login
            </Link>
            <Link
              to="/signup"
              className={`block py-2 ${
                scrolled ? "text-[#5e3023]" : "text-white"
              } hover:text-[#d3756b]`}
              onClick={() => setIsMenuOpen(false)}
            >
              Sign Up
            </Link>
          </div>
        )}
      </div>
    </nav>
  );
};

export default PreLoginNavbar;