"use client";

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/components/providers/AuthProvider';
import ClubLayout from '@/components/reservation/ClubLayout';
import { getEvent } from '@/lib/services/events';
import { getTablesByEvent } from '@/lib/services/tables';
import { useReservation } from '@/components/providers/ReservationProvider';
import { Table, Event } from '@/types/reservation';
import { toast } from 'react-hot-toast';
import { formatToMMDDYYYY } from '@/lib/utils/dateFormatter';

export default function TableSelectionPage() {
  const params = useParams();
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { setReservationDetails } = useReservation();
  
  const [tables, setTables] = useState<Table[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [eventDetails, setEventDetails] = useState<{
    title: string;
    date: string;
    imageUrl: string;
  } | null>(null);
  
  const [usingMockData, setUsingMockData] = useState(false);
  
  const eventId = params.id as string;
  
  // Define fetchTables function using useCallback like in the Expo app
  const fetchTables = useCallback(async () => {
    try {
      setLoading(true);
      
      // Fetch the event details
      const eventData = await getEvent(eventId) as Event;
      
      if (eventData) {
        // Check if reservations are enabled for this event
        if (!eventData.reservationsEnabled) {
          toast.error('Table reservations are not available for this event.');
          router.push('/events');
          return;
        }

        setEventDetails({
          title: eventData.title,
          date: eventData.date || new Date().toLocaleDateString(),
          imageUrl: eventData.flyerUrl || eventData.imageUrl || "/images/event-placeholder.jpg"
        });
      } else {
        setError('Event not found');
        return;
      }
      
      // Fetch tables - this matches the Expo app approach
      console.log(`Fetching tables for event ID: ${eventId}`);
      
      // Fetch tables using Firebase service
      const fetchedTables = await getTablesByEvent(eventId);
      
      // Check if mock data is being used by checking the IDs
      const isMockData = fetchedTables.length > 0 && fetchedTables[0].id.startsWith('mock');
      setUsingMockData(isMockData);
      
      if (isMockData) {
        console.log('Using mock tables data');
        toast.success('Using test data for development');
      }
      
      console.log(`Received ${fetchedTables.length} tables from API`);
      
      // Format the tables to ensure proper location values
      const formattedTables = fetchedTables.map((table: Table) => ({
        ...table,
        location: (table.location || 'left') as 'left' | 'right' | 'center',
      }));
      
      setTables(formattedTables);
      setError(null);
    } catch (err) {
      console.error('Failed to fetch tables:', err);
      setError('Unable to load tables. Please try again later.');
      toast.error('Failed to load tables');
    } finally {
      setLoading(false);
    }
  }, [eventId, router]);

  // Call fetchTables on component mount
  useEffect(() => {
    if (eventId) {
      fetchTables();
    }
  }, [eventId, fetchTables]);
  
  const handleTableSelect = (tableId: string, tablePrice: number) => {
    console.log('handleTableSelect called with:', { tableId, tablePrice });
    console.log('Available tables:', tables);
    
    if (authLoading) {
      // Wait for auth state to be determined
      return;
    }
    
    if (!user) {
      toast.error('You need an account to reserve a table');
      router.push('/auth/login');
      return;
    }
    
    const selectedTable = tables.find(table => table.id === tableId);
    console.log('Selected table:', selectedTable);
    
    if (!selectedTable) {
      toast.error('Unable to select this table');
      return;
    }
    
    const reservationDetails = {
      id: `temp-${Date.now()}`,
      eventId,
      eventName: eventDetails?.title || 'Event',
      tableId: selectedTable.id,
      tableNumber: selectedTable.number,
      tablePrice: selectedTable.price,
      capacity: selectedTable.capacity,
      minimumBottles: selectedTable.minimumBottles,
      guestCount: 1,
      userId: user.uid,
      userEmail: user.email || '',
      userName: user.displayName || '',
      bottles: [],
      mixers: [],
      reservationTime: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      eventDate: eventDetails?.date || new Date().toISOString()
    };
    
    console.log('Setting reservation details:', reservationDetails);
    setReservationDetails(reservationDetails);
    
    router.push(`/reserve/${eventId}/details`);
  };
  
  // Helper function to format date to MM-DD-YY
  const formatDate = (dateStr: string): string => {
    try {
      if (!dateStr) return 'Invalid date';
      
      // Parse the ISO string directly
      const [datePart] = dateStr.split('T');
      const [year, month, day] = datePart.split('-').map(Number);
      
      // Format date
      const formattedMonth = String(month).padStart(2, '0');
      const formattedDay = String(day).padStart(2, '0');
      const formattedYear = String(year).slice(2);
      
      return `${formattedMonth}-${formattedDay}-${formattedYear}`;
    } catch {
      return 'Invalid date';
    }
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
  
  if (loading) {
    return (
      <div className="min-h-screen pt-28 pb-12 flex flex-col items-center">
        <div className="w-full max-w-7xl mx-auto px-4">
          <div className="h-64 flex items-center justify-center">
            <div className="flex flex-col items-center">
              <div className="w-12 h-12 border-t-2 border-b-2 border-cyan-500 rounded-full animate-spin"></div>
              <p className="mt-4 text-white">Loading tables...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="min-h-screen pt-28 pb-12 flex flex-col items-center">
        <div className="w-full max-w-7xl mx-auto px-4">
          <div className="h-64 flex items-center justify-center">
            <div className="text-center">
              <p className="text-red-500 mb-4">{error}</p>
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
  
  return (
    <div className="min-h-screen pt-28 pb-12 flex flex-col">
      <div className="w-full max-w-7xl mx-auto px-4">
        <div className="mb-12 text-center">
          {eventDetails && (
            <div className="mb-4">
              <h1 className="text-4xl md:text-5xl font-bold text-white">
                {eventDetails.title}
              </h1>
              <p className="text-cyan-400 mt-3 text-lg">
                {formatDate(eventDetails.date)}
              </p>
            </div>
          )}
          
          {usingMockData && (
            <div className="bg-yellow-900/30 text-yellow-300 px-4 py-3 rounded-md mt-4 text-sm flex items-center justify-center mx-auto max-w-2xl">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
              <span>Using demo data for development. In production, real tables will be displayed.</span>
            </div>
          )}
        </div>
        
        {tables.length === 0 ? (
          <div className="bg-black text-white p-8 rounded-lg border border-cyan-900/30 text-center">
            <h2 className="text-2xl font-bold mb-4">No Available Tables</h2>
            <p className="text-gray-400 mb-6">There are no tables available for this event right now.</p>
            <button
              onClick={() => router.push('/events')}
              className="px-4 py-2 bg-cyan-600 text-white rounded-md hover:bg-cyan-700 transition-colors"
            >
              Browse Other Events
            </button>
          </div>
        ) : (
          <ClubLayout
            tables={tables}
            onTableSelect={handleTableSelect}
            showTablePrice={true}
          />
        )}
      </div>
    </div>
  );
} 