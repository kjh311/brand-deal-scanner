-- =============================================
-- Migration: Create blogs table with RLS
-- =============================================

create table if not exists public.blogs (
  id uuid default gen_random_uuid() primary key,
  title text not null,
  slug text unique not null,
  excerpt text,
  body text not null,
  published boolean default true not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Indexes for performance
create index if not exists blogs_slug_idx on public.blogs (slug);
create index if not exists blogs_created_at_idx on public.blogs (created_at desc);

-- Enable Row Level Security (RLS)
alter table public.blogs enable row level security;

-- Drop existing policies if re-running
drop policy if exists "Public can read published blog posts" on public.blogs;
drop policy if exists "Admins can view all blog posts" on public.blogs;
drop policy if exists "Admins can insert blog posts" on public.blogs;
drop policy if exists "Admins can update blog posts" on public.blogs;
drop policy if exists "Admins can delete blog posts" on public.blogs;

-- Policy 1: Anyone (authenticated or anon) can read published posts
create policy "Public can read published blog posts"
  on public.blogs
  for select
  using (published = true);

-- Policy 2: Admins can view ALL blog posts (including unpublished drafts)
create policy "Admins can view all blog posts"
  on public.blogs
  for select
  to authenticated
  using (
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid() and profiles.admin = true
    )
  );

-- Policy 3: Admins can insert new blog posts
create policy "Admins can insert blog posts"
  on public.blogs
  for insert
  to authenticated
  with check (
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid() and profiles.admin = true
    )
  );

-- Policy 4: Admins can update blog posts
create policy "Admins can update blog posts"
  on public.blogs
  for update
  to authenticated
  using (
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid() and profiles.admin = true
    )
  )
  with check (
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid() and profiles.admin = true
    )
  );

-- Policy 5: Admins can delete blog posts
create policy "Admins can delete blog posts"
  on public.blogs
  for delete
  to authenticated
  using (
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid() and profiles.admin = true
    )
  );

