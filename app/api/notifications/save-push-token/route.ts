import { NextResponse } from 'next/server';
import { storePushToken } from '@/lib/services/notifications';
import { getSession } from '@/lib/auth-utils';

export async function POST(request: Request) {
  try {
    // Get current user from session
    const session = await getSession();
    if (!session || !session.user) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    const userId = session.user.uid;
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
    console.error('Error registering push token:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to register push token' },
      { status: 500 }
    );
  }
}

// Mark the route as dynamic to ensure it's not cached
export const dynamic = 'force-dynamic'; 