import { NextRequest, NextResponse } from 'next/server';

import { getAuthedUser } from '@/lib/auth/server';

export const dynamic = 'force-dynamic';

/**
 * GET /api/auth/check — is the caller signed in?
 *
 * The previous implementation returned `authenticated: true` for any non-empty
 * `authToken` cookie without verifying it; its own comment said "this is a
 * placeholder". The token is now actually verified.
 */
export async function GET(request: NextRequest) {
  const user = await getAuthedUser(request);
  if (!user) {
    return NextResponse.json({ authenticated: false }, { status: 401 });
  }
  return NextResponse.json({ authenticated: true, uid: user.uid, role: user.role });
}
