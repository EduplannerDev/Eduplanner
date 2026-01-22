import { NextRequest, NextResponse } from 'next/server';
import stripe from '@/lib/stripe';

export async function POST(request: NextRequest) {
  try {
    const { userId, email, plan = 'monthly' } = await request.json();


    if (!userId) {
      return NextResponse.json(
        { error: 'userId is required' },
        { status: 400 }
      );
    }

    // Seleccionar Price ID según el plan
    const priceId = plan === 'annual'
      ? process.env.NEXT_PUBLIC_STRIPE_PRO_ANNUAL_PRICE_ID
      : process.env.NEXT_PUBLIC_STRIPE_PRO_PLAN_PRICE_ID;

    if (!priceId) {
      return NextResponse.json(
        { error: `Price ID for ${plan} plan not configured` },
        { status: 500 }
      );
    }

    const baseUrl =
      process.env.NODE_ENV === 'development'
        ? 'http://localhost:3000'
        : 'https://app.eduplanner.mx';

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'subscription',
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      customer_email: email,
      metadata: {
        userId,
      },
      subscription_data: {
        metadata: {
          userId,
        },
      },
      allow_promotion_codes: true,
      success_url: `${baseUrl}`,
      cancel_url: `${baseUrl}`,
    });

    return NextResponse.json({ url: session.url });
  } catch (err: any) {
    console.error('Error creando la sesión de checkout:', err.message);
    return NextResponse.json(
      { error: 'Error creating checkout session' },
      { status: 500 }
    );
  }
}