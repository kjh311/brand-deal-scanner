-- Enable UUID extension if not already enabled
create extension if not exists "uuid-ossp";

-- =============================================
-- PROFILES TABLE
-- =============================================
create table public.profiles (
  id uuid references auth.users(id) on delete cascade not null primary key,
  email text,
  full_name text,
  avatar_url text,
  credit_balance integer default 0 not null,
  subscription_tier text default 'free' not null,
  admin boolean default false not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table public.profiles enable row level security;

-- Policies for profiles
create policy "Users can view their own profile" 
  on public.profiles for select 
  using (auth.uid() = id);

create policy "Users can update their own profile" 
  on public.profiles for update 
  using (auth.uid() = id);

-- Function to handle new user signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, full_name, avatar_url)
  values (
    new.id, 
    new.email, 
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'avatar_url'
  );
  return new;
end;
$$ language plpgsql security definer;

-- Trigger to create profile on signup
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- =============================================
-- AUDITS TABLE (Scan History)
-- =============================================
create table public.audits (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  file_name text not null,
  file_type text,
  risk_score integer,
  risk_level text check (risk_level in ('Low', 'Medium', 'High')),
  findings jsonb,                    -- Store red flags, missing protections, etc.
  counter_offer text,                -- The generated email
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table public.audits enable row level security;

-- Policies for audits
create policy "Users can view their own audits" 
  on public.audits for select 
  using (auth.uid() = user_id);

create policy "Users can insert their own audits" 
  on public.audits for insert 
  with check (auth.uid() = user_id);

create policy "Users can update their own audits" 
  on public.audits for update 
  using (auth.uid() = user_id);

create policy "Users can delete their own audits" 
  on public.audits for delete 
  using (auth.uid() = user_id);

-- Indexes for performance
create index audits_user_id_idx on public.audits(user_id);
create index audits_created_at_idx on public.audits(created_at desc);

-- =============================================
-- CONTRACTS TABLE (File Management)
-- =============================================
create table public.contracts (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  file_path text, -- Nullable for manual text input
  source_type text check (source_type in ('file', 'text_input')) not null,
  extracted_text text,
  status text default 'pending',
  health_score integer,
  summary text,
  legalese_translation jsonb,
  predatory_clauses jsonb,
  cautionary_clauses jsonb,
  missing_protections jsonb,
  suggested_response text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table public.contracts enable row level security;

-- Policies for contracts
create policy "Users can view their own contracts" 
  on public.contracts for select 
  using (auth.uid() = user_id);

create policy "Users can insert their own contracts" 
  on public.contracts for insert 
  with check (auth.uid() = user_id);

create policy "Users can update their own contracts" 
  on public.contracts for update 
  using (auth.uid() = user_id);

create policy "Users can delete their own contracts" 
  on public.contracts for delete 
  using (auth.uid() = user_id);

-- Index for performance
-- =============================================
-- SCAN FEEDBACK TABLE
-- =============================================
create table public.scan_feedback (
  id uuid default uuid_generate_v4() primary key,
  profile_id uuid references public.profiles(id) on delete cascade not null,
  contract_id uuid references public.contracts(id) on delete set null,
  rating integer not null check (rating >= 1 and rating <= 5),
  feedback_text text,
  dismissed boolean default false not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table public.scan_feedback enable row level security;

-- Policies for scan_feedback
create policy "Users can insert their own feedback" 
  on public.scan_feedback for insert 
  with check (auth.uid() = profile_id);

create policy "Admins can view all feedback" 
  on public.scan_feedback for select 
  using (
    exists (
      select 1 from public.profiles 
      where profiles.id = auth.uid() 
      and profiles.admin = true
    )
  );

create policy "Admins can dismiss feedback" 
  on public.scan_feedback for update 
  using (
    exists (
      select 1 from public.profiles 
      where profiles.id = auth.uid() 
      and profiles.admin = true
    )
  );

create index scan_feedback_profile_id_idx on public.scan_feedback(profile_id);
create index scan_feedback_dismissed_idx on public.scan_feedback(dismissed);
create index scan_feedback_created_at_idx on public.scan_feedback(created_at desc);

-- =============================================
-- DIAGNOSTICS & AUTOMATION
-- =============================================

-- Table to track trigger execution for debugging
create table if not exists public.trigger_debug (
  id uuid default uuid_generate_v4() primary key,
  contract_id uuid,
  triggered_at timestamp with time zone default now()
);

-- Main function to handle contract processing via Edge Functions
create or replace function public.handle_new_contract()
returns trigger as $$
declare
  request_id bigint;
begin
  -- 1. Atomic Diagnostic log
  insert into public.trigger_debug (contract_id, triggered_at)
  values (new.id, now());

  -- 2. Call Edge Function via pg_net
  select net.http_post(
    url := 'https://<YOUR_PROJECT_REF>.supabase.co/functions/v1/process-contract',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer <YOUR_SERVICE_ROLE_KEY>'
    ),
    body := jsonb_build_object('record', row_to_json(new))
  ) into request_id;

  return new;
end;
$$ language plpgsql security definer;

-- Re-attach the trigger
drop trigger if exists on_contract_created on public.contracts;
create trigger on_contract_created
  after insert on public.contracts
  for each row execute procedure public.handle_new_contract();
