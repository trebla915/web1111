"use client";

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/components/providers/AuthProvider';
import { useReservation } from '@/components/providers/ReservationProvider';
import { formatCostBreakdown } from '@/lib/services/payment';
import { fetchAllBottlesForEvent } from '@/lib/services/bottles';
import { toast } from 'react-hot-toast';
import { FiPlus, FiMinus, FiShoppingCart, FiX } from 'react-icons/fi';
import { Bottle } from '@/types/reservation';

export default function ReservationDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const { reservationDetails, updateReservationDetails, addBottle, removeBottle } = useReservation();
  
  const [loading, setLoading] = useState(true);
  const [guestCount, setGuestCount] = useState(1);
  const [showBottleSelection, setShowBottleSelection] = useState(false);
  const [availableBottles, setAvailableBottles] = useState<Bottle[]>([]);
  
  const eventId = params.eventId as string;
  
  useEffect(() => {
    if (!reservationDetails || !user) {
      router.push(`/reserve/${eventId}`);
      return;
    }
    
    setGuestCount(reservationDetails.guestCount);
    setLoading(false);
  }, [eventId, reservationDetails, router, user]);
  
  useEffect(() => {
    const fetchBottles = async () => {
      try {
        const bottles = await fetchAllBottlesForEvent(eventId);
        setAvailableBottles(bottles);
      } catch (error) {
        console.error('Error fetching bottles:', error);
        toast.error('Failed to load available bottles');
      }
    };
    
    if (eventId) {
      fetchBottles();
    }
  }, [eventId]);
  
  const handleUpdateGuestCount = (increment: boolean, e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    
    if (!reservationDetails) return;
    
    let newCount = increment ? guestCount + 1 : guestCount - 1;
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

  // Format date to a more readable format
  const formatDate = (dateStr: string): string => {
    try {
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) return 'Invalid date';
      
      return date.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch {
      return 'Invalid date';
    }
  };
  
  if (loading || !reservationDetails) {
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
  
  const costBreakdown = formatCostBreakdown(reservationDetails);
  
  return (
    <div className="min-h-screen pt-28 pb-12 flex flex-col">
      <div className="w-full max-w-2xl mx-auto px-4">
        {/* Reservation Header */}
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-white mb-2">
            {reservationDetails.eventName}
          </h1>
          <p className="text-cyan-400">
            {formatDate(reservationDetails.eventDate)} - Table {reservationDetails.tableNumber}
          </p>
        </div>
        
        {/* Main Content */}
        <div className="bg-zinc-900 rounded-lg border border-cyan-900/30 overflow-hidden">
          {/* Guest Count */}
          <div className="p-6 border-b border-cyan-900/30">
            <h2 className="text-xl font-bold text-white mb-4">Guest Count</h2>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <button
                  onClick={(e) => handleUpdateGuestCount(false, e)}
                  className="w-10 h-10 rounded-full bg-cyan-900 flex items-center justify-center text-white hover:bg-cyan-800 transition-colors"
                >
                  <FiMinus size={20} />
                </button>
                <span className="text-2xl font-bold text-white">{guestCount}</span>
                <button
                  onClick={(e) => handleUpdateGuestCount(true, e)}
                  className="w-10 h-10 rounded-full bg-cyan-900 flex items-center justify-center text-white hover:bg-cyan-800 transition-colors"
                >
                  <FiPlus size={20} />
                </button>
              </div>
              <p className="text-zinc-400">
                Max {reservationDetails.capacity} guests
              </p>
            </div>
          </div>
          
          {/* Bottles */}
          <div className="p-6 border-b border-cyan-900/30">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-white">Bottles</h2>
              <button
                onClick={() => setShowBottleSelection(true)}
                className="px-4 py-2 bg-cyan-600 text-white rounded-md hover:bg-cyan-700 transition-colors flex items-center space-x-2"
              >
                <FiShoppingCart size={20} />
                <span>Add Bottles</span>
              </button>
            </div>
            
            {showBottleSelection && (
              <div className="mb-4 p-4 bg-zinc-800 rounded-lg">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-bold text-white">Select Bottles</h3>
                  <button
                    onClick={() => setShowBottleSelection(false)}
                    className="text-zinc-400 hover:text-white"
                  >
                    <FiX size={20} />
                  </button>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  {availableBottles.map((bottle) => (
                    <button
                      key={bottle.id}
                      onClick={() => handleBottleSelect(bottle)}
                      className="p-4 bg-zinc-700 rounded-lg text-left hover:bg-zinc-600 transition-colors"
                    >
                      <h4 className="font-bold text-white">{bottle.name}</h4>
                      <p className="text-cyan-400">${bottle.price.toFixed(2)}</p>
                    </button>
                  ))}
                </div>
              </div>
            )}
            
            {reservationDetails.bottles && reservationDetails.bottles.length > 0 ? (
              <div className="space-y-2">
                {reservationDetails.bottles.map((bottle) => (
                  <div
                    key={bottle.id}
                    className="flex justify-between items-center p-3 bg-zinc-800 rounded-lg"
                  >
                    <div>
                      <h4 className="font-bold text-white">{bottle.name}</h4>
                      <p className="text-cyan-400">${bottle.price.toFixed(2)}</p>
                    </div>
                    <button
                      onClick={() => handleRemoveBottle(bottle.id)}
                      className="text-red-400 hover:text-red-300"
                    >
                      <FiX size={20} />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-zinc-400">No bottles selected</p>
            )}
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