import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createClient } from '@/lib/supabase/server';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2026-05-27.dahlia',
});

export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    // Fetch the customer ID, plan, and credits from the database
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('stripe_customer_id, plan, credits')
      .eq('id', user.id)
      .single();

    if (profileError) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }

    let currentPeriodEnd: number | null = null;

    if (profile?.stripe_customer_id) {
      // List active/trialing subscriptions to get renewal date
      const subscriptions = await stripe.subscriptions.list({
        customer: profile.stripe_customer_id,
        status: 'active',
        limit: 1,
      });

      if (subscriptions.data.length > 0) {
        const sub = subscriptions.data[0] as any;
        currentPeriodEnd = sub.current_period_end || sub.currentPeriodEnd || null;
      }
    }

    return NextResponse.json({
      plan: profile.plan || 'Free',
      credits: profile.credits || 0,
      currentPeriodEnd,
    });
  } catch (err: any) {
    console.error('Subscription Status Route Error:', err);
    return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 });
  }
}
