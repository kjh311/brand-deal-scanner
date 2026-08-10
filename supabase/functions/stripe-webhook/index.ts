import { createClient } from "npm:@supabase/supabase-js@2"
import Stripe from "npm:stripe@22.2.0"

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
  apiVersion: "2026-05-27.dahlia",
})

const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SIGNING_SECRET")

const RELEVANT_EVENTS = new Set([
  "checkout.session.completed",
  "invoice.payment_succeeded",
  "customer.subscription.created",
  "customer.subscription.updated",
  "customer.subscription.deleted",
])

const PLAN_CREDITS: Record<string, number> = {
  prod_Uezx3sCcamylDq: 5,
  prod_Uf01XdkL0cOXn6: 20,
  prod_Uf03Msy5G3OZn2: 100,
}

const PLAN_NAMES: Record<string, string> = {
  prod_Uezx3sCcamylDq: "plus",
  prod_Uf01XdkL0cOXn6: "professional",
  prod_Uf03Msy5G3OZn2: "agency",
}

const supabaseUrl = Deno.env.get("SUPABASE_URL") || ""
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || ""
const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function handleCheckoutSessionCompleted(session: Stripe.Checkout.Session) {
  const userId = session.client_reference_id
  const mode = session.mode
  const customerId = session.customer as string

  if (!userId) {
    throw new Error("Missing client_reference_id in checkout session")
  }

  if (mode === "payment") {
    const lineItems = await stripe.checkout.sessions.listLineItems(session.id)
    const firstItem = lineItems.data[0]
    const quantity = firstItem?.quantity || 1

    const { error } = await supabase.rpc("increment_credits", {
      user_id: userId,
      amount: quantity,
    })
    if (error) throw new Error(`Supabase error (credits): ${error.message}`)
  }

  if (mode === "subscription") {
    const productId = session.metadata?.productId
    const planName = productId ? PLAN_NAMES[productId] || "plus" : "plus"

    const { error: profileError } = await supabase
      .from("profiles")
      .update({
        plan: planName,
        stripe_customer_id: customerId,
        cancellation_reason: null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", userId)

    if (profileError) throw new Error(`Supabase error (subscription profile): ${profileError.message}`)
  }
}

async function handleSubscriptionUpdated(
  subscription: Stripe.Subscription,
) {
  const customerId = subscription.customer as string
  const status = subscription.status
  const newProductId = subscription.items.data[0].plan.product as string

  const { data: profile, error: findError } = await supabase
    .from("profiles")
    .select("id, plan")
    .eq("stripe_customer_id", customerId)
    .single()

  if (findError || !profile) {
    console.error(`User with customer ID ${customerId} not found`)
    return
  }

  const oldPlan = profile.plan
  const newPlan = newProductId ? PLAN_NAMES[newProductId] || oldPlan : oldPlan

  const periodEnd = (subscription as any).current_period_end || (subscription as any).currentPeriodEnd
  const nextBillingDate = periodEnd ? new Date(periodEnd * 1000).toISOString() : new Date().toISOString()

  const cancelAtPeriodEnd = subscription.cancel_at_period_end

  let targetPlan = oldPlan
  if (status === "active") {
    if (cancelAtPeriodEnd) {
      // Keep current plan until period ends
      targetPlan = oldPlan
    } else {
      targetPlan = newPlan
    }
  } else if (status === "canceled" || status === "unpaid") {
    targetPlan = "none"
  }

  const updateData: Record<string, any> = {
    plan: targetPlan,
    updated_at: new Date().toISOString(),
  }

  // Keep billing date while user still has access; only null on full cancellation
  if (status === "canceled" || status === "unpaid") {
    updateData.next_billing_date = null
  } else {
    updateData.next_billing_date = nextBillingDate
  }

  // Reset credits on full cancellation
  if (status === "canceled" || status === "unpaid") {
    updateData.credits = 0
  }

  // Clear cancellation reason when user is actively subscribed (resubscribe)
  if (status === "active" && !cancelAtPeriodEnd) {
    updateData.cancellation_reason = null
  }

  // Capture cancellation reason only when subscription is actually being canceled
  if ((status === "canceled" || status === "unpaid" || cancelAtPeriodEnd) &&
      (subscription.cancel_at || subscription.canceled_at || subscription.cancellation_details)) {
    const feedback = subscription.cancellation_details?.feedback
    const comment = subscription.cancellation_details?.comment
    const reasonCode = subscription.cancellation_details?.reason

    let reason = "User cancelled"
    if (feedback && comment) {
      reason = `${feedback}: ${comment}`
    } else {
      reason = comment || feedback || reasonCode || "User cancelled"
    }

    updateData.cancellation_reason = reason
  }

  const { error: updateError, data: updateResult } = await supabase
    .from("profiles")
    .update(updateData)
    .eq("id", profile.id)
    .select()

  if (updateError) {
    throw new Error(`Sync error: ${updateError.message}`)
  }
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  const customerId = subscription.customer as string
  const cancellationReason = subscription.cancellation_details?.comment || subscription.cancellation_details?.reason || "User cancelled"

  const { error } = await supabase
    .from("profiles")
    .update({
      plan: "none",
      credits: 0,
      cancellation_reason: cancellationReason,
      next_billing_date: null,
      updated_at: new Date().toISOString(),
    })
    .eq("stripe_customer_id", customerId)

  if (error) throw new Error(`Deletion sync error: ${error.message}`)
}

async function handleInvoicePaymentSucceeded(invoice: Stripe.Invoice) {
  const invoiceAny = invoice as any
  const customerId = typeof invoice.customer === "string" ? invoice.customer : invoice.customer?.id
  const subscriptionId =
    (typeof invoiceAny.subscription === "string" ? invoiceAny.subscription : invoiceAny.subscription?.id) ||
    (invoice.lines?.data[0]?.subscription as string) ||
    invoiceAny.parent?.subscription

  console.log(`📄 Handling Invoice Payment: ${invoice.id} | Customer: ${customerId} | Sub: ${subscriptionId}`)

  if (!customerId) {
    console.warn(`⚠️ No customer found on invoice ${invoice.id}, skipping credit grant`)
    return
  }

  // Verify the invoice is actually paid
  if (invoice.status !== "paid") {
    console.warn(`⚠️ Invoice ${invoice.id} status is '${invoice.status}', not 'paid'. Skipping credit grant.`)
    return
  }

  // Find user by stripe_customer_id
  const { data: profile, error: findError } = await supabase
    .from("profiles")
    .select("id, plan")
    .eq("stripe_customer_id", customerId)
    .single()

  if (findError || !profile) {
    console.error(`❌ User with customer ID ${customerId} not found in Supabase`)
    return
  }

  // STOP IF USER IS CANCELED OR ON NO PLAN
  if (!profile.plan || profile.plan === "none") {
    console.warn(`🛑 User ${profile.id} is on plan '${profile.plan}'. Skipping credit grant and billing date sync.`)
    return
  }

  // Prevent credit grant if subscription is ending at period end
  let subCancelAtPeriodEnd = false
  if (subscriptionId) {
    try {
      const sub = await stripe.subscriptions.retrieve(subscriptionId)
      if (sub.cancel_at_period_end || sub.status === "canceled") {
        console.log(`🛑 Subscription ${subscriptionId} is ending at period end. Skipping monthly credit grant.`)
        return
      }
      subCancelAtPeriodEnd = sub.cancel_at_period_end
    } catch (err: any) {
      console.warn("Failed to inspect subscription status in Stripe:", err.message)
    }
  }

  // Sync next_billing_date from invoice period (only for active subscriptions)
  if (!subCancelAtPeriodEnd) {
    const linePeriodEnd = invoice.lines?.data[0]?.period?.end || (invoice as any).period_end
    if (linePeriodEnd) {
      const nextBillingDate = new Date(linePeriodEnd * 1000).toISOString()
      await supabase
        .from("profiles")
        .update({ next_billing_date: nextBillingDate })
        .eq("id", profile.id)
      console.log(`📅 Updated next_billing_date to ${nextBillingDate} for User ${profile.id}`)
    }
  }

  const planProductId = profile.plan === "agency" ? "prod_Uf03Msy5G3OZn2"
    : profile.plan === "professional" ? "prod_Uf01XdkL0cOXn6"
    : "prod_Uezx3sCcamylDq"

  const creditsToGrant = PLAN_CREDITS[planProductId] || 5

  console.log(`🔄 Renewal for User ${profile.id} (plan: ${profile.plan}): Granting ${creditsToGrant} credits`)

  const { error: creditError } = await supabase.rpc("increment_credits", {
    user_id: profile.id,
    amount: creditsToGrant,
  })

  if (creditError) {
    console.error(`❌ Credit renewal failed for User ${profile.id}: ${creditError.message}`)
    throw new Error(`Credit renewal failed: ${creditError.message}`)
  }

  console.log(`✅ Renewal successful for User ${profile.id}: ${creditsToGrant} credits granted`)
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers":
          "authorization, x-client-info, apikey, content-type, stripe-signature",
      },
    })
  }

  if (req.method !== "POST") {
    return new Response("Method Not Allowed", { status: 405 })
  }

  if (!webhookSecret) {
    console.error("Webhook secret not configured")
    return new Response("Missing configuration", { status: 500 })
  }

  const body = await req.text()
  const signature = req.headers.get("stripe-signature")

  if (!signature) {
    return new Response("Missing stripe-signature header", { status: 400 })
  }

  let event: Stripe.Event

  try {
    event = await stripe.webhooks.constructEventAsync(body, signature, webhookSecret)
  } catch (err: any) {
    console.error(`Webhook signature verification failed: ${err.message}`)
    return new Response(`Verification failed: ${err.message}`, { status: 400 })
  }

  if (!RELEVANT_EVENTS.has(event.type)) {
    return new Response("OK", { status: 200 })
  }

  console.log(`Processing event: ${event.type}`)

  try {
    switch (event.type) {
      case "checkout.session.completed":
        await handleCheckoutSessionCompleted(event.data.object as Stripe.Checkout.Session)
        break
      case "invoice.payment_succeeded":
        await handleInvoicePaymentSucceeded(event.data.object as Stripe.Invoice)
        break
      case "customer.subscription.created":
      case "customer.subscription.updated":
        await handleSubscriptionUpdated(
          event.data.object as Stripe.Subscription
        )
        break
      case "customer.subscription.deleted":
        await handleSubscriptionDeleted(event.data.object as Stripe.Subscription)
        break
      default:
        console.warn(`Unhandled relevant event: ${event.type}`)
    }
  } catch (err: any) {
    console.error(`Handler Error (${event.type}):`, err.message)
    return new Response("Webhook handler failed", { status: 500 })
  }

  return new Response("OK", { status: 200 })
})
