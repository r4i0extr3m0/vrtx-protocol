import "react-native-url-polyfill/auto";

import { createClient, type Session, type SupabaseClient, type User } from "@supabase/supabase-js";

import { env, hasSupabaseEnv } from "@/src/constants/env";
import { storage } from "@/src/infra/mmkv";
import type {
  BodyMeasurement,
  BodyMeasurementInput,
  CheckinInput,
  ClaimInviteResult,
  CoachCheckin,
  CoachClientLink,
  CoachClientListItem,
  CoachPrescription,
  PrescriptionExercise,
  PrescriptionExerciseInput,
} from "@/src/types";

const AUTH_TOKEN_KEY = "vrtxprotocol.supabase.auth.token";

const storageAdapter = {
  getItem: (key: string): string | null => storage.getString(key) ?? null,
  setItem: (key: string, value: string): void => {
    storage.set(key, value);
  },
  removeItem: (key: string): void => {
    storage.remove(key);
  },
};

let cachedClient: SupabaseClient | null = null;

function createFallbackClient(): SupabaseClient {
  return createClient("https://placeholder.supabase.co", "placeholder-anon-key", {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
    global: {
      headers: {
        "x-vrtxprotocol-mode": "offline-fallback",
      },
    },
  });
}

export function getSupabaseClient(): SupabaseClient {
  if (cachedClient) {
    return cachedClient;
  }

  cachedClient = hasSupabaseEnv()
    ? createClient(env.supabaseUrl, env.supabaseAnonKey, {
        auth: {
          storage: storageAdapter,
          storageKey: AUTH_TOKEN_KEY,
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: false,
        },
      })
    : createFallbackClient();

  return cachedClient;
}

export async function getCurrentSession(): Promise<Session | null> {
  if (!hasSupabaseEnv()) {
    return null;
  }

  const client = getSupabaseClient();
  const result = await client.auth.getSession();
  return result.data.session ?? null;
}

export async function getCurrentUser(): Promise<User | null> {
  if (!hasSupabaseEnv()) {
    return null;
  }

  const client = getSupabaseClient();
  const result = await client.auth.getUser();
  return result.data.user ?? null;
}

export function getSupabaseFunctionUrl(functionName: string): string | null {
  if (!hasSupabaseEnv()) {
    return null;
  }

  const baseUrl = env.supabaseUrl.replace(/\/+$/, "");
  const sanitizedName = functionName.replace(/^\/+/, "");
  return `${baseUrl}/functions/v1/${sanitizedName}`;
}

export function getSupabaseAnonKey(): string {
  return env.supabaseAnonKey;
}

export function clearPersistedAuthSession(): void {
  storage.remove(AUTH_TOKEN_KEY);
  cachedClient = null;
}

export function getPersistedAccessToken(): string | null {
  const raw = storage.getString(AUTH_TOKEN_KEY);
  if (!raw) {
    return null;
  }

  try {
    const parsed = JSON.parse(raw) as {
      access_token?: string;
      currentSession?: { access_token?: string };
    };

    if (typeof parsed.access_token === "string") {
      return parsed.access_token;
    }

    if (typeof parsed.currentSession?.access_token === "string") {
      return parsed.currentSession.access_token;
    }
  } catch (error) {
    console.warn("[supabase] Não foi possível ler o token persistido.", error);
  }

  return null;
}

// ------------------------------------------------------------------
// VRTX Coach: vínculo personal <-> aluno
// ------------------------------------------------------------------

