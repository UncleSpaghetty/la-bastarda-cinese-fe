const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:8000/api/v1";
let csrfToken: string | undefined;

export class ApiError extends Error {
  constructor(public readonly status: number, public readonly body: unknown) {
    super(`API request failed (${status})`);
  }
}

export async function apiRequest<T>(path: string, init?: RequestInit): Promise<T> {
  const cookieCsrf = document.cookie.split("; ").find((value) => value.startsWith("csrftoken="))?.split("=")[1];
  const csrf = csrfToken ?? (cookieCsrf ? decodeURIComponent(cookieCsrf) : undefined);
  const response = await fetch(`${API_URL}${path}`, {
    ...init,
    credentials: "include",
    headers: { "Content-Type": "application/json", ...(csrf ? { "X-CSRFToken": csrf } : {}), ...init?.headers },
  });
  const body = response.status === 204 ? undefined : await response.json().catch(() => undefined);
  if (!response.ok) throw new ApiError(response.status, body);
  if (path === "/csrf" && body && typeof body === "object" && "csrf_token" in body) {
    csrfToken = String(body.csrf_token);
  }
  return body as T;
}
