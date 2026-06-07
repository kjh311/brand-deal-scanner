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
    const { priceId, mode, credits, isPortalOnly } = await req.json();

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    if (!priceId && !isPortalOnly) {
      return NextResponse.json({ error: 'Price ID or Product ID is required' }, { status: 400 });
    }

    if (!process.env.STRIPE_SECRET_KEY) {
      throw new Error('STRIPE_SECRET_KEY is not configured');
    }

    let finalPriceId = priceId;
    let finalProductId = '';

    // 1. Resolve Product ID to its Default Price ID if necessary
    if (priceId && priceId.startsWith('prod_')) {
      const product = await stripe.products.retrieve(priceId);
      finalProductId = product.id;
      
      if (!product.default_price) {
        return NextResponse.json(
          { error: `Product ${priceId} has no default price configured in Stripe.` }, 
          { status: 400 }
        );
      }

      finalPriceId = typeof product.default_price === 'string' 
        ? product.default_price 
        : product.default_price.id;
    } else if (priceId && priceId.startsWith('price_')) {
      // If they passed a price ID directly, retrieve the product to get the ID
      const price = await stripe.prices.retrieve(priceId);
      finalProductId = typeof price.product === 'string' ? price.product : price.product.id;
    }

    // 2. CHECK FOR EXISTING CUSTOMER ID
    const { data: profile } = await supabase
      .from('profiles')
      .select('stripe_customer_id')
      .eq('id', user.id)
      .single();

    const customerId = profile?.stripe_customer_id || undefined;

    // Create the checkout session
    const session = await stripe.checkout.sessions.create({
      client_reference_id: user.id, // Attach user ID for webhook identification
      customer: customerId,
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
        priceId: finalPriceId || '',
        productId: finalProductId || '',
        originalId: priceId || '',
        credits: credits?.toString() || '0',
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
