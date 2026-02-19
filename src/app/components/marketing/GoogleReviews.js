'use client';

import { useState, useEffect, useCallback } from 'react';

const reviewsData = [
  {
    id: 1,
    author: 'Werkspot-gebruiker uit Maastricht',
    rating: 5,
    text: 'Komt afspraken na, denkt mee, is eerlijk en geeft goede adviezen. Zeker aan te raden!',
    project: 'Vochtbestrijding: 10 m2',
  },
  {
    id: 2,
    author: 'Annette, Meerssen',
    rating: 5,
    text: 'Zeer goed. Mensen komen afspraken na, werken hard, keurig en zijn heel vriendelijk en flexibel. Ik kan dit bedrijf bij iedereen aanraden.',
    project: 'Vochtbestrijding: 16 m2',
  },
  {
    id: 3,
    author: 'Penders, Vaals',
    rating: 5,
    text: 'Een beetje late review (alweer twee jaar geleden). Maar alles is netjes uitgevoerd - en ook nu, na twee jaar, houdt de impregnering van de gevel prima!',
    project: 'Gevel reinigen en impregneren',
  },
  {
    id: 4,
    author: 'Wim Prins',
    rating: 5,
    text: 'Het werk is perfect afgeleverd, graag beveel ik deze vakman bij iedereen aan.',
    project: 'Gevels impregneren',
  },
  {
    id: 5,
    author: 'Jo Smeets',
    rating: 5,
    text: 'Donato heeft de kelder afgewerkt, het was een erg moeilijke klus. Hij heeft zich echt verdiept in de klus, kwam al zijn afspraken na en is bovendien een aardige en spontane man.',
    project: 'Kelder waterdicht maken',
  },
];

function Stars({ rating }) {
  return (
    <div className="flex gap-0.5">
      {Array.from({ length: 5 }, (_, i) => (
        <svg key={i} className={`w-5 h-5 ${i < rating ? 'text-yellow-400' : 'text-gray-300'}`} fill="currentColor" viewBox="0 0 20 20">
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
    </div>
  );
}

export default function GoogleReviews() {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => { setIsMounted(true); }, []);

  const handleNext = useCallback(() => {
    setActiveIndex((prev) => (prev + 1) % reviewsData.length);
  }, []);

  const handlePrev = useCallback(() => {
    setActiveIndex((prev) => (prev === 0 ? reviewsData.length - 1 : prev - 1));
  }, []);

  useEffect(() => {
    if (!isMounted) return;
    const interval = setInterval(handleNext, 8000);
    return () => clearInterval(interval);
  }, [handleNext, isMounted]);

  const review = reviewsData[activeIndex];

  return (
    <section className="py-20 bg-[#F9FAFB]">
      <div className="max-w-4xl mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="font-serif text-3xl md:text-4xl text-[#111827] mb-3">
            Al 1000+ tevreden klanten in Zuid-Limburg
          </h2>
          <p className="text-[#6B7280] text-lg max-w-2xl mx-auto">
            Sluit u aan bij de vele huiseigenaren die weer genieten van een droge, gezonde woning.
          </p>
        </div>

        <div className="relative">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 md:p-10 min-h-[220px] flex flex-col">
            <div className="flex-grow mb-6">
              <svg className="w-10 h-10 text-[#8aab4c]/20 mb-4" fill="currentColor" viewBox="0 0 32 32">
                <path d="M9.352 4C4.456 7.456 1 13.12 1 19.36c0 5.088 3.072 8.064 6.624 8.064 3.36 0 5.856-2.688 5.856-5.856 0-3.168-2.208-5.472-5.088-5.472-.576 0-1.344.096-1.536.192.48-3.264 3.552-7.104 6.624-9.024L9.352 4zm16.512 0c-4.8 3.456-8.256 9.12-8.256 15.36 0 5.088 3.072 8.064 6.624 8.064 3.264 0 5.856-2.688 5.856-5.856 0-3.168-2.304-5.472-5.184-5.472-.576 0-1.248.096-1.44.192.48-3.264 3.456-7.104 6.528-9.024L25.864 4z" />
              </svg>
              <p className="text-[#111827] text-lg leading-relaxed">{review.text}</p>
            </div>
            <div className="border-t border-gray-100 pt-5 flex items-center justify-between">
              <div>
                <p className="font-semibold text-[#111827]">{review.author}</p>
                <p className="text-sm text-[#6B7280]">{review.project}</p>
              </div>
              <Stars rating={review.rating} />
            </div>
          </div>

          {/* Nav buttons */}
          {isMounted && (
            <>
              <button
                onClick={handlePrev}
                className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 bg-white rounded-full p-2.5 shadow-lg hover:bg-gray-50 transition-all hover:scale-110"
                aria-label="Vorige review"
              >
                <svg className="w-5 h-5 text-[#111827]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <button
                onClick={handleNext}
                className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 bg-white rounded-full p-2.5 shadow-lg hover:bg-gray-50 transition-all hover:scale-110"
                aria-label="Volgende review"
              >
                <svg className="w-5 h-5 text-[#111827]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </>
          )}
        </div>

        {/* Dots */}
        <div className="flex justify-center gap-1.5 mt-6">
          {reviewsData.map((_, i) => (
            <button
              key={i}
              onClick={() => setActiveIndex(i)}
              className={`rounded-full transition-all duration-300 ${
                i === activeIndex ? 'w-8 h-2 bg-[#8aab4c]' : 'w-2 h-2 bg-[#111827]/20 hover:bg-[#111827]/40'
              }`}
              aria-label={`Review ${i + 1}`}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
