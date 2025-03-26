"use client";

import { useState } from 'react';
import { FiSearch, FiX } from 'react-icons/fi';
import EventsFestivalSection from '@/components/sections/EventsFestivalSection';

export default function EventsPage() {
  const [searchQuery, setSearchQuery] = useState('');

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  return (
    <div className="min-h-screen bg-black">
      <div className="container mx-auto px-4 py-12">
        <div className="mb-10">
          <h1 className="text-7xl md:text-9xl font-bold mb-8 text-cyan-400 text-center" style={{ fontFamily: 'Impact, sans-serif' }}>
            MUSIC
          </h1>
          
          {/* Search bar */}
          <div className="max-w-xl mx-auto mb-12">
            <div className="relative">
              <input
                type="text"
                placeholder="SEARCH EVENTS..."
                value={searchQuery}
                onChange={handleSearch}
                className="w-full bg-black border-2 border-cyan-400 py-3 px-4 text-cyan-100 placeholder-cyan-600 focus:outline-none"
              />
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                {searchQuery ? (
                  <FiX 
                    className="text-cyan-400 cursor-pointer" 
                    onClick={() => setSearchQuery('')}
                  />
                ) : (
                  <FiSearch className="text-cyan-400" />
                )}
              </div>
            </div>
          </div>
        </div>
        
        <EventsFestivalSection 
          title="ALL EVENTS" 
          maxEvents={undefined}
          className="pt-0"
          showYear={true}
        />
      </div>
    </div>
  );
} 