'use client';

import Link from 'next/link';
import dynamic from 'next/dynamic';

// Dynamically import the map component (client-side only, no SSR)
const ServiceAreaMap = dynamic(() => import('./ServiceAreaMap'), {
  ssr: false,
  loading: () => (
    <div className="h-[400px] lg:h-[500px] bg-[#111827] rounded-xl flex items-center justify-center">
      <div className="text-center">
        <div className="w-12 h-12 border-4 border-[#8aab4c] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-white/70 text-sm">Kaart laden...</p>
      </div>
    </div>
  ),
});

const cities = [
  { name: 'Maastricht', slug: 'maastricht' },
  { name: 'Heerlen', slug: 'heerlen' },
  { name: 'Sittard-Geleen', slug: 'sittard-geleen' },
  { name: 'Kerkrade', slug: 'kerkrade' },
  { name: 'Valkenburg', slug: 'valkenburg' },
  { name: 'Meerssen', slug: 'meerssen' },
  { name: 'Brunssum', slug: 'brunssum' },
  { name: 'Echt-Susteren', slug: 'echt-susteren' },
];

export default function ServiceArea() {
  return (
    <section className="bg-[#F9FAFB] py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div>
            <h2 className="font-serif text-3xl md:text-4xl text-[#111827] mb-4">
              Actief in heel Zuid-Limburg
            </h2>
            <p className="text-[#6B7280] text-lg leading-relaxed mb-8">
              Vanuit Heerlen bedienen wij huiseigenaren in de hele regio. Van Maastricht tot Echt-Susteren,
              van Valkenburg tot Kerkrade. Altijd dichtbij, altijd bereikbaar.
            </p>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
              {cities.map((city) => (
                <Link
                  key={city.slug}
                  href={`/vochtbestrijding/${city.slug}`}
                  className="bg-white border border-gray-200 rounded-lg px-4 py-3 text-center text-sm font-medium text-[#111827] hover:border-[#8aab4c]/40 hover:text-[#8aab4c] transition-all hover:shadow-sm"
                >
                  {city.name}
                </Link>
              ))}
            </div>

            {/* HQ Info Card */}
            <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-[#8aab4c]/10 rounded-lg flex items-center justify-center flex-shrink-0">
                  <svg className="w-6 h-6 text-[#8aab4c]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-[#111827] font-semibold mb-1">Gevestigd in Heerlen</h3>
                  <p className="text-[#6B7280] text-sm mb-2">Grasbroekerweg 141, 6412 BG Heerlen</p>
                  <a
                    href="https://maps.google.com/?q=Grasbroekerweg+141+Heerlen"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[#8aab4c] text-sm font-medium hover:underline inline-flex items-center gap-1"
                  >
                    Bekijk in Google Maps
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                  </a>
                </div>
              </div>
            </div>
          </div>

          {/* Interactive Map */}
          <div className="relative">
            <ServiceAreaMap />
          </div>
        </div>
      </div>
    </section>
  );
}
