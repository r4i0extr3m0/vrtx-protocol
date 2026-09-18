-- VRTX Coach — Plano alimentar por refeicao + aderencia nutricional
-- Depende de: 20260912_b2b_nutrition.sql
--
-- 1) Adiciona as refeicoes (cafe da manha, almoco, lanche, jantar, ...) ao plano,
--    guardadas como JSONB: [{ id, type, title, time, notes, items: [...] }].
-- 2) Registra o check-in nutricional do aluno ("Consumi" / "Ajustei") para o coach
--    acompanhar aderencia, no mesmo padrao de coach_checkins.

-- ------------------------------------------------------------------
-- 1) Refeicoes no plano
-- ------------------------------------------------------------------

alter table public.coach_nutrition_plans
  add column if not exists meals jsonb not null default '[]'::jsonb;

alter table public.coach_nutrition_plans
  drop constraint if exists coach_nutrition_meals_is_array;
alter table public.coach_nutrition_plans
  add constraint coach_nutrition_meals_is_array
  check (jsonb_typeof(meals) = 'array');

-- Substitui o RPC anterior (sem refeicoes) pela versao com p_meals.
drop function if exists public.b2b_upsert_nutrition_plan(
  uuid, integer, integer, integer, integer, integer, integer, integer, integer, integer, text
);

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
  p_notes text default null,
  p_meals jsonb default '[]'::jsonb
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
    water_ml, notes, meals
  )
  values (
    v_coach, p_client_id,
    p_training_calories, p_training_protein, p_training_carbs, p_training_fat,
    p_rest_calories, p_rest_protein, p_rest_carbs, p_rest_fat,
    coalesce(p_water_ml, 2500),
    nullif(trim(coalesce(p_notes, '')), ''),
    coalesce(p_meals, '[]'::jsonb)
  )
  returning id into v_id;

  return v_id;
end;
$$;

grant execute on function public.b2b_upsert_nutrition_plan(
  uuid, integer, integer, integer, integer, integer, integer, integer, integer, integer, text, jsonb
) to authenticated;

-- ------------------------------------------------------------------
-- 2) Check-in nutricional do aluno
-- ------------------------------------------------------------------

create table if not exists public.coach_nutrition_checkins (
  id uuid primary key default gen_random_uuid(),
  coach_id uuid not null references auth.users(id) on delete cascade,
  client_id uuid not null references auth.users(id) on delete cascade,
  meal_id text not null,
  meal_type text not null default 'lunch',
  happened_on date not null default current_date,
  followed boolean not null default true,
  calories integer not null default 0 check (calories >= 0),
  created_at timestamptz not null default now()
);

create index if not exists coach_nutrition_checkins_coach_idx
  on public.coach_nutrition_checkins (coach_id, happened_on desc);
create index if not exists coach_nutrition_checkins_client_idx
  on public.coach_nutrition_checkins (client_id, happened_on desc);
create unique index if not exists coach_nutrition_checkins_unique_idx
  on public.coach_nutrition_checkins (client_id, meal_id, happened_on);

alter table public.coach_nutrition_checkins enable row level security;

drop policy if exists "client_insert_own_nutrition_checkins" on public.coach_nutrition_checkins;
create policy "client_insert_own_nutrition_checkins"
  on public.coach_nutrition_checkins
  for insert
  with check (auth.uid() = client_id);

drop policy if exists "client_view_own_nutrition_checkins" on public.coach_nutrition_checkins;
create policy "client_view_own_nutrition_checkins"
  on public.coach_nutrition_checkins
  for select
  using (auth.uid() = client_id);

drop policy if exists "coach_view_client_nutrition_checkins" on public.coach_nutrition_checkins;
create policy "coach_view_client_nutrition_checkins"
  on public.coach_nutrition_checkins
  for select
  using (auth.uid() = coach_id);

create or replace function public.b2b_record_nutrition_checkin(
  p_meal_id text,
  p_meal_type text,
  p_happened_on date,
  p_calories integer default 0,
  p_followed boolean default true
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_client uuid := auth.uid();
  v_coach uuid;
  v_meal_id text := nullif(trim(coalesce(p_meal_id, '')), '');
begin
  if v_client is null then
    raise exception 'Sessao invalida.';
  end if;

  if v_meal_id is null then
    raise exception 'Refeicao nao informada.';
  end if;

  select coach_id into v_coach
  from public.coach_nutrition_plans
  where client_id = v_client and status = 'active'
  order by updated_at desc
  limit 1;

  if v_coach is null then
    raise exception 'Plano nutricional nao encontrado para este aluno.';
  end if;

  insert into public.coach_nutrition_checkins (
    coach_id, client_id, meal_id, meal_type, happened_on, followed, calories
  )
  values (
    v_coach, v_client, v_meal_id,
    coalesce(nullif(trim(p_meal_type), ''), 'lunch'),
    coalesce(p_happened_on, current_date),
    coalesce(p_followed, true),
    greatest(0, coalesce(p_calories, 0))
  )
  on conflict (client_id, meal_id, happened_on)
  do update set
    meal_type = excluded.meal_type,
    followed = excluded.followed,
    calories = excluded.calories,
    created_at = now();

  return true;
end;
$$;

grant execute on function public.b2b_record_nutrition_checkin(text, text, date, integer, boolean) to authenticated;
