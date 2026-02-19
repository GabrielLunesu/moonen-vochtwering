'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';

export default function BeforeAfterSlider({
  beforeImage = '/images/before-after/before-1.jpeg',
  afterImage = '/images/before-after/after-1.jpeg',
  beforeLabel = 'VOOR',
  afterLabel = 'NA',
}) {
  const [sliderPosition, setSliderPosition] = useState(50);
  const [isDragging, setIsDragging] = useState(false);
  const [animationComplete, setAnimationComplete] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const containerRef = useRef(null);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const handleMouseDown = (e) => {
    e.preventDefault();
    setIsDragging(true);
    setAnimationComplete(true);
  };

  const handleTouchStart = () => {
    setIsDragging(true);
    setAnimationComplete(true);
  };

  const handleMouseUp = () => setIsDragging(false);
  const handleTouchEnd = () => setIsDragging(false);

  const calculateSliderPosition = (clientX) => {
    if (!containerRef.current) return;
    const { left, width } = containerRef.current.getBoundingClientRect();
    let position = ((clientX - left) / width) * 100;
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

  useEffect(() => {
    if (!isMounted || animationComplete) return;
    let pos = 0;
    const interval = setInterval(() => {
      if (pos < 50) {
        pos += 1;
        setSliderPosition(pos);
      } else {
        setAnimationComplete(true);
        clearInterval(interval);
      }
    }, 30);
    return () => clearInterval(interval);
  }, [animationComplete, isMounted]);

  if (!isMounted) {
    return (
      <div className="relative w-full aspect-[4/3] rounded-xl overflow-hidden bg-gray-100">
        <img src={beforeImage} alt={beforeLabel} className="absolute inset-0 w-full h-full object-cover" />
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="relative w-full aspect-[4/3] rounded-xl overflow-hidden cursor-ew-resize select-none border-2 border-[#8aab4c]/20"
      onMouseMove={handleMouseMove}
      onTouchMove={handleTouchMove}
      onMouseDown={handleMouseDown}
      onTouchStart={handleTouchStart}
    >
      {/* Before image (full) */}
      <img src={beforeImage} alt={beforeLabel} className="absolute inset-0 w-full h-full object-cover" />

      {/* After image (clipped) */}
      <div className="absolute top-0 left-0 h-full overflow-hidden" style={{ width: `${sliderPosition}%` }}>
        <img
          src={afterImage}
          alt={afterLabel}
          className="absolute inset-0 w-full h-full object-cover"
          style={{ minWidth: containerRef.current ? `${containerRef.current.offsetWidth}px` : '100%' }}
        />
      </div>

      {/* Slider line + handle */}
      <div
        className="absolute top-0 bottom-0 w-0.5 bg-[#8aab4c] z-10"
        style={{ left: `${sliderPosition}%`, transform: 'translateX(-50%)' }}
      >
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-[#8aab4c] border-2 border-white shadow-lg flex items-center justify-center">
          <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l4-4 4 4M8 15l4 4 4-4" />
          </svg>
        </div>
      </div>

      {/* Labels */}
      <div className="absolute top-4 left-4 bg-[#8aab4c] text-white px-3 py-1 rounded text-xs font-semibold uppercase tracking-wide z-20">
        {afterLabel}
      </div>
      <div className="absolute top-4 right-4 bg-[#111827]/80 text-white px-3 py-1 rounded text-xs font-semibold uppercase tracking-wide z-20">
        {beforeLabel}
      </div>
    </div>
  );
}
