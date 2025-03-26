import { NextResponse } from 'next/server';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export async function GET() {
  try {
    const eventsCollection = collection(db, 'events');
    const eventsQuery = query(
      eventsCollection,
      orderBy('date', 'asc')
    );
    
    const snapshot = await getDocs(eventsQuery);
    
    if (snapshot.empty) {
      return NextResponse.json({ message: 'No events found in database', events: [] });
    }
    
    // Map documents to Event objects with detailed date information
    const events = snapshot.docs.map(doc => {
      const data = doc.data();
      
      // Handle different date formats
      let dateString = data.date;
      let dateObj = null;
      let dateInfo = {};
      
      try {
        if (data.date && typeof data.date.toDate === 'function') {
          // If it's a Firestore timestamp
          dateObj = data.date.toDate();
          dateString = dateObj.toISOString();
          dateInfo = {
            originalFormat: 'Firestore Timestamp',
            asISO: dateString,
            asLocaleString: dateObj.toLocaleString(),
            timestamp: dateObj.getTime()
          };
        } else if (data.date && typeof data.date === 'string') {
          // If it's already a string
          dateObj = new Date(data.date);
          dateInfo = {
            originalFormat: 'String',
            asISO: data.date,
            parsedToDate: dateObj.toISOString(),
            asLocaleString: dateObj.toLocaleString(),
            timestamp: dateObj.getTime(),
            valid: !isNaN(dateObj.getTime())
          };
        } else {
          dateInfo = {
            originalFormat: typeof data.date,
            value: data.date
          };
        }
      } catch (error) {
        dateInfo = {
          error: 'Failed to parse date',
          originalValue: data.date
        };
      }
      
      return {
        id: doc.id,
        title: data.title || '',
        date: dateString,
        dateInfo,
        description: data.description || '',
        flyerUrl: data.flyerUrl || '',
        ticketLink: data.ticketLink || '',
        location: data.location || '',
        created: data.created,
        updated: data.updated
      };
    });
    
    return NextResponse.json({ 
      message: `Found ${events.length} events`,
      now: new Date().toISOString(),
      systemTime: new Date().toLocaleString(),
      events 
    });
  } catch (error) {
    console.error('Error in debug events API:', error);
    return NextResponse.json({ error: 'Failed to fetch events' }, { status: 500 });
  }
} 