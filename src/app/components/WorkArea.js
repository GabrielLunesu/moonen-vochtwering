'use client';

import { useEffect, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';

export default function WorkArea() {
  const workAreaRef = useRef(null);

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
    const workAreaElement = workAreaRef.current;

    if (workAreaElement) observer.observe(workAreaElement);

    return () => {
      if (workAreaElement) observer.unobserve(workAreaElement);
    };
  }, []);

  const areas = [
    'Amsterdam', 'Rotterdam', 'Den Haag', 'Utrecht', 
    'Eindhoven', 'Groningen', 'Tilburg', 'Almere', 
    'Breda', 'Nijmegen', 'Enschede', 'Haarlem'
  ];

  return (
    <section id="werkgebied" className="section py-16">
      <div className="container-narrow">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Ons Werkgebied</h2>
          <div className="divider mx-auto mb-6"></div>
          <p className="text-gray-700 max-w-3xl mx-auto">
            Wij zijn actief in heel Nederland en bieden onze diensten aan voor zowel particuliere als zakelijke klanten. Bekijk hieronder in welke regio&apos;s wij voornamelijk werkzaam zijn.
          </p>
        </div>

        <div 
          ref={workAreaRef} 
          className="flex flex-col md:flex-row items-center gap-8 md:gap-16 opacity-0"
        >
          <div className="w-full md:w-1/2 relative h-[300px] md:h-[500px]">
            <Image 
              src="https://placehold.co/800x800/CCCCCC/666666/png?text=Kaart+Nederland" 
              alt="Werkgebied kaart Nederland" 
              fill
              className="object-contain rounded-lg shadow-lg"
            />
          </div>
          
          <div className="w-full md:w-1/2">
            <h3 className="text-2xl font-semibold mb-4">Landelijke dekking, lokale service</h3>
            <p className="text-gray-700 mb-6">
              Als erkend installateur voor warmtepompen en airconditioning zijn wij werkzaam door heel Nederland. Onze focus ligt op de volgende regio&apos;s, maar ook daarbuiten staan wij voor u klaar:
            </p>
            
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-y-3 gap-x-4 mb-8">
              {areas.map((area, index) => (
                <div key={index} className="flex items-center">
                  <svg className="w-5 h-5 text-primary mr-2" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                    <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd"></path>
                  </svg>
                  <span>{area}</span>
                </div>
              ))}
            </div>
            
            <p className="text-gray-700 mb-6">
              Woont u niet in een van bovenstaande regio&apos;s? Neem dan gerust contact met ons op om te bespreken wat wij voor u kunnen betekenen.
            </p>
            
            <Link 
              href="#contact" 
              className="btn-primary px-8 py-3 rounded-full font-medium inline-block"
            >
              Neem contact op
            </Link>
          </div>
        </div>
        
        <div className="mt-16 bg-primary text-white p-8 rounded-lg">
          <div className="flex flex-col md:flex-row items-center justify-between">
            <div className="mb-6 md:mb-0">
              <h3 className="text-2xl font-semibold mb-2">Bent u benieuwd of wij in uw regio werkzaam zijn?</h3>
              <p className="text-white/90">
                Neem vrijblijvend contact met ons op voor meer informatie over onze diensten in uw regio.
              </p>
            </div>
            <Link 
              href="#contact" 
              className="bg-white text-primary px-8 py-3 rounded-full font-medium hover:bg-gray-100 transition-colors duration-300"
            >
              Vraag informatie aan
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
} 