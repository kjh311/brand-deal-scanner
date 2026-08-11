-- Fix: Use COALESCE instead of || for null-safe integer addition in increment_non_expiring_credits
create or replace function public.increment_non_expiring_credits(user_id uuid, amount integer default 1)
returns void as $$
begin
  update public.profiles
  set none_expire_credits = COALESCE(none_expire_credits, 0) + amount
  where id = user_id;
end;
$$ language plpgsql security definer;