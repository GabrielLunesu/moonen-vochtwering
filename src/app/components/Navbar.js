'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeSection, setActiveSection] = useState('home');

  useEffect(() => {
    const handleScroll = () => {
      const isScrolled = window.scrollY > 10;
      if (isScrolled !== scrolled) {
        setScrolled(isScrolled);
      }

      // Update active section based on scroll position
      const sections = ['home', 'over-ons', 'diensten', 'werkgebied', 'contact'];
      const currentSection = sections.find(section => {
        const element = document.getElementById(section);
        if (element) {
          const rect = element.getBoundingClientRect();
          return rect.top <= 100 && rect.bottom >= 100;
        }
        return false;
      });

      if (currentSection) {
        setActiveSection(currentSection);
      }
    };

    document.addEventListener('scroll', handleScroll);
    return () => {
      document.removeEventListener('scroll', handleScroll);
    };
  }, [scrolled]);

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  const navItems = [
    { name: 'Home', href: '#home' },
    { name: 'Over ons', href: '#over-ons' },
    { name: 'Diensten', href: '#diensten' },
    { name: 'Werkgebied', href: '#werkgebied' },
    { name: 'Contact', href: '#contact' },
  ];

  return (
    <nav className={`floating-navbar fixed w-full z-50 transition-all duration-300 ${scrolled ? 'py-2 shadow-md' : 'py-4'}`}>
      <div className="container mx-auto px-4 flex justify-between items-center">
        <Link href="#home" className="flex items-center group">
          <div className="relative h-12 w-12 mr-2 overflow-hidden rounded-full transition-transform duration-300 group-hover:scale-110">
            <Image 
              src="https://placehold.co/100x100/0052cc/FFFFFF/png?text=DL" 
              alt="Donato Lunesu Logo" 
              fill 
              className="object-contain"
            />
          </div>
          <span className="text-lg font-bold transition-colors duration-300 group-hover:text-primary">Donato Lunesu</span>
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden md:flex space-x-8">
          {navItems.map((item) => (
            <Link 
              key={item.name} 
              href={item.href}
              className={`text-gray-800 hover:text-primary transition-colors duration-300 relative ${activeSection === item.href.substring(1) ? 'text-primary font-medium' : ''}`}
            >
              {item.name}
              {activeSection === item.href.substring(1) && (
                <span className="absolute -bottom-1 left-0 w-full h-0.5 bg-primary"></span>
              )}
            </Link>
          ))}
        </div>

        <div className="hidden md:block">
          <Link 
            href="#contact" 
            className="btn-primary px-6 py-2 rounded-full font-medium transition-transform hover:scale-105"
          >
            Contact opnemen
          </Link>
        </div>

        {/* Mobile Menu Button */}
        <button 
          className="md:hidden text-gray-800 focus:outline-none" 
          onClick={toggleMobileMenu}
          aria-label={mobileMenuOpen ? 'Sluit menu' : 'Open menu'}
        >
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            className="h-6 w-6" 
            fill="none" 
            viewBox="0 0 24 24" 
            stroke="currentColor"
          >
            {mobileMenuOpen ? (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            )}
          </svg>
        </button>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-white py-4 px-4 animate-fade-in shadow-md">
          <div className="flex flex-col space-y-4">
            {navItems.map((item) => (
              <Link 
                key={item.name} 
                href={item.href}
                className={`text-gray-800 hover:text-primary py-2 transition-colors duration-300 ${activeSection === item.href.substring(1) ? 'text-primary font-medium' : ''}`}
                onClick={() => setMobileMenuOpen(false)}
              >
                {item.name}
              </Link>
            ))}
            <Link 
              href="#contact" 
              className="btn-primary px-6 py-2 rounded-full font-medium text-center"
              onClick={() => setMobileMenuOpen(false)}
            >
              Contact opnemen
            </Link>
          </div>
        </div>
      )}
    </nav>
  );
} 