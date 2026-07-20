import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { supabaseAdmin } from '@/lib/supabase/admin';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2026-05-27.dahlia',
});

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

// Define the events we specifically care about
const RELEVANT_EVENTS = new Set([
  'checkout.session.completed',
  'invoice.payment_succeeded',
  'customer.subscription.created',
  'customer.subscription.updated',
  'customer.subscription.deleted'
]);

// Map Product IDs to their credit counts for proration logic
const PLAN_CREDITS: Record<string, number> = {
  'prod_Uezx3sCcamylDq': 5,    // Plus
  'prod_Uf01XdkL0cOXn6': 20,   // Professional
  'prod_Uf03Msy5G3OZn2': 100,  // Agency
};

export async function POST(req: NextRequest) {
  const body = await req.text();
  const signature = req.headers.get('stripe-signature');

  if (!signature || !webhookSecret) {
    console.error('❌ Webhook Error: Missing signature or secret');
    return NextResponse.json({ error: 'Missing configuration' }, { status: 400 });
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err: any) {
    console.error(`❌ Webhook signature verification failed: ${err.message}`);
    return NextResponse.json({ error: `Verification failed: ${err.message}` }, { status: 400 });
  }

  // Filter early: Ignore events we don't care about with a 200 status
  if (!RELEVANT_EVENTS.has(event.type)) {
    return NextResponse.json({ received: true });
  }

  console.log(`🔔 Processing event: ${event.type}`);

  try {
    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutSessionCompleted(event.data.object as Stripe.Checkout.Session);
        break;
      case 'invoice.payment_succeeded':
        await handleInvoicePaymentSucceeded(event.data.object as Stripe.Invoice);
        break;
      case 'customer.subscription.created':
      case 'customer.subscription.updated':
        await handleSubscriptionUpdated(event.data.object as Stripe.Subscription, (event.data as any).previous_attributes);
        break;
      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event.data.object as Stripe.Subscription);
        break;
      default:
        console.warn(`⚠️ Unhandled relevant event: ${event.type}`);
    }
  } catch (err: any) {
    console.error(`❌ Handler Error (${event.type}):`, err.message);
    return NextResponse.json({ error: 'Webhook handler failed' }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}

async function handleCheckoutSessionCompleted(session: Stripe.Checkout.Session) {
  const userId = session.client_reference_id;
  const mode = session.mode;
  const customerId = session.customer as string;

  console.log(`📦 Handling Checkout Session: ${session.id} | User: ${userId} | Mode: ${mode}`);

  if (!userId) {
    throw new Error('Missing client_reference_id in checkout session');
  }

  if (mode === 'payment') {
    // Retrieve the actual quantity the user selected
    const lineItems = await stripe.checkout.sessions.listLineItems(session.id);
    const firstItem = lineItems.data[0];
    const quantity = firstItem?.quantity || 1;

    const { error } = await supabaseAdmin.rpc('increment_credits', {
      user_id: userId,
      amount: quantity,
    });
    if (error) throw new Error(`Supabase error (credits): ${error.message}`);
    console.log(`Top-up successful: ${quantity} items purchased, ${quantity} credits granted to User ${userId}`);
  } 
  
  if (mode === 'subscription') {
      const productId = session.metadata?.productId; 
      const creditsToGrant = parseInt(session.metadata?.credits || '5');

      const { error: profileError } = await supabaseAdmin
        .from('profiles')
        .update({
          plan: productId === 'prod_Uf03Msy5G3OZn2' ? 'agency' : (productId === 'prod_Uf01XdkL0cOXn6' ? 'professional' : 'plus'),
          stripe_customer_id: customerId,
          updated_at: new Date().toISOString(),
        })
        .eq('id', userId);
      
      if (profileError) throw new Error(`Supabase error (subscription profile): ${profileError.message}`);

      // Grant initial credits
      const { error: creditError } = await supabaseAdmin.rpc('increment_credits', {
        user_id: userId,
        amount: creditsToGrant,
      });

      if (creditError) throw new Error(`Supabase error (subscription credits): ${creditError.message}`);
      
      console.log(`✅ Subscription created: User ${userId} updated and ${creditsToGrant} credits granted`);
    }
}

async function handleSubscriptionUpdated(subscription: Stripe.Subscription, previousAttributes?: any) {
  const customerId = subscription.customer as string;
  const status = subscription.status;
  const newPriceId = subscription.items.data[0].plan.id;
  const newProductId = subscription.items.data[0].plan.product as string;

  console.log(`🔄 Handling Subscription Update: ${subscription.id} | Customer: ${customerId} | Status: ${status}`);

  // Find user by stripe_customer_id
  const { data: profile, error: findError } = await supabaseAdmin
    .from('profiles')
    .select('id, plan')
    .eq('stripe_customer_id', customerId)
    .single();

  if (findError || !profile) {
    console.error(`❌ User with customer ID ${customerId} not found`);
    return;
  }

  const oldPlan = profile.plan;
  const newPlan = newProductId === 'prod_Uf03Msy5G3OZn2' ? 'agency' : (newProductId === 'prod_Uf01XdkL0cOXn6' ? 'professional' : 'plus');

  // 1. Sync Plan Status & Name
  console.log(`🧐 Diagnostic: 
    - cancel_at_period_end: ${subscription.cancel_at_period_end}
    - status: ${status}
    - cancel_at: ${subscription.cancel_at}
    - canceled_at: ${subscription.canceled_at}
    - cancellation_details: ${JSON.stringify(subscription.cancellation_details)}
  `);
  
  const periodEnd = (subscription as any).current_period_end || (subscription as any).currentPeriodEnd;
  console.log(`🧐 current_period_end raw:`, (subscription as any).current_period_end, `currentPeriodEnd raw:`, (subscription as any).currentPeriodEnd);
  const nextBillingDate = periodEnd ? new Date(periodEnd * 1000).toISOString() : new Date().toISOString();
  
  let targetPlan = profile.plan;
  if (status === 'active') {
    targetPlan = newPlan;
  } else if (status === 'canceled' || status === 'unpaid') {
    targetPlan = 'none';
  }

  const updateData: any = {
    plan: targetPlan,
    next_billing_date: nextBillingDate,
    updated_at: new Date().toISOString(),
  };

  // Capture cancellation reason if ANY cancellation markers are present
  if (subscription.cancel_at || subscription.canceled_at || subscription.cancellation_details) {
    const feedback = subscription.cancellation_details?.feedback;
    const comment = subscription.cancellation_details?.comment;
    const reasonCode = subscription.cancellation_details?.reason;

    // Combine feedback and comment if both exist, otherwise fallback to reason codes
    let reason = 'User cancelled';
    if (feedback && comment) {
      reason = `${feedback}: ${comment}`;
    } else {
      reason = comment || feedback || reasonCode || 'User cancelled';
    }
      
    updateData.cancellation_reason = reason;
    console.log(`📉 Churn marker detected. Combined Reason: ${reason}`);
  }

  const { error: updateError, data: updateResult } = await supabaseAdmin
    .from('profiles')
    .update(updateData)
    .eq('id', profile.id)
    .select();

  if (updateError) {
    console.error(`❌ Supabase update failed: ${updateError.message}`);
    throw new Error(`Sync error: ${updateError.message}`);
  }

  console.log(`Billing date synchronized for Customer ${customerId}: ${nextBillingDate}`);
  console.log(`✅ Supabase update finished. Rows affected: ${updateResult?.length || 0}`);

  // 2. Proration Logic (Top-up credits if upgrading)
  // Check if the plan actually changed in a way that warrants more credits
  if (previousAttributes?.items && oldPlan !== newPlan) {
    const oldCredits = oldPlan === 'agency' ? 100 : (oldPlan === 'professional' ? 20 : (oldPlan === 'plus' ? 5 : 0));
    const newCredits = PLAN_CREDITS[newProductId] || 0;

    if (newCredits > oldCredits) {
      const topUp = newCredits - oldCredits;
      console.log(`🎁 Upgrading user ${profile.id}: Granting ${topUp} additional credits`);
      
      const { error: creditError } = await supabaseAdmin.rpc('increment_credits', {
        user_id: profile.id,
        amount: topUp,
      });
      if (creditError) console.error(`❌ Credit top-up failed: ${creditError.message}`);
    }
  }
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  const customerId = subscription.customer as string;
  const cancellationReason = subscription.cancellation_details?.comment || subscription.cancellation_details?.reason || 'User cancelled';

  console.log(`🗑️ Handling Subscription Deletion: ${subscription.id} | Customer: ${customerId}`);

  const { error } = await supabaseAdmin
    .from('profiles')
    .update({
      plan: 'none',
      cancellation_reason: cancellationReason,
      next_billing_date: null,
      updated_at: new Date().toISOString(),
    })
    .eq('stripe_customer_id', customerId);

  if (error) throw new Error(`Deletion sync error: ${error.message}`);
  console.log(`Billing date synchronized for Customer ${customerId}: null`);
  console.log(`✅ Cancellation captured for Customer ${customerId}: ${cancellationReason}`);
}

async function handleInvoicePaymentSucceeded(invoice: Stripe.Invoice) {
  const customerId = invoice.customer as string;
  const subscriptionId = (invoice as any).subscription as string;
  
  console.log(`📄 Handling Invoice Payment: ${invoice.id} | Customer: ${customerId}`);
  if (!subscriptionId) return;
  console.log(`✅ Recurring payment succeeded for sub: ${subscriptionId}`);
}
