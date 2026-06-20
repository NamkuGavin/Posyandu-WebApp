import {
  Balita,
  Pengukuran,
  Absensi,
  BerandaStats,
  CreateKaderPayload,
  GrowthInsightResponse,
  KaderProfile,
  UpdateKaderPayload,
} from "@/types";
import { isAdminProfile } from "@/lib/roles";

type RawPengukuran = Record<string, unknown> & {
  id?: string;
  balitaId?: string;
  bulan?: unknown;
  tahun?: unknown;
  tglUkur?: string;
  beratBadan?: unknown;
  tinggiBadan?: unknown;
  lingkarKepala?: unknown;
  lingkarLengan?: unknown;
  lila?: unknown;
  createdAt?: string;
};

type RawBalitaDetail = Omit<
  Balita,
  "nikWali" | "noKk" | "rt" | "rw" | "pengukuran"
> & {
  nikWali?: string | null;
  noKk?: string | null;
  rt: string | number;
  rw: string | number;
  pengukuran?: RawPengukuran[];
  pengukurans?: RawPengukuran[];
};

const API_URL = process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "");

function getApiUrl() {
  if (!API_URL) {
    throw new Error("NEXT_PUBLIC_API_URL belum dikonfigurasi.");
  }

  return API_URL;
}

function toNullableNumber(value: unknown): number | null {
  if (value === null || value === undefined || value === "") return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function getMeasurementPeriod(
  raw: RawPengukuran,
  fallbackBulan?: number,
  fallbackTahun?: number,
) {
  const directBulan = toNullableNumber(raw?.bulan);
  const directTahun = toNullableNumber(raw?.tahun);

  if (directBulan && directTahun) {
    return { bulan: directBulan, tahun: directTahun };
  }

  if (raw?.tglUkur) {
    const date = new Date(raw.tglUkur);
    if (!Number.isNaN(date.getTime())) {
      return {
        bulan: date.getUTCMonth() + 1,
        tahun: date.getUTCFullYear(),
      };
    }
  }

  return {
    bulan: fallbackBulan ?? 0,
    tahun: fallbackTahun ?? 0,
  };
}

function normalizePengukuran(
  raw: RawPengukuran,
  fallbackBulan?: number,
  fallbackTahun?: number,
): Pengukuran {
  const period = getMeasurementPeriod(raw, fallbackBulan, fallbackTahun);
  const lingkarLengan = toNullableNumber(raw?.lingkarLengan ?? raw?.lila);

  return {
    id: raw?.id,
    balitaId: raw?.balitaId,
    bulan: period.bulan,
    tahun: period.tahun,
    tglUkur: raw?.tglUkur,
    beratBadan: Number(raw?.beratBadan ?? 0),
    tinggiBadan: Number(raw?.tinggiBadan ?? 0),
    lingkarKepala: toNullableNumber(raw?.lingkarKepala),
    lingkarLengan,
    lila: lingkarLengan,
    createdAt: raw?.createdAt,
  };
}

function normalizeBalitaDetail(raw: RawBalitaDetail): Balita {
  const { pengukuran, pengukurans, ...detail } = raw;
  const normalizedMeasurements = [...(pengukuran ?? []), ...(pengukurans ?? [])]
    .map((measurement) => normalizePengukuran(measurement))
    .filter((measurement) => measurement.bulan > 0 && measurement.tahun > 0);
  const uniqueMeasurements = Array.from(
    new Map(
      normalizedMeasurements.map((measurement, index) => [
        measurement.id ??
          `${measurement.balitaId}-${measurement.tahun}-${measurement.bulan}-${index}`,
        measurement,
      ]),
    ).values(),
  );

  return {
    ...detail,
    nikWali: raw.nikWali ?? "",
    noKk: raw.noKk ?? undefined,
    rt: String(raw.rt),
    rw: String(raw.rw),
    pengukuran: uniqueMeasurements,
  };
}

function getErrorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}

async function getApiError(res: Response, fallback: string) {
  const data = await res.json().catch(() => null);
  const message = data?.message;

  if (Array.isArray(message)) {
    return message.join(", ");
  }

  if (typeof message === "string") {
    return message;
  }

  return fallback;
}

