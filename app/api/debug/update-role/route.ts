import { NextResponse } from 'next/server';
import { forceUpdateUserRole } from '@/lib/services/users';
import { auth } from '@/lib/firebase/admin';

export async function POST(request: Request) {
  try {
    const { userId, role } = await request.json();
    
    // Verify the request is from an admin
    const authHeader = request.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const token = authHeader.split('Bearer ')[1];
    const decodedToken = await auth.verifyIdToken(token);
    
    // Check if the user is an admin
    const userDoc = await auth.getUser(decodedToken.uid);
    if (!userDoc.customClaims?.admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Update the user's role
    await forceUpdateUserRole(userId, role);
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating user role:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 