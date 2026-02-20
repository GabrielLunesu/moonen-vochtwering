'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';

const stats = [
  { number: '15+', label: 'Jaar ervaring' },
  { number: '1000+', label: 'Tevreden klanten' },
  { number: '10', label: 'Jaar garantie' },
  { number: '100%', label: 'Gratis inspectie' },
];

export default function Hero() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 100);
    return () => clearTimeout(t);
  }, []);

  return (
    <section className="relative bg-white overflow-hidden">
      {/* Subtle background texture */}
      <div className="absolute inset-0 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:20px_20px] opacity-40" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-32 pb-20 md:pt-40 md:pb-28">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Left — Copy */}
          <div className={`transition-all duration-700 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}>
            <div className="inline-flex items-center gap-2 bg-[#8aab4c]/10 text-[#8aab4c] px-4 py-1.5 rounded-full text-sm font-medium mb-6">
              <span className="w-2 h-2 rounded-full bg-[#8aab4c] animate-pulse" />
              Vochtspecialist in Zuid-Limburg
            </div>

            <h1 className="font-serif text-4xl sm:text-5xl md:text-6xl text-[#111827] leading-[1.1] mb-6 tracking-tight">
              Uw kelder droog.{' '}
              <span className="text-[#8aab4c]">Uw woning beschermd.</span>{' '}
              Gegarandeerd.
            </h1>

            <p className="text-[#6B7280] text-lg md:text-xl leading-relaxed mb-8 max-w-lg">
              Al 15 jaar lossen wij vochtproblemen definitief op in Zuid-Limburg.
              Gratis inspectie, eerlijk advies, tot 10 jaar garantie.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 mb-10">
              <Link
                href="/gratis-inspectie"
                className="group inline-flex items-center justify-center bg-[#8aab4c] hover:bg-[#769B3D] text-white px-8 py-4 rounded-lg text-lg font-semibold transition-all shadow-lg shadow-[#8aab4c]/25 hover:shadow-xl hover:shadow-[#8aab4c]/30 hover:-translate-y-0.5"
              >
                Gratis inspectie aanvragen
                <svg className="w-5 h-5 ml-2 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </Link>
              <Link
                href="tel:+31618162515"
                className="inline-flex items-center justify-center border-2 border-[#111827]/10 hover:border-[#8aab4c] text-[#111827] px-8 py-4 rounded-lg text-lg font-medium transition-all hover:-translate-y-0.5"
              >
                <svg className="w-5 h-5 mr-2 text-[#8aab4c]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
                06 18 16 25 15
              </Link>
            </div>

            {/* Social proof line */}
            {/* <div className="flex items-center gap-3">
              <div className="flex -space-x-2">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="w-8 h-8 rounded-full bg-[#8aab4c]/20 border-2 border-white flex items-center justify-center">
                    <svg className="w-4 h-4 text-[#8aab4c]" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                    </svg>
                  </div>
                ))}
              </div>
              <div className="text-sm text-[#6B7280]">
                <span className="font-semibold text-[#111827]">1000+ klanten</span> gingen u voor
              </div>
            </div> */}
          </div>

          {/* Right — Visual */}
          <div className={`relative transition-all duration-700 delay-200 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}>
            {/* Decorative accent */}
            <div className="absolute -top-6 -right-6 w-72 h-72 bg-[#8aab4c]/10 rounded-full blur-3xl" />
            <div className="absolute -bottom-6 -left-6 w-48 h-48 bg-[#8aab4c]/5 rounded-full blur-2xl" />

            {/* Main image card */}
            <div className="relative">
              <div className="relative rounded-2xl overflow-hidden shadow-2xl">
                <Image
                  src="/images/hero-moonen.jpeg"
                  alt="Vochtbestrijding resultaat door Moonen"
                  width={700}
                  height={500}
                  className="w-full h-[400px] md:h-[480px] object-cover"
                />
                {/* Gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />

                {/* Floating badge */}
                <div className="absolute bottom-6 left-6 bg-white rounded-xl px-5 py-3 shadow-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-[#8aab4c]/10 flex items-center justify-center">
                      <svg className="w-5 h-5 text-[#8aab4c]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-[#111827]">Kelder afgedicht</p>
                      <p className="text-xs text-[#6B7280]">Resultaat na 2 dagen werk</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Small floating card top-right */}
              <div className="absolute -top-4 -right-4 md:top-6 md:-right-6 bg-white rounded-xl px-4 py-3 shadow-lg border border-gray-100 z-10">
                <div className="flex items-center gap-2">
                  <div className="flex">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <svg key={i} className="w-4 h-4 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                    ))}
                  </div>
                  <span className="text-sm font-semibold text-[#111827]">4.9/5</span>
                </div>
                <p className="text-xs text-[#6B7280] mt-0.5">Werkspot reviews</p>
              </div>
            </div>
          </div>
        </div>

        {/* Stats strip */}
        <div className={`mt-16 md:mt-20 border-t border-gray-100 pt-10 transition-all duration-700 delay-400 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat) => (
              <div key={stat.label} className="text-center">
                <div className="text-[#8aab4c] text-3xl md:text-4xl font-bold font-serif mb-1">
                  {stat.number}
                </div>
                <div className="text-[#6B7280] text-sm">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
