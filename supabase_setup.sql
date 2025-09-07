-- =============================================
-- Supabase Setup (Profiles + Membership Levels)
-- 幂等脚本：可重复执行
-- =============================================

-- 1) 枚举：会员等级（若已存在则忽略）
do $$ begin
  create type public.membership_level as enum ('free','basic','pro','vip');
exception when duplicate_object then
  null;
end $$;

-- 2) 用户资料表（若不存在则创建）
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade not null primary key,
  username text,
  email text not null,
  avatar_url text,
  website text,
  invitation_code text,
  membership_level public.membership_level not null default 'free',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2.1) 兼容：缺失列补齐 & 安全收紧 email 约束
do $$
begin
  -- avatar_url
  if not exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'profiles' and column_name = 'avatar_url'
  ) then
    alter table public.profiles add column avatar_url text;
  end if;

  -- website
  if not exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'profiles' and column_name = 'website'
  ) then
    alter table public.profiles add column website text;
  end if;

  -- email NOT NULL（仅当当前无 NULL 值时设置）
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'profiles' and column_name = 'email' and is_nullable = 'YES'
  ) then
    if not exists (select 1 from public.profiles where email is null) then
      alter table public.profiles alter column email set not null;
    end if;
  end if;

  -- email 唯一约束（仅当不存在且无重复时添加）
  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.profiles'::regclass and conname = 'profiles_email_unique'
  ) then
    if not exists (
      select email from public.profiles group by email having count(*) > 1
    ) then
      alter table public.profiles add constraint profiles_email_unique unique (email);
    end if;
  end if;
end $$;

-- 3) 启用 RLS
alter table public.profiles enable row level security;

-- 4) RLS 策略（重建以保证幂等）
drop policy if exists "Users can view own profile" on public.profiles;
create policy "Users can view own profile" on public.profiles
  for select using (auth.uid() = id);

drop policy if exists "Users can update own profile" on public.profiles;
create policy "Users can update own profile" on public.profiles
  for update using (auth.uid() = id);

-- 5) 邀请码生成函数：生成唯一的 8 位数字码（幂等）
create or replace function public.generate_invitation_code()
returns text
language plpgsql
as $$
declare
  code text;
begin
  loop
    -- 0..99999999，并左侧补零到 8 位
    code := lpad(floor(random() * 100000000)::int::text, 8, '0');
    exit when not exists (
      select 1 from public.profiles where invitation_code = code
    );
  end loop;
  return code;
end;
$$;

-- 5.1) 触发器函数：注册时自动创建资料（用户名缺省用邮箱前缀；邀请码默认 8 位数字）
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, email, username, invitation_code)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'username', split_part(new.email, '@', 1)),
    coalesce(nullif(new.raw_user_meta_data->>'invitation_code', ''), public.generate_invitation_code())
  );
  return new;
end;
$$;

-- 6) 触发器：auth.users 新用户创建后，同步创建资料（幂等）
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- 7) 更新时间戳函数与触发器（幂等）
create or replace function public.handle_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc'::text, now());
  return new;
end;
$$;

drop trigger if exists handle_profiles_updated_at on public.profiles;
create trigger handle_profiles_updated_at
  before update on public.profiles
  for each row execute procedure public.handle_updated_at();

-- 8) 邀请码唯一约束（仅当无重复时添加，幂等）
do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.profiles'::regclass and conname = 'profiles_invitation_code_unique'
  ) then
    if not exists (
      select invitation_code from public.profiles
      where invitation_code is not null and invitation_code <> ''
      group by invitation_code having count(*) > 1
    ) then
      alter table public.profiles add constraint profiles_invitation_code_unique unique (invitation_code);
    end if;
  end if;
end $$;
