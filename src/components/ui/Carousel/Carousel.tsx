'use client';

import { ReactNode, useCallback } from 'react';
import useEmblaCarousel from 'embla-carousel-react';
import type { EmblaOptionsType } from 'embla-carousel';

export type CarouselProps = {
  children: ReactNode;
  options?: EmblaOptionsType;
  className?: string;
  showControls?: boolean;
};

const Carousel = ({
  children,
  options,
  className = '',
  showControls = true
}: CarouselProps) => {
  const [emblaRef, emblaApi] = useEmblaCarousel({
    align: 'center',
    containScroll: false,
    ...options
  });

  const scrollPrev = useCallback(() => {
    emblaApi?.scrollPrev();
  }, [emblaApi]);

  const scrollNext = useCallback(() => {
    emblaApi?.scrollNext();
  }, [emblaApi]);

  return (
    <div className={`relative ${className}`}>
      <div className="overflow-hidden" ref={emblaRef}>
        <div className="flex -ml-4">{children}</div>
      </div>

      {showControls && (
        <div className="flex justify-center gap-4 mt-6">
          <PrevButton onClick={scrollPrev} />
          <NextButton onClick={scrollNext} />
        </div>
      )}
    </div>
  );
};

// Slide Component
const Slide = ({ 
  children, 
  className = '' 
}: { 
  children: ReactNode;
  className?: string;
}) => (
  <div className={`flex-[0_0_80%] min-w-0 pl-4 ${className}`}>
    {children}
  </div>
);

// Navigation Buttons
const PrevButton = ({ 
  onClick 
}: { 
  onClick: () => void;
}) => (
  <button
    onClick={onClick}
    className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors duration-200"
    aria-label="Previous slide"
  >
    <svg
      xmlns="http://www.w3.org/2000/svg"
      className="h-6 w-6 text-white"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M15 19l-7-7 7-7"
      />
    </svg>
  </button>
);

const NextButton = ({ 
  onClick 
}: { 
  onClick: () => void;
}) => (
  <button
    onClick={onClick}
    className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors duration-200"
    aria-label="Next slide"
  >
    <svg
      xmlns="http://www.w3.org/2000/svg"
      className="h-6 w-6 text-white"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M9 5l7 7-7 7"
      />
    </svg>
  </button>
);

// Export components
Carousel.Slide = Slide;
Carousel.NextButton = NextButton;
Carousel.PrevButton = PrevButton;

export default Carousel;