async function assertOperationalWriteAccess() {
  const profile = await getCurrentUser();

  if (isAdminProfile(profile)) {
    throw new Error(
      "Akun admin hanya memiliki akses baca untuk data operasional kader.",
    );
  }
}

// Client-side cookie utilities
function setCookie(name: string, value: string, days: number) {
  if (typeof document === "undefined") return;
  const expires = new Date();
  expires.setTime(expires.getTime() + days * 24 * 60 * 60 * 1000);
  document.cookie = `${name}=${value};expires=${expires.toUTCString()};path=/;SameSite=Lax`;
}

function deleteCookie(name: string) {
  if (typeof document === "undefined") return;
  document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 UTC;path=/;SameSite=Lax`;
}

export function getAuthToken(): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(new RegExp("(^| )session=([^;]+)"));
  if (match) return match[2];
  return null;
}

// Wrapper fetch untuk otomatis nambah token
async function authFetch(url: string, options: RequestInit = {}) {
  const token = getAuthToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...((options.headers as Record<string, string>) || {}),
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const response = await fetch(`${getApiUrl()}${url}`, {
    ...options,
    headers,
  });

  if (response.status === 401) {
    deleteCookie("session");
    if (typeof window !== "undefined") {
      window.location.href = "/login";
    }
    throw new Error("Sesi berakhir, silakan login kembali.");
  }

  return response;
}

// Authentication
export async function login(
  identifier: string,
  password: string,
): Promise<{ success: boolean; token?: string; error?: string }> {
  try {
    const res = await fetch(`${getApiUrl()}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ identifier, password }),
    });
    const data = await res.json();
    if (!res.ok) {
      return { success: false, error: data.message || "Login gagal" };
    }
    setCookie("session", data.access_token, 7);
    return { success: true, token: data.access_token };
  } catch (err: unknown) {
    return {
      success: false,
      error: getErrorMessage(err, "Terjadi kesalahan jaringan"),
    };
  }
}

export async function logout(): Promise<void> {
  deleteCookie("session");
}

export async function getCurrentUser(): Promise<KaderProfile> {
  const res = await authFetch("/auth/me");
  if (!res.ok) throw new Error("Gagal mengambil profil kader");

  const data = (await res.json()) as KaderProfile | { user?: KaderProfile };
  if ("user" in data && data.user) {
    return data.user;
  }

  return data as KaderProfile;
}

// Users / Kader
export async function getKaderList(): Promise<KaderProfile[]> {
  const res = await authFetch("/users");
  if (!res.ok) throw new Error("Gagal mengambil daftar kader");

  const data = await res.json();
  return Array.isArray(data) ? data : [];
}

