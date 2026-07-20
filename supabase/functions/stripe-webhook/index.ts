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
    const creditsToGrant = parseInt(session.metadata?.credits || "5")
    const planName = productId ? PLAN_NAMES[productId] || "plus" : "plus"

    const { error: profileError } = await supabase
      .from("profiles")
      .update({
        plan: planName,
        stripe_customer_id: customerId,
        updated_at: new Date().toISOString(),
      })
      .eq("id", userId)

    if (profileError) throw new Error(`Supabase error (subscription profile): ${profileError.message}`)

    const { error: creditError } = await supabase.rpc("increment_credits", {
      user_id: userId,
      amount: creditsToGrant,
    })

    if (creditError) throw new Error(`Supabase error (subscription credits): ${creditError.message}`)
  }
}

async function handleSubscriptionUpdated(
  subscription: Stripe.Subscription,
  previousAttributes?: any
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

  let targetPlan = oldPlan
  if (status === "active") {
    targetPlan = newPlan
  } else if (status === "canceled" || status === "unpaid") {
    targetPlan = "none"
  }

  const updateData: Record<string, any> = {
    plan: targetPlan,
    next_billing_date: nextBillingDate,
    updated_at: new Date().toISOString(),
  }

  if (subscription.cancel_at || subscription.canceled_at || subscription.cancellation_details) {
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

  if (previousAttributes?.items && oldPlan !== newPlan) {
    const oldCredits = oldPlan === "agency" ? 100 : oldPlan === "professional" ? 20 : oldPlan === "plus" ? 5 : 0
    const newCredits = PLAN_CREDITS[newProductId] || 0

    if (newCredits > oldCredits) {
      const topUp = newCredits - oldCredits

      const { error: creditError } = await supabase.rpc("increment_credits", {
        user_id: profile.id,
        amount: topUp,
      })
      if (creditError) console.error(`Credit top-up failed: ${creditError.message}`)
    }
  }
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  const customerId = subscription.customer as string
  const cancellationReason = subscription.cancellation_details?.comment || subscription.cancellation_details?.reason || "User cancelled"

  const { error } = await supabase
    .from("profiles")
    .update({
      plan: "none",
      cancellation_reason: cancellationReason,
      next_billing_date: null,
      updated_at: new Date().toISOString(),
    })
    .eq("stripe_customer_id", customerId)

  if (error) throw new Error(`Deletion sync error: ${error.message}`)
}

async function handleInvoicePaymentSucceeded(invoice: Stripe.Invoice) {
  const customerId = invoice.customer as string
  const subscriptionId = (invoice as any).subscription as string

  if (!subscriptionId) return

  const subscription = await stripe.subscriptions.retrieve(subscriptionId)
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

  const periodEnd = (subscription as any).current_period_end || (subscription as any).currentPeriodEnd
  const nextBillingDate = periodEnd ? new Date(periodEnd * 1000).toISOString() : new Date().toISOString()

  const newPlan = newProductId ? PLAN_NAMES[newProductId] || profile.plan : profile.plan

  const { error: updateError } = await supabase
    .from("profiles")
    .update({
      plan: newPlan,
      next_billing_date: nextBillingDate,
      updated_at: new Date().toISOString(),
    })
    .eq("id", profile.id)

  if (updateError) {
    throw new Error(`Sync error: ${updateError.message}`)
  }

  const creditsToGrant = PLAN_CREDITS[newProductId] || 0

  const { error: creditError } = await supabase.rpc("increment_credits", {
    user_id: profile.id,
    amount: creditsToGrant,
  })

  if (creditError) {
    console.error(`Supabase error (renewal credits): ${creditError.message}`)
  }
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
          event.data.object as Stripe.Subscription,
          (event.data as any).previous_attributes
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
