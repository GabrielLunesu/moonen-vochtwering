'use client';

import { useEffect, useRef } from 'react';
import Image from 'next/image';

export default function Brands() {
  const brandsRef = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('animate-fade-in');
        }
      },
      { threshold: 0.1 }
    );

    // Store ref in variable to use in cleanup
    const brandsElement = brandsRef.current;

    if (brandsElement) observer.observe(brandsElement);

    return () => {
      if (brandsElement) observer.unobserve(brandsElement);
    };
  }, []);

  const brands = [
    {
      name: 'Daikin',
      logo: 'https://placehold.co/300x150/FFFFFF/666666/png?text=Daikin'
    },
    {
      name: 'Mitsubishi Electric',
      logo: 'https://placehold.co/300x150/FFFFFF/666666/png?text=Mitsubishi'
    },
    {
      name: 'Toshiba',
      logo: 'https://placehold.co/300x150/FFFFFF/666666/png?text=Toshiba'
    },
    {
      name: 'Haier',
      logo: 'https://placehold.co/300x150/FFFFFF/666666/png?text=Haier'
    }
  ];

  return (
    <section className="py-12 bg-gray-50">
      <div className="container mx-auto px-4">
        <div className="text-center mb-10">
          <h2 className="text-2xl md:text-3xl font-bold mb-4">Wij werken met topmerken</h2>
          <div className="w-16 h-1 bg-primary mx-auto"></div>
        </div>

        <div 
          ref={brandsRef} 
          className="grid grid-cols-2 md:grid-cols-4 gap-6 items-center opacity-0"
        >
          {brands.map((brand, index) => (
            <div 
              key={index} 
              className="bg-white p-6 rounded-lg shadow-md flex items-center justify-center transition-transform duration-300 hover:transform hover:scale-105"
            >
              <div className="relative h-16 w-full">
                <Image 
                  src={brand.logo} 
                  alt={`${brand.name} logo`} 
                  fill
                  className="object-contain"
                />
              </div>
            </div>
          ))}
        </div>

        <div className="mt-12 bg-white p-6 rounded-lg shadow-md">
          <div className="flex flex-col md:flex-row items-center">
            <div className="w-full md:w-1/2 mb-6 md:mb-0 md:pr-8">
              <h3 className="text-xl font-semibold mb-3">Waarom wij met deze merken werken</h3>
              <p className="text-gray-700 mb-4">
                Als erkend installateur kiezen wij bewust voor deze topmerken vanwege hun betrouwbaarheid, duurzaamheid en innovatieve technologieën. Deze merken staan bekend om hun hoge kwaliteit en energiezuinige oplossingen.
              </p>
              <p className="text-gray-700">
                Door samen te werken met deze gerenommeerde fabrikanten kunnen wij u de beste garanties en service bieden. Wij zijn gecertificeerd om deze systemen te installeren, onderhouden en repareren volgens de hoogste standaarden.
              </p>
            </div>
            <div className="w-full md:w-1/2 relative h-[200px] md:h-[250px]">
              <Image 
                src="https://placehold.co/800x500/CCCCCC/666666/png?text=Producten" 
                alt="Airco en warmtepomp producten" 
                fill
                className="object-cover rounded-lg"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
} 