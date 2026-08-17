import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { supabaseAdmin } from '@/lib/supabase/admin';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2026-05-27.dahlia',
});

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

const RELEVANT_EVENTS = new Set([
  'checkout.session.completed',
  'invoice.payment_succeeded',
  'customer.subscription.created',
  'customer.subscription.updated',
  'customer.subscription.deleted',
]);

const PLAN_CREDITS: Record<string, number> = {
  'prod_Uezx3sCcamylDq': 5,
  'prod_Uf01XdkL0cOXn6': 20,
  'prod_Uf03Msy5G3OZn2': 100,
};

const processedEventIds = new Set<string>();

function extractCancellationReason(subscription: Stripe.Subscription): string | null {
  const sub = subscription as any;
  const feedback = sub.cancellation_details?.feedback;
  const comment = sub.cancellation_details?.comment;
  const reasonCode = sub.cancellation_details?.reason;
  const metadataReason = sub.metadata?.cancellation_reason;

  if (feedback && comment) {
    return `${feedback}: ${comment}`;
  }
  return metadataReason || comment || feedback || reasonCode || null;
}

export async function POST(req: NextRequest) {
  if (!webhookSecret) {
    console.error('CRITICAL CONFIGURATION ERROR: STRIPE_WEBHOOK_SECRET is not configured or is empty.');
    return NextResponse.json({ error: 'Webhook configuration error' }, { status: 500 });
  }

  const body = await req.text();
  const signature = req.headers.get('stripe-signature');

  if (!signature) {
    console.error('❌ Webhook Error: Missing stripe-signature header');
    return NextResponse.json({ error: 'Missing stripe-signature header' }, { status: 400 });
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err: any) {
    console.error('Stripe signature verification failed:', err.message);
    return NextResponse.json({ error: `Verification failed: ${err.message}` }, { status: 400 });
  }

  if (!RELEVANT_EVENTS.has(event.type)) {
    return NextResponse.json({ received: true }, { status: 200 });
  }

  // Idempotency check: skip already-processed events
  if (processedEventIds.has(event.id)) {
    console.log(`⚠️ Duplicate event ${event.id} (${event.type}), skipping`);
    return NextResponse.json({ received: true }, { status: 200 });
  }
  processedEventIds.add(event.id);

  console.log(`🔔 Processing event: ${event.type} (id: ${event.id})`);

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
        await handleSubscriptionUpdated(event.data.object as Stripe.Subscription);
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

  return NextResponse.json({ received: true }, { status: 200 });
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
    const creditsParam = session.metadata?.credits;
    let amount = 0;

    if (creditsParam) {
      amount = parseInt(creditsParam, 10);
    } else {
      const lineItems = await stripe.checkout.sessions.listLineItems(session.id);
      const firstItem = lineItems.data[0];
      amount = firstItem?.quantity || 1;
    }

    const { error } = await supabaseAdmin.rpc('increment_non_expiring_credits', {
      user_id: userId,
      amount: amount,
    });
    if (error) throw new Error(`Supabase error (none_expire_credits): ${error.message}`);
    console.log(`Top-up successful: ${amount} non-expiring credits granted to User ${userId}`);
  }

  if (mode === 'subscription') {
    const productId = session.metadata?.productId;

    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .update({
        plan: productId === 'prod_Uf03Msy5G3OZn2' ? 'agency' : (productId === 'prod_Uf01XdkL0cOXn6' ? 'professional' : 'plus'),
        stripe_customer_id: customerId,
        cancellation_reason: null,
        credits: 0,
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId);

    if (profileError) throw new Error(`Supabase error (subscription profile): ${profileError.message}`);

    console.log(`✅ Subscription created: User ${userId} profile updated (plan + stripe_customer_id linked). Credits will be granted on invoice.payment_succeeded.`);
  }
}

