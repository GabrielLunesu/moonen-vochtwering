'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function StickyCtaBar() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      const heroHeight = window.innerHeight;
      const docHeight = document.documentElement.scrollHeight;
      const scrollPos = window.scrollY + window.innerHeight;
      const footerBuffer = 300;

      const pastHero = window.scrollY > heroHeight * 0.8;
      const nearFooter = scrollPos > docHeight - footerBuffer;

      setVisible(pastHero && !nearFooter);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div
      className={`fixed bottom-0 left-0 right-0 z-40 bg-[#111827]/95 backdrop-blur-sm border-t border-white/10 transition-transform duration-300 ${
        visible ? 'translate-y-0' : 'translate-y-full'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
        <p className="text-white/80 text-sm hidden sm:block">
          Gratis inspectie aanvragen — Binnen een week bij u aan huis
        </p>
        <Link
          href="/gratis-inspectie"
          className="bg-[#8aab4c] hover:bg-[#769B3D] text-white px-5 py-2 rounded-md text-sm font-semibold transition-colors whitespace-nowrap sm:ml-auto"
        >
          Plan nu in →
        </Link>
      </div>
    </div>
  );
}
