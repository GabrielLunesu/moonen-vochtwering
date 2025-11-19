'use client';

import React, { useRef, useEffect } from 'react';
import Link from 'next/link';

const Locations = () => {
  const headingRef = useRef(null);
  const contentRef = useRef(null);

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

    const headingElement = headingRef.current;
    const contentElement = contentRef.current;

    if (headingElement) observer.observe(headingElement);
    if (contentElement) observer.observe(contentElement);

    return () => {
      if (headingElement) observer.unobserve(headingElement);
      if (contentElement) observer.unobserve(contentElement);
    };
  }, []);

  const cities = [
    {
      name: 'Maastricht',
      services: ['Kelderafdichting', 'Vochtbestrijding muren', 'Schimmelbestrijding'],
      description: 'Moonen Vochtwering is dé specialist in vochtbestrijding in Maastricht. Wij bieden professionele oplossingen voor alle soorten vochtproblemen in kelders, muren en op plafonds in monumentale panden en moderne woningen.'
    },
    {
      name: 'Heerlen',
      services: ['Vochtbestrijding kelder', 'Injecteren tegen optrekkend vocht', 'Schimmelaanpak'],
      description: 'Heeft u last van vocht in uw woning in Heerlen? Wij hebben ruime ervaring met het oplossen van vochtproblemen in kelders en vochtige muren in Heerlen en omgeving.'
    },
    {
      name: 'Sittard-Geleen',
      services: ['Kelder waterdicht maken', 'Behandeling optrekkend vocht', 'Vochtmeting'],
      description: 'Vochtbestrijding in Sittard-Geleen vraagt om specialistische kennis. Met Moonen Vochtwering kiest u voor een ervaren partner die vochtproblemen effectief aanpakt in de Westelijke Mijnstreek.'
    },
    {
      name: 'Echt',
      services: ['Kelderafdichting', 'Vochtwering', 'Injecteren muren'],
      description: 'Ook in Echt en omgeving staan wij voor u klaar. Wij zorgen voor een droge kelder en een gezond leefklimaat in uw woning of bedrijfspand.'
    },
    {
      name: 'Valkenburg',
      services: ['Souterrain waterdicht maken', 'Vochtbestrijding mergel', 'Gevelimpregnatie'],
      description: 'Specialist in vochtbestrijding voor de unieke panden in Valkenburg. Wij hebben specifieke ervaring met mergelbouw en souterrains in het Heuvelland.'
    },
    {
      name: 'Kerkrade',
      services: ['Vochtbestrijding kelder', 'Schimmel verwijderen', 'Muurinjectie'],
      description: 'Woont u in Kerkrade en heeft u last van vocht? Wij bieden duurzame oplossingen voor vochtige kelders en optrekkend vocht in de regio Parkstad.'
    }
  ];

  return (
    <section id="werkgebied" className="py-16 bg-white">
      <div className="container mx-auto px-4">
        <div ref={headingRef} className="text-center mb-12 opacity-0">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">Vochtbestrijding in Zuid-Limburg</h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Moonen Vochtwering is uw specialist voor vochtbestrijding in de regio Zuid-Limburg. Van Maastricht tot Echt helpen wij u met:
          </p>
        </div>

        <div ref={contentRef} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 opacity-0">
          {cities.map((city, index) => (
            <div key={index} className="bg-gray-50 rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow">
              <h3 className="text-2xl font-bold text-primary mb-3">Vochtbestrijding {city.name}</h3>
              <p className="text-gray-700 mb-4">{city.description}</p>

              <h4 className="font-semibold text-gray-800 mb-2">Onze diensten in {city.name}:</h4>
              <ul className="mb-4">
                {city.services.map((service, serviceIndex) => (
                  <li key={serviceIndex} className="flex items-start mb-1">
                    <svg className="w-5 h-5 text-primary mt-0.5 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                    </svg>
                    <span className="text-gray-700">{service}</span>
                  </li>
                ))}
              </ul>

              <Link href="#contact" className="text-primary hover:text-primary-dark font-medium inline-flex items-center transition-colors">
                <span>Neem contact op voor {city.name}</span>
                <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3"></path>
                </svg>
              </Link>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Locations; 