export async function listCoachClients(): Promise<{ data?: CoachClientListItem[]; error?: string }> {
  if (!hasSupabaseEnv()) {
    return { error: "Supabase não configurado." };
  }

  try {
    const client = getSupabaseClient();
    const { data, error } = await client
      .from("coach_clients")
      .select("id, client_id, invite_code, status, accepted_at, created_at")
      .in("status", ["active", "pending"])
      .order("created_at", { ascending: false });

    if (error) {
      return { error: error.message };
    }

    const rows = (data ?? []) as {
      id: string;
      client_id?: string | null;
      invite_code: string;
      status: CoachClientLink["status"];
      accepted_at?: string | null;
      created_at: string;
    }[];
    const clientIds = rows
      .map((row) => row.client_id)
      .filter((id): id is string => typeof id === "string" && id.length > 0);

    let profiles: { id: string; name?: string | null; email?: string | null }[] = [];
    if (clientIds.length > 0) {
      const profileQuery = await client
        .from("profiles")
        .select("id, name, email")
        .in("id", clientIds);
      if (!profileQuery.error) {
        profiles = profileQuery.data ?? [];
      }
    }

    const profileById = new Map(profiles.map((profile) => [profile.id, profile]));
    const items: CoachClientListItem[] = rows.map((row) => {
      const linkedProfile = row.client_id ? profileById.get(row.client_id) : undefined;
      return {
        linkId: row.id,
        clientId: row.client_id ?? null,
        name: linkedProfile?.name ?? "",
        email: linkedProfile?.email ?? "",
        status: row.status,
        inviteCode: row.invite_code,
        acceptedAt: row.accepted_at ?? null,
      };
    });

    return { data: items };
  } catch (error) {
    return { error: error instanceof Error ? error.message : String(error) };
  }
}

export async function createCoachInvite(): Promise<{ code?: string; error?: string }> {
  if (!hasSupabaseEnv()) {
    return { error: "Supabase não configurado." };
  }

  try {
    const client = getSupabaseClient();
    const { data, error } = await client.rpc("b2b_create_invite");
    if (error) {
      return { error: error.message };
    }
    return { code: typeof data === "string" ? data : undefined };
  } catch (error) {
    return { error: error instanceof Error ? error.message : String(error) };
  }
}

export async function claimCoachInvite(code: string): Promise<{ data?: ClaimInviteResult; error?: string }> {
  if (!hasSupabaseEnv()) {
    return { error: "Supabase não configurado." };
  }

  try {
    const client = getSupabaseClient();
    const normalized = code.trim().toUpperCase();
    if (!normalized) {
      return { error: "Informe o código do seu personal." };
    }

    const { data, error } = await client.rpc("b2b_claim_invite", { p_code: normalized });
    if (error) {
      return { error: error.message };
    }

    const raw = data as { coach_id?: string; coach_name?: string } | null;
    if (!raw?.coach_id) {
      return { error: "Não foi possível concluir o vínculo. Tente novamente." };
    }

    return {
      data: {
        coachId: raw.coach_id,
        coachName: raw.coach_name,
      },
    };
  } catch (error) {
    return { error: error instanceof Error ? error.message : String(error) };
  }
}

export async function removeCoachClient(clientId: string): Promise<{ success?: boolean; error?: string }> {
  if (!hasSupabaseEnv()) {
    return { error: "Supabase não configurado." };
  }

  try {
    const client = getSupabaseClient();
    const { error } = await client.rpc("b2b_remove_client", { p_client_id: clientId });
    if (error) {
      return { error: error.message };
    }
    return { success: true };
  } catch (error) {
    return { error: error instanceof Error ? error.message : String(error) };
  }
}

export async function fetchMyCoach(): Promise<{ coachId?: string; coachName?: string; error?: string }> {
  if (!hasSupabaseEnv()) {
    return { error: "Supabase não configurado." };
  }

  try {
    const client = getSupabaseClient();
    const { data, error } = await client
      .from("coach_clients")
      .select("id, coach_id, status")
      .eq("status", "active")
      .maybeSingle();

    if (error) {
      return { error: error.message };
    }

    if (!data?.coach_id) {
      return { coachId: undefined, coachName: undefined };
    }

    const profileQuery = await client
      .from("profiles")
      .select("name")
      .eq("id", data.coach_id as string)
      .maybeSingle();

    return {
      coachId: data.coach_id as string,
      coachName: profileQuery.error ? undefined : (profileQuery.data?.name as string | undefined),
    };
  } catch (error) {
    return { error: error instanceof Error ? error.message : String(error) };
  }
}

// ------------------------------------------------------------------
// VRTX Coach: prescricao de treinos
// ------------------------------------------------------------------

