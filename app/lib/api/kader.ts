import { authFetch, getApiError } from "@/lib/api/client";
import {
  CreateKaderPayload,
  KaderProfile,
  UpdateKaderPayload,
} from "@/types";

export async function getKaderList(): Promise<KaderProfile[]> {
  const response = await authFetch("/users");
  if (!response.ok) throw new Error("Gagal mengambil daftar kader");

  const data = await response.json();
  return Array.isArray(data) ? data : [];
}

export async function createKader(
  payload: CreateKaderPayload,
): Promise<KaderProfile> {
  const response = await authFetch("/users", {
    method: "POST",
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error(await getApiError(response, "Gagal membuat akun kader"));
  }

  return response.json();
}

export async function updateKader(
  id: string,
  payload: UpdateKaderPayload,
): Promise<KaderProfile> {
  const response = await authFetch(`/users/${id}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error(
      await getApiError(response, "Gagal memperbarui akun kader"),
    );
  }

  return response.json();
}

export async function deleteKader(id: string): Promise<void> {
  const response = await authFetch(`/users/${id}`, { method: "DELETE" });
  if (!response.ok) {
    throw new Error(await getApiError(response, "Gagal menghapus akun kader"));
  }
}
