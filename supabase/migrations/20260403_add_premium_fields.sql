-- CoreIronTrack - Premium fields for monetization (RevenueCat)
-- Safe migration: only adds columns if missing.

alter table if exists public.profiles
  add column if not exists is_premium boolean not null default false;

alter table if exists public.profiles
  add column if not exists premium_until timestamptz null;

alter table if exists public.profiles
  add column if not exists premium_source text null;

alter table if exists public.profiles
  add column if not exists revenuecat_app_user_id text null;

create index if not exists profiles_is_premium_idx on public.profiles (is_premium);
create index if not exists profiles_premium_until_idx on public.profiles (premium_until);

