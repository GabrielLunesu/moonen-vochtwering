'use client';

import { useEffect, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';

export default function Services() {
  const servicesRef = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('animate-fade-in');
        }
      },
      { threshold: 0.1 }
    );

    if (servicesRef.current) {
      observer.observe(servicesRef.current);
    }

    return () => {
      if (servicesRef.current) {
        observer.unobserve(servicesRef.current);
      }
    };
  }, []);

  const services = [
    {
      title: 'Airconditioning Installatie',
      description: 'Professionele installatie van airconditioningsystemen voor woningen en bedrijven. We zorgen voor een perfecte montage en optimale werking.',
      icon: '/icons/ac-install.svg',
      image: 'https://placehold.co/600x400/CCCCCC/666666/png?text=Airco+Installatie'
    },
    {
      title: 'Warmtepomp Installatie',
      description: 'Vakkundige installatie van warmtepompen voor duurzame verwarming en koeling van uw woning of bedrijfspand. Energiezuinig en milieuvriendelijk.',
      icon: '/icons/heat-pump.svg',
      image: 'https://placehold.co/600x400/CCCCCC/666666/png?text=Warmtepomp+Installatie'
    },
    {
      title: 'Airconditioning Service',
      description: 'Regelmatig onderhoud en service van uw airconditioningsysteem voor een langere levensduur en optimale prestaties.',
      icon: '/icons/ac-service.svg',
      image: 'https://placehold.co/600x400/CCCCCC/666666/png?text=Airco+Service'
    },
    {
      title: 'Airconditioning Reparatie',
      description: 'Snelle en effectieve reparatie van airconditioningsystemen. We diagnosticeren en verhelpen storingen vakkundig en snel.',
      icon: '/icons/ac-repair.svg',
      image: 'https://placehold.co/600x400/CCCCCC/666666/png?text=Airco+Reparatie'
    },
    {
      title: 'Warmtepomp Service',
      description: 'Professioneel onderhoud van uw warmtepomp voor optimale werking en energiebesparing. Voorkom storingen door regelmatig onderhoud.',
      icon: '/icons/heat-service.svg',
      image: 'https://placehold.co/600x400/CCCCCC/666666/png?text=Warmtepomp+Service'
    },
    {
      title: 'Warmtepomp Reparatie',
      description: 'Deskundige reparatie van alle soorten warmtepompen. We lossen storingen snel en vakkundig op zodat u weer kunt genieten van een aangenaam binnenklimaat.',
      icon: '/icons/heat-repair.svg',
      image: 'https://placehold.co/600x400/CCCCCC/666666/png?text=Warmtepomp+Reparatie'
    }
  ];

  return (
    <section id="diensten" className="section py-16">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Onze Diensten</h2>
          <div className="w-20 h-1 bg-primary mx-auto mb-6"></div>
          <p className="text-gray-700 max-w-3xl mx-auto">
            Wij bieden een compleet pakket aan diensten voor warmtepompen en airconditioning. Van installatie tot onderhoud en reparatie, wij zorgen ervoor dat uw klimaatsysteem optimaal functioneert.
          </p>
        </div>

        <div 
          ref={servicesRef} 
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 opacity-0"
        >
          {services.map((service, index) => (
            <div 
              key={index} 
              className="bg-white rounded-lg shadow-md overflow-hidden transition-transform duration-300 hover:transform hover:scale-105 hover:shadow-lg"
            >
              <div className="relative h-48">
                <Image 
                  src={service.image} 
                  alt={service.title} 
                  fill
                  className="object-cover"
                />
                <div className="absolute top-4 right-4 bg-white p-2 rounded-full shadow-md">
                  <Image 
                    src={service.icon} 
                    alt={`${service.title} icon`} 
                    width={24} 
                    height={24}
                  />
                </div>
              </div>
              <div className="p-6">
                <h3 className="text-xl font-semibold mb-3">{service.title}</h3>
                <p className="text-gray-600 mb-4">{service.description}</p>
                <Link 
                  href="#contact" 
                  className="text-primary font-medium hover:text-primary-dark transition-colors duration-300 flex items-center"
                >
                  Meer informatie
                  <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path>
                  </svg>
                </Link>
              </div>
            </div>
          ))}
        </div>

        <div className="text-center mt-12">
          <Link 
            href="#contact" 
            className="btn-primary px-8 py-3 rounded-full font-medium inline-block"
          >
            Vraag een offerte aan
          </Link>
        </div>
      </div>
    </section>
  );
} 