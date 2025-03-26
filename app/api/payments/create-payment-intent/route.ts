import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { adminFirestore } from '@/lib/firebase/admin';

// Initialize Stripe
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16',
});

// POST /api/payments/create-payment-intent - Create a payment intent with Stripe
export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    const { amount, reservationId, eventId, userId, metadata } = data;
    
    if (!amount || !reservationId || !eventId || !userId) {
      return NextResponse.json(
        { error: 'Missing required fields (amount, reservationId, eventId, userId)' },
        { status: 400 }
      );
    }
    
    // Create payment intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // Convert to cents
      currency: 'usd',
      metadata: {
        reservationId,
        eventId,
        userId,
        ...metadata
      },
    });
    
    // Store payment info in Firebase
    await adminFirestore.collection('payments').doc(paymentIntent.id).set({
      stripePaymentIntentId: paymentIntent.id,
      reservationId,
      eventId,
      userId,
      amount: amount,
      status: paymentIntent.status,
      createdAt: new Date().toISOString(),
    });
    
    // Update reservation with payment info
    await adminFirestore.collection('reservations').doc(reservationId).update({
      paymentId: paymentIntent.id,
      paymentStatus: paymentIntent.status,
      updatedAt: new Date().toISOString()
    });
    
    return NextResponse.json({
      clientSecret: paymentIntent.client_secret,
      paymentId: paymentIntent.id
    });
  } catch (error) {
    console.error('Error creating payment intent:', error);
    return NextResponse.json({ error: 'Failed to create payment intent' }, { status: 500 });
  }
} 