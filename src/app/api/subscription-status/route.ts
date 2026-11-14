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

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('stripe_customer_id, plan, credits, none_expire_credits, next_billing_date')
      .eq('id', user.id)
      .single();

    if (profileError) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }

    let currentPeriodEnd: number | null = null;
    let hasActiveSubscription = false;

    if (profile?.stripe_customer_id) {
      const subscriptions = await stripe.subscriptions.list({
        customer: profile.stripe_customer_id,
        status: 'active',
        limit: 1,
      });

      if (subscriptions.data.length > 0) {
        const sub = subscriptions.data[0] as any;
        currentPeriodEnd = sub.current_period_end || sub.currentPeriodEnd || null;
        hasActiveSubscription = true;
      }
    }

    const isPaidTier = Boolean(
      profile?.plan &&
      profile.plan.toLowerCase() !== 'free' &&
      profile.plan.toLowerCase() !== 'none'
    );

    return NextResponse.json({
      plan: profile.plan || 'Free',
      credits: profile.credits || 0,
      none_expire_credits: profile.none_expire_credits || 0,
      stripe_customer_id: profile.stripe_customer_id,
      currentPeriodEnd,
      hasActiveSubscription: hasActiveSubscription || isPaidTier,
      nextBillingDate: profile.next_billing_date,
    });
  } catch (err: any) {
    console.error('Subscription Status Route Error:', err);
    return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 });
  }
}
