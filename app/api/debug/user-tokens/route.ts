import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth-utils';
import { getUserTokens } from '@/lib/services/notifications';

export async function GET(request: Request) {
  try {
    // Get current user from session
    const session = await getSession();
    if (!session || !session.user) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Get the userId from query parameters
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    
    // Only allow users to see their own tokens unless they're admins
    if (!userId || (userId !== session.user.uid && session.user.role !== 'admin')) {
      return NextResponse.json(
        { success: false, error: 'Not authorized to view these tokens' },
        { status: 403 }
      );
    }
    
    // Get all tokens for the specified user
    const tokens = await getUserTokens(userId);
    
    return NextResponse.json({ 
      success: true, 
      tokens
    });
  } catch (error) {
    console.error('Error retrieving user tokens:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to retrieve user tokens' },
      { status: 500 }
    );
  }
}

// Mark the route as dynamic to ensure it's not cached
export const dynamic = 'force-dynamic'; 