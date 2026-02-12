import { NextRequest, NextResponse } from 'next/server';
import { adminFirestore } from '@/lib/firebase/admin';

export const dynamic = 'force-dynamic';

// GET /api/events/[id]/bottles - Get all bottles for an event
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    
    // Verify event exists
    const eventDoc = await adminFirestore.collection('events').doc(id).get();
    if (!eventDoc.exists) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }
    
    // Get all bottles for this event
    const bottlesSnapshot = await adminFirestore
      .collection('events')
      .doc(id)
      .collection('bottles')
      .get();
    
    const bottles = bottlesSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    return NextResponse.json(bottles);
  } catch (error) {
    console.error(`Error fetching bottles for event ${params.id}:`, error);
    return NextResponse.json({ error: 'Failed to fetch bottles' }, { status: 500 });
  }
}

// POST /api/events/[id]/bottles - Add bottles to an event
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const data = await request.json();
    
    // Verify event exists
    const eventDoc = await adminFirestore.collection('events').doc(id).get();
    if (!eventDoc.exists) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }
    
    const bottlesCollection = adminFirestore
      .collection('events')
      .doc(id)
      .collection('bottles');
    
    // Handle single bottle or multiple bottles
    let result;
    if (Array.isArray(data)) {
      // Add multiple bottles
      const batch = adminFirestore.batch();
      const bottlesResult = [];
      
      for (const bottle of data) {
        const bottleRef = bottlesCollection.doc();
        batch.set(bottleRef, {
          ...bottle,
          createdAt: new Date().toISOString()
        });
        bottlesResult.push({
          id: bottleRef.id,
          ...bottle
        });
      }
      
      await batch.commit();
      result = bottlesResult;
    } else {
      // Add a single bottle
      const bottleRef = await bottlesCollection.add({
        ...data,
        createdAt: new Date().toISOString()
      });
      
      result = {
        id: bottleRef.id,
        ...data
      };
    }
    
    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    console.error(`Error adding bottles to event ${params.id}:`, error);
    return NextResponse.json({ error: 'Failed to add bottles to event' }, { status: 500 });
  }
} 