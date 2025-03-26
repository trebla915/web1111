import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';

// Get the API base URL from environment variables
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_API_BASE_URL;

// GET /api/events - Fetch all events
export async function GET() {
  try {
    const response = await axios.get(`${API_BASE_URL}/events`);
    return NextResponse.json(response.data);
  } catch (error) {
    console.error('Error fetching events:', error);
    return NextResponse.json({ error: 'Failed to fetch events' }, { status: 500 });
  }
}

// POST /api/events - Create a new event
export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    const response = await axios.post(`${API_BASE_URL}/events`, data);
    return NextResponse.json(response.data, { status: 201 });
  } catch (error) {
    console.error('Error creating event:', error);
    return NextResponse.json({ error: 'Failed to create event' }, { status: 500 });
  }
} 