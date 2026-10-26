-- Migration: Add increment_credits RPC function
-- This function is called by the Stripe webhook on every invoice.payment_succeeded
-- event to grant subscription credits to the user for their billing period.
--
-- It is intentionally separate from increment_non_expiring_credits:
--   - credits             = subscription credits (reset to 0 on plan change/cancellation)
--   - none_expire_credits = one-time purchase credits (never reset)

CREATE OR REPLACE FUNCTION public.increment_credits(user_id uuid, amount integer DEFAULT 1)
RETURNS void AS $$
BEGIN
  UPDATE public.profiles
  SET credits = COALESCE(credits, 0) + amount
  WHERE id = user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to the service role used by the webhook
GRANT EXECUTE ON FUNCTION public.increment_credits(uuid, integer) TO service_role;
