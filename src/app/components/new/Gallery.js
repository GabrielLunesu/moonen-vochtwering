'use client';

import React from 'react';
import Image from 'next/image';

const Gallery = () => {
  const projects = [
    {
      id: 1,
      title: 'Vochtbestrijding kelder',
      description: 'Professionele aanpak van vochtige muren in kelder',
      imageUrl: '/images/kelder_vochtbestrijding.jpg',
      fallbackUrl: 'https://placehold.co/600x400/e8e8e8/5d5d5d?text=Kelder+vochtbestrijding',
    },
    {
      id: 2,
      title: 'Kelderdichting',
      description: 'Waterdicht maken van kelderruimtes',
      imageUrl: '/images/kelderdichting.jpg',
      fallbackUrl: 'https://placehold.co/600x400/e8e8e8/5d5d5d?text=Kelderdichting',
    },
    {
      id: 3,
      title: 'Injectie keldervochtscherm',
      description: 'Aanleg van vochtscherm in kelders via injectie',
      imageUrl: '/images/injectie_keldervochtscherm.jpg',
      fallbackUrl: 'https://placehold.co/600x400/e8e8e8/5d5d5d?text=Injectie+keldervochtscherm',
    },
    {
      id: 4,
      title: 'Kelderrenovatie',
      description: 'Complete renovatie en vochtbestrijding van kelders',
      imageUrl: '/images/kelderrenovatie.jpg',
      fallbackUrl: 'https://placehold.co/600x400/e8e8e8/5d5d5d?text=Kelderrenovatie',
    },
    {
      id: 5,
      title: 'Schimmelbestrijding kelder',
      description: 'Effectieve bestrijding van schimmel in kelderruimtes',
      imageUrl: '/images/schimmelbestrijding_kelder.jpg',
      fallbackUrl: 'https://placehold.co/600x400/e8e8e8/5d5d5d?text=Schimmelbestrijding+kelder',
    },
    {
      id: 6,
      title: 'Drainage systemen',
      description: 'Installatie van drainage rond kelders voor droge ruimtes',
      imageUrl: '/images/kelder_drainage_systemen.jpg',
      fallbackUrl: 'https://placehold.co/600x400/e8e8e8/5d5d5d?text=Kelder+drainage+systemen',
    },
  ];

  return (
    <section id="gallery" className="py-16 bg-gray-50">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">Onze Kelderprojecten</h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Bekijk enkele van onze recente kelderprojecten en onze specialistische oplossingen voor vochtproblemen in kelders.
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {projects.map((project) => (
            <div 
              key={project.id} 
              className="bg-white rounded-lg overflow-hidden shadow-lg transition-transform duration-300 hover:scale-105"
            >
              <div className="relative w-full h-64">
                <Image
                  src={project.fallbackUrl}
                  alt={project.title}
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                />
              </div>
              <div className="p-6">
                <h3 className="text-xl font-semibold text-gray-900 mb-2">{project.title}</h3>
                <p className="text-gray-600">{project.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Gallery; 