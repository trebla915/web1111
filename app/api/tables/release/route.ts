import { NextResponse } from 'next/server';
import { apiClient } from '@/lib/api/client';
import { Table } from '@/types/reservation';

// PUT /api/tables/release - Release a table
export async function PUT(request: Request) {
  try {
    const { eventId, tableNumber } = await request.json();
    
    if (!eventId || !tableNumber) {
      return NextResponse.json(
        { error: 'Missing required parameters' },
        { status: 400 }
      );
    }

    const response = await apiClient.put('/tables/release', { eventId, tableNumber });
    return NextResponse.json(response.data);
  } catch (error) {
    console.error('Error releasing table:', error);
    return NextResponse.json(
      { error: 'Failed to release table' },
      { status: 500 }
    );
  }
} 