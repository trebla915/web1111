import { NextRequest, NextResponse } from 'next/server';
import {
  createEventInFirestore,
  listEventsFromFirestore,
} from '@/lib/firebase/eventsStore';
import { ADMIN_ROLES, STAFF_ROLES, authErrorResponse, requireRole, requireUser } from '@/lib/auth/server';

export const dynamic = 'force-dynamic';

// GET /api/events - Fetch all active events from Firestore
export async function GET() {
  try {
    const events = await listEventsFromFirestore();
    return NextResponse.json(events);
  } catch (error) {
    const __authed = authErrorResponse(error);
    if (__authed) return __authed;
    console.error('Error fetching events:', error);
    return NextResponse.json({ error: 'Failed to fetch events' }, { status: 500 });
  }
}

// POST /api/events - Create a new event in Firestore
export async function POST(request: NextRequest) {
  try {
    // Event creation is administrative; GET stays public.
    await requireRole(request, ADMIN_ROLES, { checkRevoked: true });
    const data = await request.json();
    const event = await createEventInFirestore(data);
    return NextResponse.json(event, { status: 201 });
  } catch (error) {
    const __authed = authErrorResponse(error);
    if (__authed) return __authed;
    console.error('Error creating event:', error);
    return NextResponse.json({ error: 'Failed to create event' }, { status: 500 });
  }
}
