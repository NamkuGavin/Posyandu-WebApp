import { assertOperationalWriteAccess } from "@/lib/api/access";
import { authFetch, getApiError } from "@/lib/api/client";
import {
  normalizeBalitaDetail,
  RawBalitaDetail,
} from "@/lib/api/normalizers";
import { Balita, BerandaStats } from "@/types";

export async function getDashboardStats(): Promise<BerandaStats> {
  const response = await authFetch("/beranda");
  if (!response.ok) throw new Error("Gagal mengambil statistik beranda");
  return response.json();
}

export async function getBalitaList(): Promise<Balita[]> {
  const response = await authFetch("/balita");
  if (!response.ok) throw new Error("Gagal mengambil data balita");
  return response.json();
}

export async function getBalitaById(id: string): Promise<Balita | null> {
  const response = await authFetch(`/balita/${id}`);
  if (!response.ok) {
    if (response.status === 404) return null;
    throw new Error("Gagal mengambil detail balita");
  }

  return normalizeBalitaDetail((await response.json()) as RawBalitaDetail);
}

export async function createBalita(
  balita: Record<string, unknown>,
): Promise<Balita> {
  await assertOperationalWriteAccess();
  const response = await authFetch("/balita", {
    method: "POST",
    body: JSON.stringify(balita),
  });

  if (!response.ok) {
    throw new Error(await getApiError(response, "Gagal menambah balita"));
  }

  return response.json();
}

export async function updateBalita(
  id: string,
  updatedFields: Partial<Balita>,
): Promise<void> {
  await assertOperationalWriteAccess();
  const response = await authFetch(`/balita/${id}`, {
    method: "PATCH",
    body: JSON.stringify(updatedFields),
  });

  if (!response.ok) {
    throw new Error(await getApiError(response, "Gagal update balita"));
  }
}

export async function deleteBalita(
  id: string,
  alasan: string,
  catatan?: string,
): Promise<void> {
  await assertOperationalWriteAccess();
  const payload = {
    alasan,
    ...(catatan?.trim() ? { catatan: catatan.trim() } : {}),
  };
  const response = await authFetch(`/balita/${id}`, {
    method: "DELETE",
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error(await getApiError(response, "Gagal menghapus balita"));
  }
}
