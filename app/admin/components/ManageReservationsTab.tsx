"use client";

import React, { useState, useEffect } from 'react';
import { ReservationService } from '@/lib/services/reservations';
import { EventService } from '@/lib/services/events';
import { getUserById } from '@/lib/services/users';
import { TableService } from '@/lib/services/tables';
import { toast } from 'react-hot-toast';
import { FiChevronDown, FiChevronUp, FiUsers, FiUser, FiRefreshCw, FiCalendar, FiAlertTriangle, FiTrash2 } from 'react-icons/fi';
import { BiTable, BiWine, BiDrink } from 'react-icons/bi';
import { Event } from '@/types/event';
import { Reservation } from '@/types/reservation';
import { User } from '@/types/user';

interface ReservationWithUser extends Reservation {
  userName?: string;
  userEmail?: string;
  userId?: string;
}

type ReservationsByEvent = {
  [eventTitle: string]: ReservationWithUser[];
};

export default function ManageReservationsTab() {
  const [reservationsByEvent, setReservationsByEvent] = useState<ReservationsByEvent>({});
  const [expandedEventId, setExpandedEventId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchReservationsData();
  }, []);

  const fetchReservationsData = async () => {
    setLoading(true);
    try {
      const reservationsData = await ReservationService.getGroupedByEvent();
      if (!reservationsData || typeof reservationsData !== 'object' || Array.isArray(reservationsData)) {
        throw new Error('Invalid reservations data format');
      }

      const events = await EventService.getAll();
      const eventTitleMap: { [key: string]: string } = {};
      events.forEach((event: Event) => {
        eventTitleMap[event.id] = event.title;
      });

      const reservationsByEventTitle: ReservationsByEvent = {};
      for (const [eventId, reservations] of Object.entries(reservationsData)) {
        if (!Array.isArray(reservations)) {
          console.warn(`Invalid reservations array for eventId: ${eventId}`);
          continue;
        }

        const eventTitle = eventTitleMap[eventId] || eventId;
        // Fetch user names for all reservations
        const reservationsWithUserNames = await Promise.all(
          reservations.map(async (reservation) => {
            try {
              const user = await getUserById(reservation.userId);
              return {
                ...reservation,
                tableNumber: reservation.tableNumber ?? 0,
                userName: user?.displayName || 'Unknown User',
                userEmail: user?.email || 'No email',
                userId: reservation.userId
              };
            } catch (error) {
              console.error(`Error fetching user for reservation ${reservation.id}:`, error);
              return {
                ...reservation,
                tableNumber: reservation.tableNumber ?? 0,
                userName: 'Unknown User',
                userEmail: 'No email',
                userId: reservation.userId
              };
            }
          })
        );

        reservationsByEventTitle[eventTitle] = reservationsWithUserNames;
      }

      setReservationsByEvent(reservationsByEventTitle);
      setError(null);
    } catch (err: any) {
      console.error('Error fetching reservations:', err.message || err);
      setError('Failed to load reservations. Please try again.');
      toast.error('Failed to load reservations');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteReservation = async (reservationId: string, eventId: string, tableNumber: number) => {
    if (!confirm('Are you sure you want to delete this reservation?')) {
      return;
    }

    try {
      // First, release the table
      await TableService.release(eventId, tableNumber.toString());
      
      // Then delete the reservation
      await ReservationService.delete(reservationId);
      
      toast.success('Reservation deleted successfully');
      fetchReservationsData(); // Refresh the data
    } catch (error) {
      console.error('Error deleting reservation:', error);
      toast.error('Failed to delete reservation');
    }
  };

  const toggleEventExpand = (eventTitle: string) => {
    setExpandedEventId(expandedEventId === eventTitle ? null : eventTitle);
  };

  const noReservations = Object.keys(reservationsByEvent).length === 0;

  // Format currency
  const formatCurrency = (amount: number = 0) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
    }).format(amount);
  };

  // Format date
  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    
    try {
      // Parse the date string and ensure it's treated as UTC
      const date = new Date(dateString + 'Z');
      if (isNaN(date.getTime())) {
        console.warn('Invalid date string:', dateString);
        return 'Invalid Date';
      }
      
      // Format the date in UTC to prevent timezone issues
      return new Intl.DateTimeFormat('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        timeZone: 'UTC',
        hour12: true
      }).format(date);
    } catch (error) {
      console.error('Error formatting date:', error);
      return 'Invalid Date';
    }
  };

  // Get status badge classes based on status
  const getStatusBadgeClasses = (status?: string) => {
    switch (status) {
      case 'confirmed':
        return 'bg-green-900/40 text-green-400 border-green-500/50';
      case 'pending':
        return 'bg-yellow-900/40 text-yellow-400 border-yellow-500/50';
      case 'cancelled':
        return 'bg-red-900/30 text-red-400 border-red-500/50';
      case 'completed':
        return 'bg-cyan-900/30 text-cyan-400 border-cyan-500/50';
      default:
        return 'bg-gray-800 text-gray-300 border-gray-600';
    }
  };

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-6 text-cyan-300 digital-glow-soft">Manage Reservations</h2>
      
      {loading ? (
        <div className="flex flex-col items-center justify-center py-12">
          <div className="w-12 h-12 border-t-2 border-b-2 border-cyan-500 rounded-full animate-spin mb-4"></div>
          <p className="text-cyan-400">Loading reservations...</p>
        </div>
      ) : error ? (
        <div className="flex flex-col items-center justify-center py-12 text-red-400">
          <FiAlertTriangle size={48} className="mb-4" />
          <p className="text-lg font-medium mb-4">{error}</p>
          <button
            onClick={fetchReservationsData}
            className="px-4 py-2 bg-red-900/20 hover:bg-red-900/40 border border-red-500/40 rounded-lg transition-colors flex items-center gap-2"
          >
            <FiRefreshCw className="animate-pulse" />
            <span>Try Again</span>
          </button>
        </div>
      ) : noReservations ? (
        <div className="flex flex-col items-center justify-center py-16 text-gray-400">
          <FiCalendar size={64} className="text-cyan-900/50 mb-4" />
          <p className="text-xl font-medium mb-6">No reservations yet</p>
          <button
            onClick={fetchReservationsData}
            className="px-4 py-2 bg-gradient-to-r from-cyan-900/30 to-cyan-800/20 hover:from-cyan-800/30 hover:to-cyan-700/20 border border-cyan-600/30 rounded-lg transition-colors"
          >
            Refresh
          </button>
        </div>
      ) : (
        <div className="space-y-4 max-w-4xl mx-auto">
          {Object.entries(reservationsByEvent).map(([eventTitle, reservations]) => (
            <div key={eventTitle} className="bg-zinc-900 border border-cyan-900/30 rounded-lg overflow-hidden relative">
              <div className="absolute inset-0 noise opacity-5"></div>
              <button
                onClick={() => toggleEventExpand(eventTitle)}
                className="relative z-10 w-full px-6 py-4 flex justify-between items-center bg-gradient-to-r from-zinc-900 to-zinc-800/60 hover:from-zinc-800 hover:to-zinc-700/60 border-b border-cyan-900/20 transition-colors"
              >
                <div className="flex items-center">
                  <FiCalendar className="text-cyan-400 mr-3" />
                  <span className="font-medium text-lg">{eventTitle}</span>
                  <span className="ml-3 px-2 py-1 text-xs rounded-full bg-cyan-900/20 text-cyan-400 border border-cyan-900/50">
                    {reservations.length} {reservations.length === 1 ? 'reservation' : 'reservations'}
                  </span>
                </div>
                <div className={`w-8 h-8 flex items-center justify-center rounded-full transition-colors ${
                  expandedEventId === eventTitle ? 'bg-cyan-900/30 text-cyan-400' : 'text-gray-400'
                }`}>
                  {expandedEventId === eventTitle ? (
                    <FiChevronUp className="h-5 w-5" />
                  ) : (
                    <FiChevronDown className="h-5 w-5" />
                  )}
                </div>
              </button>
              
              {expandedEventId === eventTitle && (
                <div className="relative z-10 p-4">
                  {reservations.length === 0 ? (
                    <div className="text-gray-400 text-center py-8 border border-dashed border-cyan-900/30 rounded-lg">
                      <FiAlertTriangle className="mx-auto mb-2 text-2xl" />
                      <p>No reservations found for this event.</p>
                    </div>
                  ) : (
                    <div className="grid gap-4 md:grid-cols-2">
                      {reservations.map((reservation) => (
                        <div 
                          key={reservation.id} 
                          className="bg-zinc-800/80 p-5 rounded-lg border border-cyan-900/30 relative group hover:border-cyan-700/50 transition-all"
                        >
                          <div className="absolute inset-0 noise opacity-5 rounded-lg"></div>
                          
                          {/* Status Badge */}
                          {reservation.status && (
                            <div className={`absolute top-3 right-3 px-2 py-1 text-xs rounded-md border ${getStatusBadgeClasses(reservation.status)}`}>
                              {reservation.status?.toUpperCase()}
                            </div>
                          )}
                          
                          <div className="relative z-10">
                            {/* Table Information */}
                            <div className="flex items-center space-x-2 mb-3 pb-3 border-b border-cyan-900/20">
                              <BiTable className="h-5 w-5 text-cyan-400" />
                              <span className="text-lg font-medium text-white">Table {reservation.tableNumber}</span>
                            </div>
                            
                            {/* User Information */}
                            <div className="space-y-2 mb-3">
                              <div className="flex items-center space-x-2 text-gray-300">
                                <FiUser className="h-4 w-4 text-gray-400" />
                                <span>userName: {reservation.userName}</span>
                              </div>
                              <div className="flex items-center space-x-2 text-gray-300 ml-6">
                                <span>Email: {reservation.userEmail}</span>
                              </div>
                            </div>
                            
                            {/* Guest Count */}
                            <div className="flex items-center space-x-2 mb-2 text-gray-300">
                              <FiUsers className="h-4 w-4 text-gray-400" />
                              <span>Guests: {reservation.guestCount}</span>
                            </div>
                            
                            {/* Bottles */}
                            <div className="mb-3">
                              <div className="flex items-center space-x-2 mb-1 text-gray-300">
                                <BiDrink className="h-4 w-4 text-gray-400" />
                                <span>Bottles:</span>
                              </div>
                              
                              {reservation.bottles?.length ? (
                                <div className="ml-6 pl-2 border-l border-cyan-900/30">
                                  {reservation.bottles.map((b, index) => (
                                    <div key={b.id} className="text-sm text-gray-400 py-1">
                                      {b.name}
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <div className="ml-6 pl-2 border-l border-cyan-900/30 text-sm text-gray-500 py-1">
                                  No bottles reserved
                                </div>
                              )}
                            </div>
                            
                            {/* Total Amount and Creation Date */}
                            <div className="flex flex-col sm:flex-row sm:justify-between mt-4 pt-3 border-t border-cyan-900/20 text-sm">
                              {reservation.totalAmount !== undefined && (
                                <div className="text-cyan-400 font-medium mb-2 sm:mb-0">
                                  {formatCurrency(reservation.totalAmount)}
                                </div>
                              )}
                              
                              {reservation.createdAt && (
                                <div className="text-gray-500">
                                  {formatDate(reservation.createdAt)}
                                </div>
                              )}
                            </div>

                            {/* Delete Button */}
                            <button
                              onClick={() => handleDeleteReservation(reservation.id, reservation.eventId, reservation.tableNumber || 0)}
                              className="absolute top-3 right-3 p-2 text-red-400 hover:text-red-300 transition-colors"
                              title="Delete reservation"
                            >
                              <FiTrash2 className="h-4 w-4" />
                            </button>
                          </div>
                          
                          {/* Hover effect bottom gradient line */}
                          <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-cyan-500/0 via-cyan-500/40 to-cyan-500/0 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500"></div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
          
          <div className="mt-8 flex justify-center">
            <button
              onClick={fetchReservationsData}
              className="px-6 py-3 bg-gradient-to-r from-cyan-800 to-cyan-600 hover:from-cyan-700 hover:to-cyan-500 border border-cyan-500/50 rounded-lg text-white font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 relative overflow-hidden group"
            >
              <div className="absolute inset-0 flex justify-center items-center bg-gradient-to-r from-cyan-600/0 via-cyan-600/30 to-cyan-600/0 opacity-0 group-hover:opacity-100 transform translate-y-full group-hover:translate-y-0 transition-all duration-500"></div>
              <span className="relative z-10 flex items-center">
                <FiRefreshCw className="mr-2" />
                Refresh Reservations
              </span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
} 