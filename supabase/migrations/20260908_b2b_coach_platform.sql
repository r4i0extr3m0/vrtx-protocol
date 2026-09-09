-- B2B VRTX Coach: roles, planos de treinador e vinculo personal-aluno
-- 2026-09-08
-- Safe migration: apenas adiciona colunas/tabelas se nao existirem.

-- ============================================================
-- 1) profiles: role + cref (registro profissional do personal)
-- ============================================================
alter table public.profiles
  add column if not exists role text not null default 'client';

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'profiles_role_check') then
    alter table public.profiles
      add constraint profiles_role_check check (role in ('client', 'coach'));
  end if;
end $$;

alter table public.profiles
  add column if not exists cref text null;

-- ============================================================
-- 2) plano do treinador (define o limite de alunos)
--    coach_plan: 'free' (2), 'basic' (5), 'plus' (10), 'premier' (20)
--    clientes avulsos/alunos mantem coach_plan = null
-- ============================================================
alter table public.profiles
  add column if not exists coach_plan text null;

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'profiles_coach_plan_check') then
    alter table public.profiles
      add constraint profiles_coach_plan_check check (
        coach_plan is null or coach_plan in ('free', 'basic', 'plus', 'premier')
      );
  end if;
end $$;

-- Limite de alunos por plano (fonte unica de verdade no banco)
create or replace function public.b2b_coach_plan_cap(plan text)
returns integer
language sql
immutable
as $$
  select case coalesce(plan, 'free')
    when 'premier' then 20
    when 'plus'    then 10
    when 'basic'   then 5
    else 2
  end;
$$;

-- ============================================================
-- 3) coach_clients: vinculo personal <-> aluno (isolamento por RLS)
--    Fluxo: coach cria convite (status pending, sem client_id) ->
--    aluno entra com o codigo -> RPC b2b_claim_invite vincula a conta.
-- ============================================================
create table if not exists public.coach_clients (
  id uuid primary key default gen_random_uuid(),
  coach_id uuid not null references auth.users(id) on delete cascade,
  client_id uuid null references auth.users(id) on delete cascade,
  invite_code text not null unique,
  status text not null default 'pending'
    check (status in ('pending', 'active', 'removed')),
  invited_at timestamptz not null default now(),
  accepted_at timestamptz null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists coach_clients_coach_id_idx
  on public.coach_clients (coach_id, status);
create index if not exists coach_clients_client_id_idx
  on public.coach_clients (client_id, status);
create index if not exists coach_clients_invite_code_idx
  on public.coach_clients (invite_code);

alter table public.coach_clients enable row level security;

-- Coach gerencia os proprios vinculos (criar convite, remover, listar)
drop policy if exists "coach_manage_own_clients" on public.coach_clients;
create policy "coach_manage_own_clients"
  on public.coach_clients
  for all
  using (coach_id = auth.uid())
  with check (coach_id = auth.uid());

-- Aluno ve apenas o proprio vinculo (nunca os de outros alunos)
drop policy if exists "client_view_own_link" on public.coach_clients;
create policy "client_view_own_link"
  on public.coach_clients
  for select
  using (client_id = auth.uid());

-- Coach precisa ver o perfil (nome/foto) dos alunos vinculados
drop policy if exists "coach_view_client_profiles" on public.profiles;
create policy "coach_view_client_profiles"
  on public.profiles
  for select
  using (
    auth.uid() in (
      select cc.coach_id from public.coach_clients cc
      where cc.client_id = profiles.id
        and cc.status = 'active'
    )
  );

-- Aluno precisa ver o perfil do seu personal
drop policy if exists "client_view_coach_profile" on public.profiles;
create policy "client_view_coach_profile"
  on public.profiles
  for select
  using (
    auth.uid() in (
      select cc.client_id from public.coach_clients cc
      where cc.coach_id = profiles.id
        and cc.status = 'active'
    )
  );

-- ============================================================
-- 4) RPCs de convite (SECURITY DEFINER: regras de negocio no banco)
-- ============================================================
-- Gera um codigo de convite para um novo aluno.
-- Respeita o limite de alunos do plano (pending + active < cap).
create or replace function public.b2b_create_invite()
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_role text;
  v_plan text;
  v_cap integer;
  v_count integer;
  v_code text;
begin
  select role, coach_plan into v_role, v_plan
  from public.profiles where id = auth.uid();

  if v_role <> 'coach' then
    raise exception 'somente um personal pode gerar convites';
  end if;

  v_cap := public.b2b_coach_plan_cap(v_plan);

  select count(*) into v_count
  from public.coach_clients
  where coach_id = auth.uid()
    and status in ('pending', 'active');

  if v_count >= v_cap then
    raise exception 'limite de alunos do plano atingido';
  end if;

  v_code := 'VRTX-' || upper(substr(md5(random()::text), 1, 6));

  insert into public.coach_clients (coach_id, invite_code, status)
  values (auth.uid(), v_code, 'pending');

  return v_code;
end;
$$;

-- Aluno entra com o codigo e vincula a conta do personal.
-- Regras: codigo valido e pendente; aluno ainda nao vinculado a outro
-- personal; coach ainda tem vaga no plano.
create or replace function public.b2b_claim_invite(p_code text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_row public.coach_clients%rowtype;
  v_coach_plan text;
  v_cap integer;
  v_active_count integer;
  v_already integer;
begin
  select * into v_row
  from public.coach_clients
  where invite_code = upper(trim(p_code))
    and status = 'pending'
  limit 1;

  if not found then
    raise exception 'codigo de convite invalido ou ja utilizado';
  end if;

  select count(*) into v_already
  from public.coach_clients
  where client_id = auth.uid()
    and status = 'active';

  if v_already > 0 then
    raise exception 'voce ja esta vinculado a um personal';
  end if;

  select coach_plan into v_coach_plan
  from public.profiles where id = v_row.coach_id;

  v_cap := public.b2b_coach_plan_cap(v_coach_plan);

  select count(*) into v_active_count
  from public.coach_clients
  where coach_id = v_row.coach_id
    and status = 'active';

  if v_active_count >= v_cap then
    raise exception 'personal atingiu o limite de alunos do plano';
  end if;

  update public.coach_clients
  set client_id = auth.uid(),
      status = 'active',
      accepted_at = now(),
      updated_at = now()
  where id = v_row.id;

  return jsonb_build_object(
    'coach_id', v_row.coach_id,
    'coach_name', (select name from public.profiles where id = v_row.coach_id)
  );
end;
$$;

-- Revoga o acesso de um aluno (coach remove; vaga volta ao plano)
create or replace function public.b2b_remove_client(p_client_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.coach_clients
  set status = 'removed', updated_at = now()
  where coach_id = auth.uid()
    and client_id = p_client_id
    and status = 'active';
end;
$$;

revoke all on function public.b2b_create_invite() from public;
revoke all on function public.b2b_claim_invite(text) from public;
revoke all on function public.b2b_remove_client(uuid) from public;
grant execute on function public.b2b_create_invite() to authenticated;
grant execute on function public.b2b_claim_invite(text) to authenticated;
grant execute on function public.b2b_remove_client(uuid) to authenticated;
