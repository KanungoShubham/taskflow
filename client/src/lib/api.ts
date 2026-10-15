/**
 * Small fetch wrapper for the Express API (proxied at /api by next.config.ts).
 * - Sends/receives JSON and the httpOnly auth cookie.
 * - Returns `data` from `{ data }` responses.
 * - Throws ApiClientError with the server message and per-field errors.
 */
export class ApiClientError extends Error {
  status: number;
  errors?: Record<string, string>;

  constructor(status: number, message: string, errors?: Record<string, string>) {
    super(message);
    this.status = status;
    this.errors = errors;
  }
}

type Method = "GET" | "POST" | "PATCH" | "DELETE";

export async function api<T>(path: string, options: { method?: Method; body?: unknown } = {}): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`/api${path}`, {
      method: options.method ?? "GET",
      credentials: "include",
      headers: options.body !== undefined ? { "Content-Type": "application/json" } : undefined,
      body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
    });
  } catch {
    throw new ApiClientError(0, "Cannot reach the server. Check your connection and try again.");
  }

  const json = await res.json().catch(() => null);
  if (!res.ok) {
    const message =
      json?.message ?? (res.status >= 500 ? "Server error. Is the API running?" : `Request failed (${res.status})`);
    throw new ApiClientError(res.status, message, json?.errors);
  }
  return json?.data as T;
}

/** Builds a query string from defined, non-empty values. */
export function toQuery(params: Record<string, string | undefined>) {
  const qs = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) if (v) qs.set(k, v);
  const s = qs.toString();
  return s ? `?${s}` : "";
}

/** Best human message for any thrown error. */
export function errorMessage(err: unknown) {
  if (err instanceof Error) return err.message;
  return "Something went wrong";
}