interface PrescriptionRow {
  id: string;
  coach_id: string;
  client_id: string;
  name: string;
  notes?: string | null;
  scheduled_for?: string | null;
  status: CoachPrescription["status"];
  created_at: string;
}

interface PrescriptionExerciseRow {
  id: string;
  workout_id: string;
  name: string;
  muscle_group?: string | null;
  target_sets?: number | null;
  target_reps?: number | null;
  target_weight_kg?: number | string | null;
  notes?: string | null;
  position?: number | null;
}

function mapPrescriptionExercises(rows: PrescriptionExerciseRow[]): Map<string, PrescriptionExercise[]> {
  const byWorkout = new Map<string, PrescriptionExercise[]>();

  for (const row of rows) {
    const list = byWorkout.get(row.workout_id) ?? [];
    list.push({
      id: row.id,
      name: row.name,
      muscleGroup: row.muscle_group ?? null,
      targetSets: row.target_sets ?? 3,
      targetReps: row.target_reps ?? 10,
      targetWeightKg: row.target_weight_kg === null || row.target_weight_kg === undefined
        ? null
        : Number(row.target_weight_kg),
      notes: row.notes ?? null,
    });
    byWorkout.set(row.workout_id, list);
  }

  return byWorkout;
}

async function fetchPrescriptions(clientId?: string): Promise<{ data?: CoachPrescription[]; error?: string }> {
  if (!hasSupabaseEnv()) {
    return { error: "Supabase não configurado." };
  }

  try {
    const client = getSupabaseClient();
    const baseQuery = client
      .from("coach_workouts")
      .select("id, coach_id, client_id, name, notes, scheduled_for, status, created_at")
      .eq("status", "active");

    const filteredQuery = clientId ? baseQuery.eq("client_id", clientId) : baseQuery;
    const { data, error } = await filteredQuery.order("created_at", { ascending: false });
    if (error) {
      return { error: error.message };
    }

    const rows = (data ?? []) as PrescriptionRow[];
    if (rows.length === 0) {
      return { data: [] };
    }

    const exerciseQuery = await client
      .from("coach_workout_exercises")
      .select("id, workout_id, name, muscle_group, target_sets, target_reps, target_weight_kg, notes, position")
      .in("workout_id", rows.map((row) => row.id))
      .order("position", { ascending: true });

    if (exerciseQuery.error) {
      return { error: exerciseQuery.error.message };
    }

    const exercisesByWorkout = mapPrescriptionExercises(
      (exerciseQuery.data ?? []) as PrescriptionExerciseRow[],
    );

    const items: CoachPrescription[] = rows.map((row) => ({
      id: row.id,
      coachId: row.coach_id,
      clientId: row.client_id,
      name: row.name,
      notes: row.notes ?? null,
      scheduledFor: row.scheduled_for ?? null,
      status: row.status,
      createdAt: row.created_at,
      exercises: exercisesByWorkout.get(row.id) ?? [],
    }));

    return { data: items };
  } catch (error) {
    return { error: error instanceof Error ? error.message : String(error) };
  }
}

export async function listCoachClientPrescriptions(
  clientId: string,
): Promise<{ data?: CoachPrescription[]; error?: string }> {
  return fetchPrescriptions(clientId);
}

export async function listMyPrescriptions(): Promise<{ data?: CoachPrescription[]; error?: string }> {
  return fetchPrescriptions();
}

