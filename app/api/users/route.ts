import { NextRequest, NextResponse } from 'next/server';
import { adminAuth, adminFirestore } from '@/lib/firebase/admin';

export const dynamic = 'force-dynamic';

// POST /api/users - Create a new user
export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    const { email, password, displayName, role = 'user' } = data;
    
    if (!email || !password) {
      return NextResponse.json(
        { error: 'Missing required fields (email, password)' },
        { status: 400 }
      );
    }
    
    // Create the user with Firebase Auth
    const userRecord = await adminAuth.createUser({
      email,
      password,
      displayName,
    });
    
    // Set custom claims for role-based access control
    await adminAuth.setCustomUserClaims(userRecord.uid, {
      role,
    });
    
    // Store additional user data in Firestore
    await adminFirestore.collection('users').doc(userRecord.uid).set({
      uid: userRecord.uid,
      email,
      displayName,
      role,
      createdAt: new Date().toISOString(),
    });
    
    return NextResponse.json({
      uid: userRecord.uid,
      email: userRecord.email,
      displayName: userRecord.displayName,
      role,
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating user:', error);
    return NextResponse.json({ error: 'Failed to create user' }, { status: 500 });
  }
} 