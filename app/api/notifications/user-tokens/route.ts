import { NextResponse } from 'next/server';
import { getUserTokens } from '@/lib/services/notifications';
import { isAdmin } from '@/lib/auth-utils';

export async function GET(request: Request) {
  try {
    // Check if the current user is an admin
    const admin = await isAdmin();
    if (!admin) {
      return NextResponse.json(
        { success: false, error: 'Admin privileges required' },
        { status: 403 }
      );
    }

    // Get the userIds from query parameters
    const { searchParams } = new URL(request.url);
    const userIds = searchParams.get('userIds');
    
    if (!userIds) {
      return NextResponse.json(
        { success: false, error: 'User IDs are required' },
        { status: 400 }
      );
    }
    
    // Parse the comma-separated list of userIds
    const userIdArray = userIds.split(',').map(id => id.trim()).filter(Boolean);
    
    if (userIdArray.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No valid user IDs provided' },
        { status: 400 }
      );
    }
    
    // Get all tokens for the specified users
    const tokenMap = await Promise.all(
      userIdArray.map(async (userId) => {
        const tokens = await getUserTokens(userId);
        return { userId, tokens };
      })
    );
    
    // Filter out users with no tokens
    const validTokens = tokenMap.filter(item => item.tokens && item.tokens.length > 0);
    const totalTokens = validTokens.reduce((sum, item) => sum + item.tokens.length, 0);
    
    return NextResponse.json({ 
      success: true, 
      userCount: validTokens.length,
      totalTokens,
      users: validTokens
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