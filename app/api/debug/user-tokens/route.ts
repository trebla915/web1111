import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'User ID is required' },
        { status: 400 }
      );
    }

    // Query the tokens collection for the user's tokens
    const tokensRef = collection(db, 'pushTokens');
    const q = query(tokensRef, where('userId', '==', userId));
    const querySnapshot = await getDocs(q);

    const tokens = querySnapshot.docs.map(doc => ({
      token: doc.data().token,
      createdAt: doc.data().createdAt,
      lastUsed: doc.data().lastUsed,
      deviceInfo: doc.data().deviceInfo
    }));

    return NextResponse.json({ success: true, tokens });
  } catch (error) {
    console.error('Error fetching user tokens:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch tokens' },
      { status: 500 }
    );
  }
} 