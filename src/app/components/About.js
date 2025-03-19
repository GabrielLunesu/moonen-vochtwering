'use client';

import { useEffect, useRef } from 'react';
import Image from 'next/image';

export default function About() {
  const aboutRef = useRef(null);

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
    const aboutElement = aboutRef.current;

    if (aboutElement) observer.observe(aboutElement);

    return () => {
      if (aboutElement) observer.unobserve(aboutElement);
    };
  }, []);

  return (
    <section id="over-ons" className="section py-16 bg-gray-50">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Over Ons</h2>
          <div className="w-20 h-1 bg-primary mx-auto"></div>
        </div>

        <div ref={aboutRef} className="flex flex-col md:flex-row items-center gap-12 opacity-0">
          <div className="w-full md:w-1/2 relative h-[350px] md:h-[450px]">
            <Image 
              src="https://placehold.co/800x600/CCCCCC/666666/png?text=Werkplaats" 
              alt="Donato Lunesu Werkplaats" 
              fill
              className="object-cover rounded-lg shadow-lg"
            />
          </div>
          
          <div className="w-full md:w-1/2">
            <h3 className="text-2xl font-semibold mb-4">Donato Lunesu - Specialist in klimaatbeheersing</h3>
            <p className="text-gray-700 mb-4">
              Al meer dan 30 jaar ben ik, Donato Lunesu, actief in de wereld van klimaatbeheersing. Wat begon als een passie voor techniek en comfort, is uitgegroeid tot een gespecialiseerd bedrijf dat staat voor kwaliteit, betrouwbaarheid en vakmanschap.
            </p>
            <p className="text-gray-700 mb-4">
              Mijn expertise ligt in het installeren, onderhouden en repareren van warmtepompen en airconditioningsystemen voor zowel particuliere als zakelijke klanten. Door de jaren heen heb ik bijna 3000 tevreden klanten mogen helpen met hun klimaatbehoeften.
            </p>
            <p className="text-gray-700 mb-4">
              Als erkend installateur werk ik uitsluitend met hoogwaardige merken en materialen, en blijf ik continu op de hoogte van de nieuwste ontwikkelingen in de branche. Zo kan ik u altijd de beste en meest energiezuinige oplossingen bieden.
            </p>
            
            <div className="mt-6 grid grid-cols-2 gap-4">
              <div className="flex items-center">
                <svg className="w-5 h-5 text-primary mr-2" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"></path>
                </svg>
                <span>Gecertificeerd</span>
              </div>
              <div className="flex items-center">
                <svg className="w-5 h-5 text-primary mr-2" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"></path>
                </svg>
                <span>Betrouwbaar</span>
              </div>
              <div className="flex items-center">
                <svg className="w-5 h-5 text-primary mr-2" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"></path>
                </svg>
                <span>Vakkundig</span>
              </div>
              <div className="flex items-center">
                <svg className="w-5 h-5 text-primary mr-2" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"></path>
                </svg>
                <span>Klantvriendelijk</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
} 