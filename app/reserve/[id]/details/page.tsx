"use client";

import { useState, useEffect, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/components/providers/AuthProvider';
import { useReservation } from '@/components/providers/ReservationProvider';
import { PaymentService } from '@/lib/services/payment';
import { BottleService } from '@/lib/services/bottles';
import { getTableBottleRequirements } from '@/lib/services/tables';
import { toast } from 'react-hot-toast';
import { FiPlus, FiMinus, FiShoppingCart, FiX } from 'react-icons/fi';
import { Bottle } from '@/types/reservation';

export default function ReservationDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { reservationDetails, updateReservationDetails, addBottle, removeBottle } = useReservation();
  
  const [loading, setLoading] = useState(true);
  const [guestCount, setGuestCount] = useState(1);
  const [showBottleSelection, setShowBottleSelection] = useState(false);
  const [availableBottles, setAvailableBottles] = useState<Bottle[]>([]);
  const [error, setError] = useState<string | null>(null);
  
  const eventId = params.id as string;
  
  useEffect(() => {
    if (authLoading) {
      return; // Wait for auth state to be determined
    }
    
    if (!user) {
      toast.error('You need an account to reserve a table');
      router.push('/auth/login');
      return;
    }
    
    if (!reservationDetails) {
      router.push(`/reserve/${eventId}`);
      return;
    }
    
    setGuestCount(reservationDetails.guestCount);
    setLoading(false);
  }, [eventId, reservationDetails, router, user, authLoading]);
  
  useEffect(() => {
    const fetchBottles = async () => {
      try {
        setLoading(true);
        const bottles = await BottleService.getByEvent(eventId);
        setAvailableBottles(bottles);
        setError(null);
      } catch (err) {
        console.error('Failed to fetch bottles:', err);
        setError('Unable to load bottles. Please try again later.');
        toast.error('Failed to load bottles');
      } finally {
        setLoading(false);
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
  
  // Calculate bottle requirements and status
  const [bottleRequirements, setBottleRequirements] = useState({
    required: 1,
    current: 0,
    isMet: false,
    isLoading: true
  });
  
  useEffect(() => {
    const fetchBottleRequirements = async () => {
      if (!reservationDetails) return;
      
      setBottleRequirements(prev => ({ ...prev, isLoading: true }));
      
      try {
        const requirements = await getTableBottleRequirements(reservationDetails.eventId, reservationDetails.tableId);
        const current = reservationDetails.bottles?.length || 0;
        
        setBottleRequirements({
          required: requirements.minimumBottles,
          current,
          isMet: current >= requirements.minimumBottles,
          isLoading: false
        });
      } catch (error) {
        console.error('Error fetching bottle requirements:', error);
        const current = reservationDetails.bottles?.length || 0;
        setBottleRequirements({
          required: 1,
          current,
          isMet: current >= 1,
          isLoading: false
        });
        toast.error('Could not fetch bottle requirements. Using default minimum of 1 bottle.');
      }
    };
    
    fetchBottleRequirements();
  }, [reservationDetails]);

  // Format cost breakdown with proper grat and fees
  const costBreakdown = useMemo(() => {
    if (!reservationDetails) return {
      tablePrice: 0,
      bottlesCost: 0,
      mixersCost: 0,
      gratAmount: 0,
      salesTax: 0,
      stripeFee: 0,
      subtotal: 0,
      total: 0
    };

    const tablePrice = reservationDetails.tablePrice || 0;
    const bottles = reservationDetails.bottles || [];
    const mixers = reservationDetails.mixers || [];
    
    // Calculate costs
    const bottlesCost = bottles.reduce((total, bottle) => total + (bottle.price || 0), 0);
    const mixersCost = mixers.reduce((total, mixer) => total + (mixer.price || 0), 0);
    
    // Calculate taxable subtotal (everything except gratuity and processing fee)
    const taxableSubtotal = tablePrice + bottlesCost + mixersCost;
    
    // Calculate sales tax (8.25%)
    const salesTax = taxableSubtotal * 0.0825;
    
    // Calculate gratuity (18% on bottles only)
    const gratAmount = bottlesCost * 0.18;
    
    // Calculate subtotal including tax and gratuity
    const subtotal = taxableSubtotal + salesTax + gratAmount;
    
    // Calculate Stripe fee (2.9% + $0.30)
    const stripeFee = (subtotal * 0.029) + 0.30;
    
    // Calculate final total
    const total = subtotal + stripeFee;

    return {
      tablePrice,
      bottlesCost,
      mixersCost,
      salesTax,
      gratAmount,
      stripeFee,
      subtotal,
      total
    };
  }, [reservationDetails]);

  const handleBottleSelect = (bottle: Bottle) => {
    if (!reservationDetails) return;
    
    addBottle(bottle);
    setShowBottleSelection(false);

    const newBottleCount = (reservationDetails.bottles?.length || 0) + 1;
    const remaining = Math.max(0, bottleRequirements.required - newBottleCount);

    if (remaining > 0) {
      toast.error(
        `Added ${bottle.name}. ${remaining} more bottle${remaining > 1 ? 's' : ''} required.`
      );
    } else {
      toast.success(`Added ${bottle.name}. Minimum bottle requirement met!`);
    }
  };
  
  const handleRemoveBottle = (bottleId: string) => {
    if (!reservationDetails) return;
    
    removeBottle(bottleId);
    
    const newBottleCount = (reservationDetails.bottles?.length || 0) - 1;
    const remaining = Math.max(0, bottleRequirements.required - newBottleCount);

    if (remaining > 0) {
      toast.error(
        `Bottle removed. ${remaining} more bottle${remaining > 1 ? 's' : ''} required to meet minimum.`
      );
    } else {
      toast.success('Bottle removed. Minimum requirement still met.');
    }
  };
  
  const handleContinueToPayment = () => {
    if (!reservationDetails) {
      toast.error('Reservation details not found');
      return;
    }

    if (!bottleRequirements.isMet) {
      toast.error(
        `Table ${reservationDetails.tableNumber} requires a minimum of ${bottleRequirements.required} bottle${bottleRequirements.required > 1 ? 's' : ''}. Please add ${bottleRequirements.required - bottleRequirements.current} more.`
      );
      return;
    }
    
    router.push(`/reserve/${eventId}/payment`);
  };

  // Format date to a more readable format
  const formatDate = (dateStr: string): string => {
    try {
      if (!dateStr) return 'Date TBA';
      
      // Parse the ISO string directly
      const [datePart] = dateStr.split('T');
      const [year, month, day] = datePart.split('-').map(Number);
      
      // Create date object using the parsed components
      const date = new Date(year, month - 1, day);
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
  
  const renderBottleRequirements = () => {
    if (bottleRequirements.isLoading) {
      return <p className="text-sm mt-1 text-zinc-400">Loading bottle requirements...</p>;
    }

    return (
      <p className={`text-sm mt-1 ${bottleRequirements.isMet ? 'text-green-400' : 'text-yellow-400'}`}>
        {bottleRequirements.isMet 
          ? "Minimum bottle requirement met"
          : `Minimum ${bottleRequirements.required} bottle${bottleRequirements.required > 1 ? 's' : ''} required`}
      </p>
    );
  };
  
  // Show loading state while auth is being determined
  if (authLoading) {
    return (
      <div className="min-h-screen pt-28 pb-12 flex flex-col items-center">
        <div className="w-full max-w-2xl mx-auto px-4">
          <div className="h-64 flex items-center justify-center">
            <div className="flex flex-col items-center">
              <div className="w-12 h-12 border-t-2 border-b-2 border-cyan-500 rounded-full animate-spin"></div>
              <p className="mt-4 text-white">Loading...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }
  
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
              <div>
                <h2 className="text-xl font-bold text-white">Bottles</h2>
                {renderBottleRequirements()}
              </div>
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
                  <div>
                    <h3 className="text-lg font-bold text-white">Select Bottles</h3>
                    {(() => {
                      const requiredBottles = reservationDetails.tableNumber <= 4 ? 2 : 1;
                      const currentBottles = reservationDetails.bottles?.length || 0;
                      const remaining = Math.max(0, requiredBottles - currentBottles);
                      return (
                        <p className={`text-sm mt-1 ${remaining > 0 ? 'text-yellow-400' : 'text-green-400'}`}>
                          {remaining > 0
                            ? `${remaining} more bottle${remaining > 1 ? 's' : ''} required`
                            : 'Minimum requirement met'}
                        </p>
                      );
                    })()}
                  </div>
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
                <span className="text-zinc-400">Sales Tax (8.25%):</span>
                <span className="text-white">${costBreakdown.salesTax.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-400">Gratuity (18% on bottles):</span>
                <span className="text-white">${costBreakdown.gratAmount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-400">Processing Fee (2.9% + $0.30):</span>
                <span className="text-white">${costBreakdown.stripeFee.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-400">Subtotal:</span>
                <span className="text-white">${costBreakdown.subtotal.toFixed(2)}</span>
              </div>
              <div className="border-t border-zinc-700 pt-2 mt-2 flex justify-between font-bold">
                <span className="text-white">Total:</span>
                <span className="text-cyan-400">${costBreakdown.total.toFixed(2)}</span>
              </div>
              <div className="mt-4 text-sm text-zinc-500">
                <p>* A card processing fee of 2.9% + $0.30 is applied to all transactions to cover payment processing costs.</p>
                <p className="mt-2">* Please note: an automatic 18% gratuity is applied to all bottle purchases at checkout.</p>
                <p className="mt-2">* Sales tax of 8.25% is applied to all purchases except gratuity and processing fees.</p>
              </div>
            </div>
          </div>
          
          {/* Actions */}
          <div className="p-6">
            <button
              onClick={handleContinueToPayment}
              disabled={!bottleRequirements.isMet}
              className={`w-full py-3 font-bold rounded transition-colors ${
                !bottleRequirements.isMet 
                  ? 'bg-gray-600 text-gray-300 cursor-not-allowed' 
                  : 'bg-cyan-600 hover:bg-cyan-700 text-white'
              }`}
            >
              {bottleRequirements.isMet 
                ? 'Continue to Payment' 
                : `Add Required Bottles (${bottleRequirements.required - bottleRequirements.current} More)`}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
} 