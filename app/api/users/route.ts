import { NextRequest, NextResponse } from 'next/server';
import { adminAuth, adminFirestore } from '@/lib/firebase/admin';
import { ADMIN_ROLES, authErrorResponse, requireRole } from '@/lib/auth/server';

export const dynamic = 'force-dynamic';

// GET /api/users - Get total registered user count
export async function GET(request: NextRequest) {
  try {
    await requireRole(request, ADMIN_ROLES);
    const snapshot = await adminFirestore.collection('users').count().get();
    return NextResponse.json({ count: snapshot.data().count });
  } catch (error) {
    const authed = authErrorResponse(error);
    if (authed) return authed;
    console.error('Error counting users:', error);
    return NextResponse.json({ error: 'Failed to count users' }, { status: 500 });
  }
}

// POST /api/users - Create a new user
export async function POST(request: NextRequest) {
  try {
    // Account creation with an arbitrary `role` was reachable anonymously —
    // a second path to minting an admin. Now admin-only.
    const actor = await requireRole(request, ADMIN_ROLES, { checkRevoked: true });
    // Account creation with a role is the second escalation path. Nothing in
    // the product creates accounts this way — customers self-register through
    // Firebase Auth — so it is disabled by the same switch.
    if (process.env.ALLOW_ROLE_CHANGES_VIA_API !== 'true') {
      return NextResponse.json(
        { error: 'Account creation through the API is disabled during the security review.' },
        { status: 503 }
      );
    }
    const data = await request.json();
    const { email, password, displayName } = data;
    const requestedRole = data.role ?? 'user';
    if (!['user', 'promoter', 'staff', 'admin'].includes(requestedRole)) {
      return NextResponse.json({ error: 'Invalid role' }, { status: 400 });
    }
    const role = requestedRole;
    
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
    const authed = authErrorResponse(error);
    if (authed) return authed;
    console.error('Error creating user:', error);
    return NextResponse.json({ error: 'Failed to create user' }, { status: 500 });
  }
} 