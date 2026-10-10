-- Migration: Postgres Database Trigger for profiles.credits reaching 0

create table if not exists public.trigger_debug (
  id uuid default gen_random_uuid() primary key,
  contract_id uuid,
  triggered_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create or replace function public.on_credits_reached_zero()
returns trigger as $$
declare
  site_url text := 'https://www.branddealfixer.com';
begin
  -- Fire when credits transitions to 0 or is set to 0 from a positive number
  if (NEW.credits = 0 and (OLD.credits > 0 or OLD.credits is null)) then
    insert into public.trigger_debug (contract_id, triggered_at)
    values (null, now());

    -- Call pg_net HTTP POST to trigger the zero credits email route
    perform net.http_post(
      url := site_url || '/api/send-zero-credits',
      headers := jsonb_build_object(
        'Content-Type', 'application/json'
      ),
      body := jsonb_build_object('email', NEW.email)
    );
  end if;
  return NEW;
end;
$$ language plpgsql security definer;

-- Attach trigger to public.profiles table
drop trigger if exists on_profiles_credits_zero on public.profiles;
create trigger on_profiles_credits_zero
  after update of credits on public.profiles
  for each row
  when (NEW.credits = 0 and (OLD.credits > 0 or OLD.credits is null))
  execute procedure public.on_credits_reached_zero();
