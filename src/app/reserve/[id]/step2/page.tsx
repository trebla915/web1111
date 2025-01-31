'use client';

import { useState, useEffect } from 'react';
import { useSearchParams, useRouter, useParams } from 'next/navigation';
import Image from 'next/image';
import { fetchAllBottlesForEvent } from '@/lib/api/bottleService';
import type { Bottle } from '@/types/bottle';

const PLACEHOLDER_IMAGE = '/placeholder-bottle.png';

export default function Step2Page() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  
  const tableId = searchParams.get('tableId');
  const tablePrice = searchParams.get('tablePrice');
  const guests = searchParams.get('guests');
  
  const [bottles, setBottles] = useState<Bottle[]>([]);
  const [selectedBottles, setSelectedBottles] = useState<Bottle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadBottles = async () => {
      try {
        if (!params.id) throw new Error('Missing event ID');
        
        const backendBottles = await fetchAllBottlesForEvent(params.id as string);
        const formattedBottles = backendBottles.map(bottle => ({
          ...bottle,
          imageUrl: bottle.imageUrl || PLACEHOLDER_IMAGE,
          price: bottle.price || 0
        }));
        
        setBottles(formattedBottles);
        setError('');
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load bottles');
      } finally {
        setLoading(false);
      }
    };

    loadBottles();
  }, [params.id]);

  const toggleBottle = (bottle: Bottle) => {
    setSelectedBottles(prev => 
      prev.some(b => b.id === bottle.id)
        ? prev.filter(b => b.id !== bottle.id)
        : [...prev, bottle]
    );
  };

  const handleNextStep = () => {
    router.push(
      `/reserve/${params.id}/step3?` +
      new URLSearchParams({
        tableId: tableId || '',
        tablePrice: tablePrice || '',
        tableNumber: searchParams.get('tableNumber') || 'Unknown Table', // ✅ Now Passing Table Number
        guests: guests || '1',
        bottles: JSON.stringify(selectedBottles)
      })
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <div className="bg-red-500/20 backdrop-blur-sm p-6 rounded-xl border border-red-500/30 text-center">
          <p className="text-red-400 text-lg font-bold">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="block mt-4 text-white border border-white px-4 py-2 rounded-lg hover:bg-white hover:text-black transition-all"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center bg-black px-4">
      <div className="max-w-6xl w-full space-y-10 p-8 border border-white/20 backdrop-blur-lg rounded-xl bg-black/50">
        {/* Title */}
        <h1 className="text-4xl md:text-5xl font-bold text-center text-white">
          Premium Bottle Selection
        </h1>

        {/* No Bottles Available */}
        {bottles.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            No bottles available for this event
          </div>
        ) : (
          <>
            {/* Bottle Selection Grid */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 mb-8">
              {bottles.map(bottle => (
                <div 
                  key={bottle.id}
                  className="relative group bg-transparent border border-white/20 rounded-xl overflow-hidden hover:shadow-2xl transition-all"
                >
                  <button
                    onClick={() => toggleBottle(bottle)}
                    className={`w-full h-full text-left p-4 border-2 transition-all ${
                      selectedBottles.some(b => b.id === bottle.id)
                        ? 'border-white bg-white/10'
                        : 'border-white/30 hover:border-white/50'
                    }`}
                  >
                    {/* Bottle Image */}
                    <div className="relative aspect-square mb-4">
                      <Image
                        src={bottle.imageUrl || PLACEHOLDER_IMAGE}
                        alt={bottle.name}
                        fill
                        className="object-contain"
                        sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
                        quality={100}
                      />
                    </div>
                    
                    {/* Bottle Info */}
                    <h3 className="font-bold text-lg text-white truncate mb-1">{bottle.name}</h3>
                    <p className="text-white font-mono text-xl mb-2">
                      ${bottle.price.toFixed(2)}
                    </p>
                    {bottle.description && (
                      <p className="text-gray-400 text-sm line-clamp-2">
                        {bottle.description}
                      </p>
                    )}
                  </button>

                  {/* Selected Badge */}
                  {selectedBottles.some(b => b.id === bottle.id) && (
                    <div className="absolute bottom-4 right-4 bg-black/90 backdrop-blur-sm px-3 py-2 rounded-full">
                      <span className="text-white">Selected</span>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Bottom Sticky Bar */}
            <div className="sticky bottom-0 w-full bg-black/70 backdrop-blur-lg py-4">
              <div className="max-w-4xl mx-auto">
                <div className="flex flex-col md:flex-row justify-between items-center gap-4 p-4 border border-white/20 rounded-xl bg-black/50">
                  <div className="text-center md:text-left text-white">
                    <h3 className="text-xl font-bold">
                      Selected: {selectedBottles.length} bottles
                    </h3>
                    <p className="text-gray-400">
                      Total: ${selectedBottles.reduce((sum, b) => sum + (b.price || 0), 0).toFixed(2)}
                    </p>
                  </div>
                  <button
                    onClick={handleNextStep}
                    disabled={selectedBottles.length === 0}
                    className="py-3 px-8 border border-white text-white rounded-lg font-bold text-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-white hover:text-black transition-all"
                  >
                    Continue to Payment →
                  </button>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}