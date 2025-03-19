'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      const offset = window.scrollY;
      if (offset > 50) {
        setScrolled(true);
      } else {
        setScrolled(false);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  return (
    <header className={`navbar fixed w-full z-50 ${scrolled ? 'py-2' : 'py-3 md:py-5'}`}>
      <div className="container-narrow flex items-center justify-between">
        <Link href="/" className="flex items-center">
          <div className="relative h-10 w-10 md:h-12 md:w-12 mr-2 md:mr-3">
            <Image 
              src="/logo.png" 
              alt="Moonen Vochtwering Logo" 
              width={48}
              height={48}
              className="object-contain"
              style={{ filter: 'drop-shadow(0px 1px 2px rgba(0, 0, 0, 0.1))' }}
            />
          </div>
          <span className="font-bold text-base md:text-xl tracking-tight text-black">Moonen Vochtwering</span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center space-x-6 md:space-x-8">
          <Link href="#diensten" className="text-black hover:text-primary transition-all text-sm md:text-base">
            Diensten
          </Link>
          <Link href="#oplossingen" className="text-black hover:text-primary transition-all text-sm md:text-base">
            Oplossingen
          </Link>
          <Link href="#werkwijze" className="text-black hover:text-primary transition-all text-sm md:text-base">
            Werkwijze
          </Link>
          <Link href="#over-ons" className="text-black hover:text-primary transition-all text-sm md:text-base">
            Over ons
          </Link>
          <Link href="#contact" className="text-black hover:text-primary transition-all text-sm md:text-base">
            Contact
          </Link>
          <Link href="#contact" className="btn btn-primary text-sm md:text-base">
            Gratis inspectie
          </Link>
        </nav>

        {/* Mobile Menu Button */}
        <button 
          className="md:hidden flex items-center"
          onClick={() => setIsOpen(!isOpen)}
          aria-label={isOpen ? 'Close Menu' : 'Open Menu'}
        >
          <svg 
            className="w-6 h-6 text-black" 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24" 
            xmlns="http://www.w3.org/2000/svg"
          >
            {isOpen ? (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            )}
          </svg>
        </button>
      </div>

      {/* Mobile Menu */}
      {isOpen && (
        <div className="md:hidden absolute top-full left-0 right-0 bg-white border-b border-gray-200 animate-fade-in">
          <div className="container-narrow py-4 flex flex-col space-y-3">
            <Link 
              href="#diensten" 
              className="text-black hover:text-primary py-2 transition-all text-sm"
              onClick={() => setIsOpen(false)}
            >
              Diensten
            </Link>
            <Link 
              href="#oplossingen" 
              className="text-black hover:text-primary py-2 transition-all text-sm"
              onClick={() => setIsOpen(false)}
            >
              Oplossingen
            </Link>
            <Link 
              href="#werkwijze" 
              className="text-black hover:text-primary py-2 transition-all text-sm"
              onClick={() => setIsOpen(false)}
            >
              Werkwijze
            </Link>
            <Link 
              href="#over-ons" 
              className="text-black hover:text-primary py-2 transition-all text-sm"
              onClick={() => setIsOpen(false)}
            >
              Over ons
            </Link>
            <Link 
              href="#contact" 
              className="text-black hover:text-primary py-2 transition-all text-sm"
              onClick={() => setIsOpen(false)}
            >
              Contact
            </Link>
            <Link 
              href="#contact" 
              className="btn btn-primary inline-block text-center text-sm"
              onClick={() => setIsOpen(false)}
            >
              Gratis inspectie
            </Link>
          </div>
        </div>
      )}
    </header>
  );
} 