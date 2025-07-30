"use client";

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';
import { FiCheckCircle, FiUsers, FiCalendar, FiMapPin, FiUser, FiPhone, FiMail, FiClock, FiAlertCircle } from 'react-icons/fi';
import { BiTable, BiWine, BiDrink } from 'react-icons/bi';

interface Reservation {
  id: string;
  userId: string;
  eventId: string;
  tableId: string;
  tableNumber: number;
  guestCount: number;
  bottles?: Array<{ id: string; name: string; price?: number }>;
  mixers?: Array<{ id: string; name: string; price?: number }>;
  totalAmount?: number;
  paymentId: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  userName?: string;
  userEmail?: string;
  userPhone?: string;
  checkedInAt?: string;
  checkedInBy?: string;
}

interface Event {
  id: string;
  title: string;
  date: string;
  description?: string;
  imageUrl?: string;
}

export default function StaffCheckInPage() {
  const params = useParams();
  const router = useRouter();
  const reservationId = params.reservationId as string;
  
  const [reservation, setReservation] = useState<Reservation | null>(null);
  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [checkingIn, setCheckingIn] = useState(false);
  const [staffName, setStaffName] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchReservationDetails();
  }, [reservationId]);

  const fetchReservationDetails = async () => {
    try {
      const response = await fetch(`/api/reservations/${reservationId}/check-in`);
      
      if (!response.ok) {
        if (response.status === 404) {
          setError('Reservation not found');
        } else {
          setError('Failed to load reservation details');
        }
        return;
      }
      
      const data = await response.json();
      setReservation(data.reservation);
      setEvent(data.event);
    } catch (err) {
      console.error('Error fetching reservation:', err);
      setError('Failed to load reservation details');
    } finally {
      setLoading(false);
    }
  };

  const handleCheckIn = async () => {
    if (!staffName.trim()) {
      toast.error('Please enter your name');
      return;
    }

    setCheckingIn(true);
    try {
      const response = await fetch(`/api/reservations/${reservationId}/check-in`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ staffName: staffName.trim() }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 400 && data.error.includes('already checked in')) {
          toast.error(`Already checked in by ${data.checkedInBy} at ${formatDate(data.checkedInAt)}`);
        } else {
          toast.error(data.error || 'Failed to check in');
        }
        return;
      }

      toast.success('Successfully checked in!');
      // Refresh reservation data
      await fetchReservationDetails();
      
      // Clear staff name
      setStaffName('');
    } catch (err) {
      console.error('Error checking in:', err);
      toast.error('Failed to check in');
    } finally {
      setCheckingIn(false);
    }
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return dateString;
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-t-2 border-b-2 border-cyan-500 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-white">Loading reservation details...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-4">
          <FiAlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-white mb-4">Error</h1>
          <p className="text-red-400 mb-6">{error}</p>
          <button
            onClick={() => router.push('/staff')}
            className="px-6 py-3 bg-cyan-600 text-white rounded-lg hover:bg-cyan-700 transition-colors"
          >
            Back to Staff Dashboard
          </button>
        </div>
      </div>
    );
  }

  if (!reservation) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <p className="text-white">No reservation data found</p>
        </div>
      </div>
    );
  }

  const isAlreadyCheckedIn = reservation.status === 'checked-in';

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-cyan-400 mb-2">
            Staff Check-In
          </h1>
          <p className="text-gray-400">Reservation ID: {reservationId}</p>
        </div>

        {/* Status Banner */}
        {isAlreadyCheckedIn && (
          <div className="bg-green-900/30 border border-green-500/50 rounded-lg p-4 mb-6">
            <div className="flex items-center gap-3">
              <FiCheckCircle className="w-6 h-6 text-green-400" />
              <div>
                <p className="text-green-400 font-semibold">Already Checked In</p>
                <p className="text-green-300 text-sm">
                  Checked in by {reservation.checkedInBy} on {formatDate(reservation.checkedInAt!)}
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Event Details */}
          <div className="bg-zinc-900 rounded-lg border border-cyan-900/30 p-6">
            <h2 className="text-xl font-bold text-cyan-400 mb-4 flex items-center gap-2">
              <FiCalendar className="w-5 h-5" />
              Event Details
            </h2>
            
            {event && (
              <div className="space-y-3">
                <div>
                  <p className="text-gray-400 text-sm">Event Name</p>
                  <p className="text-white font-medium">{event.title}</p>
                </div>
                <div>
                  <p className="text-gray-400 text-sm">Date</p>
                  <p className="text-white">{formatDate(event.date)}</p>
                </div>
                {event.description && (
                  <div>
                    <p className="text-gray-400 text-sm">Description</p>
                    <p className="text-white">{event.description}</p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Table & Guest Info */}
          <div className="bg-zinc-900 rounded-lg border border-cyan-900/30 p-6">
            <h2 className="text-xl font-bold text-cyan-400 mb-4 flex items-center gap-2">
              <BiTable className="w-5 h-5" />
              Table Information
            </h2>
            
            <div className="space-y-3">
              <div>
                <p className="text-gray-400 text-sm">Table Number</p>
                <p className="text-white font-medium text-2xl">#{reservation.tableNumber}</p>
              </div>
              <div>
                <p className="text-gray-400 text-sm">Guest Count</p>
                <p className="text-white flex items-center gap-2">
                  <FiUsers className="w-4 h-4" />
                  {reservation.guestCount} guests
                </p>
              </div>
              {reservation.totalAmount && (
                <div>
                  <p className="text-gray-400 text-sm">Total Amount</p>
                  <p className="text-white font-medium">{formatCurrency(reservation.totalAmount)}</p>
                </div>
              )}
            </div>
          </div>

          {/* Customer Information */}
          <div className="bg-zinc-900 rounded-lg border border-cyan-900/30 p-6">
            <h2 className="text-xl font-bold text-cyan-400 mb-4 flex items-center gap-2">
              <FiUser className="w-5 h-5" />
              Customer Information
            </h2>
            
            <div className="space-y-3">
              <div>
                <p className="text-gray-400 text-sm">Name</p>
                <p className="text-white font-medium">{reservation.userName || 'N/A'}</p>
              </div>
              {reservation.userEmail && (
                <div>
                  <p className="text-gray-400 text-sm">Email</p>
                  <p className="text-white flex items-center gap-2">
                    <FiMail className="w-4 h-4" />
                    {reservation.userEmail}
                  </p>
                </div>
              )}
              {reservation.userPhone && (
                <div>
                  <p className="text-gray-400 text-sm">Phone</p>
                  <p className="text-white flex items-center gap-2">
                    <FiPhone className="w-4 h-4" />
                    {reservation.userPhone}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Bottles & Mixers */}
          <div className="bg-zinc-900 rounded-lg border border-cyan-900/30 p-6">
            <h2 className="text-xl font-bold text-cyan-400 mb-4 flex items-center gap-2">
              <BiWine className="w-5 h-5" />
              Orders
            </h2>
            
            <div className="space-y-4">
              {reservation.bottles && reservation.bottles.length > 0 && (
                <div>
                  <p className="text-gray-400 text-sm mb-2">Bottles</p>
                  <div className="space-y-1">
                    {reservation.bottles.map((bottle, index) => (
                      <div key={index} className="flex justify-between items-center">
                        <p className="text-white">{bottle.name}</p>
                        {bottle.price && (
                          <p className="text-gray-400">{formatCurrency(bottle.price)}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {reservation.mixers && reservation.mixers.length > 0 && (
                <div>
                  <p className="text-gray-400 text-sm mb-2">Mixers</p>
                  <div className="space-y-1">
                    {reservation.mixers.map((mixer, index) => (
                      <div key={index} className="flex justify-between items-center">
                        <p className="text-white">{mixer.name}</p>
                        {mixer.price && (
                          <p className="text-gray-400">{formatCurrency(mixer.price)}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {(!reservation.bottles || reservation.bottles.length === 0) && 
               (!reservation.mixers || reservation.mixers.length === 0) && (
                <p className="text-gray-400">No bottles or mixers ordered</p>
              )}
            </div>
          </div>
        </div>

        {/* Check-in Section */}
        {!isAlreadyCheckedIn && (
          <div className="mt-8 bg-zinc-900 rounded-lg border border-cyan-900/30 p-6">
            <h2 className="text-xl font-bold text-cyan-400 mb-4">Check In Customer</h2>
            
            <div className="max-w-md">
              <label htmlFor="staffName" className="block text-gray-400 text-sm mb-2">
                Your Name (Staff)
              </label>
              <input
                type="text"
                id="staffName"
                value={staffName}
                onChange={(e) => setStaffName(e.target.value)}
                placeholder="Enter your name"
                className="w-full px-4 py-3 bg-zinc-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:border-cyan-500 focus:outline-none"
                disabled={checkingIn}
              />
              
              <button
                onClick={handleCheckIn}
                disabled={checkingIn || !staffName.trim()}
                className="w-full mt-4 px-6 py-3 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-bold rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                {checkingIn ? (
                  <>
                    <div className="w-4 h-4 border-t-2 border-b-2 border-white rounded-full animate-spin"></div>
                    Checking In...
                  </>
                ) : (
                  <>
                    <FiCheckCircle className="w-5 h-5" />
                    Check In Customer
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* Reservation Metadata */}
        <div className="mt-6 bg-zinc-900 rounded-lg border border-cyan-900/30 p-6">
          <h3 className="text-lg font-semibold text-gray-300 mb-3">Reservation Details</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-gray-400">Status</p>
              <p className={`font-medium ${
                reservation.status === 'checked-in' ? 'text-green-400' :
                reservation.status === 'confirmed' ? 'text-cyan-400' :
                reservation.status === 'pending' ? 'text-yellow-400' :
                'text-gray-400'
              }`}>
                {reservation.status.charAt(0).toUpperCase() + reservation.status.slice(1)}
              </p>
            </div>
            <div>
              <p className="text-gray-400">Created</p>
              <p className="text-white">{formatDate(reservation.createdAt)}</p>
            </div>
            <div>
              <p className="text-gray-400">Payment ID</p>
              <p className="text-white font-mono text-xs">{reservation.paymentId}</p>
            </div>
            <div>
              <p className="text-gray-400">Table ID</p>
              <p className="text-white">{reservation.tableId}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 