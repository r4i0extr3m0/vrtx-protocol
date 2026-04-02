-- IronLog - Exemplo de schema para Supabase/Postgres
-- Este arquivo documenta uma estrutura inicial para sincronização remota.

create extension if not exists pgcrypto;

create table if not exists public.workouts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  workout_date date not null,
  started_at timestamptz not null default now(),
  completed_at timestamptz null,
  notes text null,
  sync_status text not null default 'synced' check (sync_status in ('local', 'pending', 'synced', 'error')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.exercise_entries (
  id uuid primary key default gen_random_uuid(),
  workout_id uuid not null references public.workouts(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  muscle_group text not null,
  notes text null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.exercise_sets (
  id uuid primary key default gen_random_uuid(),
  exercise_entry_id uuid not null references public.exercise_entries(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  reps integer not null check (reps >= 0),
  weight_kg numeric(8,2) not null default 0 check (weight_kg >= 0),
  completed boolean not null default true,
  notes text null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists workouts_user_id_idx on public.workouts(user_id, workout_date desc);
create index if not exists exercise_entries_workout_id_idx on public.exercise_entries(workout_id);
create index if not exists exercise_sets_entry_id_idx on public.exercise_sets(exercise_entry_id);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace trigger workouts_set_updated_at
before update on public.workouts
for each row
execute function public.set_updated_at();

create or replace trigger exercise_entries_set_updated_at
before update on public.exercise_entries
for each row
execute function public.set_updated_at();

create or replace trigger exercise_sets_set_updated_at
before update on public.exercise_sets
for each row
execute function public.set_updated_at();

alter table public.workouts enable row level security;
alter table public.exercise_entries enable row level security;
alter table public.exercise_sets enable row level security;

create policy "users_manage_own_workouts"
on public.workouts
for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "users_manage_own_exercise_entries"
on public.exercise_entries
for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "users_manage_own_exercise_sets"
on public.exercise_sets
for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id);