export async function createKader(
  payload: CreateKaderPayload,
): Promise<KaderProfile> {
  const res = await authFetch("/users", {
    method: "POST",
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    throw new Error(await getApiError(res, "Gagal membuat akun kader"));
  }

  return res.json();
}

export async function updateKader(
  id: string,
  payload: UpdateKaderPayload,
): Promise<KaderProfile> {
  const res = await authFetch(`/users/${id}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    throw new Error(await getApiError(res, "Gagal memperbarui akun kader"));
  }

  return res.json();
}

export async function deleteKader(id: string): Promise<void> {
  const res = await authFetch(`/users/${id}`, {
    method: "DELETE",
  });

  if (!res.ok) {
    throw new Error(await getApiError(res, "Gagal menghapus akun kader"));
  }
}

// Dashboard
export async function getDashboardStats(): Promise<BerandaStats> {
  const res = await authFetch("/beranda");
  if (!res.ok) throw new Error("Gagal mengambil statistik beranda");
  return res.json();
}

// Balita
export async function getBalitaList(): Promise<Balita[]> {
  const res = await authFetch("/balita");
  if (!res.ok) throw new Error("Gagal mengambil data balita");
  return res.json();
}

export async function getBalitaById(id: string): Promise<Balita | null> {
  const res = await authFetch(`/balita/${id}`);
  if (!res.ok) {
    if (res.status === 404) return null;
    throw new Error("Gagal mengambil detail balita");
  }
  const data = (await res.json()) as RawBalitaDetail;
  return normalizeBalitaDetail(data);
}

export async function createBalita(
  balita: Record<string, unknown>,
): Promise<Balita> {
  await assertOperationalWriteAccess();

  const res = await authFetch("/balita", {
    method: "POST",
    body: JSON.stringify(balita),
  });
  if (!res.ok) {
    throw new Error(await getApiError(res, "Gagal menambah balita"));
  }
  return res.json();
}

export async function updateBalita(
  id: string,
  updatedFields: Partial<Balita>,
): Promise<void> {
  await assertOperationalWriteAccess();

  const res = await authFetch(`/balita/${id}`, {
    method: "PATCH",
    body: JSON.stringify(updatedFields),
  });
  if (!res.ok) {
    throw new Error(await getApiError(res, "Gagal update balita"));
  }
}

type UpdatePengukuranBalitaPayload = {
  bulan: number;
  tahun: number;
  beratBadan: number;
  tinggiBadan: number;
  lingkarKepala: number | null;
  lila?: number;
};

export async function updatePengukuranBalita(
  pengukuranId: string,
  updatedFields: UpdatePengukuranBalitaPayload,
): Promise<void> {
  await assertOperationalWriteAccess();

  const res = await authFetch(`/pengukuran/${pengukuranId}`, {
    method: "PATCH",
    body: JSON.stringify(updatedFields),
  });
  if (!res.ok) {
    throw new Error(await getApiError(res, "Gagal update pengukuran balita"));
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

  const res = await authFetch(`/balita/${id}`, {
    method: "DELETE",
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    throw new Error(await getApiError(res, "Gagal menghapus balita"));
  }
}

// Pengukuran
export async function addPengukuran(
  id: string,
  pengukuran: Partial<Pengukuran>,
): Promise<void> {
  await assertOperationalWriteAccess();

  const { lingkarLengan, ...rest } = pengukuran;
  const payload = {
    balitaId: id,
    lila: lingkarLengan,
    ...rest,
  };
  const res = await authFetch("/pengukuran", {
    method: "POST",
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    throw new Error(await getApiError(res, "Gagal menambah pengukuran"));
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
  const res = await authFetch(`/pengukuran?${query.toString()}`);
  if (!res.ok) throw new Error("Gagal mengambil data pengukuran");

  const data = await res.json();
  if (!Array.isArray(data)) return [];

  return data.map((item) => normalizePengukuran(item, bulan, tahun));
}

// Absensi
export async function getAbsensiList(
  bulan?: number,
  tahun?: number,
): Promise<Absensi[]> {
  let query = "";
  if (bulan && tahun) {
    query = `?bulan=${bulan}&tahun=${tahun}`;
  }
  const res = await authFetch(`/absensi${query}`);
  if (!res.ok) throw new Error("Gagal mengambil data absensi");
  return res.json();
}

export async function bulkUpdateAbsensi(
  absensiUpdates: {
    balitaId: string;
    isHadir: boolean;
    bulan: number;
    tahun: number;
  }[],
): Promise<void> {
  if (absensiUpdates.length === 0) return;
  await assertOperationalWriteAccess();

  const first = absensiUpdates[0];
  const payload = {
    bulan: first.bulan,
    tahun: first.tahun,
    items: absensiUpdates.map(({ balitaId, isHadir }) => ({
      balitaId,
      isHadir,
    })),
  };
  const res = await authFetch("/absensi/bulk", {
    method: "POST",
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    throw new Error(await getApiError(res, "Gagal update absensi"));
  }
}

// Laporan
export async function exportLaporanExcel(
  bulan: number,
  tahun: number,
): Promise<Blob> {
  const query = new URLSearchParams({
    tahun: tahun.toString(),
    bulan: bulan.toString(),
  });
  const res = await authFetch(`/laporan/export/excel?${query.toString()}`);

  if (!res.ok) {
    const err = await res.json().catch(() => null);
    throw new Error(err?.message || "Gagal export laporan Excel");
  }

  return res.blob();
}

export async function getEvaluasi(
  balita: Balita,
): Promise<GrowthInsightResponse> {
  const res = await fetch("/api/ai-insight", {
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

  if (!res.ok) {
    const data = await res.json().catch(() => null);
    throw new Error(data?.message || "Gagal mengambil evaluasi balita");
  }

  return res.json();
}
