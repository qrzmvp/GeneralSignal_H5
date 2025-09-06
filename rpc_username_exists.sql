-- RPC: Check if a username already exists in public.profiles
-- Run once in Supabase SQL Editor.

create or replace function public.username_exists(username_input text)
returns table (
  username_taken boolean
)
language plpgsql
security definer
set search_path = public, auth
as $$
begin
  return query
  select true as username_taken
  from public.profiles p
  where lower(p.username) = lower(username_input)
  limit 1;

  if not found then
    return query select false as username_taken;
  end if;
end;
$$;

grant execute on function public.username_exists(text) to anon, authenticated;
