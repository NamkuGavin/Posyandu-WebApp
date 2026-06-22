import { assertOperationalWriteAccess } from "@/lib/api/access";
import { authFetch, getApiError } from "@/lib/api/client";
import { normalizePengukuran } from "@/lib/api/normalizers";
import { Pengukuran } from "@/types";

export type UpdatePengukuranPayload = {
  bulan: number;
  tahun: number;
  beratBadan: number;
  tinggiBadan: number;
  lingkarKepala: number | null;
  lila?: number;
};

export async function updatePengukuranBalita(
  pengukuranId: string,
  updatedFields: UpdatePengukuranPayload,
): Promise<void> {
  await assertOperationalWriteAccess();
  const response = await authFetch(`/pengukuran/${pengukuranId}`, {
    method: "PATCH",
    body: JSON.stringify(updatedFields),
  });

  if (!response.ok) {
    throw new Error(
      await getApiError(response, "Gagal update pengukuran balita"),
    );
  }
}

export async function addPengukuran(
  balitaId: string,
  pengukuran: Partial<Pengukuran>,
): Promise<void> {
  await assertOperationalWriteAccess();
  const { lingkarLengan, ...rest } = pengukuran;
  const response = await authFetch("/pengukuran", {
    method: "POST",
    body: JSON.stringify({
      balitaId,
      lila: lingkarLengan,
      ...rest,
    }),
  });

  if (!response.ok) {
    throw new Error(await getApiError(response, "Gagal menambah pengukuran"));
  }
}

export async function getPengukuranList(
  bulan: number,
  tahun: number,
): Promise<Pengukuran[]> {
  const query = new URLSearchParams({
    tahun: tahun.toString(),
    bulan: bulan.toString(),
  });
  const response = await authFetch(`/pengukuran?${query.toString()}`);
  if (!response.ok) throw new Error("Gagal mengambil data pengukuran");

  const data = await response.json();
  if (!Array.isArray(data)) return [];
  return data.map((item) => normalizePengukuran(item, bulan, tahun));
}
