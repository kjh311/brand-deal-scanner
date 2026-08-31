import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { sendPurchaseReceiptEmail } from '@/lib/emails/send-purchase-receipt';
import { sendCancellationEmail } from '@/lib/emails/send-cancellation';
import { sendPaymentFailedEmail } from '@/lib/emails/send-payment-failed';

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
  'invoice.payment_failed',
]);

const PLAN_CREDITS: Record<string, number> = {
  'prod_Uezx3sCcamylDq': 5,
  'prod_Uf01XdkL0cOXn6': 20,
  'prod_Uf03Msy5G3OZn2': 100,
  'plus': 5,
  'professional': 20,
  'agency': 100,
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
        await handleSubscriptionUpdated(event.data.object as Stripe.Subscription, event);
        break;
      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event.data.object as Stripe.Subscription);
        break;
      case 'invoice.payment_failed':
        await handleInvoicePaymentFailed(event.data.object as Stripe.Invoice);
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

  // Send purchase receipt email (non-blocking)
  let customerEmail = session.customer_details?.email;
  if (!customerEmail && userId) {
    try {
      const { data: profile } = await supabaseAdmin
        .from('profiles')
        .select('email')
        .eq('id', userId)
        .single();
      if (profile?.email) {
        customerEmail = profile.email;
        console.log(`🔍 Resolved customer email from Supabase: ${customerEmail}`);
      }
    } catch (err: any) {
      console.warn('Failed to retrieve customer email from profile:', err.message);
    }
  }

  if (customerEmail) {
    try {
      // Get invoice URL for receipt
      let hostedInvoiceUrl: string | null = null;
      if (session.invoice) {
        const invoiceId = typeof session.invoice === 'string' ? session.invoice : session.invoice?.id;
        if (invoiceId) {
          const invoice = await stripe.invoices.retrieve(invoiceId);
          hostedInvoiceUrl = invoice.hosted_invoice_url ?? null;
        }
      }

      // Get plan name and amount
      const lineItems = await stripe.checkout.sessions.listLineItems(session.id);
      const firstItem = lineItems.data[0];
      const planName = firstItem?.description || 'Brand Deal Fixer Plan';
      const amountPaid = session.amount_total || 0;

      console.log('[Stripe Webhook] Processing purchase receipt for:', customerEmail);
      console.log('[Stripe Webhook] Invoice URL:', hostedInvoiceUrl);

      await sendPurchaseReceiptEmail({
        email: customerEmail,
        planName,
        amountPaid,
        hostedInvoiceUrl,
        isSubscription: mode === 'subscription',
      });

      console.log('[Resend] Purchase email sent successfully');
    } catch (err: any) {
      console.error('[Stripe Webhook] Failed to send purchase receipt:', err.message);
    }
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
    let productId = session.metadata?.productId;

    // Fallback: derive productId from line items if not present in metadata
    if (!productId) {
      try {
        const lineItems = await stripe.checkout.sessions.listLineItems(session.id);
        const firstItem = lineItems.data[0] as any;
        productId = typeof firstItem?.price?.product === 'string' 
          ? firstItem.price.product 
          : firstItem?.price?.product?.id;
        console.log(`🔍 Fallback: Derived productId from line items: ${productId || 'unknown'}`);
      } catch (err: any) {
        console.error('Failed to list line items for checkout session:', err.message);
      }
    }

    const plan = productId === 'prod_Uf03Msy5G3OZn2' ? 'agency' 
      : productId === 'prod_Uf01XdkL0cOXn6' ? 'professional' 
      : 'plus';

    console.log(`📦 Subscription mode: resolved productId to ${productId || 'none'} -> plan: ${plan}`);

    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .update({
        plan: plan,
        stripe_customer_id: customerId,
        cancellation_reason: null,
        credits: 0,
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId);

    if (profileError) throw new Error(`Supabase error (subscription profile): ${profileError.message}`);

    console.log(`✅ Subscription created: User ${userId} profile updated (plan set to '${plan}' + stripe_customer_id linked). Credits will be granted on invoice.payment_succeeded.`);
  }
}

