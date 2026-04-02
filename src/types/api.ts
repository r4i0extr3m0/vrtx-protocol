export interface ApiError {
  code: string;
  message: string;
  status?: number;
}

export interface ApiResult<T> {
  data: T | null;
  error: ApiError | null;
}
