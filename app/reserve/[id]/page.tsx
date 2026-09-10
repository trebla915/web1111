"use client";

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/components/providers/AuthProvider';
import ClubLayout from '@/components/reservation/ClubLayout';
import { getEvent } from '@/lib/services/events';
import { getEventTables } from '@/lib/services/tables';
import { useReservation } from '@/components/providers/ReservationProvider';
import { Table, Event } from '@/types/reservation';
import { toast } from 'react-hot-toast';
import { FiAlertTriangle } from 'react-icons/fi';
import { BiTable } from 'react-icons/bi';
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { RouteError, RouteLoading } from "@/components/ui/page-state";
import { ReservationStepHeader } from "@/components/reservation/ReservationSteps";

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
      
      // Fetch tables using Firebase service
      const fetchedTables = await getEventTables(eventId);

      // Check if mock data is being used by checking the IDs
      const isMockData = fetchedTables.length > 0 && fetchedTables[0].id.startsWith('mock');
      setUsingMockData(isMockData);

      if (isMockData) {
        toast.success('Using test data for development');
      }

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
    
    setReservationDetails(reservationDetails);
    
    router.push(`/reserve/${eventId}/details`);
  };
  
  /**
   * Readable date. This rendered "10-17-26", while the very next step of the
   * same flow spelled the same fact out as "Saturday, October 17, 2026" — two
   * formats for one date, with the terse one sitting on the screen where the
   * guest decides which night they are booking.
   */
  const formatDate = (dateStr: string): string => {
    try {
      if (!dateStr) return 'Date TBA';
      const [datePart] = dateStr.split('T');
      const [year, month, day] = datePart.split('-').map(Number);
      const date = new Date(year, month - 1, day);
      if (isNaN(date.getTime())) return 'Date TBA';
      return date.toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      });
    } catch {
      return 'Date TBA';
    }
  };

  if (authLoading) return <RouteLoading message="Checking your account…" />;

  if (loading) return <RouteLoading message="Loading the floor plan…" />;

  if (error) {
    return (
      <RouteError
        title="We couldn't load the tables"
        description={error}
        onRetry={fetchTables}
        action={
          <Button variant="ghost" size="md" onClick={() => router.push('/events')}>
            Back to events
          </Button>
        }
      />
    );
  }

  return (
    <div className="flex min-h-dvh flex-col pt-24 pb-16 sm:pt-28">
      <div className="mx-auto w-full max-w-5xl px-4">
        {/* The task is the heading on a task page. The event is context above
            it, not a 48px display line that outweighs the thing being done. */}
        <ReservationStepHeader
          step="table"
          eventName={eventDetails?.title}
          eventDate={eventDetails ? formatDate(eventDetails.date) : undefined}
          title="Choose your table"
          description="Prices are per table for the night. Each table shows how many it seats and its bottle minimum."
          aside={
            <Button variant="outline" size="md" onClick={() => router.push('/events')}>
              All events
            </Button>
          }
        />

        {usingMockData && (
          <div
            role="status"
            className="mb-6 flex items-start gap-3 rounded-lg border border-warning-line/40 bg-warning-950/40 px-4 py-3 text-sm text-warning-200"
          >
            <FiAlertTriangle aria-hidden="true" className="mt-0.5 shrink-0" size={16} />
            <span>Showing demo tables. Real availability appears once this event is published.</span>
          </div>
        )}

        {tables.length === 0 ? (
          <EmptyState
            icon={<BiTable size={40} aria-hidden="true" />}
            title="No tables yet"
            description="Tables for this event haven't been set up. Try another event, or check back closer to the date."
            action={
              <Button variant="primary" size="lg" onClick={() => router.push('/events')}>
                Browse other events
              </Button>
            }
          />
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