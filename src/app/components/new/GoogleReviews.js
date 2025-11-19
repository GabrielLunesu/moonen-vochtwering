'use client';

import React, { useState, useEffect, useCallback } from 'react';

const GoogleReviews = () => {
  // New reviews data without profile photos
  const reviewsData = [
    {
      id: 1,
      author: "Werkspot-gebruiker uit Maastricht",
      rating: 5,
      text: "Komt afspraken na, denkt mee, is eerlijk en geeft goede adviezen. Zeker aan te raden!",
      project: "Vochtbestrijding: 10 m²"
    },
    {
      id: 2,
      author: "Annette, Meerssen",
      rating: 5,
      text: "Zeer goed. Mensen komen afspraken na, werken hard, keurig en zijn heel vriendelijk en fexibel. Prijs kwaliteit weet ik niet. Enige bedrijf met offerte. Ik kan dit bedrijf bij iedereen aanraden. Minpunten zijn er niet.",
      project: "Vochtbestrijding: 16 m²"
    },
    {
      id: 3,
      author: "Penders, Vaals",
      rating: 5,
      text: "Een beetje late review (alweer twee jaar geleden). Maar alles is netjes uitgevoerd - en ook nu, na twee jaar, houdt de impregnering van de gevel prima!",
      project: "Gevel reinigen en impregneren"
    },
    {
      id: 4,
      author: "Wim Prins",
      rating: 5,
      text: "Het werk is perfect afgeleverd, graag beveel ik deze vakman bij iedereen aan.",
      project: "Gevels impregneren"
    },
    {
      id: 5,
      author: "Jo Smeets",
      rating: 5,
      text: "Donato heeft bij de kelder afgewerkt, het was een erg moeilijke klus, de muren zijn goed afgewerkt op het gebied rond de leidingen na, dat is wat grof afgewerkt. Voor de rest ben ik alleen maar heel positief, hij heeft zich echt verdiept in de klus, kwam al zijn afspraken na en is bovendien een aardige en spontane man.",
      project: "Kelder waterdicht maken"
    }
  ];

  const [activeIndex, setActiveIndex] = useState(0);
  const [animationDirection, setAnimationDirection] = useState('');
  const [isAnimating, setIsAnimating] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [prevIndex, setPrevIndex] = useState(0);

  // Detect when component is mounted on client
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Get text size class based on length
  const getTextSizeClass = (text) => {
    if (text.length < 50) return 'text-2xl';
    if (text.length < 100) return 'text-xl';
    if (text.length < 200) return 'text-lg';
    return 'text-base';
  };

  // Get card height class based on text length
  const getCardHeightClass = (text) => {
    if (text.length < 100) return 'min-h-[200px]';
    if (text.length < 200) return 'min-h-[250px]';
    if (text.length < 300) return 'min-h-[300px]';
    return 'min-h-[350px]';
  };

  // Wrap handleNext in useCallback to prevent it from changing on every render
  const handleNext = useCallback(() => {
    if (isAnimating) return;

    setIsAnimating(true);
    setAnimationDirection('slide-left');
    setPrevIndex(activeIndex);

    // Change slide after animation starts
    setTimeout(() => {
      setActiveIndex((prevActiveIndex) => (prevActiveIndex + 1) % reviewsData.length);

      // Reset animation state after transition completes
      setTimeout(() => {
        setIsAnimating(false);
      }, 500);
    }, 300);
  }, [isAnimating, activeIndex, reviewsData.length]);

  // Wrap handlePrev in useCallback as well to be consistent
  const handlePrev = useCallback(() => {
    if (isAnimating) return;

    setIsAnimating(true);
    setAnimationDirection('slide-right');
    setPrevIndex(activeIndex);

    // Change slide after animation starts
    setTimeout(() => {
      setActiveIndex((prevActiveIndex) => (prevActiveIndex === 0 ? reviewsData.length - 1 : prevActiveIndex - 1));

      // Reset animation state after transition completes
      setTimeout(() => {
        setIsAnimating(false);
      }, 500);
    }, 300);
  }, [isAnimating, activeIndex, reviewsData.length]);

  // Auto-rotate reviews
  useEffect(() => {
    if (!isMounted) return;

    const interval = setInterval(() => {
      handleNext();
    }, 8000);

    return () => clearInterval(interval);
  }, [handleNext, isMounted]);

  const renderStars = (rating) => {
    return Array.from({ length: 5 }, (_, i) => (
      <svg
        key={i}
        className={`w-5 h-5 ${i < rating ? "text-yellow-400" : "text-gray-300"}`}
        fill="currentColor"
        viewBox="0 0 20 20"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"></path>
      </svg>
    ));
  };

  return (
    <section id="reviews" className="py-16 bg-gray-50">
      {isMounted && (
        <style jsx>{`
          /* Animations for reviews */
          @keyframes fadeIn {
            from { opacity: 0; transform: translateY(20px); }
            to { opacity: 1; transform: translateY(0); }
          }
          
          @keyframes slideOutLeft {
            from { 
              transform: translateX(0); 
              opacity: 1;
            }
            to { 
              transform: translateX(-50px); 
              opacity: 0;
            }
          }
          
          @keyframes slideOutRight {
            from { 
              transform: translateX(0); 
              opacity: 1;
            }
            to { 
              transform: translateX(50px); 
              opacity: 0;
            }
          }
          
          @keyframes slideInLeft {
            from { 
              transform: translateX(50px); 
              opacity: 0;
            }
            to { 
              transform: translateX(0); 
              opacity: 1;
            }
          }
          
          @keyframes slideInRight {
            from { 
              transform: translateX(-50px); 
              opacity: 0;
            }
            to { 
              transform: translateX(0); 
              opacity: 1;
            }
          }
          
          @keyframes scaleButton {
            0% { transform: scale(1); }
            50% { transform: scale(1.1); }
            100% { transform: scale(1); }
          }
          
          .review-content {
            animation: fadeIn 0.8s ease-out;
          }
          
          .slide-out-left {
            animation: slideOutLeft 0.5s forwards;
          }
          
          .slide-out-right {
            animation: slideOutRight 0.5s forwards;
          }
          
          .slide-in-left {
            animation: slideInLeft 0.5s forwards;
          }
          
          .slide-in-right {
            animation: slideInRight 0.5s forwards;
          }
          
          .scale-button {
            animation: scaleButton 2s infinite;
          }
          
          .review-enter {
            opacity: 0;
            transform: translateY(20px);
          }
          
          .review-enter-active {
            opacity: 1;
            transform: translateY(0);
            transition: opacity 500ms, transform 500ms;
          }
          
          .review-exit {
            opacity: 1;
          }
          
          .review-exit-active {
            opacity: 0;
            transition: opacity 300ms;
          }
        `}</style>
      )}

      <div className="container mx-auto px-4">
        <div className={`text-center mb-12 ${isMounted ? 'review-content' : ''}`}>
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">Al 1000+ Tevreden Klanten in Zuid-Limburg</h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Sluit u aan bij de vele huiseigenaren die weer genieten van een droge, gezonde woning.
          </p>
        </div>

        {/* Modern Reviews Carousel */}
        <div className="max-w-4xl mx-auto mb-10 relative">
          {/* Review card container */}
          <div className="mx-auto w-full relative overflow-x-hidden">
            {isMounted && (
              <>
                {/* Current Review */}
                <div
                  className={`rounded-2xl bg-white shadow-lg transition-all duration-500 overflow-hidden
                    ${getCardHeightClass(reviewsData[activeIndex].text)}
                    ${isAnimating ?
                      animationDirection === 'slide-left' ? 'slide-out-left' : 'slide-out-right'
                      : 'slide-in-' + (animationDirection === 'slide-left' ? 'right' : 'left')
                    }`}
                  aria-live="polite"
                >
                  <div className="p-8 h-full flex flex-col">
                    <div className="mb-6 flex-grow">
                      <div className="relative">
                        <svg className="absolute text-gray-200 w-12 h-12 -top-6 -left-6 opacity-30" fill="currentColor" viewBox="0 0 32 32" aria-hidden="true">
                          <path d="M9.352 4C4.456 7.456 1 13.12 1 19.36c0 5.088 3.072 8.064 6.624 8.064 3.36 0 5.856-2.688 5.856-5.856 0-3.168-2.208-5.472-5.088-5.472-.576 0-1.344.096-1.536.192.48-3.264 3.552-7.104 6.624-9.024L9.352 4zm16.512 0c-4.8 3.456-8.256 9.12-8.256 15.36 0 5.088 3.072 8.064 6.624 8.064 3.264 0 5.856-2.688 5.856-5.856 0-3.168-2.304-5.472-5.184-5.472-.576 0-1.248.096-1.44.192.48-3.264 3.456-7.104 6.528-9.024L25.864 4z" />
                        </svg>

                        <p className={`relative ${getTextSizeClass(reviewsData[activeIndex].text)} text-gray-700 leading-relaxed mb-6`}>
                          {reviewsData[activeIndex].text}
                        </p>
                      </div>
                    </div>

                    <div className="mt-auto border-t border-gray-100 pt-5 flex items-center justify-between">
                      <div>
                        <div className="font-bold text-primary text-lg">{reviewsData[activeIndex].author}</div>
                        <div className="text-sm text-gray-600 mt-1">{reviewsData[activeIndex].project}</div>
                      </div>
                      <div className="flex">
                        {renderStars(reviewsData[activeIndex].rating)}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Navigation buttons */}
                <button
                  className="absolute left-0 top-1/2 transform -translate-y-1/2 -translate-x-1/2 md:translate-x-0 bg-white rounded-full p-3 shadow-lg hover:bg-gray-100 z-20 transition-all duration-300 hover:scale-110 focus:outline-none"
                  onClick={handlePrev}
                  disabled={isAnimating}
                  aria-label="Vorige review"
                >
                  <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>

                <button
                  className="absolute right-0 top-1/2 transform -translate-y-1/2 translate-x-1/2 md:translate-x-0 bg-white rounded-full p-3 shadow-lg hover:bg-gray-100 z-20 transition-all duration-300 hover:scale-110 focus:outline-none"
                  onClick={handleNext}
                  disabled={isAnimating}
                  aria-label="Volgende review"
                >
                  <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </>
            )}

            {!isMounted && (
              <div className="bg-white rounded-2xl shadow-lg p-8">
                <div className="relative">
                  <svg className="absolute text-gray-200 w-12 h-12 -top-6 -left-6 opacity-30" fill="currentColor" viewBox="0 0 32 32" aria-hidden="true">
                    <path d="M9.352 4C4.456 7.456 1 13.12 1 19.36c0 5.088 3.072 8.064 6.624 8.064 3.36 0 5.856-2.688 5.856-5.856 0-3.168-2.208-5.472-5.088-5.472-.576 0-1.344.096-1.536.192.48-3.264 3.552-7.104 6.624-9.024L9.352 4zm16.512 0c-4.8 3.456-8.256 9.12-8.256 15.36 0 5.088 3.072 8.064 6.624 8.064 3.264 0 5.856-2.688 5.856-5.856 0-3.168-2.304-5.472-5.184-5.472-.576 0-1.248.096-1.44.192.48-3.264 3.456-7.104 6.528-9.024L25.864 4z" />
                  </svg>

                  <div className="mb-6">
                    <p className="relative text-xl text-gray-700 leading-relaxed mb-4">
                      Het werk is perfect afgeleverd, graag beveel ik deze vakman bij iedereen aan.
                    </p>
                  </div>

                  <div className="mt-auto border-t border-gray-100 pt-5 flex items-center justify-between">
                    <div>
                      <div className="font-bold text-primary text-lg">Wim Prins</div>
                      <div className="text-sm text-gray-600 mt-1">Gevels impregneren</div>
                    </div>
                    <div className="flex">
                      {renderStars(5)}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Dots navigation */}
          <div className="flex justify-center mt-6">
            {reviewsData.map((_, index) => (
              <button
                key={index}
                onClick={() => {
                  if (isAnimating) return;
                  setPrevIndex(activeIndex);
                  setAnimationDirection(index > activeIndex ? 'slide-left' : 'slide-right');
                  setIsAnimating(true);
                  setTimeout(() => {
                    setActiveIndex(index);
                    setTimeout(() => setIsAnimating(false), 500);
                  }, 300);
                }}
                className={`mx-1 transition-all duration-300 focus:outline-none ${index === activeIndex
                    ? 'w-8 h-2 bg-primary rounded-full'
                    : 'w-2 h-2 bg-gray-300 rounded-full hover:bg-primary/50'
                  }`}
                aria-label={`Ga naar review ${index + 1}`}
                aria-current={index === activeIndex ? 'true' : 'false'}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default GoogleReviews; 