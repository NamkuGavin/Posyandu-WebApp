import { authFetch } from "@/lib/api/client";
import { Balita, GrowthInsightResponse } from "@/types";

export async function exportLaporanExcel(
  bulan: number,
  tahun: number,
): Promise<Blob> {
  const query = new URLSearchParams({
    tahun: tahun.toString(),
    bulan: bulan.toString(),
  });
  const response = await authFetch(`/laporan/export/excel?${query.toString()}`);

  if (!response.ok) {
    const error = await response.json().catch(() => null);
    throw new Error(error?.message || "Gagal export laporan Excel");
  }

  return response.blob();
}

export async function getEvaluasi(
  balita: Balita,
): Promise<GrowthInsightResponse> {
  const response = await fetch("/api/ai-insight", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      balita: {
        jenisKelamin: balita.jenisKelamin,
        tglLahir: balita.tglLahir,
        pengukuran: balita.pengukuran ?? [],
      },
    }),
  });

  if (!response.ok) {
    const data = await response.json().catch(() => null);
    throw new Error(data?.message || "Gagal mengambil evaluasi balita");
  }

  return response.json();
}
