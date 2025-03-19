'use client';

import { useEffect, useRef } from 'react';
import Image from 'next/image';

export default function Oplossingen() {
  const headingRef = useRef(null);
  const solutionsRef = useRef(null);

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
    const solutionsElement = solutionsRef.current;

    if (headingElement) observer.observe(headingElement);
    if (solutionsElement) observer.observe(solutionsElement);

    return () => {
      if (headingElement) observer.unobserve(headingElement);
      if (solutionsElement) observer.unobserve(solutionsElement);
    };
  }, []);

  const solutions = [
    {
      name: 'Keldervochtbestrijding',
      description: 'Wij bieden specialistische oplossingen voor vochtige kelders en kruipruimtes. Met geavanceerde injectietechnieken en waterdichte barrières beschermen wij uw kelder effectief tegen grondwater en opstijgend vocht.',
      icon: (
        <svg className="w-12 h-12 text-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <rect x="2" y="4" width="20" height="16" rx="2"></rect>
          <path d="M2 8h20"></path>
          <path d="M12 12v8"></path>
          <path d="M8 16h8"></path>
          {/* Water at the bottom */}
          <path d="M3 18c0-1 1-2 3-2s3 1 3 2 1 2 3 2 3-1 3-2 1-2 3-2 3 1 3 2" className="animate-dash" />
        </svg>
      )
    },
    {
      name: 'Muurvochtbestrijding',
      description: 'Met geavanceerde injectietechnieken en vochtregulerende stucwerk maken wij vochtige muren definitief droog. Wij behandelen zowel opstijgend vocht als doorslaand vocht via de buitenmuren.',
      icon: (
        <svg className="w-12 h-12 text-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="3" width="18" height="18" rx="2"></rect>
          <path d="M3 9h18"></path>
          <path d="M9 21V9"></path>
          {/* Moisture symbols */}
          <path d="M6 7C5 6 5 5 6 4" className="animate-dash" />
          <path d="M12 7C11 6 11 5 12 4" className="animate-dash stagger-1" />
          <path d="M18 7C17 6 17 5 18 4" className="animate-dash stagger-2" />
        </svg>
      )
    },
    {
      name: 'Schimmelbestrijding',
      description: 'Onze schimmelbestrijding gaat verder dan alleen het oppervlak. Wij pakken de bron van het vocht aan en zorgen voor blijvende oplossingen met speciaal ontwikkelde anti-schimmelbehandelingen.',
      icon: (
        <svg className="w-12 h-12 text-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M8 14s1.5 2 4 2 4-2 4-2"></path>
          <path d="M9 9h.01"></path>
          <path d="M15 9h.01"></path>
          <path d="M22 12c0 5.523-4.477 10-10 10S2 17.523 2 12 6.477 2 12 2s10 4.477 10 10z"></path>
          {/* Mold symbols */}
          <circle cx="7" cy="7" r="1" fill="currentColor" className="animate-float" />
          <circle cx="17" cy="7" r="1" fill="currentColor" className="animate-float stagger-1" />
          <circle cx="12" cy="17" r="1" fill="currentColor" className="animate-float stagger-2" />
          <circle cx="9" cy="5" r="0.5" fill="currentColor" className="animate-float stagger-3" />
          <circle cx="15" cy="5" r="0.5" fill="currentColor" className="animate-float stagger-2" />
        </svg>
      )
    },
    {
      name: 'Preventieve Vochtbehandeling',
      description: 'Voorkom toekomstige vochtproblemen met onze preventieve behandelingen. Wij bieden hydrofobe impregnaties voor gevels, waterdichte coatings en andere beschermende maatregelen.',
      icon: (
        <svg className="w-12 h-12 text-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 7.5c2.5-2.5 4.5-3 7-1.5-2.5 4.5-5 7-7.5 9s-5 3-7 1.5c2.5-4.5 5-7 7.5-9z"></path>
          <path d="M12 7.5v9"></path>
          <path d="M12 7.5c-2.5-2.5-4.5-3-7-1.5"></path>
          <path d="M12 16.5c-2.5 2-5 3-7 1.5"></path>
          {/* Water drop with shield */}
          <path d="M20 11a5 5 0 01-10 0c0-2.76 2.5-5 5-7.5 2.5 2.5 5 4.74 5 7.5z" opacity="0.3" fill="currentColor" />
        </svg>
      )
    }
  ];

  return (
    <section id="oplossingen" className="section bg-white">
      <div className="container-narrow">
        <div ref={headingRef} className="text-center mb-12 md:mb-16 opacity-0">
          <h2 className="text-2xl md:text-4xl font-bold mb-4 text-black">Onze Oplossingen</h2>
          <div className="divider mx-auto"></div>
          <p className="text-black max-w-2xl mx-auto">
            Wij bieden professionele en effectieve oplossingen voor alle soorten vochtproblemen in woningen en bedrijfspanden, van kelders tot daken.
          </p>
        </div>

        <div 
          ref={solutionsRef}
          className="grid grid-cols-1 md:grid-cols-2 gap-8 opacity-0"
        >
          {solutions.map((solution, index) => (
            <div 
              key={index} 
              className="card p-6 hover:border-primary/30 group bg-white hover:shadow-lg transition-all duration-300"
            >
              <div className="flex items-center mb-4">
                <div className="mr-4 bg-primary/10 p-3 rounded-lg group-hover:bg-primary/20 transition-all">
                  {solution.icon}
                </div>
                <h3 className="text-xl font-semibold text-black">{solution.name}</h3>
              </div>
              <p className="text-black ml-[80px]">{solution.description}</p>
            </div>
          ))}
        </div>
        
        <div className="mt-12 text-center">
          <p className="text-black mb-6 max-w-2xl mx-auto">
            Twijfelt u over welke oplossing het beste past bij uw vochtprobleem? Onze experts komen graag langs voor een gratis inspectie en advies op maat.
          </p>
          <a href="#contact" className="btn btn-primary inline-flex items-center group">
            <span>Gratis inspectie aanvragen</span>
            <svg className="w-5 h-5 ml-2 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
            </svg>
          </a>
        </div>
      </div>
    </section>
  );
} 