-- VRTX Coach: assinatura Stripe do coach e enforcement comercial.

create table if not exists public.coach_subscriptions (
  id uuid primary key default gen_random_uuid(),
  coach_id uuid not null unique references auth.users(id) on delete cascade,
  stripe_customer_id text unique,
  stripe_subscription_id text unique,
  stripe_price_id text,
  plan text not null default 'free'
    check (plan in ('free', 'basic', 'plus', 'premier')),
  status text not null default 'free'
    check (status in ('free', 'trialing', 'active', 'past_due', 'canceled', 'incomplete', 'expired')),
  current_period_end timestamptz,
  cancel_at_period_end boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists coach_subscriptions_status_idx
  on public.coach_subscriptions (status, current_period_end);

create table if not exists public.billing_events (
  id uuid primary key default gen_random_uuid(),
  provider text not null default 'stripe',
  provider_event_id text not null unique,
  event_type text not null,
  payload jsonb not null,
  processed_at timestamptz not null default now()
);

alter table public.coach_subscriptions enable row level security;
alter table public.billing_events enable row level security;

drop policy if exists "coach_view_own_subscription" on public.coach_subscriptions;
create policy "coach_view_own_subscription"
  on public.coach_subscriptions for select
  using (auth.uid() = coach_id);

revoke all on public.billing_events from anon, authenticated;

-- New coaches start on the free tier. Paid access is granted only by Stripe webhook.
update public.profiles
set coach_plan = 'free'
where role = 'coach' and (coach_plan is null or coach_plan = 'basic');

-- Keep the profile plan synchronized with the subscription state.
create or replace function public.b2b_sync_coach_subscription(
  p_coach_id uuid,
  p_stripe_customer_id text,
  p_stripe_subscription_id text,
  p_stripe_price_id text,
  p_plan text,
  p_status text,
  p_current_period_end timestamptz default null,
  p_cancel_at_period_end boolean default false
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if p_plan not in ('free', 'basic', 'plus', 'premier') then
    raise exception 'Plano Stripe invalido.';
  end if;

  if p_status not in ('free', 'trialing', 'active', 'past_due', 'canceled', 'incomplete', 'expired') then
    raise exception 'Status Stripe invalido.';
  end if;

  insert into public.coach_subscriptions (
    coach_id, stripe_customer_id, stripe_subscription_id, stripe_price_id,
    plan, status, current_period_end, cancel_at_period_end, updated_at
  ) values (
    p_coach_id, p_stripe_customer_id, p_stripe_subscription_id, p_stripe_price_id,
    p_plan, p_status, p_current_period_end, p_cancel_at_period_end, now()
  )
  on conflict (coach_id) do update set
    stripe_customer_id = excluded.stripe_customer_id,
    stripe_subscription_id = excluded.stripe_subscription_id,
    stripe_price_id = excluded.stripe_price_id,
    plan = excluded.plan,
    status = excluded.status,
    current_period_end = excluded.current_period_end,
    cancel_at_period_end = excluded.cancel_at_period_end,
    updated_at = now();

  update public.profiles
  set coach_plan = case
    when p_status in ('active', 'trialing') then p_plan
    else 'free'
  end,
  updated_at = now()
  where id = p_coach_id and role = 'coach';
end;
$$;

revoke all on function public.b2b_sync_coach_subscription(uuid, text, text, text, text, text, timestamptz, boolean) from public, anon, authenticated;

-- Paid/trial coaches can invite up to their plan cap. Free coaches retain the 2-client funnel.
create or replace function public.b2b_create_invite()
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_role text;
  v_plan text;
  v_status text;
  v_cap integer;
  v_count integer;
  v_code text;
begin
  select p.role, p.coach_plan, coalesce(s.status, 'free')
    into v_role, v_plan, v_status
  from public.profiles p
  left join public.coach_subscriptions s on s.coach_id = p.id
  where p.id = auth.uid();

  if v_role <> 'coach' then
    raise exception 'somente um personal pode gerar convites';
  end if;

  if v_status not in ('free', 'active', 'trialing') then
    raise exception 'assinatura do personal nao esta ativa';
  end if;

  v_cap := public.b2b_coach_plan_cap(v_plan);
  select count(*) into v_count
  from public.coach_clients
  where coach_id = auth.uid() and status in ('pending', 'active');

  if v_count >= v_cap then
    raise exception 'limite de alunos do plano atingido';
  end if;

  v_code := 'VRTX-' || upper(substr(md5(random()::text), 1, 6));
  insert into public.coach_clients (coach_id, invite_code, status)
  values (auth.uid(), v_code, 'pending');
  return v_code;
end;
$$;

revoke all on function public.b2b_create_invite() from public;
grant execute on function public.b2b_create_invite() to authenticated;