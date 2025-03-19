'use client';

import { useEffect, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';

export default function Hero() {
  const heroRef = useRef(null);
  const statsRef = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('animate-fade-in');
        }
      },
      { threshold: 0.1 }
    );

    if (heroRef.current) {
      observer.observe(heroRef.current);
    }

    if (statsRef.current) {
      observer.observe(statsRef.current);
    }

    return () => {
      if (heroRef.current) {
        observer.unobserve(heroRef.current);
      }
      if (statsRef.current) {
        observer.unobserve(statsRef.current);
      }
    };
  }, []);

  return (
    <section id="home" className="section pt-24 pb-16 md:pt-32 md:pb-24">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row items-center gap-8 md:gap-16">
          <div ref={heroRef} className="w-full md:w-1/2 opacity-0">
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4">
              Uw erkende installateur voor warmtepompen en airconditioning
            </h1>
            <p className="text-lg md:text-xl text-gray-700 mb-6">
              Met meer dan 30 jaar ervaring en bijna 3000 tevreden klanten, biedt Donato Lunesu betrouwbare en professionele installatie- en onderhoudsdiensten voor warmtepompen en airconditioning in heel Nederland.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link 
                href="#diensten" 
                className="btn-primary px-8 py-3 rounded-full font-medium text-center transition-transform hover:scale-105"
              >
                Onze diensten
              </Link>
              <Link 
                href="#contact" 
                className="btn-secondary px-8 py-3 rounded-full font-medium text-center transition-transform hover:scale-105"
              >
                Contact opnemen
              </Link>
            </div>
          </div>
          <div className="w-full md:w-1/2 relative h-[300px] md:h-[500px]">
            <div className="absolute inset-0 bg-primary rounded-lg opacity-10 transform rotate-3"></div>
            <Image 
              src="https://placehold.co/800x800/CCCCCC/666666/png?text=Donato+Lunesu" 
              alt="Donato Lunesu" 
              fill
              className="object-cover rounded-lg shadow-lg transform -rotate-3 transition-transform duration-500 hover:rotate-0"
            />
          </div>
        </div>
        
        <div ref={statsRef} className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8 opacity-0">
          <div className="bg-white p-6 rounded-lg shadow-md transition-transform duration-300 hover:transform hover:scale-105 hover:shadow-lg border-t-4 border-primary">
            <div className="text-primary text-4xl mb-4 font-bold">30+</div>
            <h3 className="text-xl font-semibold mb-2">Jaren ervaring</h3>
            <p className="text-gray-600">Meer dan drie decennia expertise in de installatie en het onderhoud van klimaatsystemen.</p>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-md transition-transform duration-300 hover:transform hover:scale-105 hover:shadow-lg border-t-4 border-primary">
            <div className="text-primary text-4xl mb-4 font-bold">3000</div>
            <h3 className="text-xl font-semibold mb-2">Tevreden klanten</h3>
            <p className="text-gray-600">Bijna 3000 succesvolle installaties en tevreden klanten door heel Nederland.</p>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-md transition-transform duration-300 hover:transform hover:scale-105 hover:shadow-lg border-t-4 border-primary">
            <div className="text-primary text-4xl mb-4 font-bold">100%</div>
            <h3 className="text-xl font-semibold mb-2">Gecertificeerd</h3>
            <p className="text-gray-600">Volledig erkend en gecertificeerd voor alle werkzaamheden aan warmtepompen en airconditioning.</p>
          </div>
        </div>
      </div>
    </section>
  );
} 