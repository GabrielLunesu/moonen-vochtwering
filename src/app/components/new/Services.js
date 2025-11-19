'use client';

import { useEffect, useRef } from 'react';
import Image from 'next/image';

export default function Services() {
  const headingRef = useRef(null);
  const cardsRef = useRef([]);

  useEffect(() => {
    if (headingRef.current) {
      headingRef.current.classList.add('animate-fade-in');
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('animate-scale-in');
          }
        });
      },
      { threshold: 0.1 }
    );

    // Create a copy of the current refs array to use in cleanup
    const cards = [...cardsRef.current];

    cards.forEach((card) => {
      if (card) {
        observer.observe(card);
      }
    });

    return () => {
      cards.forEach((card) => {
        if (card) {
          observer.unobserve(card);
        }
      });
    };
  }, []);

  const services = [
    {
      title: 'Gratis Vochtdiagnose',
      description: 'Geen gokwerk, maar zekerheid. Wij komen langs voor een grondige inspectie en helder advies. Volledig kosteloos.',
      icon: '/icons/water.svg',
    },
    {
      title: 'Kelderafdichting',
      description: 'Van vochtige opslag naar waardevolle leefruimte. Wij maken uw kelder gegarandeerd 100% waterdicht.',
      icon: '/icons/window.svg',
    },
    {
      title: 'Schimmelbestrijding',
      description: 'Bescherm uw gezondheid. Wij verwijderen schimmel definitief en pakken de oorzaak bij de wortel aan.',
      icon: '/icons/file.svg',
    },
    {
      title: 'Muurinjectie',
      description: 'Stop optrekkend vocht voorgoed. Onze geavanceerde injectietechniek vormt een ondoordringbare barrière.',
      icon: '/icons/globe.svg',
    },
    {
      title: 'Vochtwerend Stucwerk',
      description: 'Een strakke, droge afwerking die ademt maar vocht tegenhoudt. De perfecte finish voor uw muren.',
      icon: '/icons/window.svg',
    },
    {
      title: 'Gevelimpregnatie',
      description: 'Bescherm uw woning tegen doorslaand vocht. Uw gevel blijft droog, schoon en isoleert beter.',
      icon: '/icons/water.svg',
    }
  ];

  return (
    <section id="diensten" className="section bg-gray-100">
      <div className="container-narrow">
        <div ref={headingRef} className="text-center mb-12 md:mb-16 opacity-0">
          <h2 className="text-2xl md:text-4xl font-bold mb-4 text-black">Onze Diensten</h2>
          <div className="divider mx-auto"></div>
          <p className="text-black max-w-2xl mx-auto">
            Moonen Vochtwering biedt een compleet pakket aan oplossingen voor alle vocht- en schimmelproblemen in woningen en bedrijfspanden in Heerlen en omgeving Parkstad.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
          {services.map((service, index) => (
            <div
              key={index}
              ref={(el) => (cardsRef.current[index] = el)}
              className="card p-5 md:p-6 opacity-0 hover:border-primary/30 group"
            >
              <div className="flex items-start mb-4">
                <div className="bg-primary/10 p-3 rounded-lg mr-4 group-hover:bg-primary/20 transition-all">
                  <svg
                    className="w-6 h-6 text-primary"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    {service.title.includes('Vocht') && (
                      <>
                        <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z"></path>
                      </>
                    )}
                    {service.title.includes('Kelder') && (
                      <>
                        <rect x="2" y="4" width="20" height="16" rx="2"></rect>
                        <path d="M2 8h20"></path>
                        <path d="M12 12v8"></path>
                        <path d="M8 16h8"></path>
                      </>
                    )}
                    {service.title.includes('Schimmel') && (
                      <>
                        <path d="M18 3a3 3 0 0 0-3 3v12a3 3 0 0 0 3 3 3 3 0 0 0 3-3 3 3 0 0 0-3-3H6a3 3 0 0 0-3 3 3 3 0 0 0 3 3 3 3 0 0 0 3-3V6a3 3 0 0 0-3-3 3 3 0 0 0-3 3 3 3 0 0 0 3 3h12a3 3 0 0 0 3-3 3 3 0 0 0-3-3z"></path>
                      </>
                    )}
                    {service.title.includes('Injecteren') && (
                      <>
                        <circle cx="12" cy="12" r="10"></circle>
                        <line x1="2" y1="12" x2="22" y2="12"></line>
                        <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path>
                      </>
                    )}
                    {service.title.includes('Stucwerk') && (
                      <>
                        <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                        <line x1="3" y1="9" x2="21" y2="9"></line>
                        <line x1="9" y1="21" x2="9" y2="9"></line>
                      </>
                    )}
                    {service.title.includes('Preventieve') && (
                      <>
                        <path d="M8 16s1.5 2 4 2 4-2 4-2"></path>
                        <path d="M12 12a2 2 0 1 0 0-4 2 2 0 0 0 0 4z"></path>
                        <path d="M20 12a8 8 0 1 0-16 0"></path>
                      </>
                    )}
                  </svg>
                </div>
                <h3 className="text-lg md:text-xl font-semibold text-black">{service.title}</h3>
              </div>
              <p className="text-black text-sm md:text-base ml-[56px]">{service.description}</p>
            </div>
          ))}
        </div>

        <div className="mt-12 md:mt-16 text-center">
          <a href="#contact" className="btn btn-primary inline-flex items-center group">
            <span>Vraag een gratis inspectie aan</span>
            <svg className="w-5 h-5 ml-2 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
            </svg>
          </a>
        </div>
      </div>
    </section>
  );
} 