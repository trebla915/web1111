import { NextRequest, NextResponse } from 'next/server';
import { adminFirestore } from '@/lib/firebase/admin';

// GET /api/catalog - Fetch all bottles from catalog
export async function GET() {
  try {
    const catalogSnapshot = await adminFirestore
      .collection('catalog')
      .get();
    
    const catalog = catalogSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    return NextResponse.json(catalog);
  } catch (error) {
    console.error('Error fetching catalog:', error);
    return NextResponse.json({ error: 'Failed to fetch catalog' }, { status: 500 });
  }
}

// POST /api/catalog - Add a bottle to catalog
export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    
    // Validate required fields
    if (!data.name || !data.type) {
      return NextResponse.json(
        { error: 'Missing required fields (name, type)' }, 
        { status: 400 }
      );
    }
    
    // Add the bottle to catalog
    const bottleRef = await adminFirestore.collection('catalog').add({
      ...data,
      createdAt: new Date().toISOString()
    });
    
    return NextResponse.json({
      id: bottleRef.id,
      ...data,
      createdAt: new Date().toISOString()
    }, { status: 201 });
  } catch (error) {
    console.error('Error adding bottle to catalog:', error);
    return NextResponse.json({ error: 'Failed to add bottle to catalog' }, { status: 500 });
  }
} 