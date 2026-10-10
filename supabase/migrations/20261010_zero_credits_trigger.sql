-- Migration: Postgres Database Trigger for profiles.credits reaching 0 with atomic deduplication

-- Log table to record when zero credits emails were dispatched
create table if not exists public.zero_credits_log (
  email text primary key,
  sent_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create or replace function public.on_credits_reached_zero()
returns trigger as $$
declare
  site_url text := 'https://www.branddealfixer.com';
  recently_sent boolean;
begin
  -- Only fire when the 'credits' column transitions to 0
  if (NEW.credits = 0 and (OLD.credits > 0 or OLD.credits is null)) then
    
    -- Atomically check if an email was already dispatched for this email in the last 2 minutes
    select exists (
      select 1 from public.zero_credits_log
      where email = NEW.email
      and sent_at > now() - interval '2 minutes'
    ) into recently_sent;

    -- If already sent recently, suppress duplicate immediately
    if recently_sent then
      return NEW;
    end if;

    -- Record timestamp in zero_credits_log
    insert into public.zero_credits_log (email, sent_at)
    values (NEW.email, now())
    on conflict (email) do update set sent_at = now();

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
