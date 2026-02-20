'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';

const services = [
  { name: 'Kelderafdichting', href: '/diensten/kelderafdichting' },
  { name: 'Opstijgend vocht', href: '/diensten/opstijgend-vocht' },
  { name: 'Schimmelbestrijding', href: '/diensten/schimmelbestrijding' },
  { name: 'Gevelimpregnatie', href: '/diensten/gevelimpregnatie' },
  { name: 'Vochtwerend stucwerk', href: '/diensten/vochtwerend-stucwerk' },
];

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [dienstenOpen, setDienstenOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  return (
    <header
      className={`fixed w-full z-50 transition-all duration-300 bg-white ${scrolled
        ? 'py-2 shadow-sm'
        : 'py-4'
        }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
        <Link href="/" className="flex items-center">
          <Image
            src="/logo/logo.png"
            alt="Moonen Vochtwering"
            width={40}
            height={40}
            className={`object-contain transition-all duration-300 lg:hidden ${scrolled ? 'h-9 w-9' : 'h-10 w-10'}`}
            priority
          />
          <Image
            src="/logo/logo.svg"
            alt="Moonen Vochtwering"
            width={220}
            height={56}
            className={`object-contain transition-all duration-300 hidden lg:block ${scrolled ? 'h-12' : 'h-14'}`}
            priority
          />
        </Link>

        {/* Desktop nav */}
        <nav className="hidden lg:flex items-center gap-8">
          {/* Diensten dropdown */}
          <div
            className="relative"
            onMouseEnter={() => setDienstenOpen(true)}
            onMouseLeave={() => setDienstenOpen(false)}
          >
            <button className="flex items-center gap-1 text-[#111827] hover:text-[#8aab4c] transition-colors text-sm font-medium">
              Diensten
              <svg className={`w-4 h-4 transition-transform ${dienstenOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            {dienstenOpen && (
              <div className="absolute top-full left-0 pt-2">
                <div className="bg-white rounded-lg shadow-xl border border-gray-100 py-2 min-w-[240px]">
                  {services.map((service) => (
                    <Link
                      key={service.href}
                      href={service.href}
                      className="block px-4 py-2.5 text-sm text-[#111827] hover:bg-[#F9FAFB] hover:text-[#8aab4c] transition-colors"
                    >
                      {service.name}
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>

          <Link href="/werkwijze" className="text-[#111827] hover:text-[#8aab4c] transition-colors text-sm font-medium">
            Werkwijze
          </Link>
          <Link href="/over-ons" className="text-[#111827] hover:text-[#8aab4c] transition-colors text-sm font-medium">
            Over ons
          </Link>
          <Link href="/veelgestelde-vragen" className="text-[#111827] hover:text-[#8aab4c] transition-colors text-sm font-medium">
            FAQ
          </Link>
          <Link
            href="/gratis-inspectie"
            className="bg-[#8aab4c] hover:bg-[#769B3D] text-white px-5 py-2.5 rounded-md text-sm font-semibold transition-all hover:-translate-y-0.5 shadow-sm hover:shadow-md"
          >
            Gratis inspectie
          </Link>
        </nav>

        {/* Mobile hamburger */}
        <button
          className="lg:hidden p-2"
          onClick={() => setIsOpen(!isOpen)}
          aria-label={isOpen ? 'Menu sluiten' : 'Menu openen'}
        >
          <svg className="w-6 h-6 text-[#111827]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            {isOpen ? (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            )}
          </svg>
        </button>
      </div>

      {/* Mobile menu */}
      {isOpen && (
        <div className="lg:hidden fixed inset-0 top-[64px] bg-white z-40 overflow-y-auto">
          <div className="px-4 py-6 flex flex-col gap-1">
            <p className="text-xs font-semibold text-[#6B7280] uppercase tracking-wider px-3 mb-2">Diensten</p>
            {services.map((service) => (
              <Link
                key={service.href}
                href={service.href}
                className="block px-3 py-2.5 text-[#111827] hover:text-[#8aab4c] text-sm rounded-md hover:bg-[#F9FAFB] transition-colors"
                onClick={() => setIsOpen(false)}
              >
                {service.name}
              </Link>
            ))}
            <div className="h-px bg-gray-200 my-3" />
            <Link href="/werkwijze" className="block px-3 py-2.5 text-[#111827] hover:text-[#8aab4c] text-sm font-medium" onClick={() => setIsOpen(false)}>
              Werkwijze
            </Link>
            <Link href="/over-ons" className="block px-3 py-2.5 text-[#111827] hover:text-[#8aab4c] text-sm font-medium" onClick={() => setIsOpen(false)}>
              Over ons
            </Link>
            <Link href="/veelgestelde-vragen" className="block px-3 py-2.5 text-[#111827] hover:text-[#8aab4c] text-sm font-medium" onClick={() => setIsOpen(false)}>
              Veelgestelde vragen
            </Link>
            <div className="mt-4 px-3">
              <Link
                href="/gratis-inspectie"
                className="block bg-[#8aab4c] hover:bg-[#769B3D] text-white text-center px-5 py-3 rounded-md text-sm font-semibold transition-colors"
                onClick={() => setIsOpen(false)}
              >
                Gratis inspectie aanvragen
              </Link>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
