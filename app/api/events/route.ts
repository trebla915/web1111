import { NextRequest, NextResponse } from 'next/server';
import {
  createEventInFirestore,
  listEventsFromFirestore,
} from '@/lib/firebase/eventsStore';

export const dynamic = 'force-dynamic';

// GET /api/events - Fetch all active events from Firestore
export async function GET() {
  try {
    const events = await listEventsFromFirestore();
    return NextResponse.json(events);
  } catch (error) {
    console.error('Error fetching events:', error);
    return NextResponse.json({ error: 'Failed to fetch events' }, { status: 500 });
  }
}

// POST /api/events - Create a new event in Firestore
export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    const event = await createEventInFirestore(data);
    return NextResponse.json(event, { status: 201 });
  } catch (error) {
    console.error('Error creating event:', error);
    return NextResponse.json({ error: 'Failed to create event' }, { status: 500 });
  }
}
