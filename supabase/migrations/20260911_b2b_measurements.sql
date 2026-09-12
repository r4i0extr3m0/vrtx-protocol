-- VRTX Coach — Medidas / avaliacao corporal (aluno -> coach)
-- Depende de: 20260908_b2b_coach_platform.sql

-- ------------------------------------------------------------------
-- Tabela
-- ------------------------------------------------------------------

create table if not exists public.coach_measurements (
  id uuid primary key default gen_random_uuid(),
  coach_id uuid not null references auth.users(id) on delete cascade,
  client_id uuid not null references auth.users(id) on delete cascade,
  measured_on date not null default current_date,
  weight_kg numeric(6, 2) null check (weight_kg is null or weight_kg > 0),
  body_fat_pct numeric(5, 2) null check (body_fat_pct is null or (body_fat_pct >= 0 and body_fat_pct <= 100)),
  chest_cm numeric(6, 2) null,
  waist_cm numeric(6, 2) null,
  hip_cm numeric(6, 2) null,
  arm_cm numeric(6, 2) null,
  thigh_cm numeric(6, 2) null,
  calf_cm numeric(6, 2) null,
  notes text null,
  created_at timestamptz not null default now()
);

create index if not exists coach_measurements_coach_idx
  on public.coach_measurements (coach_id, measured_on desc);
create index if not exists coach_measurements_client_idx
  on public.coach_measurements (client_id, measured_on desc);

-- ------------------------------------------------------------------
-- RLS: aluno escreve/le o proprio registro; coach le os dos alunos
-- ------------------------------------------------------------------

alter table public.coach_measurements enable row level security;

drop policy if exists "client_insert_own_measurements" on public.coach_measurements;
create policy "client_insert_own_measurements"
  on public.coach_measurements
  for insert
  with check (auth.uid() = client_id);

drop policy if exists "client_view_own_measurements" on public.coach_measurements;
create policy "client_view_own_measurements"
  on public.coach_measurements
  for select
  using (auth.uid() = client_id);

drop policy if exists "coach_view_client_measurements" on public.coach_measurements;
create policy "coach_view_client_measurements"
  on public.coach_measurements
  for select
  using (auth.uid() = coach_id);

-- ------------------------------------------------------------------
-- RPC: aluno envia medida; coach e derivado do vinculo ativo
-- ------------------------------------------------------------------

create or replace function public.b2b_submit_measurement(
  p_measured_on date,
  p_weight_kg numeric default null,
  p_body_fat_pct numeric default null,
  p_chest_cm numeric default null,
  p_waist_cm numeric default null,
  p_hip_cm numeric default null,
  p_arm_cm numeric default null,
  p_thigh_cm numeric default null,
  p_calf_cm numeric default null,
  p_notes text default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_client uuid := auth.uid();
  v_coach uuid;
  v_id uuid;
begin
  if v_client is null then
    raise exception 'Sessao invalida.';
  end if;

  if coalesce(p_weight_kg, p_body_fat_pct, p_chest_cm, p_waist_cm, p_hip_cm, p_arm_cm, p_thigh_cm, p_calf_cm) is null then
    raise exception 'Informe pelo menos uma medida.';
  end if;

  select coach_id into v_coach
  from public.coach_clients
  where client_id = v_client and status = 'active'
  order by created_at desc
  limit 1;

  if v_coach is null then
    raise exception 'Voce nao esta vinculado a um personal.';
  end if;

  insert into public.coach_measurements (
    coach_id, client_id, measured_on, weight_kg, body_fat_pct,
    chest_cm, waist_cm, hip_cm, arm_cm, thigh_cm, calf_cm, notes
  )
  values (
    v_coach, v_client, coalesce(p_measured_on, current_date),
    p_weight_kg, p_body_fat_pct, p_chest_cm, p_waist_cm, p_hip_cm,
    p_arm_cm, p_thigh_cm, p_calf_cm,
    nullif(trim(coalesce(p_notes, '')), '')
  )
  returning id into v_id;

  return v_id;
end;
$$;

grant execute on function public.b2b_submit_measurement(
  date, numeric, numeric, numeric, numeric, numeric, numeric, numeric, numeric, text
) to authenticated;
