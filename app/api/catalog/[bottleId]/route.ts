import { NextRequest, NextResponse } from 'next/server';
import { adminFirestore } from '@/lib/firebase/admin';

// GET /api/catalog/[bottleId] - Fetch a specific bottle from the catalog
export async function GET(
  request: NextRequest,
  { params }: { params: { bottleId: string } }
) {
  try {
    const { bottleId } = params;
    
    // Get the specific bottle
    const bottleDoc = await adminFirestore
      .collection('catalog')
      .doc(bottleId)
      .get();
    
    if (!bottleDoc.exists) {
      return NextResponse.json({ error: 'Bottle not found in catalog' }, { status: 404 });
    }
    
    return NextResponse.json({
      id: bottleDoc.id,
      ...bottleDoc.data()
    });
  } catch (error) {
    console.error(`Error fetching bottle ${params.bottleId} from catalog:`, error);
    return NextResponse.json({ error: 'Failed to fetch bottle from catalog' }, { status: 500 });
  }
}

// PUT /api/catalog/[bottleId] - Update a specific bottle in the catalog
export async function PUT(
  request: NextRequest,
  { params }: { params: { bottleId: string } }
) {
  try {
    const { bottleId } = params;
    const data = await request.json();
    
    const bottleRef = adminFirestore
      .collection('catalog')
      .doc(bottleId);
    
    // Verify bottle exists
    const bottleDoc = await bottleRef.get();
    if (!bottleDoc.exists) {
      return NextResponse.json({ error: 'Bottle not found in catalog' }, { status: 404 });
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
    console.error(`Error updating bottle ${params.bottleId} in catalog:`, error);
    return NextResponse.json({ error: 'Failed to update bottle in catalog' }, { status: 500 });
  }
}

// DELETE /api/catalog/[bottleId] - Delete a specific bottle from the catalog
export async function DELETE(
  request: NextRequest,
  { params }: { params: { bottleId: string } }
) {
  try {
    const { bottleId } = params;
    
    const bottleRef = adminFirestore
      .collection('catalog')
      .doc(bottleId);
    
    // Verify bottle exists
    const bottleDoc = await bottleRef.get();
    if (!bottleDoc.exists) {
      return NextResponse.json({ error: 'Bottle not found in catalog' }, { status: 404 });
    }
    
    // Delete the bottle
    await bottleRef.delete();
    
    return NextResponse.json({ message: 'Bottle deleted successfully from catalog' });
  } catch (error) {
    console.error(`Error deleting bottle ${params.bottleId} from catalog:`, error);
    return NextResponse.json({ error: 'Failed to delete bottle from catalog' }, { status: 500 });
  }
} 