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
  'invoice.payment_succeeded'
]);

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
    console.log(`ℹ️ Skipping non-target event: ${event.type}`);
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
      default:
        console.warn(`⚠️ Unhandled relevant event: ${event.type}`);
    }
  } catch (err: any) {
    console.error(`❌ Handler Error (${event.type}):`, err.message);
    // We still return a 200 in some cases to stop Stripe from retrying 
    // if the error is "expected" or non-recoverable, but here we'll 
    // let it fail with 500 if the DB is actually down.
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
    const { error } = await supabaseAdmin.rpc('increment_credits', {
      user_id: userId,
      amount: 1,
    });
    if (error) throw new Error(`Supabase error (credits): ${error.message}`);
    console.log(`✅ One-time payment: Credits incremented for user ${userId}`);
  } 
  
    if (mode === 'subscription') {
      const { error: profileError } = await supabaseAdmin
        .from('profiles')
        .update({
          plan: 'professional', // Should be dynamic based on priceId meta
          stripe_customer_id: customerId,
          updated_at: new Date().toISOString(),
        })
        .eq('id', userId);
      
      if (profileError) throw new Error(`Supabase error (subscription profile): ${profileError.message}`);

      // Grant initial 50 credits for the new subscription
      const { error: creditError } = await supabaseAdmin.rpc('increment_credits', {
        user_id: userId,
        amount: 50,
      });

      if (creditError) throw new Error(`Supabase error (subscription credits): ${creditError.message}`);
      
      console.log(`✅ Subscription created: User ${userId} updated and 50 credits granted`);
    }
}

async function handleInvoicePaymentSucceeded(invoice: Stripe.Invoice) {
  // Useful for subscription renewals
  const customerId = invoice.customer as string;
  const subscriptionId = (invoice as any).subscription as string;
  
  console.log(`📄 Handling Invoice Payment: ${invoice.id} | Customer: ${customerId}`);

  if (!subscriptionId) return;

  // You can add logic here to extend the user's subscription end date 
  // or simply log the successful renewal.
  console.log(`✅ Recurring payment succeeded for sub: ${subscriptionId}`);
}
