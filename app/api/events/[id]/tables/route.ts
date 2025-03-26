import { NextRequest, NextResponse } from 'next/server';
import { adminFirestore } from '@/lib/firebase/admin';

// GET /api/events/[id]/tables - Get all tables for an event
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
    
    // Get all tables for this event
    const tablesSnapshot = await adminFirestore
      .collection('events')
      .doc(id)
      .collection('tables')
      .get();
    
    const tables = tablesSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    return NextResponse.json(tables);
  } catch (error) {
    console.error(`Error fetching tables for event ${params.id}:`, error);
    return NextResponse.json({ error: 'Failed to fetch tables' }, { status: 500 });
  }
}

// POST /api/events/[id]/tables - Add tables to an event
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
    
    const tablesCollection = adminFirestore
      .collection('events')
      .doc(id)
      .collection('tables');
    
    // Handle single table or multiple tables
    let result;
    if (Array.isArray(data)) {
      // Add multiple tables
      const batch = adminFirestore.batch();
      const tablesResult = [];
      
      for (const table of data) {
        const tableRef = tablesCollection.doc();
        batch.set(tableRef, {
          ...table,
          createdAt: new Date().toISOString()
        });
        tablesResult.push({
          id: tableRef.id,
          ...table
        });
      }
      
      await batch.commit();
      result = tablesResult;
    } else {
      // Add a single table
      const tableRef = await tablesCollection.add({
        ...data,
        createdAt: new Date().toISOString()
      });
      
      result = {
        id: tableRef.id,
        ...data
      };
    }
    
    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    console.error(`Error adding tables to event ${params.id}:`, error);
    return NextResponse.json({ error: 'Failed to add tables to event' }, { status: 500 });
  }
} 