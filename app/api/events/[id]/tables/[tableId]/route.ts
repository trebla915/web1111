import { NextRequest, NextResponse } from 'next/server';
import { adminFirestore } from '@/lib/firebase/admin';

// GET /api/events/[id]/tables/[tableId] - Fetch a specific table from an event
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string; tableId: string } }
) {
  try {
    const { id, tableId } = params;
    
    // Verify event exists
    const eventDoc = await adminFirestore.collection('events').doc(id).get();
    if (!eventDoc.exists) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }
    
    // Get the specific table
    const tableDoc = await adminFirestore
      .collection('events')
      .doc(id)
      .collection('tables')
      .doc(tableId)
      .get();
    
    if (!tableDoc.exists) {
      return NextResponse.json({ error: 'Table not found' }, { status: 404 });
    }
    
    return NextResponse.json({
      id: tableDoc.id,
      ...tableDoc.data()
    });
  } catch (error) {
    console.error(`Error fetching table ${params.tableId} for event ${params.id}:`, error);
    return NextResponse.json({ error: 'Failed to fetch table' }, { status: 500 });
  }
}

// PUT /api/events/[id]/tables/[tableId] - Update a table (e.g. release it)
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string; tableId: string } }
) {
  try {
    const { id, tableId } = params;
    const data = await request.json();

    const tableRef = adminFirestore
      .collection('events')
      .doc(id)
      .collection('tables')
      .doc(tableId);

    const tableDoc = await tableRef.get();
    if (!tableDoc.exists) {
      return NextResponse.json({ error: 'Table not found' }, { status: 404 });
    }

    await tableRef.update(data);

    return NextResponse.json({ message: 'Table updated successfully' });
  } catch (error) {
    console.error(`Error updating table ${params.tableId} for event ${params.id}:`, error);
    return NextResponse.json({ error: 'Failed to update table' }, { status: 500 });
  }
}

// DELETE /api/events/[id]/tables/[tableId] - Delete a specific table from an event
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string; tableId: string } }
) {
  try {
    const { id, tableId } = params;
    
    // Verify event exists
    const eventDoc = await adminFirestore.collection('events').doc(id).get();
    if (!eventDoc.exists) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }
    
    const tableRef = adminFirestore
      .collection('events')
      .doc(id)
      .collection('tables')
      .doc(tableId);
    
    // Verify table exists
    const tableDoc = await tableRef.get();
    if (!tableDoc.exists) {
      return NextResponse.json({ error: 'Table not found' }, { status: 404 });
    }
    
    // Delete the table
    await tableRef.delete();
    
    return NextResponse.json({ message: 'Table removed successfully' });
  } catch (error) {
    console.error(`Error removing table ${params.tableId} for event ${params.id}:`, error);
    return NextResponse.json({ error: 'Failed to remove table' }, { status: 500 });
  }
} 