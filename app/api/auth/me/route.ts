import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getUserByEmail } from '@/lib/services/users';

export async function GET(request: NextRequest) {
  // Get the auth token from cookies
  const authToken = cookies().get('authToken')?.value;
  
  if (!authToken) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  try {
    // This is a simplified example
    // In a real app, you would verify the token first
    
    // Check for a user parameter in case we need to debug
    const email = request.nextUrl.searchParams.get('email');
    
    if (email) {
      // Get user by email (for debugging)
      const user = await getUserByEmail(email);
      if (user) {
        return NextResponse.json(user);
      }
    }
    
    return NextResponse.json({ 
      error: 'User not found',
      note: 'For debugging, use ?email=user@example.com'
    }, { status: 404 });
  } catch (error) {
    console.error('Error fetching user:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export const dynamic = 'force-dynamic'; 