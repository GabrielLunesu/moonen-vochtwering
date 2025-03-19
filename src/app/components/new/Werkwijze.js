'use client';

import { useEffect, useRef } from 'react';

export default function Werkwijze() {
  const headingRef = useRef(null);
  const stepsRef = useRef([]);

  useEffect(() => {
    if (headingRef.current) {
      headingRef.current.classList.add('animate-fade-in');
    }

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

    // Create a copy of the current refs array to use in cleanup
    const steps = [...stepsRef.current];

    steps.forEach((step) => {
      if (step) {
        observer.observe(step);
      }
    });

    return () => {
      steps.forEach((step) => {
        if (step) {
          observer.unobserve(step);
        }
      });
    };
  }, []);

  const steps = [
    {
      number: 1,
      title: 'Gratis Inspectie & Diagnose',
      description: 'Wij beginnen met een gratis en vrijblijvende inspectie van uw pand. Onze experts lokaliseren de oorzaak van uw vochtprobleem met professionele meetapparatuur.',
      icon: (
        <svg className="w-10 h-10 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0z"></path>
          <path d="M9 12l2 2 4-4"></path>
        </svg>
      ),
    },
    {
      number: 2,
      title: 'Persoonlijk Advies & Offerte',
      description: 'Na de diagnose stellen we een gedetailleerd adviesrapport op met verschillende oplossingsmogelijkheden. U ontvangt een heldere offerte zonder verborgen kosten.',
      icon: (
        <svg className="w-10 h-10 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
          <path d="M14 2v6h6"></path>
          <path d="M16 13H8"></path>
          <path d="M16 17H8"></path>
          <path d="M10 9H8"></path>
        </svg>
      ),
    },
    {
      number: 3,
      title: 'Professionele Uitvoering',
      description: 'Onze ervaren vakmensen voeren de werkzaamheden zorgvuldig uit, met zo min mogelijk overlast. We gebruiken uitsluitend hoogwaardige materialen.',
      icon: (
        <svg className="w-10 h-10 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"></path>
        </svg>
      ),
    },
    {
      number: 4,
      title: 'Afwerking & Controle',
      description: 'Na afronding zorgen we voor een nette afwerking en controleren we het resultaat. We garanderen een droge, gezonde leefomgeving.',
      icon: (
        <svg className="w-10 h-10 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
          <path d="M22 4L12 14.01l-3-3"></path>
        </svg>
      ),
    },
    {
      number: 5,
      title: 'Garantie & Nazorg',
      description: 'Wij staan achter onze werkzaamheden met uitgebreide garantie. Ook na de werkzaamheden blijven we beschikbaar voor advies en ondersteuning.',
      icon: (
        <svg className="w-10 h-10 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
        </svg>
      ),
    },
  ];

  return (
    <section id="werkwijze" className="section bg-white relative">
      {/* Background decor */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <svg className="absolute right-0 top-0 h-64 w-64 text-primary opacity-5" viewBox="0 0 200 200">
          <path d="M0,0 L200,0 L200,200 L0,200 Z" fill="currentColor" />
          <path d="M20,20 L180,20 L180,180 L20,180 Z" fill="none" stroke="currentColor" strokeWidth="4" />
          <path d="M40,40 L160,40 L160,160 L40,160 Z" fill="none" stroke="currentColor" strokeWidth="2" />
        </svg>
        <svg className="absolute left-0 bottom-0 h-64 w-64 text-primary opacity-5" viewBox="0 0 200 200">
          <circle cx="100" cy="100" r="80" fill="none" stroke="currentColor" strokeWidth="4" />
          <circle cx="100" cy="100" r="60" fill="none" stroke="currentColor" strokeWidth="2" />
          <circle cx="100" cy="100" r="40" fill="none" stroke="currentColor" strokeWidth="4" />
        </svg>
      </div>
      
      <div className="container-narrow relative z-10">
        <div ref={headingRef} className="text-center mb-16 opacity-0">
          <h2 className="text-2xl md:text-4xl font-bold mb-4 text-black">Onze Werkwijze</h2>
          <div className="divider mx-auto"></div>
          <p className="text-black max-w-2xl mx-auto">
            Bij Moonen Vochtwering hanteren we een gestructureerde, professionele aanpak om uw vochtproblemen effectief op te lossen - van diagnose tot volledig herstel.
          </p>
        </div>

        <div className="relative">
          {/* Connecting line */}
          <div className="absolute left-[28px] md:left-1/2 top-0 bottom-0 w-1 bg-primary/20 -translate-x-1/2 hidden md:block"></div>

          {steps.map((step, index) => (
            <div
              key={index}
              ref={(el) => (stepsRef.current[index] = el)}
              className={`flex flex-col md:flex-row ${
                index % 2 === 0 ? 'md:flex-row' : 'md:flex-row-reverse'
              } items-center md:items-start mb-12 md:mb-16 opacity-0 relative`}
            >
              {/* Step number circle - visible on mobile */}
              <div className="flex md:hidden items-center justify-center w-14 h-14 bg-primary rounded-full mb-4 shadow-lg animate-float">
                {step.icon}
              </div>

              {/* Content for each step */}
              <div 
                className={`w-full md:w-5/12 ${
                  index % 2 === 0 ? 'md:text-right md:pr-12' : 'md:text-left md:pl-12'
                }`}
              >
                <h3 className="text-xl md:text-2xl font-bold text-black mb-2">
                  {step.title}
                </h3>
                <p className="text-black">{step.description}</p>
              </div>

              {/* Center icon - hidden on mobile */}
              <div className="hidden md:flex items-center justify-center w-16 h-16 bg-primary rounded-full z-10 shadow-lg animate-float">
                {step.icon}
                <span className="absolute font-bold text-white">{step.number}</span>
              </div>

              {/* Empty div for layout on odd steps */}
              <div className={`hidden md:block w-5/12`}></div>
            </div>
          ))}
        </div>

        <div className="text-center mt-10">
          <a href="#contact" className="btn btn-primary inline-flex items-center group">
            <span>Plan uw gratis inspectie</span>
            <svg className="w-5 h-5 ml-2 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
            </svg>
          </a>
        </div>
      </div>
    </section>
  );
} 