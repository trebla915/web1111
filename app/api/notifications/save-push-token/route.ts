import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { storePushToken } from '@/lib/services/notifications';
import { authErrorResponse, requireUser } from '@/lib/auth/server';

export async function POST(request: NextRequest) {
  try {
    // Get current user from session
    // getSession() read the client-writable `userInfo` cookie, so any caller
    // could register a push token against another user's uid.
    const actor = await requireUser(request);
    const userId = actor.uid;
    const body = await request.json();
    
    // Validate token
    if (!body.expoPushToken) {
      return NextResponse.json(
        { success: false, error: 'Push token is required' },
        { status: 400 }
      );
    }
    
    const { expoPushToken, deviceInfo } = body;
    
    // Register the token
    await storePushToken(userId, expoPushToken, deviceInfo || {});
    
    console.log(`Expo push token registered for user ${userId}`);
    
    return NextResponse.json({ 
      success: true, 
      message: 'Push token registered successfully'
    });
  } catch (error) {
    const __authed = authErrorResponse(error);
    if (__authed) return __authed;
    console.error('Error registering push token:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to register push token' },
      { status: 500 }
    );
  }
}

// Mark the route as dynamic to ensure it's not cached
export const dynamic = 'force-dynamic'; 