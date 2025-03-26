"use client";

import { useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useReservation } from '@/components/providers/ReservationProvider';
import { formatCostBreakdown } from '@/lib/services/payment';
import { FiCheckCircle, FiCalendar, FiUsers, FiClock, FiMapPin } from 'react-icons/fi';
import Link from 'next/link';

export default function ConfirmationPage() {
  const router = useRouter();
  const { reservationDetails, clearReservation } = useReservation();
  
  useEffect(() => {
    // Navigate back to events if no reservation details
    if (!reservationDetails) {
      router.push('/events');
      return;
    }
    
    // Clear reservation when unmounting
    return () => {
      clearReservation();
    };
  }, [reservationDetails, router, clearReservation]);
  
  if (!reservationDetails) {
    return (
      <div className="min-h-screen pt-28 pb-12 flex flex-col items-center">
        <div className="w-full max-w-2xl mx-auto px-4">
          <div className="h-64 flex items-center justify-center">
            <div className="flex flex-col items-center">
              <div className="w-12 h-12 border-t-2 border-b-2 border-cyan-500 rounded-full animate-spin"></div>
              <p className="mt-4 text-white">Redirecting...</p>
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
        {/* Success Header */}
        <div className="mb-8 text-center">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center">
              <FiCheckCircle size={40} className="text-green-500" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">
            Reservation Confirmed!
          </h1>
          <p className="text-cyan-400">
            Your table has been reserved for {reservationDetails.eventName}
          </p>
        </div>
        
        {/* Reservation Details */}
        <div className="bg-zinc-900 rounded-lg border border-cyan-900/30 overflow-hidden mb-8">
          <div className="p-6 border-b border-cyan-900/30">
            <h2 className="text-xl font-bold text-white mb-4">Reservation Details</h2>
            
            <div className="space-y-6">
              <div className="flex items-start">
                <div className="p-2 bg-zinc-800 rounded-md mr-4">
                  <FiCalendar className="text-cyan-400" size={20} />
                </div>
                <div>
                  <p className="text-zinc-400 text-sm">Date</p>
                  <p className="text-white font-medium">{reservationDetails.eventDate}</p>
                </div>
              </div>
              
              <div className="flex items-start">
                <div className="p-2 bg-zinc-800 rounded-md mr-4">
                  <FiClock className="text-cyan-400" size={20} />
                </div>
                <div>
                  <p className="text-zinc-400 text-sm">Event</p>
                  <p className="text-white font-medium">{reservationDetails.eventName}</p>
                </div>
              </div>
              
              <div className="flex items-start">
                <div className="p-2 bg-zinc-800 rounded-md mr-4">
                  <FiMapPin className="text-cyan-400" size={20} />
                </div>
                <div>
                  <p className="text-zinc-400 text-sm">Table</p>
                  <p className="text-white font-medium">Table #{reservationDetails.tableNumber}</p>
                </div>
              </div>
              
              <div className="flex items-start">
                <div className="p-2 bg-zinc-800 rounded-md mr-4">
                  <FiUsers className="text-cyan-400" size={20} />
                </div>
                <div>
                  <p className="text-zinc-400 text-sm">Guests</p>
                  <p className="text-white font-medium">{reservationDetails.guestCount} {reservationDetails.guestCount === 1 ? 'person' : 'people'}</p>
                </div>
              </div>
            </div>
          </div>
          
          {/* Bottles Selection */}
          {reservationDetails.bottles && reservationDetails.bottles.length > 0 && (
            <div className="p-6 border-b border-cyan-900/30">
              <h2 className="text-xl font-bold text-white mb-4">Your Bottles</h2>
              <div className="space-y-2">
                {reservationDetails.bottles.map(bottle => (
                  <div key={bottle.id} className="flex justify-between items-center p-3 bg-zinc-800 rounded">
                    <span className="text-white">{bottle.name}</span>
                    <span className="text-cyan-400">${bottle.price.toFixed(2)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {/* Payment Summary */}
          <div className="p-6">
            <h2 className="text-xl font-bold text-white mb-4">Payment Summary</h2>
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
                <span className="text-white">Total Paid:</span>
                <span className="text-cyan-400">${costBreakdown.total.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>
        
        {/* Actions */}
        <div className="flex flex-col md:flex-row gap-4 w-full">
          <Link 
            href="/" 
            className="w-full py-3 bg-cyan-600 hover:bg-cyan-700 text-white font-bold rounded text-center transition-colors"
          >
            Back to Home
          </Link>
          <Link 
            href="/events" 
            className="w-full py-3 bg-zinc-800 hover:bg-zinc-700 text-white font-bold rounded text-center transition-colors"
          >
            Browse More Events
          </Link>
        </div>
      </div>
    </div>
  );
}