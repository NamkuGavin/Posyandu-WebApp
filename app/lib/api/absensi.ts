import { assertOperationalWriteAccess } from "@/lib/api/access";
import { authFetch, getApiError } from "@/lib/api/client";
import { Absensi } from "@/types";

export async function getAbsensiList(
  bulan?: number,
  tahun?: number,
): Promise<Absensi[]> {
  const query =
    bulan && tahun ? `?bulan=${bulan}&tahun=${tahun}` : "";
  const response = await authFetch(`/absensi${query}`);
  if (!response.ok) throw new Error("Gagal mengambil data absensi");
  return response.json();
}

export async function bulkUpdateAbsensi(
  updates: {
    balitaId: string;
    isHadir: boolean;
    bulan: number;
    tahun: number;
  }[],
): Promise<void> {
  if (updates.length === 0) return;
  await assertOperationalWriteAccess();

  const first = updates[0];
  const response = await authFetch("/absensi/bulk", {
    method: "POST",
    body: JSON.stringify({
      bulan: first.bulan,
      tahun: first.tahun,
      items: updates.map(({ balitaId, isHadir }) => ({
        balitaId,
        isHadir,
      })),
    }),
  });

  if (!response.ok) {
    throw new Error(await getApiError(response, "Gagal update absensi"));
  }
}
