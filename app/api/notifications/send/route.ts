import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { 
  sendPushNotification, 
  sendPushNotificationToUsers 
} from '@/lib/services/notifications';
import { ADMIN_ROLES, STAFF_ROLES, authErrorResponse, requireRole, requireUser } from '@/lib/auth/server';

export async function POST(request: NextRequest) {
  try {
    // Broadcasts to customers: admin only.
    await requireRole(request, ADMIN_ROLES, { checkRevoked: true });
    const body = await request.json();
    
    // Validate required fields
    if (!body.title || !body.message) {
      return NextResponse.json(
        { success: false, error: 'Title and message are required' },
        { status: 400 }
      );
    }
    
    const { title, message, data, userIds } = body;
    
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
      targetedUsers: userIds ? userIds.length : 'all'
    });
    
    try {
      let result;
      
      // Check if this is a targeted notification
      if (userIds && Array.isArray(userIds) && userIds.length > 0) {
        console.log(`Sending targeted notification to ${userIds.length} users`);
        result = await sendPushNotificationToUsers(userIds, notificationPayload);
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
    } catch (innerError: any) {
      console.error('Error in notification service:', innerError);
      return NextResponse.json(
        { 
          success: false, 
          error: 'Failed to process push notification',
          details: innerError.message || 'Unknown error'
        },
        { status: 500 }
      );
    }
  } catch (error: any) {
    const __authed = authErrorResponse(error);
    if (__authed) return __authed;
    console.error('Error processing push notification request:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to process push notification', 
        details: error.message || 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// Mark the route as dynamic to ensure it's not cached
export const dynamic = 'force-dynamic'; 