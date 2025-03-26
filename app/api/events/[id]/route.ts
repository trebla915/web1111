import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';

// Get the API base URL from environment variables
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_API_BASE_URL;

// GET /api/events/[id] - Fetch event by ID
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const response = await axios.get(`${API_BASE_URL}/events/${id}`);
    return NextResponse.json(response.data);
  } catch (error: any) {
    console.error(`Error fetching event ${params.id}:`, error);
    
    // Forward the status code from the backend
    const status = error.response?.status || 500;
    const message = error.response?.data?.error || 'Failed to fetch event';
    
    return NextResponse.json({ error: message }, { status });
  }
}

// PUT /api/events/[id] - Update event by ID
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const data = await request.json();
    const response = await axios.put(`${API_BASE_URL}/events/${id}`, data);
    return NextResponse.json(response.data);
  } catch (error: any) {
    console.error(`Error updating event ${params.id}:`, error);
    
    // Forward the status code from the backend
    const status = error.response?.status || 500;
    const message = error.response?.data?.error || 'Failed to update event';
    
    return NextResponse.json({ error: message }, { status });
  }
}

// DELETE /api/events/[id] - Delete event by ID
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    await axios.delete(`${API_BASE_URL}/events/${id}`);
    return NextResponse.json({ message: 'Event deleted successfully' });
  } catch (error: any) {
    console.error(`Error deleting event ${params.id}:`, error);
    
    // Forward the status code from the backend
    const status = error.response?.status || 500;
    const message = error.response?.data?.error || 'Failed to delete event';
    
    return NextResponse.json({ error: message }, { status });
  }
} 