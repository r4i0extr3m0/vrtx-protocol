import type { PostgrestError } from "@supabase/supabase-js";

import { getSupabaseClient } from "@/src/api/supabase";
import type { ApiError, ApiResult } from "@/src/types";

function normalizeError(error: unknown, fallbackCode: string): ApiError {
  if (!error) {
    return {
      code: fallbackCode,
      message: "Erro desconhecido ao processar a requisição.",
    };
  }

  if (typeof error === "object" && error !== null && "message" in error) {
    const maybePostgrest = error as PostgrestError;

    return {
      code: typeof maybePostgrest.code === "string" ? maybePostgrest.code : fallbackCode,
      message: maybePostgrest.message,
      status:
        typeof maybePostgrest.details === "string" && maybePostgrest.details.length > 0
          ? 400
          : undefined,
    };
  }

  return {
    code: fallbackCode,
    message: "Falha inesperada de comunicação.",
  };
}

export class ApiClient {
  async selectMany<TRecord>(table: string): Promise<ApiResult<TRecord[]>> {
    try {
      const client = getSupabaseClient();
      const result = await client.from(table).select("*");

      if (result.error) {
        return { data: null, error: normalizeError(result.error, "SUPABASE_SELECT_FAILED") };
      }

      return { data: (result.data ?? []) as TRecord[], error: null };
    } catch (error) {
      console.error("[ApiClient.selectMany]", error);
      return { data: null, error: normalizeError(error, "SUPABASE_SELECT_EXCEPTION") };
    }
  }

  async insertOne<TRecord extends Record<string, unknown>>(
    table: string,
    payload: TRecord,
  ): Promise<ApiResult<TRecord>> {
    try {
      const client = getSupabaseClient();
      const result = await client.from(table).insert(payload).select("*").single();

      if (result.error) {
        return { data: null, error: normalizeError(result.error, "SUPABASE_INSERT_FAILED") };
      }

      return { data: result.data as TRecord, error: null };
    } catch (error) {
      console.error("[ApiClient.insertOne]", error);
      return { data: null, error: normalizeError(error, "SUPABASE_INSERT_EXCEPTION") };
    }
  }

  async updateOne<TRecord extends Record<string, unknown>>(
    table: string,
    id: string,
    payload: Partial<TRecord>,
  ): Promise<ApiResult<TRecord>> {
    try {
      const client = getSupabaseClient();
      const result = await client.from(table).update(payload).eq("id", id).select("*").single();

      if (result.error) {
        return { data: null, error: normalizeError(result.error, "SUPABASE_UPDATE_FAILED") };
      }

      return { data: result.data as TRecord, error: null };
    } catch (error) {
      console.error("[ApiClient.updateOne]", error);
      return { data: null, error: normalizeError(error, "SUPABASE_UPDATE_EXCEPTION") };
    }
  }

  async deleteOne(table: string, id: string): Promise<ApiResult<{ id: string }>> {
    try {
      const client = getSupabaseClient();
      const result = await client.from(table).delete().eq("id", id);

      if (result.error) {
        return { data: null, error: normalizeError(result.error, "SUPABASE_DELETE_FAILED") };
      }

      return { data: { id }, error: null };
    } catch (error) {
      console.error("[ApiClient.deleteOne]", error);
      return { data: null, error: normalizeError(error, "SUPABASE_DELETE_EXCEPTION") };
    }
  }
}

export const apiClient = new ApiClient();
