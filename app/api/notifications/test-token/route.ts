import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    // Validate token
    if (!body.token) {
      return NextResponse.json(
        { success: false, error: 'Push token is required' },
        { status: 400 }
      );
    }
    
    const { token } = body;
    
    // In a real implementation, you would validate the token with FCM or another service
    // For now, we'll just simulate token validation
    const tokenValid = token.length > 20; // Simple validation rule
    
    console.log(`Token validation test ${tokenValid ? 'passed' : 'failed'}: ${token.substring(0, 10)}...`);
    
    // Simulate a slight delay for realism
    await new Promise(resolve => setTimeout(resolve, 500));
    
    if (tokenValid) {
      return NextResponse.json({ 
        success: true, 
        valid: true,
        message: 'Token is valid'
      });
    } else {
      return NextResponse.json({ 
        success: true, 
        valid: false,
        message: 'Token appears to be invalid'
      });
    }
  } catch (error) {
    console.error('Error testing push token:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to test push token' },
      { status: 500 }
    );
  }
}

// Mark the route as dynamic to ensure it's not cached
export const dynamic = 'force-dynamic'; 