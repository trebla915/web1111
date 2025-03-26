import { ReactNode } from 'react';

interface SectionProps {
  title: string;
  description?: string;
  children: ReactNode;
  className?: string;
  bgColor?: string;
  centered?: boolean;
  id?: string;
  withNoise?: boolean;
  withSpotlight?: boolean;
}

export default function Section({
  title,
  description,
  children,
  className = '',
  bgColor = 'bg-gray-900',
  centered = true,
  id,
  withNoise = false,
  withSpotlight = false,
}: SectionProps) {
  return (
    <section 
      id={id}
      className={`py-16 px-6 ${bgColor} text-white ${centered ? 'text-center' : ''} ${className} relative overflow-hidden`}
    >
      {withNoise && <div className="noise absolute inset-0 opacity-10"></div>}
      {withSpotlight && <div className="spotlight"></div>}
      
      <div className="max-w-6xl mx-auto relative z-10">
        <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4 tracking-wider uppercase">{title}</h2>
        {description && <p className="max-w-2xl mx-auto mb-12 tracking-wide text-gray-300 text-sm md:text-base uppercase">{description}</p>}
        <div className="relative z-10">
          {children}
        </div>
      </div>
    </section>
  );
}