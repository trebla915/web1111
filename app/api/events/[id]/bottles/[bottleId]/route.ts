import { NextRequest, NextResponse } from 'next/server';
import { adminFirestore } from '@/lib/firebase/admin';

export const dynamic = 'force-dynamic';

// GET /api/events/[id]/bottles/[bottleId] - Fetch a specific bottle from an event
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string; bottleId: string } }
) {
  try {
    const { id, bottleId } = params;
    
    // Verify event exists
    const eventDoc = await adminFirestore.collection('events').doc(id).get();
    if (!eventDoc.exists) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }
    
    // Get the specific bottle
    const bottleDoc = await adminFirestore
      .collection('events')
      .doc(id)
      .collection('bottles')
      .doc(bottleId)
      .get();
    
    if (!bottleDoc.exists) {
      return NextResponse.json({ error: 'Bottle not found' }, { status: 404 });
    }
    
    return NextResponse.json({
      id: bottleDoc.id,
      ...bottleDoc.data()
    });
  } catch (error) {
    console.error(`Error fetching bottle ${params.bottleId} for event ${params.id}:`, error);
    return NextResponse.json({ error: 'Failed to fetch bottle' }, { status: 500 });
  }
}

// PUT /api/events/[id]/bottles/[bottleId] - Update a specific bottle in an event
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string; bottleId: string } }
) {
  try {
    const { id, bottleId } = params;
    const data = await request.json();
    
    // Verify event exists
    const eventDoc = await adminFirestore.collection('events').doc(id).get();
    if (!eventDoc.exists) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }
    
    const bottleRef = adminFirestore
      .collection('events')
      .doc(id)
      .collection('bottles')
      .doc(bottleId);
    
    // Verify bottle exists
    const bottleDoc = await bottleRef.get();
    if (!bottleDoc.exists) {
      return NextResponse.json({ error: 'Bottle not found' }, { status: 404 });
    }
    
    // Update the bottle
    await bottleRef.update({
      ...data,
      updatedAt: new Date().toISOString()
    });
    
    return NextResponse.json({
      id: bottleId,
      ...data,
      updatedAt: new Date().toISOString()
    });
  } catch (error) {
    console.error(`Error updating bottle ${params.bottleId} for event ${params.id}:`, error);
    return NextResponse.json({ error: 'Failed to update bottle' }, { status: 500 });
  }
}

// DELETE /api/events/[id]/bottles/[bottleId] - Delete a specific bottle from an event
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string; bottleId: string } }
) {
  try {
    const { id, bottleId } = params;
    
    // Verify event exists
    const eventDoc = await adminFirestore.collection('events').doc(id).get();
    if (!eventDoc.exists) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }
    
    const bottleRef = adminFirestore
      .collection('events')
      .doc(id)
      .collection('bottles')
      .doc(bottleId);
    
    // Verify bottle exists
    const bottleDoc = await bottleRef.get();
    if (!bottleDoc.exists) {
      return NextResponse.json({ error: 'Bottle not found' }, { status: 404 });
    }
    
    // Delete the bottle
    await bottleRef.delete();
    
    return NextResponse.json({ message: 'Bottle deleted successfully' });
  } catch (error) {
    console.error(`Error deleting bottle ${params.bottleId} for event ${params.id}:`, error);
    return NextResponse.json({ error: 'Failed to delete bottle' }, { status: 500 });
  }
} 