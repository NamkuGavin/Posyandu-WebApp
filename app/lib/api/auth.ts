import {
  clearSessionCookie,
  getErrorMessage,
  publicApiFetch,
  setSessionCookie,
  authFetch,
} from "@/lib/api/client";
import { KaderProfile } from "@/types";

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