async function handleSubscriptionUpdated(subscription: Stripe.Subscription, event: Stripe.Event) {
  const customerId = subscription.customer as string;
  const status = subscription.status;

  console.log(`🔄 Handling Subscription Update: ${subscription.id} | Customer: ${customerId} | Status: ${status} | cancel_at_period_end: ${subscription.cancel_at_period_end}`);

  const { data: profile, error: findError } = await supabaseAdmin
    .from('profiles')
    .select('id, plan, email, credits, none_expire_credits, cancellation_reason')
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

  // Send cancellation email if cancel_at_period_end transitioned to true
  const previousAttributes = (event.data.previous_attributes as any);
  const cancelAtPeriodEndJustEnabled = 
    subscription.cancel_at_period_end && 
    ((previousAttributes && previousAttributes.cancel_at_period_end === false) ||
     !profile.cancellation_reason);

  if (cancelAtPeriodEndJustEnabled) {
    try {
      await sendCancellationEmail({
        email: profile.email || '',
        currentPeriodEnd: periodEnd || Math.floor(Date.now() / 1000),
        creditsRemaining: profile.credits || 0,
        nonExpiringCredits: profile.none_expire_credits || 0,
      });
    } catch (emailErr: any) {
      console.error('[Stripe Webhook] Error sending cancellation email:', emailErr.message || emailErr);
    }
  }
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  const customerId = subscription.customer as string;
  const cancellationReason = extractCancellationReason(subscription);

  console.log(`🗑️ Handling Subscription Deletion: ${subscription.id} | Customer: ${customerId} | Reason: ${cancellationReason || 'N/A'}`);

  // Fetch email and credits before resetting them in the update
  const { data: profile, error: findError } = await supabaseAdmin
    .from('profiles')
    .select('id, email, credits, none_expire_credits')
    .eq('stripe_customer_id', customerId)
    .single();

  if (findError) {
    console.warn(`[Stripe Webhook] Profile not found for customer ${customerId} during deletion email check`);
  }

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

  if (profile) {
    try {
      const periodEnd = (subscription as any).current_period_end || Math.floor(Date.now() / 1000);
      await sendCancellationEmail({
        email: profile.email || '',
        currentPeriodEnd: periodEnd,
        creditsRemaining: profile.credits || 0,
        nonExpiringCredits: profile.none_expire_credits || 0,
      });
    } catch (emailErr: any) {
      console.error('[Stripe Webhook] Error sending cancellation deleted email:', emailErr.message || emailErr);
    }
  }
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

  // Derive Product ID directly from Invoice Line Item
  const invoiceLineItem = invoice.lines?.data[0] as any;
  const productId = typeof invoiceLineItem?.price?.product === 'string' 
    ? invoiceLineItem.price.product 
    : invoiceLineItem?.price?.product?.id;

  const plan = productId === 'prod_Uf03Msy5G3OZn2' ? 'agency' 
    : productId === 'prod_Uf01XdkL0cOXn6' ? 'professional' 
    : 'plus';

  console.log(`🔍 Derived Product ID: ${productId || 'unknown'} -> plan: ${plan}`);

  let profile = null;
  const { data: existingProfile } = await supabaseAdmin
    .from('profiles')
    .select('id, plan')
    .eq('stripe_customer_id', customerId)
    .single();

  if (existingProfile) {
    profile = existingProfile;
  } else {
    // Look up customer details in Stripe to find the email
    try {
      const customer = await stripe.customers.retrieve(customerId);
      const email = (customer as Stripe.Customer).email;
      if (email) {
        console.log(`🔍 Customer ID ${customerId} not matched in DB. Searching by email: ${email}`);
        const { data: emailProfile } = await supabaseAdmin
          .from('profiles')
          .select('id, plan')
          .eq('email', email)
          .single();

        if (emailProfile) {
          profile = emailProfile;
          console.log(`🔗 Found profile via email lookup. ID: ${profile.id}`);
        }
      }
    } catch (err: any) {
      console.error('Failed to resolve customer by email fallback:', err.message);
    }
  }

  if (!profile) {
    console.error(`❌ User with customer ID ${customerId} not found in Supabase (even after email fallback)`);
    return;
  }

  // Sync next_billing_date and plan status in profile
  const updateFields: any = {
    plan: plan,
    stripe_customer_id: customerId,
    updated_at: new Date().toISOString()
  };

  const linePeriodEnd = invoice.lines?.data[0]?.period?.end || (invoice as any).period_end;
  if (linePeriodEnd) {
    updateFields.next_billing_date = new Date(linePeriodEnd * 1000).toISOString();
  }

  await supabaseAdmin
    .from('profiles')
    .update(updateFields)
    .eq('id', profile.id);

  console.log(`📅 Updated plan to ${plan} and next_billing_date for User ${profile.id}`);

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

async function handleInvoicePaymentFailed(invoice: Stripe.Invoice) {
  const customerId = typeof invoice.customer === 'string' ? invoice.customer : invoice.customer?.id;
  
  let customerEmail = invoice.customer_email;
  if (!customerEmail && customerId) {
    try {
      const customer = await stripe.customers.retrieve(customerId);
      customerEmail = (customer as Stripe.Customer).email;
    } catch (err: any) {
      console.warn('Failed to retrieve customer email from Stripe:', err.message);
    }
  }

  if (!customerEmail) {
    console.warn(`[Stripe Webhook] No customer email found on invoice ${invoice.id}, skipping failed payment email`);
    return;
  }

  console.log('[Stripe Webhook] Processing failed payment notification for:', customerEmail);

  let billingPortalUrl = 'https://www.branddealfixer.com/dashboard/billing';
  if (customerId) {
    try {
      const session = await stripe.billingPortal.sessions.create({
        customer: customerId,
        return_url: 'https://www.branddealfixer.com/settings',
      });
      billingPortalUrl = session.url;
    } catch (err: any) {
      console.warn('Failed to create customer portal session:', err.message);
    }
  }

  try {
    const data = await sendPaymentFailedEmail({
      email: customerEmail,
      amountDue: invoice.amount_due || 0,
      currency: invoice.currency || 'usd',
      billingPortalUrl,
    });
    console.log('[Resend] Payment failed email sent successfully:', data);
  } catch (emailErr: any) {
    console.error('[Stripe Webhook] Error sending failed payment email:', emailErr.message || emailErr);
  }
}
