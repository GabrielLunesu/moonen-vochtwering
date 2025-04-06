'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';

const BeforeAfterSlider = () => {
  const [sliderPosition, setSliderPosition] = useState(50);
  const [isDragging, setIsDragging] = useState(false);
  const [animationComplete, setAnimationComplete] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const containerRef = useRef(null);
  
  // Set mounted state to true when component mounts
  useEffect(() => {
    setIsMounted(true);
  }, []);
  
  const handleMouseDown = (e) => {
    e.preventDefault();
    setIsDragging(true);
    setAnimationComplete(true); // Stop animation permanently once user interacts
  };
  
  const handleTouchStart = () => {
    setIsDragging(true);
    setAnimationComplete(true); // Stop animation permanently once user interacts
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };
  
  const handleTouchEnd = () => {
    setIsDragging(false);
  };

  const calculateSliderPosition = (clientX) => {
    if (!containerRef.current) return;
    
    const { left, width } = containerRef.current.getBoundingClientRect();
    let position = ((clientX - left) / width) * 100;
    
    // Clamp the position between 0 and 100
    position = Math.max(0, Math.min(100, position));
    
    setSliderPosition(position);
  };

  const handleMouseMove = (e) => {
    if (!isDragging) return;
    calculateSliderPosition(e.clientX);
  };
  
  const handleTouchMove = (e) => {
    if (!isDragging) return;
    calculateSliderPosition(e.touches[0].clientX);
  };

  useEffect(() => {
    document.addEventListener('mouseup', handleMouseUp);
    document.addEventListener('touchend', handleTouchEnd);
    
    return () => {
      document.removeEventListener('mouseup', handleMouseUp);
      document.removeEventListener('touchend', handleTouchEnd);
    };
  }, []);
  
  // Initial animation that stops at 50%
  useEffect(() => {
    if (!isMounted || animationComplete) return;
    
    let startPosition = 0;
    
    const interval = setInterval(() => {
      if (startPosition < 50) {
        startPosition += 1;
        setSliderPosition(startPosition);
      } else {
        setAnimationComplete(true);
        clearInterval(interval);
      }
    }, 30);
    
    return () => clearInterval(interval);
  }, [animationComplete, isMounted]);

  // If component is not mounted yet (during SSR), render a simple placeholder
  if (!isMounted) {
    return (
      <div className="relative w-[300px] h-[300px] md:w-[420px] md:h-[420px] rounded-xl border-2 border-primary overflow-hidden bg-white shadow-lg">
        <div className="absolute top-0 left-0 w-full h-full">
          <Image
            src="/images/before.png"
            alt="Voor behandeling"
            fill
            className="object-cover"
            sizes="(max-width: 768px) 300px, 420px"
            priority
          />
        </div>
      </div>
    );
  }

  return (
    <div 
      ref={containerRef}
      className={`relative w-[300px] h-[300px] md:w-[420px] md:h-[420px] rounded-xl border-2 border-primary overflow-hidden bg-white cursor-ew-resize shadow-lg before-after-container ${isDragging ? 'slider-active' : ''}`}
      onMouseMove={handleMouseMove}
      onTouchMove={handleTouchMove}
      onMouseDown={handleMouseDown}
      onTouchStart={handleTouchStart}
    >
      {/* Before Image - Full width */}
      <div className="absolute top-0 left-0 w-full h-full">
        <Image
          src="/images/before.png"
          alt="Voor behandeling"
          fill
          className="object-cover"
          sizes="(max-width: 768px) 300px, 420px"
          priority
        />
      </div>
      
      {/* After Image - Clipped by slider position */}
      <div 
        className="absolute top-0 left-0 h-full overflow-hidden"
        style={{ width: `${sliderPosition}%` }}
      >
        <Image
          src="/images/after.png"
          alt="Na behandeling"
          fill
          className="object-cover"
          sizes="(max-width: 768px) 300px, 420px"
          priority
        />
      </div>
      
      {/* Labels */}
      <div className="absolute top-4 left-4 bg-primary text-white px-3 py-1 rounded text-sm font-medium">
        NA
      </div>
      <div className="absolute top-4 right-4 bg-black/70 text-white px-3 py-1 rounded text-sm font-medium">
        VOOR
      </div>
    </div>
  );
};

export default BeforeAfterSlider; 