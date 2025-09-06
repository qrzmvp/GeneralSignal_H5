-- 创建用户资料表
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade not null primary key,
  username text,
  email text,
  invitation_code text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 设置行级安全 (RLS)
alter table public.profiles enable row level security;

-- 创建策略：用户只能查看和编辑自己的资料
create policy "Users can view own profile" on public.profiles
  for select using (auth.uid() = id);

create policy "Users can update own profile" on public.profiles
  for update using (auth.uid() = id);

-- 创建触发器：当新用户注册时自动创建资料
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, username, email, invitation_code)
  values (
    new.id,
    new.raw_user_meta_data->>'username',
    new.email,
    new.raw_user_meta_data->>'invitation_code'
  );
  return new;
end;
$$;

-- 创建触发器
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- 创建更新时间戳的触发器
create or replace function public.handle_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc'::text, now());
  return new;
end;
$$;

create trigger handle_profiles_updated_at
  before update on public.profiles
  for each row execute procedure public.handle_updated_at();
