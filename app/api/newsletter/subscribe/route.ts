import { NextRequest, NextResponse } from 'next/server';
import { adminFirestore } from '@/lib/firebase/admin';

export const dynamic = 'force-dynamic';

// POST /api/newsletter/subscribe - Add an email to the newsletter list
export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email?.trim()) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(normalizedEmail)) {
      return NextResponse.json({ error: 'Please enter a valid email address' }, { status: 400 });
    }

    // Use the email itself as the doc ID so re-subscribing is idempotent
    const docId = normalizedEmail.replace(/[^a-z0-9@._-]/g, '_');
    const subscriberRef = adminFirestore.collection('newsletter_subscribers').doc(docId);
    const existing = await subscriberRef.get();

    if (!existing.exists) {
      await subscriberRef.set({
        email: normalizedEmail,
        subscribedAt: new Date().toISOString(),
        source: 'homepage_footer',
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error subscribing to newsletter:', error);
    return NextResponse.json({ error: 'Failed to subscribe' }, { status: 500 });
  }
}
