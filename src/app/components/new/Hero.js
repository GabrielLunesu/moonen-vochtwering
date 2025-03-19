'use client';

import { useEffect, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';

export default function Hero() {
  const titleRef = useRef(null);
  const subtitleRef = useRef(null);
  const ctaRef = useRef(null);
  const imageRef = useRef(null);
  const waterDropsRef = useRef(null);
  const statsRef = useRef(null);

  useEffect(() => {
    // Store refs in variables to use in animations and cleanup
    const titleElement = titleRef.current;
    const subtitleElement = subtitleRef.current;
    const ctaElement = ctaRef.current;
    const imageElement = imageRef.current;
    const waterDropsElement = waterDropsRef.current;
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
    if (waterDropsElement) {
      waterDropsElement.classList.add('animate-fade-in', 'stagger-2');
    }
    if (statsElement) {
      statsElement.classList.add('animate-fade-in', 'stagger-3');
    }

    // Rain animation
    const createRaindrop = () => {
      if (!waterDropsElement) return;
      
      const raindrop = document.createElement('div');
      raindrop.classList.add('raindrop');
      
      const size = Math.random() * 8 + 3;
      raindrop.style.width = `${size}px`;
      raindrop.style.height = `${size * 1.5}px`;
      
      raindrop.style.left = `${Math.random() * 100}%`;
      raindrop.style.animationDuration = `${Math.random() * 2 + 1}s`;
      raindrop.style.opacity = Math.random() * 0.4 + 0.2;
      
      waterDropsElement.appendChild(raindrop);
      
      setTimeout(() => {
        raindrop.remove();
      }, 3000);
    };
    
    const rainInterval = setInterval(createRaindrop, 100);
    
    return () => {
      clearInterval(rainInterval);
    };
  }, []);

  return (
    <section className="pt-28 pb-16 md:pt-36 md:pb-24 relative overflow-hidden">
      {/* Animated water drops in background */}
      <div 
        ref={waterDropsRef} 
        className="absolute top-0 left-0 w-full h-full pointer-events-none opacity-0"
      />
      
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
              Specialist in <span className="text-gradient">vochtwering</span> & <span className="text-gradient">vochtbestrijding</span>
            </h1>
            
            <p 
              ref={subtitleRef}
              className="text-base md:text-lg text-black mb-8 opacity-0"
            >
              Bescherm uw woning of bedrijfspand tegen vocht, schimmel en lekkages met Moonen Vochtwering. Wij bieden professionele oplossingen voor vochtwering en -bestrijding in Heerlen en omgeving Parkstad.
            </p>
            
            <div 
              ref={ctaRef}
              className="flex flex-col sm:flex-row gap-4 opacity-0"
            >
              <Link href="#contact" className="btn btn-primary text-center group">
                <span>Gratis inspectie</span>
                <svg className="w-5 h-5 ml-2 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              </Link>
              <Link href="#diensten" className="btn btn-outline text-center flex items-center">
                <span>Onze diensten</span>
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
              {/* House with water protection illustration */}
              <div className="w-[300px] h-[300px] md:w-[420px] md:h-[420px] rounded-xl border-2 border-primary p-2 bg-white relative overflow-hidden hover:shadow-xl transition-all duration-300">
                <svg className="absolute top-0 left-0 w-full h-full opacity-10 text-primary" viewBox="0 0 100 100">
                  <path d="M10,50 Q50,10 90,50 L90,90 L10,90 Z" fill="currentColor" />
                  <path d="M30,90 L30,60 L45,60 L45,90 Z" fill="currentColor" />
                  <path d="M55,90 L55,50 L70,50 L70,90 Z" fill="currentColor" />
                </svg>
                
                <div className="w-full h-full rounded-lg overflow-hidden relative">
                  <div className="absolute inset-0 bg-gradient-to-b from-primary/40 to-primary/5 z-10"></div>
                  
                  {/* We'll display a house image here. For now using a placeholder */}
                  <div className="absolute inset-0 flex items-center justify-center z-20">
                    <svg className="w-3/4 h-3/4 text-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                      <path d="M9 22V12h6v10" />
                      <path d="M8 9h8" strokeDasharray="12" strokeDashoffset="0" className="animate-dash" />
                      <path d="M4 10l8-6 8 6" strokeDasharray="24" strokeDashoffset="0" className="animate-dash" />
                      <path d="M4 22h16" strokeDasharray="16" strokeDashoffset="0" className="animate-dash-reverse" />
                      {/* Water drop shield */}
                      <g transform="translate(12, 15) scale(0.5)">
                        <path d="M0 -8 C-5 2, -5 8, 0 12 C5 8, 5 2, 0 -8z" fill="currentColor" stroke="none" />
                      </g>
                    </svg>
                  </div>
                </div>
              </div>
              
              <div className="absolute bottom-0 left-0 right-0 text-center -mb-8">
                <h2 className="text-2xl md:text-3xl font-bold rounded-full text-white bg-primary inline-block px-6 py-2 shadow-lg">
                  Moonen <span className="text-accent">Vochtwering</span>
                </h2>
              </div>
            </div>
          </div>
        </div>
        
        <div 
          ref={statsRef}
          className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6 mt-20 md:mt-24 pt-8 border-t border-gray-200 opacity-0"
        >
          <div className="text-center">
            <div className="text-2xl md:text-3xl font-bold text-primary mb-1 md:mb-2">15+</div>
            <p className="text-sm md:text-base text-black">Jaren ervaring</p>
          </div>
          
          <div className="text-center">
            <div className="text-2xl md:text-3xl font-bold text-primary mb-1 md:mb-2">1000+</div>
            <p className="text-sm md:text-base text-black">Tevreden klanten</p>
          </div>
          
          <div className="text-center">
            <div className="text-2xl md:text-3xl font-bold text-primary mb-1 md:mb-2">100%</div>
            <p className="text-sm md:text-base text-black">Kwaliteitsgarantie</p>
          </div>
        </div>
      </div>
    </section>
  );
} 