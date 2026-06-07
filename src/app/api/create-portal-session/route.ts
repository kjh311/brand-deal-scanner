import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createClient } from '@/lib/supabase/server';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2026-05-27.dahlia',
});

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    // Fetch the customer ID from the database
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('stripe_customer_id')
      .eq('id', user.id)
      .single();

    if (profileError || !profile?.stripe_customer_id) {
      return NextResponse.json({ 
        error: `No billing account found for user ${user.id}. Please make a purchase first.` 
      }, { status: 404 });
    }

    // Check if they have an active subscription for the "direct update" flow
    const activeSubs = await stripe.subscriptions.list({
      customer: profile.stripe_customer_id,
      status: 'active',
      limit: 1,
    });

    const hasActiveSub = activeSubs.data.length > 0;

    // Create the portal session
    const portalSession = await stripe.billingPortal.sessions.create({
      customer: profile.stripe_customer_id,
      return_url: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/settings`,
      // If they have an active sub, try to send them to the update screen.
      // Note: This requires "Subscription Updates" to be enabled in Stripe Dashboard.
      ...(hasActiveSub ? {
        flow_data: {
          type: 'subscription_update',
          subscription_update: {
            subscription: activeSubs.data[0].id,
          },
        },
      } : {})
    });

    return NextResponse.json({ url: portalSession.url });
  } catch (err: any) {
    console.error('Portal Session Error:', err);
    
    // Fallback: If the "Direct Update" flow failed (e.g. because it's disabled in Dashboard),
    // try creating a generic portal session instead.
    try {
        const { data: { user } } = await (await createClient()).auth.getUser();
        const { data: profile } = await (await createClient())
            .from('profiles')
            .select('stripe_customer_id')
            .eq('id', user?.id)
            .single();

        if (profile?.stripe_customer_id) {
            const genericSession = await stripe.billingPortal.sessions.create({
                customer: profile.stripe_customer_id,
                return_url: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/settings`,
            });
            return NextResponse.json({ url: genericSession.url });
        }
    } catch {}

    return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 });
  }
}
