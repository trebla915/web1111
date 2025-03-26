import { NextResponse } from 'next/server';
import { sendPushNotification, sendPushNotificationToUsers } from '@/lib/services/notifications';
import { getSession } from '@/lib/auth-utils';

export async function POST(request: Request) {
  try {
    // Authenticate the request
    const session = await getSession();
    if (!session || !session.user) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    const body = await request.json();
    
    // Validate required fields
    if (!body.title || !body.message) {
      return NextResponse.json(
        { success: false, error: 'Title and message are required' },
        { status: 400 }
      );
    }
    
    const { title, message, data, targetedUsers } = body;
    
    // Create notification payload without undefined fields
    const notificationPayload: any = {
      title,
      message
    };
    
    // Only add data field if it exists and is not empty
    if (data && Object.keys(data).length > 0) {
      notificationPayload.data = data;
    }
    
    // Log the request for debugging
    console.log('Push notification request:', { 
      title, 
      message, 
      hasData: !!data && Object.keys(data).length > 0, 
      targetedUsers: targetedUsers ? targetedUsers.length : 'all'
    });
    
    let result;
    
    // Check if this is a targeted notification
    if (targetedUsers && Array.isArray(targetedUsers) && targetedUsers.length > 0) {
      console.log(`Sending targeted notification to ${targetedUsers.length} users`);
      result = await sendPushNotificationToUsers(targetedUsers, notificationPayload);
    } else {
      // Send to all users
      console.log('Sending notification to all users');
      result = await sendPushNotification(notificationPayload);
    }
    
    return NextResponse.json({ 
      success: true, 
      message: 'Push notification sent successfully', 
      notificationId: result.id
    });
  } catch (error: any) {
    console.error('Error processing push notification request:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to send push notification', 
        details: error.message || 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// Mark the route as dynamic to ensure it's not cached
export const dynamic = 'force-dynamic'; 