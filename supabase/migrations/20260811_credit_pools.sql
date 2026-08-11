-- Add non-expiring credit pool to profiles table
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS none_expire_credits integer DEFAULT 0 NOT NULL;

-- RPC: increment_non_expiring_credits
-- Adds credits to the user's non-expiring credit pool.
create or replace function public.increment_non_expiring_credits(user_id uuid, amount integer default 1)
returns void as $$
begin
  update public.profiles
  set none_expire_credits = COALESCE(none_expire_credits, 0) + amount
  where id = user_id;
end;
$$ language plpgsql security definer;

-- RPC: deduct_scan_credit
-- Deducts one scan credit from the user's combined pool.
-- Consumption order: subscription credits first, then non-expiring credits.
-- Returns true if the deduction succeeded, false if insufficient credits.
create or replace function public.deduct_scan_credit(user_id uuid)
returns boolean as $$
declare
  remaining integer;
begin
  -- First, try to use subscription credits
  if (select credits from public.profiles where id = user_id) > 0 then
    update public.profiles
    set credits = credits - 1
    where id = user_id;
    return true;
  end if;

  -- Fall back to non-expiring credits
  if (select none_expire_credits from public.profiles where id = user_id) > 0 then
    update public.profiles
    set none_expire_credits = none_expire_credits - 1
    where id = user_id;
    return true;
  end if;

  -- Insufficient credits
  return false;
end;
$$ language plpgsql security definer;