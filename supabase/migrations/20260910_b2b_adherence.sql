-- VRTX Coach — Aderencia (feito x programado)
-- Depende de: 20260908_b2b_coach_platform.sql e 20260909_b2b_prescriptions.sql

-- ------------------------------------------------------------------
-- Tabela: registro de sessao concluida pelo aluno
-- ------------------------------------------------------------------

create table if not exists public.coach_checkins (
  id uuid primary key default gen_random_uuid(),
  coach_id uuid not null references auth.users(id) on delete cascade,
  client_id uuid not null references auth.users(id) on delete cascade,
  prescription_id uuid null references public.coach_workouts(id) on delete set null,
  workout_name text not null,
  happened_on date not null default current_date,
  exercise_count integer not null default 0 check (exercise_count >= 0),
  set_count integer not null default 0 check (set_count >= 0),
  total_volume numeric(12, 2) not null default 0 check (total_volume >= 0),
  notes text null,
  created_at timestamptz not null default now()
);

create index if not exists coach_checkins_coach_idx on public.coach_checkins (coach_id, happened_on desc);
create index if not exists coach_checkins_client_idx on public.coach_checkins (client_id, happened_on desc);
create unique index if not exists coach_checkins_unique_session_idx
  on public.coach_checkins (client_id, prescription_id, happened_on)
  where prescription_id is not null;

-- ------------------------------------------------------------------
-- RLS: aluno escreve/le o proprio registro; coach le os dos alunos
-- ------------------------------------------------------------------

alter table public.coach_checkins enable row level security;

drop policy if exists "client_insert_own_checkins" on public.coach_checkins;
create policy "client_insert_own_checkins"
  on public.coach_checkins
  for insert
  with check (auth.uid() = client_id);

drop policy if exists "client_view_own_checkins" on public.coach_checkins;
create policy "client_view_own_checkins"
  on public.coach_checkins
  for select
  using (auth.uid() = client_id);

drop policy if exists "coach_view_client_checkins" on public.coach_checkins;
create policy "coach_view_client_checkins"
  on public.coach_checkins
  for select
  using (auth.uid() = coach_id);

-- ------------------------------------------------------------------
-- RPC: registrar check-in derivando coach/cliente do treino prescrito
-- ------------------------------------------------------------------

create or replace function public.b2b_record_checkin(
  p_prescription_id uuid,
  p_workout_name text,
  p_happened_on date,
  p_exercise_count integer default 0,
  p_set_count integer default 0,
  p_total_volume numeric default 0,
  p_notes text default null
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_client uuid := auth.uid();
  v_coach uuid;
  v_name text := nullif(trim(coalesce(p_workout_name, '')), '');
begin
  if v_client is null then
    raise exception 'Sessao invalida.';
  end if;

  if p_prescription_id is null then
    raise exception 'Treino prescrito nao informado.';
  end if;

  if v_name is null then
    raise exception 'Nome do treino nao informado.';
  end if;

  select coach_id into v_coach
  from public.coach_workouts
  where id = p_prescription_id and client_id = v_client;

  if v_coach is null then
    raise exception 'Treino prescrito nao encontrado para este aluno.';
  end if;

  insert into public.coach_checkins (
    coach_id, client_id, prescription_id, workout_name, happened_on,
    exercise_count, set_count, total_volume, notes
  )
  values (
    v_coach, v_client, p_prescription_id, v_name, coalesce(p_happened_on, current_date),
    greatest(0, coalesce(p_exercise_count, 0)),
    greatest(0, coalesce(p_set_count, 0)),
    greatest(0, coalesce(p_total_volume, 0)),
    nullif(trim(coalesce(p_notes, '')), '')
  )
  on conflict (client_id, prescription_id, happened_on)
  where prescription_id is not null
  do update set
    workout_name = excluded.workout_name,
    exercise_count = excluded.exercise_count,
    set_count = excluded.set_count,
    total_volume = excluded.total_volume,
    notes = excluded.notes,
    created_at = now();

  return true;
end;
$$;

grant execute on function public.b2b_record_checkin(uuid, text, date, integer, integer, numeric, text) to authenticated;