export async function createCoachPrescription(input: {
  clientId: string;
  name: string;
  notes?: string | null;
  scheduledFor?: string | null;
  exercises: PrescriptionExerciseInput[];
}): Promise<{ data?: { workoutId: string; exerciseCount: number }; error?: string }> {
  if (!hasSupabaseEnv()) {
    return { error: "Supabase não configurado." };
  }

  try {
    const client = getSupabaseClient();
    const payload = input.exercises.map((exercise) => ({
      name: exercise.name,
      muscle_group: exercise.muscleGroup ?? null,
      sets: exercise.sets,
      reps_target: exercise.repsTarget,
      weight_kg: exercise.weightKg ?? null,
      notes: exercise.notes ?? null,
    }));

    const { data, error } = await client.rpc("b2b_assign_workout", {
      p_client_id: input.clientId,
      p_name: input.name,
      p_exercises: payload,
      p_scheduled_for: input.scheduledFor ?? null,
    });

    if (error) {
      return { error: error.message };
    }

    const raw = data as { workout_id?: string; exercise_count?: number } | null;
    if (!raw?.workout_id) {
      return { error: "Não foi possível salvar o treino. Tente novamente." };
    }

    return {
      data: {
        workoutId: raw.workout_id,
        exerciseCount: raw.exercise_count ?? payload.length,
      },
    };
  } catch (error) {
    return { error: error instanceof Error ? error.message : String(error) };
  }
}

export async function archiveCoachPrescription(
  workoutId: string,
): Promise<{ success?: boolean; error?: string }> {
  if (!hasSupabaseEnv()) {
    return { error: "Supabase não configurado." };
  }

  try {
    const client = getSupabaseClient();
    const { data, error } = await client.rpc("b2b_archive_workout", { p_workout_id: workoutId });
    if (error) {
      return { error: error.message };
    }
    return { success: data === true };
  } catch (error) {
    return { error: error instanceof Error ? error.message : String(error) };
  }
}

// ------------------------------------------------------------------
// VRTX Coach: aderencia (check-ins de treino concluido)
// ------------------------------------------------------------------

interface CheckinRow {
  id: string;
  coach_id: string;
  client_id: string;
  prescription_id?: string | null;
  workout_name: string;
  happened_on: string;
  exercise_count: number;
  set_count: number;
  total_volume: number | string;
  notes?: string | null;
  created_at: string;
}

function mapCheckin(row: CheckinRow): CoachCheckin {
  return {
    id: row.id,
    coachId: row.coach_id,
    clientId: row.client_id,
    prescriptionId: row.prescription_id ?? null,
    workoutName: row.workout_name,
    happenedOn: row.happened_on,
    exerciseCount: row.exercise_count ?? 0,
    setCount: row.set_count ?? 0,
    totalVolume: Number(row.total_volume ?? 0),
    notes: row.notes ?? null,
    createdAt: row.created_at,
  };
}

export async function recordCheckin(
  input: CheckinInput,
): Promise<{ success?: boolean; error?: string }> {
  if (!hasSupabaseEnv()) {
    return { error: "Supabase não configurado." };
  }

  try {
    const client = getSupabaseClient();
    const { data, error } = await client.rpc("b2b_record_checkin", {
      p_prescription_id: input.prescriptionId ?? null,
      p_workout_name: input.workoutName,
      p_happened_on: input.happenedOn,
      p_exercise_count: input.exerciseCount,
      p_set_count: input.setCount,
      p_total_volume: input.totalVolume,
      p_notes: input.notes ?? null,
    });

    if (error) {
      return { error: error.message };
    }

    return { success: data === true };
  } catch (error) {
    return { error: error instanceof Error ? error.message : String(error) };
  }
}

async function fetchCheckins(clientId?: string): Promise<{ data?: CoachCheckin[]; error?: string }> {
  if (!hasSupabaseEnv()) {
    return { error: "Supabase não configurado." };
  }

  try {
    const client = getSupabaseClient();
    const baseQuery = client
      .from("coach_checkins")
      .select(
        "id, coach_id, client_id, prescription_id, workout_name, happened_on, exercise_count, set_count, total_volume, notes, created_at",
      );

    const filteredQuery = clientId ? baseQuery.eq("client_id", clientId) : baseQuery;
    const { data, error } = await filteredQuery
      .order("happened_on", { ascending: false })
      .limit(200);

    if (error) {
      return { error: error.message };
    }

    return { data: ((data ?? []) as CheckinRow[]).map(mapCheckin) };
  } catch (error) {
    return { error: error instanceof Error ? error.message : String(error) };
  }
}

export async function listCoachCheckins(
  clientId?: string,
): Promise<{ data?: CoachCheckin[]; error?: string }> {
  return fetchCheckins(clientId);
}

