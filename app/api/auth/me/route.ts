import { NextRequest, NextResponse } from 'next/server';

import { adminFirestore } from '@/lib/firebase/admin';
import { authErrorResponse, requireUser } from '@/lib/auth/server';

export const dynamic = 'force-dynamic';

/**
 * GET /api/auth/me — the caller's own profile.
 *
 * The previous implementation accepted any non-empty cookie and supported
 * `?email=` to look up an arbitrary user "for debugging" — an unauthenticated
 * user-enumeration and PII disclosure endpoint. The lookup parameter is gone:
 * this route only ever returns the verified caller's own record.
 */
export async function GET(request: NextRequest) {
  try {
    const actor = await requireUser(request);

    const userDoc = await adminFirestore.collection('users').doc(actor.uid).get();
    if (!userDoc.exists) {
      return NextResponse.json({ uid: actor.uid, email: actor.email, role: actor.role });
    }

    const data = userDoc.data() ?? {};
    return NextResponse.json({
      uid: actor.uid,
      email: actor.email,
      role: actor.role,
      displayName: data.displayName ?? null,
      firstName: data.firstName ?? null,
      lastName: data.lastName ?? null,
      phoneNumber: data.phoneNumber ?? null,
      photoURL: data.photoURL ?? null,
    });
  } catch (error) {
    const authed = authErrorResponse(error);
    if (authed) return authed;
    console.error('[auth/me] failed');
    return NextResponse.json({ error: 'Failed to load profile' }, { status: 500 });
  }
}
