const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:8000/api/v1";
let csrfToken: string | undefined;

export class ApiError extends Error {
  constructor(public readonly status: number, public readonly body: unknown) {
    super(`API request failed (${status})`);
  }
}

export function apiErrorMessage(error: unknown, fallback = "Azione non riuscita. Riprova.") {
  if (!(error instanceof ApiError) || !error.body || typeof error.body !== "object") return fallback;
  const body = error.body as Record<string, unknown>;
  const detail = body.detail;
  if (typeof detail === "string") return detail;
  if (Array.isArray(detail) && typeof detail[0] === "string") return detail[0];
  if (detail && typeof detail === "object") {
    const nested = detail as Record<string, unknown>;
    if (typeof nested.detail === "string") return nested.detail;
  }
  const codeMessages: Record<string, string> = {
    NOT_YOUR_TURN: "Calma, fenomeno: non è ancora il tuo turno.",
    ILLEGAL_PLAY: "Questa carta qui non si può giocare.",
    INVALID_ZONE: "Prima devi terminare le carte della zona attiva.",
    INVALID_PHASE: "Questa azione non è disponibile in questo momento.",
    VERSION_CONFLICT: "Il tavolo è cambiato. Sincronizzo e riprova.",
    FACE_DOWN_NOT_PEEKED: "Prima devi spiare la carta coperta.",
  };
  return typeof body.code === "string" ? codeMessages[body.code] ?? fallback : fallback;
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
