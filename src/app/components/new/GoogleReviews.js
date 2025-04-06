'use client';

import React, { useState, useEffect } from 'react';

const GoogleReviews = () => {
  // These would typically come from a Google API call
  // For now we'll use placeholder review data
  const reviewsData = [
    {
      id: 1,
      author: "Jan Janssen",
      rating: 5,
      date: "2 weken geleden",
      text: "Zeer professioneel bedrijf. Ze hebben mijn vochtprobleem in de kelder perfect opgelost. Ik ben zeer tevreden met het resultaat.",
      profilePhoto: "https://placehold.co/50x50/e8e8e8/5d5d5d?text=JJ"
    },
    {
      id: 2,
      author: "Petra Vermeulen",
      rating: 5,
      date: "1 maand geleden",
      text: "Na jarenlang problemen met vocht in onze kelder hebben Moonen Vochtwering een blijvende oplossing geboden. Aanrader!",
      profilePhoto: "https://placehold.co/50x50/e8e8e8/5d5d5d?text=PV"
    },
    {
      id: 3,
      author: "Kevin de Groot",
      rating: 4,
      date: "3 maanden geleden",
      text: "Goede service, snelle afhandeling en prima oplossing voor onze keldervochtproblemen. Daarom 4 sterren.",
      profilePhoto: "https://placehold.co/50x50/e8e8e8/5d5d5d?text=KG"
    },
    {
      id: 4,
      author: "Femke Bakker",
      rating: 5,
      date: "5 maanden geleden",
      text: "Professioneel advies en uitstekende uitvoering van de kelderdichting. Geen vocht meer en geen schimmel. Top!",
      profilePhoto: "https://placehold.co/50x50/e8e8e8/5d5d5d?text=FB"
    }
  ];

  // Google review page URL - replace with actual Google Business URL
  const googleReviewUrl = "https://g.page/r/YOUR_GOOGLE_BUSINESS_ID/review";
  
  const [activeIndex, setActiveIndex] = useState(0);
  const [animationDirection, setAnimationDirection] = useState('');
  const [isAnimating, setIsAnimating] = useState(false);
  
  // Auto-rotate reviews
  useEffect(() => {
    const interval = setInterval(() => {
      handleNext();
    }, 8000);
    
    return () => clearInterval(interval);
  }, []);
  
  const handleNext = () => {
    if (isAnimating) return;
    
    setIsAnimating(true);
    setAnimationDirection('slide-left');
    
    // Change slide after animation starts
    setTimeout(() => {
      setActiveIndex((prevIndex) => (prevIndex + 1) % reviewsData.length);
      
      // Reset animation state after transition completes
      setTimeout(() => {
        setIsAnimating(false);
      }, 500);
    }, 300);
  };
  
  const handlePrev = () => {
    if (isAnimating) return;
    
    setIsAnimating(true);
    setAnimationDirection('slide-right');
    
    // Change slide after animation starts
    setTimeout(() => {
      setActiveIndex((prevIndex) => (prevIndex === 0 ? reviewsData.length - 1 : prevIndex - 1));
      
      // Reset animation state after transition completes
      setTimeout(() => {
        setIsAnimating(false);
      }, 500);
    }, 300);
  };

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
    <section id="reviews" className="py-16 bg-white">
      <style jsx>{`
        /* Add these animation styles */
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        @keyframes slideLeft {
          from { transform: translateX(0); opacity: 1; }
          to { transform: translateX(-50px); opacity: 0; }
        }
        
        @keyframes slideRight {
          from { transform: translateX(0); opacity: 1; }
          to { transform: translateX(50px); opacity: 0; }
        }
        
        @keyframes slideInLeft {
          from { transform: translateX(50px); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
        
        @keyframes slideInRight {
          from { transform: translateX(-50px); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
        
        .review-content {
          animation: fadeIn 0.8s ease-out;
        }
        
        .slide-left {
          animation: slideLeft 0.5s forwards;
        }
        
        .slide-right {
          animation: slideRight 0.5s forwards;
        }
        
        .slide-in-left {
          animation: slideInLeft 0.5s forwards;
        }
        
        .slide-in-right {
          animation: slideInRight 0.5s forwards;
        }
      `}</style>
      
      <div className="container mx-auto px-4">
        <div className="text-center mb-16 review-content">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">Wat Onze Klanten Zeggen</h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Lees wat onze klanten over onze kelderprojecten te zeggen hebben op Google. We zijn trots op onze 
            <span className="text-yellow-500 font-bold"> 4.8 </span> 
            gemiddelde beoordeling!
          </p>
        </div>
        
        {/* Reviews Carousel */}
        <div className="max-w-4xl mx-auto bg-gray-50 rounded-xl shadow-lg p-8 mb-10 relative overflow-hidden">
          <button 
            className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-white rounded-full p-2 shadow-md hover:bg-gray-100 z-10"
            onClick={handlePrev}
            disabled={isAnimating}
          >
            <svg className="w-6 h-6 text-gray-800" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          
          <div className={`flex flex-col items-center ${animationDirection} ${isAnimating ? '' : 'slide-in-' + (animationDirection === 'slide-left' ? 'right' : 'left')}`}>
            <div className="flex items-center mb-4">
              <img 
                src={reviewsData[activeIndex].profilePhoto} 
                alt={reviewsData[activeIndex].author} 
                className="w-16 h-16 rounded-full mr-4 shadow-md"
              />
              <div>
                <div className="font-bold text-xl">{reviewsData[activeIndex].author}</div>
                <div className="text-gray-500 text-sm">{reviewsData[activeIndex].date}</div>
                <div className="flex mt-1">
                  {renderStars(reviewsData[activeIndex].rating)}
                </div>
              </div>
            </div>
            
            <p className="text-gray-700 italic text-center text-lg mb-4">
              "{reviewsData[activeIndex].text}"
            </p>
            
            <div className="flex mt-4">
              {reviewsData.map((_, index) => (
                <button 
                  key={index} 
                  onClick={() => !isAnimating && setActiveIndex(index)} 
                  className={`mx-1 w-3 h-3 rounded-full transition-all duration-300 ${index === activeIndex ? 'bg-blue-600 w-6' : 'bg-gray-300'}`}
                  aria-label={`Go to review ${index + 1}`}
                />
              ))}
            </div>
          </div>
          
          <button 
            className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-white rounded-full p-2 shadow-md hover:bg-gray-100 z-10"
            onClick={handleNext}
            disabled={isAnimating}
          >
            <svg className="w-6 h-6 text-gray-800" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
        
        {/* Call to Action */}
        <div className="text-center review-content">
          <a 
            href={googleReviewUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 md:py-4 md:text-lg md:px-8 transition duration-300 hover:scale-105"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
            </svg>
            Laat een review achter op Google
          </a>
          <p className="mt-4 text-gray-500">
            Uw feedback helpt ons en andere klanten. Bedankt voor uw ondersteuning!
          </p>
        </div>
      </div>
    </section>
  );
};

export default GoogleReviews; 