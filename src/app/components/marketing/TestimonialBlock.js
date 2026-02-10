'use client';

import { useState, useEffect, useCallback } from 'react';

export default function TestimonialBlock({
  quotes = [
    {
      text: 'Komt afspraken na, denkt mee, is eerlijk en geeft goede adviezen. Zeker aan te raden!',
      author: 'Werkspot-gebruiker',
      city: 'Maastricht',
      project: 'Vochtbestrijding',
    },
    {
      text: 'Het werk is perfect afgeleverd, graag beveel ik deze vakman bij iedereen aan.',
      author: 'Wim Prins',
      city: '',
      project: 'Gevels impregneren',
    },
    {
      text: 'Zeer goed. Mensen komen afspraken na, werken hard, keurig en zijn heel vriendelijk. Ik kan dit bedrijf bij iedereen aanraden.',
      author: 'Annette',
      city: 'Meerssen',
      project: 'Vochtbestrijding',
    },
  ],
  dark = true,
}) {
  const [activeIndex, setActiveIndex] = useState(0);

  const next = useCallback(() => {
    setActiveIndex((prev) => (prev + 1) % quotes.length);
  }, [quotes.length]);

  useEffect(() => {
    const interval = setInterval(next, 7000);
    return () => clearInterval(interval);
  }, [next]);

  const quote = quotes[activeIndex];

  return (
    <section className={dark ? 'bg-[#111827] py-20' : 'bg-[#F9FAFB] py-20'}>
      <div className="max-w-3xl mx-auto px-4 text-center">
        {/* Quote marks */}
        <div className={`text-6xl font-serif leading-none mb-4 ${dark ? 'text-[#8aab4c]' : 'text-[#8aab4c]'}`}>
          &ldquo;
        </div>

        <blockquote
          className={`text-xl md:text-2xl font-serif italic leading-relaxed mb-8 min-h-[80px] transition-opacity duration-500 ${
            dark ? 'text-white' : 'text-[#111827]'
          }`}
        >
          {quote.text}
        </blockquote>

        <div>
          <p className={`font-semibold ${dark ? 'text-white' : 'text-[#111827]'}`}>
            {quote.author}
          </p>
          <p className={`text-sm ${dark ? 'text-[#F9FAFB]/60' : 'text-[#6B7280]'}`}>
            {[quote.city, quote.project].filter(Boolean).join(' — ')}
          </p>
        </div>

        {/* Dots */}
        {quotes.length > 1 && (
          <div className="flex justify-center gap-2 mt-8">
            {quotes.map((_, i) => (
              <button
                key={i}
                onClick={() => setActiveIndex(i)}
                className={`transition-all duration-300 rounded-full ${
                  i === activeIndex
                    ? 'w-8 h-2 bg-[#8aab4c]'
                    : `w-2 h-2 ${dark ? 'bg-white/30 hover:bg-white/50' : 'bg-[#111827]/20 hover:bg-[#111827]/40'}`
                }`}
                aria-label={`Review ${i + 1}`}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
