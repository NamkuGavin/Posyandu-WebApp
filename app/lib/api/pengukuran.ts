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

function withOptionalLila<T extends { lila?: number | null }>(payload: T) {
  const { lila, ...rest } = payload;

  return {
    ...rest,
    ...(typeof lila === "number" && Number.isFinite(lila) ? { lila } : {}),
  };
}

export async function updatePengukuranBalita(
  pengukuranId: string,
  updatedFields: UpdatePengukuranPayload,
): Promise<void> {
  await assertOperationalWriteAccess();
  const response = await authFetch(`/pengukuran/${pengukuranId}`, {
    method: "PATCH",
    body: JSON.stringify(withOptionalLila(updatedFields)),
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
  const { lingkarLengan, lila, ...rest } = pengukuran;
  const lilaValue = lingkarLengan ?? lila;
  const response = await authFetch("/pengukuran", {
    method: "POST",
    body: JSON.stringify(
      withOptionalLila({
        ...rest,
        balitaId,
        lila: lilaValue,
      }),
    ),
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
