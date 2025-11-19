'use client';

import { useEffect, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import BeforeAfterSlider from './BeforeAfterSlider';

export default function Hero() {
  const titleRef = useRef(null);
  const subtitleRef = useRef(null);
  const ctaRef = useRef(null);
  const imageRef = useRef(null);
  const statsRef = useRef(null);

  useEffect(() => {
    // Store refs in variables to use in animations and cleanup
    const titleElement = titleRef.current;
    const subtitleElement = subtitleRef.current;
    const ctaElement = ctaRef.current;
    const imageElement = imageRef.current;
    const statsElement = statsRef.current;

    if (titleElement) {
      titleElement.classList.add('animate-fade-in');
    }
    if (subtitleElement) {
      subtitleElement.classList.add('animate-fade-in', 'stagger-1');
    }
    if (ctaElement) {
      ctaElement.classList.add('animate-fade-in', 'stagger-2');
    }
    if (imageElement) {
      imageElement.classList.add('animate-slide-in-right', 'stagger-1');
    }
    if (statsElement) {
      statsElement.classList.add('animate-fade-in', 'stagger-3');
    }

    // Cleanup function with the stored references
    return () => {
      // No need to check for current.current here since we're using the stored elements
      if (titleElement) titleElement.classList.remove('animate-fade-in');
      if (subtitleElement) subtitleElement.classList.remove('animate-fade-in', 'stagger-1');
      if (ctaElement) ctaElement.classList.remove('animate-fade-in', 'stagger-2');
      if (imageElement) imageElement.classList.remove('animate-slide-in-right', 'stagger-1');
      if (statsElement) statsElement.classList.remove('animate-fade-in', 'stagger-3');
    };
  }, []);

  return (
    <section className="pt-28 pb-16 md:pt-36 md:pb-24 relative overflow-hidden">
      {/* SVG House Shield - background element */}
      <div className="absolute top-0 right-0 w-1/2 h-full opacity-5 pointer-events-none">
        <svg viewBox="0 0 200 200" fill="currentColor" className="w-full h-full text-primary">
          <path d="M100,20 L180,60 V140 L100,180 L20,140 V60 L100,20z M100,40 L40,70 V130 L100,160 L160,130 V70 L100,40z" />
          <path d="M100,70 L130,85 V115 L100,130 L70,115 V85 L100,70z" />
        </svg>
      </div>
      
      <div className="container-narrow">
        <div className="flex flex-col md:flex-row items-center relative z-10">
          <div className="w-full md:w-1/2 mb-10 md:mb-0 md:pr-8">
            <h1 
              ref={titleRef} 
              className="text-3xl md:text-5xl lg:text-6xl font-bold leading-tight mb-6 opacity-0 text-black"
            >
              Dé Vochtspecialist van <span className="text-gradient">Zuid-Limburg</span>
            </h1>
            
            <p 
              ref={subtitleRef}
              className="text-base md:text-lg text-black mb-8 opacity-0"
            >
              <strong>Wij maken uw kelder gegarandeerd droog.</strong> Van Maastricht tot Echt: wij zijn de onbetwiste specialist. Sluit u aan bij meer dan 1000 tevreden klanten die kozen voor definitieve oplossingen.
            </p>
            
            <div 
              ref={ctaRef}
              className="flex flex-col sm:flex-row gap-4 opacity-0"
            >
              <Link href="#contact" className="btn btn-primary text-center group shadow-lg hover:shadow-xl transition-all transform hover:-translate-y-1">
                <span>Maak mijn kelder droog</span>
                <svg className="w-5 h-5 ml-2 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              </Link>
              <Link href="#diensten" className="btn btn-outline text-center flex items-center">
                <span>Onze aanpak</span>
                <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </Link>
            </div>
          </div>
          
          <div className="w-full md:w-1/2 relative flex justify-center">
            <div className="absolute -z-10 top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[90%] h-[90%] bg-primary/5 rounded-full blur-3xl"></div>
            <div 
              ref={imageRef}
              className="relative opacity-0"
            >
              {/* Replace the old image with the BeforeAfterSlider */}
              <BeforeAfterSlider />
              
              <div className="absolute bottom-0 left-0 right-0 text-center -mb-8">
                <h2 className="text-xl md:text-2xl font-bold rounded-full text-white bg-primary inline-block px-8 py-3 shadow-xl border-4 border-white">
                  Beste van <span className="text-accent">Zuid-Limburg</span>
                </h2>
              </div>
            </div>
          </div>
        </div>
        
        <div 
          ref={statsRef}
          className="grid grid-cols-3 gap-4 md:gap-8 mt-20 md:mt-24 pt-8 border-t border-gray-200 opacity-0"
        >
          <div className="text-center">
            <div className="text-3xl md:text-4xl font-bold text-primary mb-1 md:mb-2">15+</div>
            <p className="text-sm md:text-base text-gray-600 font-medium">Jaren ervaring</p>
          </div>
          
          <div className="text-center border-l border-gray-100">
            <div className="text-3xl md:text-4xl font-bold text-primary mb-1 md:mb-2">1000+</div>
            <p className="text-sm md:text-base text-gray-600 font-medium">Droge kelders</p>
          </div>
          
          <div className="text-center border-l border-gray-100">
            <div className="text-3xl md:text-4xl font-bold text-primary mb-1 md:mb-2">100%</div>
            <p className="text-sm md:text-base text-gray-600 font-medium">Resultaat</p>
          </div>
        </div>
      </div>
    </section>
  );
} 