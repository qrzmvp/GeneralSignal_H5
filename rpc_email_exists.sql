-- RPC: Check if an email already exists in auth.users (and whether it's confirmed)
-- Run this in Supabase SQL Editor once. It is SECURITY DEFINER and safe: returns only booleans.

create or replace function public.email_exists(email_input text)
returns table (
  email_exists boolean,
  email_confirmed boolean
)
language plpgsql
security definer
set search_path = public, auth
as $$
begin
  return query
  select true  as email_exists,
         (u.email_confirmed_at is not null) as email_confirmed
  from auth.users u
  where lower(u.email) = lower(email_input)
  limit 1;

  if not found then
    return query select false as email_exists, false as email_confirmed;
  end if;
end;
$$;

grant execute on function public.email_exists(text) to anon, authenticated;
