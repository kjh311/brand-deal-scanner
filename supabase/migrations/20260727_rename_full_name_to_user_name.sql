-- Rename full_name to user_name in profiles table
ALTER TABLE public.profiles RENAME COLUMN full_name TO user_name;

-- Update handle_new_user function to use user_name
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, user_name, avatar_url)
  values (
    new.id, 
    new.email, 
    COALESCE(new.raw_user_meta_data->>'user_name', new.raw_user_meta_data->>'name'),
    new.raw_user_meta_data->>'avatar_url'
  );
  return new;
end;
$$ language plpgsql security definer;