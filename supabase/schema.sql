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
create index contracts_user_id_idx on public.contracts(user_id);
