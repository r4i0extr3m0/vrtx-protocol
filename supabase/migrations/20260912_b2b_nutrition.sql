-- VRTX Coach — Plano nutricional (coach -> aluno)
-- Depende de: 20260908_b2b_coach_platform.sql (profiles.role, coach_clients)
--
-- O coach define duas metas de macronutrientes: dia de treino e dia de descanso.
-- O app do aluno alterna automaticamente conforme o treino prescrito para o dia.

-- ------------------------------------------------------------------
-- Tabela
-- ------------------------------------------------------------------

create table if not exists public.coach_nutrition_plans (
  id uuid primary key default gen_random_uuid(),
  coach_id uuid not null references auth.users(id) on delete cascade,
  client_id uuid not null references auth.users(id) on delete cascade,
  training_calories integer not null check (training_calories between 500 and 10000),
  training_protein integer not null check (training_protein between 0 and 1000),
  training_carbs integer not null check (training_carbs between 0 and 2000),
  training_fat integer not null check (training_fat between 0 and 500),
  rest_calories integer not null check (rest_calories between 500 and 10000),
  rest_protein integer not null check (rest_protein between 0 and 1000),
  rest_carbs integer not null check (rest_carbs between 0 and 2000),
  rest_fat integer not null check (rest_fat between 0 and 500),
  water_ml integer not null default 2500 check (water_ml between 500 and 10000),
  notes text null,
  status text not null default 'active' check (status in ('active', 'archived')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Apenas um plano ativo por aluno; ao atualizar, o anterior e arquivado.
create unique index if not exists coach_nutrition_active_unique
  on public.coach_nutrition_plans (client_id)
  where status = 'active';

create index if not exists coach_nutrition_coach_idx on public.coach_nutrition_plans (coach_id);
create index if not exists coach_nutrition_client_idx on public.coach_nutrition_plans (client_id);

-- ------------------------------------------------------------------
-- RLS: coach gerencia o que prescreveu; aluno le o plano ativo
-- ------------------------------------------------------------------

alter table public.coach_nutrition_plans enable row level security;

drop policy if exists "coach_manage_own_nutrition" on public.coach_nutrition_plans;
create policy "coach_manage_own_nutrition"
  on public.coach_nutrition_plans
  for all
  using (auth.uid() = coach_id)
  with check (auth.uid() = coach_id);

drop policy if exists "client_view_own_nutrition" on public.coach_nutrition_plans;
create policy "client_view_own_nutrition"
  on public.coach_nutrition_plans
  for select
  using (auth.uid() = client_id and status = 'active');

-- ------------------------------------------------------------------
-- RPC: criar/atualizar plano (valida vinculo ativo e arquiva o anterior)
-- ------------------------------------------------------------------

create or replace function public.b2b_upsert_nutrition_plan(
  p_client_id uuid,
  p_training_calories integer,
  p_training_protein integer,
  p_training_carbs integer,
  p_training_fat integer,
  p_rest_calories integer,
  p_rest_protein integer,
  p_rest_carbs integer,
  p_rest_fat integer,
  p_water_ml integer default 2500,
  p_notes text default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_coach uuid := auth.uid();
  v_id uuid;
begin
  if v_coach is null then
    raise exception 'Sessao invalida.';
  end if;

  if not exists (
    select 1 from public.coach_clients
    where coach_id = v_coach
      and client_id = p_client_id
      and status = 'active'
  ) then
    raise exception 'Aluno nao esta vinculado a voce.';
  end if;

  update public.coach_nutrition_plans
  set status = 'archived', updated_at = now()
  where client_id = p_client_id and status = 'active';

  insert into public.coach_nutrition_plans (
    coach_id, client_id,
    training_calories, training_protein, training_carbs, training_fat,
    rest_calories, rest_protein, rest_carbs, rest_fat,
    water_ml, notes
  )
  values (
    v_coach, p_client_id,
    p_training_calories, p_training_protein, p_training_carbs, p_training_fat,
    p_rest_calories, p_rest_protein, p_rest_carbs, p_rest_fat,
    coalesce(p_water_ml, 2500),
    nullif(trim(coalesce(p_notes, '')), '')
  )
  returning id into v_id;

  return v_id;
end;
$$;

grant execute on function public.b2b_upsert_nutrition_plan(
  uuid, integer, integer, integer, integer, integer, integer, integer, integer, integer, text
) to authenticated;
