-- VRTX Coach — Prescricao de treinos (coach -> aluno)
-- Depende de: 20260908_b2b_coach_platform.sql (profiles.role, coach_clients)

-- ------------------------------------------------------------------
-- Tabelas
-- ------------------------------------------------------------------

create table if not exists public.coach_workouts (
  id uuid primary key default gen_random_uuid(),
  coach_id uuid not null references auth.users(id) on delete cascade,
  client_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  notes text null,
  scheduled_for date null,
  status text not null default 'active' check (status in ('active', 'archived')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists coach_workouts_coach_idx on public.coach_workouts (coach_id);
create index if not exists coach_workouts_client_idx on public.coach_workouts (client_id);
create index if not exists coach_workouts_scheduled_idx on public.coach_workouts (client_id, scheduled_for);

create table if not exists public.coach_workout_exercises (
  id uuid primary key default gen_random_uuid(),
  workout_id uuid not null references public.coach_workouts(id) on delete cascade,
  position integer not null default 0,
  name text not null,
  muscle_group text null,
  target_sets integer not null default 3 check (target_sets between 1 and 20),
  target_reps integer not null default 10 check (target_reps between 1 and 100),
  target_weight_kg numeric(8, 2) null,
  notes text null,
  created_at timestamptz not null default now()
);

create index if not exists coach_workout_exercises_workout_idx
  on public.coach_workout_exercises (workout_id, position);

-- ------------------------------------------------------------------
-- RLS: coach gerencia o que prescreveu; aluno le o que recebeu
-- ------------------------------------------------------------------

alter table public.coach_workouts enable row level security;
alter table public.coach_workout_exercises enable row level security;

drop policy if exists "coach_manage_own_workouts" on public.coach_workouts;
create policy "coach_manage_own_workouts"
  on public.coach_workouts
  for all
  using (auth.uid() = coach_id)
  with check (auth.uid() = coach_id);

drop policy if exists "client_view_assigned_workouts" on public.coach_workouts;
create policy "client_view_assigned_workouts"
  on public.coach_workouts
  for select
  using (auth.uid() = client_id and status = 'active');

drop policy if exists "coach_manage_own_workout_exercises" on public.coach_workout_exercises;
create policy "coach_manage_own_workout_exercises"
  on public.coach_workout_exercises
  for all
  using (
    exists (
      select 1 from public.coach_workouts w
      where w.id = coach_workout_exercises.workout_id
        and w.coach_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.coach_workouts w
      where w.id = coach_workout_exercises.workout_id
        and w.coach_id = auth.uid()
    )
  );

drop policy if exists "client_view_assigned_workout_exercises" on public.coach_workout_exercises;
create policy "client_view_assigned_workout_exercises"
  on public.coach_workout_exercises
  for select
  using (
    exists (
      select 1 from public.coach_workouts w
      where w.id = coach_workout_exercises.workout_id
        and w.client_id = auth.uid()
        and w.status = 'active'
    )
  );

-- ------------------------------------------------------------------
-- RPC: atribuir treino (valida vinculo ativo)
-- ------------------------------------------------------------------

create or replace function public.b2b_assign_workout(
  p_client_id uuid,
  p_name text,
  p_exercises jsonb,
  p_scheduled_for date default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_coach uuid := auth.uid();
  v_workout_id uuid;
  v_name text := nullif(trim(coalesce(p_name, '')), '');
  v_count integer;
begin
  if v_coach is null then
    raise exception 'Sessao invalida.';
  end if;

  if v_name is null then
    raise exception 'Informe o nome do treino.';
  end if;

  if not exists (
    select 1 from public.coach_clients
    where coach_id = v_coach
      and client_id = p_client_id
      and status = 'active'
  ) then
    raise exception 'Aluno nao esta vinculado a voce.';
  end if;

  if p_exercises is null or jsonb_typeof(p_exercises) <> 'array' or jsonb_array_length(p_exercises) = 0 then
    raise exception 'Adicione pelo menos um exercicio.';
  end if;

  insert into public.coach_workouts (coach_id, client_id, name, scheduled_for)
  values (v_coach, p_client_id, v_name, p_scheduled_for)
  returning id into v_workout_id;

  insert into public.coach_workout_exercises (
    workout_id, position, name, muscle_group, target_sets, target_reps, target_weight_kg, notes
  )
  select
    v_workout_id,
    coalesce((item.ordinality - 1)::integer, 0),
    nullif(trim(coalesce(item.value ->> 'name', '')), ''),
    nullif(trim(coalesce(item.value ->> 'muscle_group', '')), ''),
    greatest(1, least(20, coalesce((item.value ->> 'sets')::integer, 3))),
    greatest(1, least(100, coalesce((item.value ->> 'reps_target')::integer, 10))),
    nullif(item.value ->> 'weight_kg', '')::numeric,
    nullif(trim(coalesce(item.value ->> 'notes', '')), '')
  from jsonb_array_elements(p_exercises) with ordinality as item(value, ordinality);

  select count(*) into v_count from public.coach_workout_exercises where workout_id = v_workout_id;

  if v_count = 0 then
    raise exception 'Nenhum exercicio valido foi enviado.';
  end if;

  return jsonb_build_object(
    'workout_id', v_workout_id,
    'exercise_count', v_count
  );
end;
$$;

create or replace function public.b2b_archive_workout(p_workout_id uuid)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_coach uuid := auth.uid();
  v_updated integer;
begin
  if v_coach is null then
    raise exception 'Sessao invalida.';
  end if;

  update public.coach_workouts
  set status = 'archived', updated_at = now()
  where id = p_workout_id and coach_id = v_coach;

  get diagnostics v_updated = row_count;
  return v_updated > 0;
end;
$$;

grant execute on function public.b2b_assign_workout(uuid, text, jsonb, date) to authenticated;
grant execute on function public.b2b_archive_workout(uuid) to authenticated;
