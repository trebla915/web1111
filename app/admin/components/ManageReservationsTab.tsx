"use client";

import React, { useState, useEffect } from 'react';
import { getGroupedByEvent, deleteReservation } from '@/lib/services/reservations';
import { getAllEvents } from '@/lib/services/events';
import { getAllTables, releaseTable } from '@/lib/services/tables';
import { toast } from 'react-hot-toast';
import { FiChevronDown, FiChevronUp, FiUsers, FiUser, FiRefreshCw, FiCalendar, FiAlertTriangle, FiTrash2, FiSearch, FiFilter } from 'react-icons/fi';
import { BiTable, BiWine, BiDrink } from 'react-icons/bi';
import { Event } from '@/types/event';
import { Reservation } from '@/types/reservation';
import { User } from '@/types/user';

interface ReservationWithUser extends Reservation {
  userName?: string;
  userEmail?: string;
  userPhone?: string;
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
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    fetchReservationsData();
  }, []);

  const fetchReservationsData = async () => {
    setLoading(true);
    try {
      const reservationsData = await getGroupedByEvent();
      if (!reservationsData || typeof reservationsData !== 'object' || Array.isArray(reservationsData)) {
        throw new Error('Invalid reservations data format');
      }

      const events = await getAllEvents();
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

        // Use event title from event list, or fallback to eventName from reservation, or eventId
        const eventTitle = eventTitleMap[eventId] || reservations[0]?.eventName || eventId;
        
        // Process reservations - user data is already embedded in reservation documents
        const processedReservations = reservations.map((reservation) => {
          return {
            ...reservation,
            tableNumber: reservation.tableNumber ?? 0,
            userName: reservation.userName || 'Unknown User',
            userEmail: reservation.userEmail || 'No email',
            userPhone: reservation.userPhone || 'No phone',
            userId: reservation.userId
          };
        });

        reservationsByEventTitle[eventTitle] = processedReservations;
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
      const tableId = tableNumber.toString();
      await releaseTable(eventId, tableId);
      
      // Then delete the reservation
      await deleteReservation(reservationId);
      
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

  // Filter reservations based on search and status
  const filteredReservationsByEvent = Object.entries(reservationsByEvent).reduce((acc, [eventTitle, reservations]) => {
    const filteredReservations = reservations.filter(reservation => {
      const matchesSearch = !searchTerm || 
        reservation.userName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        reservation.userEmail?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        reservation.userPhone?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        eventTitle.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesStatus = statusFilter === 'all' || reservation.status === statusFilter;
      
      return matchesSearch && matchesStatus;
    });

    if (filteredReservations.length > 0) {
      acc[eventTitle] = filteredReservations;
    }
    return acc;
  }, {} as ReservationsByEvent);

  const noReservations = Object.keys(filteredReservationsByEvent).length === 0;
  const totalReservations = Object.values(reservationsByEvent).reduce((total, reservations) => total + reservations.length, 0);

  // Format currency
  const formatCurrency = (amount: number = 0) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
    }).format(amount);
  };

  // Format date
  const formatDate = (dateInput?: string | { _seconds: number, _nanoseconds: number }) => {
    if (!dateInput) return 'N/A';

    let date: Date;
    if (typeof dateInput === 'object' && dateInput._seconds) {
      date = new Date(dateInput._seconds * 1000);
    } else if (typeof dateInput === 'string') {
      date = new Date(dateInput + 'Z');
    } else {
      return 'Invalid Date';
    }

    if (isNaN(date.getTime())) {
      console.warn('Invalid date string:', dateInput);
      return 'Invalid Date';
    }

    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'UTC',
      hour12: true
    }).format(date);
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
    <div className="space-y-6">
      {/* Mobile Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl lg:text-3xl font-bold text-white digital-glow-soft">Manage Reservations</h2>
          <p className="text-sm text-gray-400 mt-1">Total reservations: {totalReservations}</p>
        </div>
        <button
          onClick={fetchReservationsData}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 bg-white hover:bg-gray-200 disabled:bg-gray-400 text-black rounded-lg transition-colors text-sm"
        >
          <FiRefreshCw className={loading ? 'animate-spin' : ''} />
          Refresh
        </button>
      </div>

      {/* Search and Filter Bar - Mobile Optimized */}
      <div className="bg-zinc-900/50 rounded-lg border border-gray-700/30 p-4">
        <div className="space-y-4 sm:space-y-0 sm:flex sm:items-center sm:gap-4">
          {/* Search */}
          <div className="flex-1">
            <div className="relative">
              <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search reservations..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-black/50 border border-gray-700/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-white/50 text-white placeholder-gray-500 text-sm"
              />
            </div>
          </div>

          {/* Status Filter */}
          <div className="sm:w-48">
            <div className="relative">
              <FiFilter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-black/50 border border-gray-700/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-white/50 text-white text-sm appearance-none"
              >
                <option value="all">All Status</option>
                <option value="pending">Pending</option>
                <option value="confirmed">Confirmed</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
          </div>
        </div>
      </div>
      
      {loading ? (
        <div className="flex flex-col items-center justify-center py-12">
          <div className="w-12 h-12 border-t-2 border-b-2 border-white rounded-full animate-spin mb-4"></div>
          <p className="text-white">Loading reservations...</p>
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
          <FiUsers size={64} className="mb-4 opacity-50" />
          <h3 className="text-xl font-semibold mb-2">No reservations found</h3>
          <p className="text-center text-sm">
            {searchTerm || statusFilter !== 'all' ? 
              'No reservations match your current filters. Try adjusting your search or filter criteria.' : 
              'There are no reservations to display.'
            }
          </p>
          {(searchTerm || statusFilter !== 'all') && (
            <button
              onClick={() => {
                setSearchTerm('');
                setStatusFilter('all');
              }}
              className="mt-4 px-4 py-2 bg-white hover:bg-gray-200 text-black rounded-lg transition-colors text-sm"
            >
              Clear Filters
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {Object.entries(filteredReservationsByEvent).map(([eventTitle, reservations]) => (
            <div key={eventTitle} className="bg-zinc-900/50 rounded-lg border border-gray-700/30 overflow-hidden">
              {/* Event Header - Mobile Optimized */}
              <button
                onClick={() => toggleEventExpand(eventTitle)}
                className="w-full p-4 text-left hover:bg-zinc-800/50 transition-colors focus:outline-none focus:ring-2 focus:ring-white/50"
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-white text-base lg:text-lg truncate">{eventTitle}</h3>
                    <div className="flex flex-wrap items-center gap-2 mt-1">
                      <span className="text-sm text-gray-400 flex items-center gap-1">
                        <FiUsers size={14} />
                        {reservations.length} reservation{reservations.length !== 1 ? 's' : ''}
                      </span>
                      <span className="text-sm text-gray-400 flex items-center gap-1">
                        <FiCalendar size={14} />
                        {reservations[0]?.eventDate ? formatDate(reservations[0].eventDate).split(',')[0] : 'N/A'}
                      </span>
                    </div>
                  </div>
                  <div className="ml-4 text-white">
                    {expandedEventId === eventTitle ? 
                      <FiChevronUp size={20} /> : 
                      <FiChevronDown size={20} />
                    }
                  </div>
                </div>
              </button>

              {/* Reservations List */}
              {expandedEventId === eventTitle && (
                <div className="border-t border-gray-700/30">
                  <div className="divide-y divide-gray-700/20">
                    {reservations.map((reservation) => (
                      <div key={reservation.id} className="p-4 hover:bg-zinc-800/30 transition-colors">
                        {/* Mobile Card Layout */}
                        <div className="space-y-4">
                          {/* User Info Section */}
                          <div className="flex items-start justify-between">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-2">
                                <FiUser className="text-gray-400 shrink-0" size={16} />
                                <span className="font-medium text-white truncate">{reservation.userName}</span>
                              </div>
                              <div className="space-y-1 text-sm">
                                <p className="text-gray-400 truncate">📧 {reservation.userEmail}</p>
                                <p className="text-gray-400 truncate">📱 {reservation.userPhone}</p>
                              </div>
                            </div>
                            <button
                              onClick={() => handleDeleteReservation(reservation.id, reservation.eventId, reservation.tableNumber)}
                              className="p-2 text-red-400 hover:bg-red-900/20 rounded-lg transition-colors shrink-0"
                              title="Delete reservation"
                            >
                              <FiTrash2 size={16} />
                            </button>
                          </div>

                          {/* Reservation Details Grid */}
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
                            <div>
                              <span className="text-gray-400 block">Table</span>
                              <span className="text-white font-medium flex items-center gap-1">
                                <BiTable size={14} />
                                #{reservation.tableNumber}
                              </span>
                            </div>
                            <div>
                              <span className="text-gray-400 block">Status</span>
                              <span className={`inline-block px-2 py-1 rounded-full text-xs border ${getStatusBadgeClasses(reservation.status)}`}>
                                {reservation.status || 'pending'}
                              </span>
                            </div>
                            <div>
                              <span className="text-gray-400 block">Guests</span>
                              <span className="text-white font-medium">{reservation.guestCount || 1}</span>
                            </div>
                            <div>
                              <span className="text-gray-400 block">Total</span>
                              <span className="text-white font-medium">{formatCurrency(reservation.totalAmount)}</span>
                            </div>
                          </div>

                          {/* Bottles Section */}
                          {reservation.bottles && reservation.bottles.length > 0 && (
                            <div className="bg-zinc-800/50 p-3 rounded-lg">
                              <div className="flex items-center gap-2 mb-2">
                                <BiWine className="text-gray-400" size={16} />
                                <span className="text-gray-400 text-sm font-medium">Bottles Ordered:</span>
                              </div>
                              <div className="flex flex-wrap gap-2">
                                {reservation.bottles.map((bottle, index) => (
                                  <span 
                                    key={index}
                                    className="px-2 py-1 bg-gray-700 text-white rounded-full text-xs"
                                  >
                                    {bottle.name}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Special Requests */}
                          {reservation.specialRequests && (
                            <div className="bg-zinc-800/50 p-3 rounded-lg">
                              <span className="text-gray-400 text-sm block mb-1">Special Requests:</span>
                              <span className="text-white text-sm">{reservation.specialRequests}</span>
                            </div>
                          )}

                          {/* Timestamp */}
                          <div className="text-xs text-gray-500 pt-2 border-t border-gray-700/30">
                            Reserved: {formatDate(reservation.createdAt)}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
} 