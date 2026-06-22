import { MONTH_NAMES } from "@/lib/constants";
import { Pengukuran } from "@/types";

export type MeasurementPeriod = {
  month: number;
  year: number;
};

export type MeasurementMonthOption = {
  label: string;
  value: number;
};

export function getBirthPeriod(
  dateString?: string | null,
): MeasurementPeriod | null {
  if (!dateString) return null;

  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return null;

  return {
    month: date.getUTCMonth() + 1,
    year: date.getUTCFullYear(),
  };
}

export function getMeasurementYearOptions(
  birthPeriod: MeasurementPeriod | null,
  currentYear: number,
) {
  if (!birthPeriod || birthPeriod.year > currentYear) return [];

  const years: number[] = [];
  for (let year = currentYear; year >= birthPeriod.year; year -= 1) {
    years.push(year);
  }

  return years;
}

export function getMeasurementMonthOptions(
  year: number,
  birthPeriod: MeasurementPeriod | null,
  currentMonth: number,
  currentYear: number,
): MeasurementMonthOption[] {
  if (!birthPeriod || year < birthPeriod.year || year > currentYear) return [];

  const startMonth = year === birthPeriod.year ? birthPeriod.month : 1;
  const endMonth = year === currentYear ? currentMonth : 12;
  if (startMonth > endMonth) return [];

  return MONTH_NAMES.slice(startMonth - 1, endMonth).map((label, index) => ({
    label,
    value: startMonth + index,
  }));
}

export function getMeasurementPeriodKey(year: number, month: number) {
  return `${year}-${month}`;
}

export function getLatestAvailableMonth(
  monthOptions: MeasurementMonthOption[],
  fallback: number,
) {
  return monthOptions.at(-1)?.value ?? fallback;
}

export function getMeasurementsByPeriod(measurements: Pengukuran[] = []) {
  return measurements.reduce<Record<string, Pengukuran>>(
    (result, measurement) => {
      result[getMeasurementPeriodKey(measurement.tahun, measurement.bulan)] =
        measurement;
      return result;
    },
    {},
  );
}

export function getMeasurementFieldValues(
  measurement?: Pengukuran | null,
) {
  return {
    panjang: measurement?.tinggiBadan?.toString() || "",
    berat: measurement?.beratBadan?.toString() || "",
    lingkarKepala: measurement?.lingkarKepala?.toString() || "",
    lingkarLengan: measurement?.lingkarLengan?.toString() || "",
  };
}
