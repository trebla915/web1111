"use client";

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/components/providers/AuthProvider';
import { useReservation } from '@/components/providers/ReservationProvider';
import { fetchAllBottles, fetchAllMixers } from '@/lib/services/bottles';
import { Bottle, Mixer } from '@/types/reservation';
import { formatCostBreakdown } from '@/lib/services/payment';
import { toast } from 'react-hot-toast';
import { FiPlus, FiMinus, FiTrash, FiEdit } from 'react-icons/fi';

export default function ReservationDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const { 
    reservationDetails, 
    updateReservationDetails, 
    addBottle, 
    removeBottle, 
    calculateTotal 
  } = useReservation();
  
  const [loading, setLoading] = useState(true);
  const [guestCount, setGuestCount] = useState(1);
  const [bottles, setBottles] = useState<Bottle[]>([]);
  const [mixers, setMixers] = useState<Mixer[]>([]);
  const [showBottleSelection, setShowBottleSelection] = useState(false);
  
  const eventId = params.eventId as string;
  
  useEffect(() => {
    if (!reservationDetails) {
      router.push(`/reserve/${eventId}`);
      return;
    }
    
    setGuestCount(reservationDetails.guestCount);
    
    const fetchProducts = async () => {
      try {
        setLoading(true);
        const [fetchedBottles, fetchedMixers] = await Promise.all([
          fetchAllBottles(),
          fetchAllMixers()
        ]);
        setBottles(fetchedBottles);
        setMixers(fetchedMixers);
      } catch (err) {
        console.error('Failed to fetch products:', err);
        toast.error('Failed to load bottles and mixers');
      } finally {
        setLoading(false);
      }
    };
    
    fetchProducts();
  }, [eventId, reservationDetails, router]);
  
  const handleUpdateGuestCount = (increment: boolean, e?: React.MouseEvent) => {
    // Prevent default behavior if event is provided
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    
    if (!reservationDetails) return;
    
    let newCount = increment ? guestCount + 1 : guestCount - 1;
    
    // Limit guest count between 1 and table capacity
    newCount = Math.max(1, Math.min(newCount, reservationDetails.capacity));
    
    setGuestCount(newCount);
    updateReservationDetails({ guestCount: newCount });
  };
  
  const handleBottleSelect = (bottle: Bottle) => {
    addBottle(bottle);
    setShowBottleSelection(false);
    toast.success(`Added ${bottle.name} to your reservation`);
  };
  
  const handleRemoveBottle = (bottleId: string) => {
    removeBottle(bottleId);
    toast.success('Removed bottle from your reservation');
  };
  
  const handleContinueToPayment = () => {
    if (!reservationDetails) {
      toast.error('Reservation details not found');
      return;
    }
    
    router.push(`/reserve/${eventId}/payment`);
  };
  
  if (loading) {
    return (
      <div className="min-h-screen pt-28 pb-12 flex flex-col items-center">
        <div className="w-full max-w-2xl mx-auto px-4">
          <div className="h-64 flex items-center justify-center">
            <div className="flex flex-col items-center">
              <div className="w-12 h-12 border-t-2 border-b-2 border-cyan-500 rounded-full animate-spin"></div>
              <p className="mt-4 text-white">Loading your reservation...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }
  
  if (!reservationDetails) {
    return (
      <div className="min-h-screen pt-28 pb-12 flex flex-col items-center">
        <div className="w-full max-w-2xl mx-auto px-4">
          <div className="h-64 flex items-center justify-center">
            <div className="text-center">
              <p className="text-red-500 mb-4">Reservation not found</p>
              <button
                onClick={() => router.push('/events')}
                className="px-4 py-2 bg-cyan-600 text-white rounded-md hover:bg-cyan-700 transition-colors"
              >
                Back to Events
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }
  
  const costBreakdown = formatCostBreakdown(reservationDetails);
  
  return (
    <div className="min-h-screen pt-28 pb-12 flex flex-col">
      <div className="w-full max-w-3xl mx-auto px-4">
        {/* Reservation Header */}
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-white mb-2">
            {reservationDetails.eventName}
          </h1>
          <p className="text-cyan-400">
            {reservationDetails.eventDate} - Table {reservationDetails.tableNumber}
          </p>
        </div>
        
        {/* Main Content */}
        <div className="bg-zinc-900 rounded-lg border border-cyan-900/30 overflow-hidden">
          {/* Guest Count Section */}
          <div className="p-6 border-b border-cyan-900/30">
            <h2 className="text-xl font-bold text-white mb-4">Guest Count</h2>
            <div className="flex items-center justify-center">
              <button 
                onClick={(e) => handleUpdateGuestCount(false, e)}
                disabled={guestCount <= 1}
                className="p-2 rounded-full bg-zinc-800 text-cyan-400 disabled:text-zinc-600 disabled:bg-zinc-800/50"
                type="button"
              >
                <FiMinus size={24} />
              </button>
              <span className="mx-6 text-2xl font-bold text-white">{guestCount}</span>
              <button 
                onClick={(e) => handleUpdateGuestCount(true, e)}
                disabled={guestCount >= reservationDetails.capacity}
                className="p-2 rounded-full bg-zinc-800 text-cyan-400 disabled:text-zinc-600 disabled:bg-zinc-800/50"
                type="button"
              >
                <FiPlus size={24} />
              </button>
            </div>
            <p className="text-center text-zinc-400 mt-2">
              Maximum capacity: {reservationDetails.capacity}
            </p>
          </div>
          
          {/* Bottle Selection */}
          <div className="p-6 border-b border-cyan-900/30">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-white">Bottles & Mixers</h2>
              <button 
                onClick={() => setShowBottleSelection(!showBottleSelection)}
                className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-cyan-400 border border-cyan-900/50 rounded"
              >
                {showBottleSelection ? 'Hide Selection' : 'Add Items'}
              </button>
            </div>
            
            {showBottleSelection && (
              <div className="mt-4 mb-6 bg-zinc-800 p-4 rounded-md border border-cyan-900/40">
                <h3 className="text-lg font-semibold text-white mb-3">Bottles</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-6">
                  {bottles.map(bottle => (
                    <div 
                      key={bottle.id} 
                      className="p-3 bg-zinc-900 rounded flex justify-between items-center cursor-pointer hover:bg-zinc-800 transition-colors"
                      onClick={() => handleBottleSelect(bottle)}
                    >
                      <div>
                        <p className="font-semibold text-white">{bottle.name}</p>
                        <p className="text-sm text-cyan-400">${bottle.price.toFixed(2)}</p>
                      </div>
                      <FiPlus className="text-cyan-400" />
                    </div>
                  ))}
                </div>
                
                <h3 className="text-lg font-semibold text-white mb-3">Mixers</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {mixers.map(mixer => (
                    <div 
                      key={mixer.id} 
                      className="p-3 bg-zinc-900 rounded flex justify-between items-center cursor-pointer hover:bg-zinc-800 transition-colors"
                      onClick={() => handleBottleSelect(mixer as unknown as Bottle)}
                    >
                      <div>
                        <p className="font-semibold text-white">{mixer.name}</p>
                        <p className="text-sm text-cyan-400">${mixer.price.toFixed(2)}</p>
                      </div>
                      <FiPlus className="text-cyan-400" />
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {/* Selected Items */}
            <div className="mt-4">
              <h3 className="text-lg font-semibold text-white mb-3">Your Selection</h3>
              {reservationDetails.bottles && reservationDetails.bottles.length > 0 ? (
                <div className="space-y-3">
                  {reservationDetails.bottles.map(bottle => (
                    <div 
                      key={bottle.id} 
                      className="flex justify-between items-center p-3 bg-zinc-800 rounded"
                    >
                      <div>
                        <p className="font-semibold text-white">{bottle.name}</p>
                        <p className="text-sm text-cyan-400">${bottle.price.toFixed(2)}</p>
                      </div>
                      <button
                        onClick={() => handleRemoveBottle(bottle.id)}
                        className="p-2 text-red-400 hover:text-red-300"
                      >
                        <FiTrash size={18} />
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-zinc-400 italic">No bottles selected</p>
              )}
            </div>
          </div>
          
          {/* Cost Breakdown */}
          <div className="p-6 border-b border-cyan-900/30">
            <h2 className="text-xl font-bold text-white mb-4">Cost Breakdown</h2>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-zinc-400">Table Price:</span>
                <span className="text-white">${costBreakdown.tablePrice.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-400">Bottles:</span>
                <span className="text-white">${costBreakdown.bottlesCost.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-400">Mixers:</span>
                <span className="text-white">${costBreakdown.mixersCost.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-400">Service Fee:</span>
                <span className="text-white">${costBreakdown.serviceFee.toFixed(2)}</span>
              </div>
              <div className="border-t border-zinc-700 pt-2 mt-2 flex justify-between font-bold">
                <span className="text-white">Total:</span>
                <span className="text-cyan-400">${costBreakdown.total.toFixed(2)}</span>
              </div>
            </div>
          </div>
          
          {/* Actions */}
          <div className="p-6">
            <button
              onClick={handleContinueToPayment}
              className="w-full py-3 bg-cyan-600 hover:bg-cyan-700 text-white font-bold rounded transition-colors"
            >
              Continue to Payment
            </button>
          </div>
        </div>
      </div>
    </div>
  );
} 