export async function listMyCheckins(): Promise<{ data?: CoachCheckin[]; error?: string }> {
  return fetchCheckins();
}

// ------------------------------------------------------------------
// VRTX Coach: medidas / avaliacao corporal
// ------------------------------------------------------------------

interface MeasurementRow {
  id: string;
  coach_id: string;
  client_id: string;
  measured_on: string;
  weight_kg?: number | string | null;
  body_fat_pct?: number | string | null;
  chest_cm?: number | string | null;
  waist_cm?: number | string | null;
  hip_cm?: number | string | null;
  arm_cm?: number | string | null;
  thigh_cm?: number | string | null;
  calf_cm?: number | string | null;
  notes?: string | null;
  created_at: string;
}

function toNumberOrNull(value: number | string | null | undefined): number | null {
  if (value === null || value === undefined || value === "") return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function mapMeasurement(row: MeasurementRow): BodyMeasurement {
  return {
    id: row.id,
    coachId: row.coach_id,
    clientId: row.client_id,
    measuredOn: row.measured_on,
    weightKg: toNumberOrNull(row.weight_kg),
    bodyFatPct: toNumberOrNull(row.body_fat_pct),
    chestCm: toNumberOrNull(row.chest_cm),
    waistCm: toNumberOrNull(row.waist_cm),
    hipCm: toNumberOrNull(row.hip_cm),
    armCm: toNumberOrNull(row.arm_cm),
    thighCm: toNumberOrNull(row.thigh_cm),
    calfCm: toNumberOrNull(row.calf_cm),
    notes: row.notes ?? null,
    createdAt: row.created_at,
  };
}

async function fetchMeasurements(
  clientId?: string,
): Promise<{ data?: BodyMeasurement[]; error?: string }> {
  if (!hasSupabaseEnv()) {
    return { error: "Supabase não configurado." };
  }

  try {
    const client = getSupabaseClient();
    const baseQuery = client
      .from("coach_measurements")
      .select(
        "id, coach_id, client_id, measured_on, weight_kg, body_fat_pct, chest_cm, waist_cm, hip_cm, arm_cm, thigh_cm, calf_cm, notes, created_at",
      );

    const filteredQuery = clientId ? baseQuery.eq("client_id", clientId) : baseQuery;
    const { data, error } = await filteredQuery
      .order("measured_on", { ascending: false })
      .limit(100);

    if (error) {
      return { error: error.message };
    }

    return { data: ((data ?? []) as MeasurementRow[]).map(mapMeasurement) };
  } catch (error) {
    return { error: error instanceof Error ? error.message : String(error) };
  }
}

export async function listMyMeasurements(): Promise<{ data?: BodyMeasurement[]; error?: string }> {
  return fetchMeasurements();
}

export async function listCoachClientMeasurements(
  clientId: string,
): Promise<{ data?: BodyMeasurement[]; error?: string }> {
  return fetchMeasurements(clientId);
}

export async function submitMeasurement(
  input: BodyMeasurementInput,
): Promise<{ data?: string; error?: string }> {
  if (!hasSupabaseEnv()) {
    return { error: "Supabase não configurado." };
  }

  try {
    const client = getSupabaseClient();
    const { data, error } = await client.rpc("b2b_submit_measurement", {
      p_measured_on: input.measuredOn,
      p_weight_kg: input.weightKg ?? null,
      p_body_fat_pct: input.bodyFatPct ?? null,
      p_chest_cm: input.chestCm ?? null,
      p_waist_cm: input.waistCm ?? null,
      p_hip_cm: input.hipCm ?? null,
      p_arm_cm: input.armCm ?? null,
      p_thigh_cm: input.thighCm ?? null,
      p_calf_cm: input.calfCm ?? null,
      p_notes: input.notes ?? null,
    });

    if (error) {
      return { error: error.message };
    }

    return { data: typeof data === "string" ? data : undefined };
  } catch (error) {
    return { error: error instanceof Error ? error.message : String(error) };
  }
}
