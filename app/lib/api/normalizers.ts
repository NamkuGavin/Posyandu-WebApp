import { Balita, Pengukuran } from "@/types";

export type RawPengukuran = Record<string, unknown> & {
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

export type RawBalitaDetail = Omit<
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
  const directBulan = toNullableNumber(raw.bulan);
  const directTahun = toNullableNumber(raw.tahun);

  if (directBulan && directTahun) {
    return { bulan: directBulan, tahun: directTahun };
  }

  if (raw.tglUkur) {
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

export function normalizePengukuran(
  raw: RawPengukuran,
  fallbackBulan?: number,
  fallbackTahun?: number,
): Pengukuran {
  const period = getMeasurementPeriod(raw, fallbackBulan, fallbackTahun);
  const lingkarLengan = toNullableNumber(raw.lingkarLengan ?? raw.lila);

  return {
    id: raw.id,
    balitaId: raw.balitaId,
    bulan: period.bulan,
    tahun: period.tahun,
    tglUkur: raw.tglUkur,
    beratBadan: Number(raw.beratBadan ?? 0),
    tinggiBadan: Number(raw.tinggiBadan ?? 0),
    lingkarKepala: toNullableNumber(raw.lingkarKepala),
    lingkarLengan,
    lila: lingkarLengan,
    createdAt: raw.createdAt,
  };
}

export function normalizeBalitaDetail(raw: RawBalitaDetail): Balita {
  const { pengukuran, pengukurans, ...detail } = raw;
  const measurements = [...(pengukuran ?? []), ...(pengukurans ?? [])]
    .map((measurement) => normalizePengukuran(measurement))
    .filter((measurement) => measurement.bulan > 0 && measurement.tahun > 0);

  const uniqueMeasurements = Array.from(
    new Map(
      measurements.map((measurement, index) => [
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
