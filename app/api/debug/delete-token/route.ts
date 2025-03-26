import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth-utils';
import { deleteUserToken } from '@/lib/services/notifications';

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
    if (!body.token) {
      return NextResponse.json(
        { success: false, error: 'Token is required' },
        { status: 400 }
      );
    }
    
    const { token } = body;
    
    // Delete the token
    const deleted = await deleteUserToken(userId, token);
    
    if (!deleted) {
      return NextResponse.json(
        { success: false, error: 'Token not found or could not be deleted' },
        { status: 404 }
      );
    }
    
    console.log(`Push token deleted for user ${userId}`);
    
    return NextResponse.json({ 
      success: true, 
      message: 'Push token deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting push token:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete push token' },
      { status: 500 }
    );
  }
}

// Mark the route as dynamic to ensure it's not cached
export const dynamic = 'force-dynamic'; 