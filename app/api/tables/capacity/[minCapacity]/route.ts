import { NextResponse } from 'next/server';
import { apiClient } from '@/lib/api/client';
import { Table } from '@/types/reservation';

// GET /api/tables/capacity/[minCapacity] - Get tables with minimum capacity
export async function GET(
  request: Request,
  { params }: { params: { minCapacity: string } }
) {
  try {
    const minCapacity = parseInt(params.minCapacity);
    if (isNaN(minCapacity)) {
      return NextResponse.json(
        { error: 'Invalid capacity parameter' },
        { status: 400 }
      );
    }

    const response = await apiClient.get(`/tables/capacity/${minCapacity}`);
    return NextResponse.json(response.data);
  } catch (error) {
    console.error('Error fetching tables by capacity:', error);
    return NextResponse.json(
      { error: 'Failed to fetch tables by capacity' },
      { status: 500 }
    );
  }
} 