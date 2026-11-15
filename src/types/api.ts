/** Shared API envelope and canonical identifiers. IDs are MongoDB ObjectId hex strings. */
export type ID = string;
export type ISODateTime = string;

export type ApiErrorCode =
  | "INVALID_INPUT"
  | "UNAUTHENTICATED"
  | "FORBIDDEN"
  | "NOT_FOUND"
  | "CONFLICT"
  | "INVALID_CREDENTIALS"
  | "TOO_MANY_REQUESTS"
  | "INTERNAL_ERROR";

export interface ApiError {
  code: ApiErrorCode;
  message: string;
}

export type ApiResponse<T> =
  | { success: true; data: T }
  | { success: false; error: ApiError };
