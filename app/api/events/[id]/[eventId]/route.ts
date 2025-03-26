import { NextResponse } from 'next/server';
import { apiClient } from '@/lib/api/client';
import { Event } from '@/types/event';

// GET /api/events/[id] - Fetch a specific event
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const response = await apiClient.get(`${process.env.NEXT_PUBLIC_API_URL}/events/${params.id}`);
    return NextResponse.json(response.data);
  } catch (error) {
    console.error('Error fetching event:', error);
    return NextResponse.json(
      { error: 'Failed to fetch event' },
      { status: 500 }
    );
  }
}

// PUT /api/events/[id] - Update an event
export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const eventData = await request.json();
    const response = await apiClient.put(`${process.env.NEXT_PUBLIC_API_URL}/events/${params.id}`, eventData);
    return NextResponse.json(response.data);
  } catch (error) {
    console.error('Error updating event:', error);
    return NextResponse.json(
      { error: 'Failed to update event' },
      { status: 500 }
    );
  }
}

// DELETE /api/events/[id] - Delete an event
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const response = await apiClient.delete(`${process.env.NEXT_PUBLIC_API_URL}/events/${params.id}`);
    return NextResponse.json(response.data);
  } catch (error) {
    console.error('Error deleting event:', error);
    return NextResponse.json(
      { error: 'Failed to delete event' },
      { status: 500 }
    );
  }
} 