'use client';

import { useEffect, useRef } from 'react';
import Image from 'next/image';

export default function About() {
  const headingRef = useRef(null);
  const contentRef = useRef(null);
  const imageRef = useRef(null);
  const statsRef = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            if (entry.target === headingRef.current) {
              entry.target.classList.add('animate-fade-in');
            } else if (entry.target === contentRef.current) {
              entry.target.classList.add('animate-slide-in-left');
            } else if (entry.target === imageRef.current) {
              entry.target.classList.add('animate-slide-in-right');
            } else if (entry.target === statsRef.current) {
              entry.target.classList.add('animate-fade-in', 'stagger-2');
            }
          }
        });
      },
      { threshold: 0.1 }
    );

    // Store refs in variables to use in cleanup
    const headingElement = headingRef.current;
    const contentElement = contentRef.current;
    const imageElement = imageRef.current;
    const statsElement = statsRef.current;

    if (headingElement) observer.observe(headingElement);
    if (contentElement) observer.observe(contentElement);
    if (imageElement) observer.observe(imageElement);
    if (statsElement) observer.observe(statsElement);

    return () => {
      if (headingElement) observer.unobserve(headingElement);
      if (contentElement) observer.unobserve(contentElement);
      if (imageElement) observer.unobserve(imageElement);
      if (statsElement) observer.unobserve(statsElement);
    };
  }, []);

  return (
    <section id="over-ons" className="section">
      <div className="container-narrow">
        <div ref={headingRef} className="text-center mb-12 md:mb-16 opacity-0">
          <h2 className="text-2xl md:text-4xl font-bold mb-4 text-black">Over Ons</h2>
          <div className="divider mx-auto"></div>
          <p className="text-black max-w-2xl mx-auto">
            Maak kennis met <b>Moonen Vochtwering</b>, uw specialist in vochtwering en -bestrijding met meer dan 15 jaar ervaring in Heerlen en omgeving Parkstad.
          </p>
        </div>

        <div className="flex flex-col md:flex-row items-center gap-8 md:gap-12">
          <div ref={imageRef} className="w-full md:w-1/2 opacity-0">
            <div className="relative h-[300px] md:h-[450px] rounded-lg overflow-hidden bg-primary/5 border border-primary/20 p-4">
              {/* Replace SVG with about.png image */}
              <div className="absolute inset-0">
                <Image
                  src="/images/about.png"
                  alt="Moonen Vochtwering kelder renovatie"
                  fill
                  className="object-cover rounded-lg"
                  sizes="(max-width: 768px) 100vw, 50vw"
                  priority
                />
              </div>
            </div>
          </div>

          <div ref={contentRef} className="w-full md:w-1/2 opacity-0">
            <h3 className="text-xl md:text-2xl font-semibold mb-4 text-black">Expertise & Ervaring</h3>
            <div className="divider"></div>
            <p className="text-black text-sm md:text-base mb-4">
              Moonen Vochtwering is al meer dan 15 jaar dé specialist op het gebied van vochtwering en -bestrijding in Heerlen en omgeving Parkstad. Wij bieden professionele oplossingen voor alle soorten vochtproblemen in woningen en bedrijfspanden.
            </p>
            <p className="text-black text-sm md:text-base mb-6">
              Onze expertise ligt in het opsporen en duurzaam oplossen van vochtproblematiek. We werken met de nieuwste technieken en hoogwaardige materialen om uw pand te beschermen tegen vocht, schimmel en structurele schade. Met ruim 1000 tevreden klanten heeft Moonen Vochtwering een uitstekende reputatie opgebouwd in de regio.
            </p>

            <div className="grid grid-cols-2 gap-3 md:gap-4 mb-6">
              <div className="flex items-center">
                <div className="w-2 h-2 bg-primary rounded-full mr-2"></div>
                <span className="text-black text-sm md:text-base">Professioneel</span>
              </div>
              <div className="flex items-center">
                <div className="w-2 h-2 bg-primary rounded-full mr-2"></div>
                <span className="text-black text-sm md:text-base">Betrouwbaar</span>
              </div>
              <div className="flex items-center">
                <div className="w-2 h-2 bg-primary rounded-full mr-2"></div>
                <span className="text-black text-sm md:text-base">Efficiënt</span>
              </div>
              <div className="flex items-center">
                <div className="w-2 h-2 bg-primary rounded-full mr-2"></div>
                <span className="text-black text-sm md:text-base">Klantvriendelijk</span>
              </div>
            </div>
            
            <a href="#contact" className="btn btn-primary inline-flex items-center group">
              <span>Neem contact op</span>
              <svg className="w-5 h-5 ml-2 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
            </a>
          </div>
        </div>
        
        <div 
          ref={statsRef}
          className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-16 pt-8 border-t border-gray-200 opacity-0"
        >
          <div className="text-center">
            <div className="bg-primary/10 w-16 h-16 mx-auto rounded-full flex items-center justify-center mb-3">
              <svg className="w-8 h-8 text-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
              </svg>
            </div>
            <h4 className="font-semibold text-black mb-1">Garantie</h4>
            <p className="text-sm text-black">Tot 10 jaar garantie op onze werkzaamheden</p>
          </div>
          
          <div className="text-center">
            <div className="bg-primary/10 w-16 h-16 mx-auto rounded-full flex items-center justify-center mb-3">
              <svg className="w-8 h-8 text-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
                <polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline>
                <line x1="12" y1="22.08" x2="12" y2="12"></line>
              </svg>
            </div>
            <h4 className="font-semibold text-black mb-1">Materialen</h4>
            <p className="text-sm text-black">Alleen hoogwaardige en duurzame materialen</p>
          </div>
          
          <div className="text-center">
            <div className="bg-primary/10 w-16 h-16 mx-auto rounded-full flex items-center justify-center mb-3">
              <svg className="w-8 h-8 text-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"></circle>
                <polyline points="12 6 12 12 16 14"></polyline>
              </svg>
            </div>
            <h4 className="font-semibold text-black mb-1">Snelle service</h4>
            <p className="text-sm text-black">Snel ter plaatse voor acute vochtproblemen</p>
          </div>
          
          <div className="text-center">
            <div className="bg-primary/10 w-16 h-16 mx-auto rounded-full flex items-center justify-center mb-3">
              <svg className="w-8 h-8 text-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                <circle cx="8.5" cy="7" r="4"></circle>
                <line x1="20" y1="8" x2="20" y2="14"></line>
                <line x1="23" y1="11" x2="17" y2="11"></line>
              </svg>
            </div>
            <h4 className="font-semibold text-black mb-1">Persoonlijk</h4>
            <p className="text-sm text-black">Persoonlijke aandacht voor elke klant</p>
          </div>
        </div>
      </div>
    </section>
  );
} 