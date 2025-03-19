'use client';

import { useEffect, useRef } from 'react';
import Image from 'next/image';

export default function Brands() {
  const headingRef = useRef(null);
  const brandsRef = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('animate-fade-in');
          }
        });
      },
      { threshold: 0.1 }
    );

    // Store refs in variables to use in cleanup
    const headingElement = headingRef.current;
    const brandsElement = brandsRef.current;

    if (headingElement) observer.observe(headingElement);
    if (brandsElement) observer.observe(brandsElement);

    return () => {
      if (headingElement) observer.unobserve(headingElement);
      if (brandsElement) observer.unobserve(brandsElement);
    };
  }, []);

  const brands = [
    {
      name: 'Daikin',
      logo: '/logo/daiking-logo.png'
    },
    {
      name: 'Mitsubishi Electric',
      logo: '/logo/mitshubishi-logo.png'
    },
    {
      name: 'Mitsubishi Heavy',
      logo: '/logo/mitshubishi-heavy-logo.png'
    },
    {
      name: 'Toshiba',
      logo: '/logo/toshiba-logo.png'
    },
    {
      name: 'Panasonic',
      logo: '/logo/panasonic.png'
    }
  ];

  return (
    <section className="section bg-white py-12 md:py-16">
      <div className="container-narrow">
        <div ref={headingRef} className="text-center mb-8 md:mb-12 opacity-0">
          <h2 className="text-2xl md:text-4xl font-bold mb-4 text-black">Wij werken met topmerken</h2>
          <div className="divider mx-auto"></div>
        </div>

        <div 
          ref={brandsRef}
          className="grid grid-cols-2 md:grid-cols-5 gap-6 md:gap-8 items-center opacity-0"
        >
          {brands.map((brand, index) => (
            <div key={index} className="flex items-center justify-center p-3 md:p-4">
              <Image 
                src={brand.logo} 
                alt={`${brand.name} logo`} 
                width={120}
                height={60}
                className="object-contain transition-all duration-300"
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
} 