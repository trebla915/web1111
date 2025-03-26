import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function GET(request: NextRequest) {
  const authToken = cookies().get('authToken')?.value;
  
  if (!authToken) {
    return NextResponse.json({ 
      authenticated: false,
      message: 'Not authenticated' 
    }, { status: 401 });
  }
  
  try {
    // In a real implementation, you would verify the token with Firebase Admin SDK
    // This is a placeholder implementation
    return NextResponse.json({ 
      authenticated: true,
      message: 'Authenticated'
    });
  } catch (error) {
    return NextResponse.json({ 
      authenticated: false,
      message: 'Invalid token' 
    }, { status: 401 });
  }
}

export const dynamic = 'force-dynamic';