async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  const customerId = subscription.customer as string;
  const status = subscription.status;

  console.log(`🔄 Handling Subscription Update: ${subscription.id} | Customer: ${customerId} | Status: ${status} | cancel_at_period_end: ${subscription.cancel_at_period_end}`);

  const { data: profile, error: findError } = await supabaseAdmin
    .from('profiles')
    .select('id, plan')
    .eq('stripe_customer_id', customerId)
    .single();

  if (findError || !profile) {
    console.error(`❌ User with customer ID ${customerId} not found`);
    return;
  }

  const subAny = subscription as any;
  const periodEnd =
    subAny.current_period_end ||
    subAny.currentPeriodEnd ||
    subscription.items?.data[0]?.current_period_end ||
    subAny.latest_invoice?.lines?.data?.[0]?.period?.end;

  const cancelAtPeriodEnd = subscription.cancel_at_period_end;
  const isCancelling = cancelAtPeriodEnd || !!subscription.cancel_at || !!subscription.canceled_at;

  const cancellationReason = isCancelling
    ? extractCancellationReason(subscription) || 'Cancellation Requested'
    : null;

  if (cancellationReason) {
    console.log(`📉 Cancellation reason: ${cancellationReason}`);
  }

  const updateData: any = {
    cancellation_reason: cancellationReason,
    updated_at: new Date().toISOString(),
  };

  // Reset subscription credits only; never touch none_expire_credits
  if (status === 'canceled' || status === 'unpaid') {
    updateData.plan = 'none';
    updateData.next_billing_date = null;
    updateData.credits = 0;
  } else if (status === 'active' && !isCancelling) {
    if (periodEnd) {
      updateData.next_billing_date = new Date(periodEnd * 1000).toISOString();
    }
  }

  const { error: updateError } = await supabaseAdmin
    .from('profiles')
    .update(updateData)
    .eq('id', profile.id);

  if (updateError) {
    console.error(`❌ Supabase update failed: ${updateError.message}`);
    throw new Error(`Sync error: ${updateError.message}`);
  }

  console.log(`✅ Subscription updated for User ${profile.id}: plan=${updateData.plan || profile.plan}, cancellation_reason=${cancellationReason || 'null'}`);
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  const customerId = subscription.customer as string;
  const cancellationReason = extractCancellationReason(subscription);

  console.log(`🗑️ Handling Subscription Deletion: ${subscription.id} | Customer: ${customerId} | Reason: ${cancellationReason || 'N/A'}`);

  const { error } = await supabaseAdmin
    .from('profiles')
    .update({
      plan: 'none',
      credits: 0,
      next_billing_date: null,
      cancellation_reason: null,
      updated_at: new Date().toISOString(),
    })
    .eq('stripe_customer_id', customerId);

  if (error) {
    console.error(`❌ Deletion sync error for customer ${customerId}: ${error.message}`);
    throw new Error(`Deletion sync error: ${error.message}`);
  }

  console.log(`✅ Cancellation finalized for Customer ${customerId}: plan set to 'none', credits reset to 0. Non-expiring credits preserved.`);
}

async function handleInvoicePaymentSucceeded(invoice: Stripe.Invoice) {
  const invoiceAny = invoice as any;
  const customerId = typeof invoice.customer === 'string' ? invoice.customer : invoice.customer?.id;
  const subscriptionId =
    (typeof invoiceAny.subscription === 'string' ? invoiceAny.subscription : invoiceAny.subscription?.id) ||
    (invoice.lines?.data[0]?.subscription as string) ||
    invoiceAny.parent?.subscription;

  console.log(`📄 Handling Invoice Payment: ${invoice.id} | Customer: ${customerId} | Sub: ${subscriptionId}`);

  if (!customerId) {
    console.warn(`⚠️ No customer found on invoice ${invoice.id}, skipping credit grant`);
    return;
  }

  if (invoice.status !== 'paid') {
    console.warn(`⚠️ Invoice ${invoice.id} status is '${invoice.status}', not 'paid'. Skipping credit grant.`);
    return;
  }

  const { data: profile, error: findError } = await supabaseAdmin
    .from('profiles')
    .select('id, plan')
    .eq('stripe_customer_id', customerId)
    .single();

  if (findError || !profile) {
    console.error(`❌ User with customer ID ${customerId} not found in Supabase`);
    return;
  }

  // Sync next_billing_date from invoice period
  const linePeriodEnd = invoice.lines?.data[0]?.period?.end || (invoice as any).period_end;
  if (linePeriodEnd) {
    const nextBillingDate = new Date(linePeriodEnd * 1000).toISOString();
    await supabaseAdmin
      .from('profiles')
      .update({ next_billing_date: nextBillingDate })
      .eq('id', profile.id);
    console.log(`📅 Updated next_billing_date to ${nextBillingDate} for User ${profile.id}`);
  }

  // Derive Product ID directly from Invoice Line Item
  const invoiceLineItem = invoice.lines?.data[0] as any;
  const productId = typeof invoiceLineItem?.price?.product === 'string' 
    ? invoiceLineItem.price.product 
    : invoiceLineItem?.price?.product?.id;

  console.log(`🔍 Derived Product ID: ${productId || 'unknown'} | Stored profile plan: ${profile.plan || 'none'}`);

  // Prevent credit grant if subscription is ending or canceled
  if (subscriptionId) {
    try {
      const sub = await stripe.subscriptions.retrieve(subscriptionId);
      if (sub.cancel_at_period_end || sub.status === 'canceled' || sub.cancel_at || sub.canceled_at) {
        console.log(`🛑 Subscription ${subscriptionId} is canceled or ending. Skipping monthly credit grant.`);
        return;
      }
    } catch (err: any) {
      console.warn('Failed to inspect subscription status in Stripe:', err.message);
    }
  }

  const creditsToGrant = (productId && PLAN_CREDITS[productId]) || PLAN_CREDITS[profile.plan] || 5;

  console.log(`🔄 Renewal for User ${profile.id} (productId: ${productId || 'none'}, plan: ${profile.plan || 'none'}): Granting ${creditsToGrant} credits`);

  const { error: creditError } = await supabaseAdmin.rpc('increment_credits', {
    user_id: profile.id,
    amount: creditsToGrant,
  });

  if (creditError) {
    console.error(`❌ Credit renewal failed for User ${profile.id}: ${creditError.message}`);
    throw new Error(`Credit renewal failed: ${creditError.message}`);
  }

  console.log(`✅ Renewal successful for User ${profile.id}: ${creditsToGrant} credits granted`);
}
