const API_URL = process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "");

function getApiUrl() {
  if (!API_URL) {
    throw new Error("NEXT_PUBLIC_API_URL belum dikonfigurasi.");
  }

  return API_URL;
}

export function getErrorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}

export async function getApiError(response: Response, fallback: string) {
  const data = await response.json().catch(() => null);
  const message = data?.message;

  if (Array.isArray(message)) return message.join(", ");
  return typeof message === "string" ? message : fallback;
}

export function setSessionCookie(token: string, days = 7) {
  if (typeof document === "undefined") return;

  const expires = new Date();
  expires.setTime(expires.getTime() + days * 24 * 60 * 60 * 1000);
  document.cookie = `session=${token};expires=${expires.toUTCString()};path=/;SameSite=Lax`;
}

export function clearSessionCookie() {
  if (typeof document === "undefined") return;
  document.cookie =
    "session=;expires=Thu, 01 Jan 1970 00:00:00 UTC;path=/;SameSite=Lax";
}

export function getAuthToken(): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(new RegExp("(^| )session=([^;]+)"));
  return match?.[2] ?? null;
}

export async function authFetch(url: string, options: RequestInit = {}) {
  const token = getAuthToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...((options.headers as Record<string, string>) || {}),
  };

  if (token) headers.Authorization = `Bearer ${token}`;

  const response = await fetch(`${getApiUrl()}${url}`, {
    ...options,
    headers,
  });

  if (response.status === 401) {
    clearSessionCookie();
    if (typeof window !== "undefined") window.location.href = "/login";
    throw new Error("Sesi berakhir, silakan login kembali.");
  }

  return response;
}

export async function publicApiFetch(
  url: string,
  options: RequestInit = {},
) {
  return fetch(`${getApiUrl()}${url}`, options);
}
