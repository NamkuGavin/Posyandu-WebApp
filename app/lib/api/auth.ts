import {
  clearSessionCookie,
  getErrorMessage,
  publicApiFetch,
  setSessionCookie,
  authFetch,
} from "@/lib/api/client";
import { KaderProfile, RegisterKaderPayload } from "@/types";

export async function login(
  identifier: string,
  password: string,
): Promise<{ success: boolean; token?: string; error?: string }> {
  try {
    const response = await publicApiFetch("/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ identifier, password }),
    });
    const data = await response.json();

    if (!response.ok) {
      return { success: false, error: data.message || "Login gagal" };
    }

    setSessionCookie(data.access_token);
    return { success: true, token: data.access_token };
  } catch (error: unknown) {
    return {
      success: false,
      error: getErrorMessage(error, "Terjadi kesalahan jaringan"),
    };
  }
}

export async function registerKader(
  payload: RegisterKaderPayload,
): Promise<KaderProfile> {
  const response = await publicApiFetch("/users/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const data = await response.json().catch(() => null);
    const message = data?.message;

    if (Array.isArray(message)) {
      throw new Error(message.join(", "));
    }

    throw new Error(
      typeof message === "string" ? message : "Pendaftaran akun gagal",
    );
  }

  return response.json();
}

export async function logout(): Promise<void> {
  clearSessionCookie();
}

export async function getCurrentUser(): Promise<KaderProfile> {
  const response = await authFetch("/auth/me");
  if (!response.ok) throw new Error("Gagal mengambil profil kader");

  const data = (await response.json()) as KaderProfile | { user?: KaderProfile };
  if ("user" in data && data.user) return data.user;
  return data as KaderProfile;
}
