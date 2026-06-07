import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';

// Initialize Stripe with the Secret Key
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2026-05-27.dahlia', // Match expected environment version
});

import { createClient } from '@/lib/supabase/server';

// Switch to Node.js runtime for reliable auth/cookies handling
export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  try {
    const { priceId, mode } = await req.json();

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    if (!priceId) {
      return NextResponse.json({ error: 'Price ID or Product ID is required' }, { status: 400 });
    }

    if (!process.env.STRIPE_SECRET_KEY) {
      throw new Error('STRIPE_SECRET_KEY is not configured');
    }

    let finalPriceId = priceId;

    // Resolve Product ID to its Default Price ID if necessary
    if (priceId.startsWith('prod_')) {
      const product = await stripe.products.retrieve(priceId);
      
      if (!product.default_price) {
        return NextResponse.json(
          { error: `Product ${priceId} has no default price configured in Stripe.` }, 
          { status: 400 }
        );
      }

      finalPriceId = typeof product.default_price === 'string' 
        ? product.default_price 
        : product.default_price.id;
    }

    // Create the checkout session
    const session = await stripe.checkout.sessions.create({
      client_reference_id: user.id, // Attach user ID for webhook identification
      line_items: [
        {
          price: finalPriceId,
          quantity: 1,
        },
      ],
      mode: mode || 'subscription',
      success_url: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/plans`,
      metadata: {
        priceId: finalPriceId,
        originalId: priceId,
      },
    });

    if (!session.url) {
      throw new Error('Failed to create session URL');
    }

    return NextResponse.json({ url: session.url });
  } catch (error: any) {
    console.error('Stripe Session Error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create checkout session' }, 
      { status: 500 }
    );
  }
}
