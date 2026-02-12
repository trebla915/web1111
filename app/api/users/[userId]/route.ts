import { NextRequest, NextResponse } from 'next/server';
import { adminAuth, adminFirestore } from '@/lib/firebase/admin';

export const dynamic = 'force-dynamic';

// GET /api/users/[userId] - Get user by ID
export async function GET(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    const { userId } = params;
    
    // Get user from Firestore
    const userDoc = await adminFirestore.collection('users').doc(userId).get();
    
    if (!userDoc.exists) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    
    return NextResponse.json(userDoc.data());
  } catch (error) {
    console.error(`Error fetching user ${params.userId}:`, error);
    return NextResponse.json({ error: 'Failed to fetch user' }, { status: 500 });
  }
}

// PATCH /api/users/[userId] - Update user by ID
export async function PATCH(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    const { userId } = params;
    const data = await request.json();
    const { displayName, email, phoneNumber, role } = data;
    
    // Check if user exists
    const userDoc = await adminFirestore.collection('users').doc(userId).get();
    if (!userDoc.exists) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    
    // Update in Auth if needed
    if (displayName || email || phoneNumber) {
      const authUpdateData: any = {};
      if (displayName) authUpdateData.displayName = displayName;
      if (email) authUpdateData.email = email;
      if (phoneNumber) authUpdateData.phoneNumber = phoneNumber;
      
      await adminAuth.updateUser(userId, authUpdateData);
    }
    
    // Update role in custom claims if provided
    if (role) {
      await adminAuth.setCustomUserClaims(userId, { role });
    }
    
    // Update in Firestore
    const updateData = {
      ...data,
      updatedAt: new Date().toISOString()
    };
    
    await adminFirestore.collection('users').doc(userId).update(updateData);
    
    // Get updated user data
    const updatedUserDoc = await adminFirestore.collection('users').doc(userId).get();
    
    return NextResponse.json(updatedUserDoc.data());
  } catch (error) {
    console.error(`Error updating user ${params.userId}:`, error);
    return NextResponse.json({ error: 'Failed to update user' }, { status: 500 });
  }
} 