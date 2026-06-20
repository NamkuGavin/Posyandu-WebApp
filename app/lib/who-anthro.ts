import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  GrowthAnthropometryIndicator,
  GrowthAnthropometryIndicatorId,
} from "@/types";

type SexCode = 1 | 2;
type MeasurementMode = "length" | "height";

type Lms = {
  l: number;
  m: number;
  s: number;
};

type AgeStandard = Lms & {
  sex: SexCode;
  age: number;
  mode?: "L" | "H";
};

type SizeStandard = Lms & {
  sex: SexCode;
  size: number;
};

type AssessmentInput = {
  sex?: "LAKI_LAKI" | "PEREMPUAN";
  birthDate?: string;
  measurementDate?: string;
  year: number;
  month: number;
  weightKg: number | null;
  heightCm: number | null;
};

export type WhoAnthroAssessment = {
  calculated: boolean;
  period: string;
  measurementDate: string;
  ageDays: number | null;
  ageMonths: number | null;
  measurementMode: MeasurementMode | null;
  bmi: number | null;
  indicators: GrowthAnthropometryIndicator[];
  dataIssues: string[];
};

const STANDARD_DIRECTORY = join(
  process.cwd(),
  "app",
  "lib",
  "who-growth-standards",
);
const DAY_IN_MS = 86_400_000;
const INDICATOR_META: Record<
  GrowthAnthropometryIndicatorId,
  Pick<GrowthAnthropometryIndicator, "label">
> = {
  haz: { label: "PB/TB menurut umur" },
  waz: { label: "BB menurut umur" },
  whz: { label: "BB menurut PB/TB" },
  baz: { label: "IMT menurut umur" },
};

let lengthForAge: Map<string, AgeStandard> | null = null;
let weightForAge: Map<string, AgeStandard> | null = null;
let bmiForAge: Map<string, AgeStandard> | null = null;
let weightForLength: Map<string, SizeStandard> | null = null;
let weightForHeight: Map<string, SizeStandard> | null = null;

function parseNumber(value: string) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function readRows(fileName: string) {
  const content = readFileSync(join(STANDARD_DIRECTORY, fileName), "utf8");
  const [headerLine, ...lines] = content.trim().split(/\r?\n/);
  const headers = headerLine.split("\t");

  return lines.map((line) =>
    Object.fromEntries(
      line.split("\t").map((value, index) => [headers[index], value]),
    ),
  );
}

function loadAgeStandard(
  fileName: string,
  includeMode: boolean,
): Map<string, AgeStandard> {
  const standards = new Map<string, AgeStandard>();

  readRows(fileName).forEach((row) => {
    const sex = parseNumber(row.sex) as SexCode | null;
    const age = parseNumber(row.age);
    const l = parseNumber(row.l);
    const m = parseNumber(row.m);
    const s = parseNumber(row.s);
    const mode =
      includeMode && (row.loh === "L" || row.loh === "H") ? row.loh : undefined;

    if (
      sex === null ||
      age === null ||
      l === null ||
      m === null ||
      s === null
    ) {
      return;
    }

    const key = includeMode ? `${sex}:${age}:${mode}` : `${sex}:${age}`;
    standards.set(key, { sex, age, l, m, s, mode });
  });

  return standards;
}

function loadSizeStandard(
  fileName: string,
  sizeColumn: "length" | "height",
): Map<string, SizeStandard> {
  const standards = new Map<string, SizeStandard>();

  readRows(fileName).forEach((row) => {
    const sex = parseNumber(row.sex) as SexCode | null;
    const size = parseNumber(row[sizeColumn]);
    const l = parseNumber(row.l);
    const m = parseNumber(row.m);
    const s = parseNumber(row.s);

    if (
      sex === null ||
      size === null ||
      l === null ||
      m === null ||
      s === null
    ) {
      return;
    }

    standards.set(`${sex}:${size.toFixed(1)}`, { sex, size, l, m, s });
  });

  return standards;
}

function getStandards() {
  lengthForAge ??= loadAgeStandard("lenanthro.txt", true);
  weightForAge ??= loadAgeStandard("weianthro.txt", false);
  bmiForAge ??= loadAgeStandard("bmianthro.txt", true);
  weightForLength ??= loadSizeStandard("wflanthro.txt", "length");
  weightForHeight ??= loadSizeStandard("wfhanthro.txt", "height");

  return {
    lengthForAge,
    weightForAge,
    bmiForAge,
    weightForLength,
    weightForHeight,
  };
}

function calculateAge(birthDate?: string, measurementDate?: string) {
  if (!birthDate || !measurementDate) {
    return { days: null, months: null };
  }

  const birth = new Date(birthDate);
  const measured = new Date(measurementDate);

  if (
    Number.isNaN(birth.getTime()) ||
    Number.isNaN(measured.getTime()) ||
    measured < birth
  ) {
    return { days: null, months: null };
  }

  const days = Math.round((measured.getTime() - birth.getTime()) / DAY_IN_MS);
  return {
    days,
    months: Number((days / 30.4375).toFixed(2)),
  };
}

function calculateLmsZScore(value: number, lms: Lms, adjusted: boolean) {
  const raw = (Math.pow(value / lms.m, lms.l) - 1) / (lms.s * lms.l);

  if (!adjusted || (raw >= -3 && raw <= 3)) {
    return raw;
  }

  const standardDeviationValue = (sd: number) =>
    lms.m * Math.pow(1 + lms.l * lms.s * sd, 1 / lms.l);
  const positiveSd3 = standardDeviationValue(3);
  const negativeSd3 = standardDeviationValue(-3);

  if (raw > 3) {
    return (
      3 + (value - positiveSd3) / (positiveSd3 - standardDeviationValue(2))
    );
  }

  return (
    -3 + (value - negativeSd3) / (standardDeviationValue(-2) - negativeSd3)
  );
}

function interpolateSizeStandard(
  standards: Map<string, SizeStandard>,
  sex: SexCode,
  size: number,
) {
  const lowerSize = Math.floor(size * 10) / 10;
  const upperSize = Math.ceil(size * 10) / 10;
  const lower = standards.get(`${sex}:${lowerSize.toFixed(1)}`);
  const upper = standards.get(`${sex}:${upperSize.toFixed(1)}`);

  if (!lower || !upper) return null;
  if (lowerSize === upperSize) return lower;

  const ratio = (size - lowerSize) / (upperSize - lowerSize);
  return {
    sex,
    size,
    l: lower.l + (upper.l - lower.l) * ratio,
    m: lower.m + (upper.m - lower.m) * ratio,
    s: lower.s + (upper.s - lower.s) * ratio,
  };
}

function getIndicatorClassification(
  id: GrowthAnthropometryIndicatorId,
  zScore: number,
) {
  if (id === "haz") {
    if (zScore < -3) return ["Sangat pendek", "critical"] as const;
    if (zScore < -2) return ["Pendek", "warning"] as const;
    if (zScore > 3) return ["Tinggi", "warning"] as const;
    return ["Normal", "normal"] as const;
  }

  if (id === "waz") {
    if (zScore < -3) return ["Berat badan sangat kurang", "critical"] as const;
    if (zScore < -2) return ["Berat badan kurang", "warning"] as const;
    if (zScore > 1) return ["Risiko berat badan lebih", "warning"] as const;
    return ["Berat badan normal", "normal"] as const;
  }

  if (zScore < -3) return ["Gizi buruk", "critical"] as const;
  if (zScore < -2) return ["Gizi kurang", "warning"] as const;
  if (zScore <= 1) return ["Gizi baik", "normal"] as const;
  if (zScore <= 2) return ["Berisiko gizi lebih", "warning"] as const;
  if (zScore <= 3) return ["Gizi lebih", "warning"] as const;
  return ["Obesitas", "critical"] as const;
}

function buildIndicator(
  id: GrowthAnthropometryIndicatorId,
  zScore: number | null,
  flagRange: [number, number],
  unavailableNote?: string,
): GrowthAnthropometryIndicator {
  if (zScore === null || !Number.isFinite(zScore)) {
    return {
      id,
      ...INDICATOR_META[id],
      zScore: null,
      classification: "Belum dapat dihitung",
      status: "unavailable",
      note: unavailableNote,
    };
  }

  const roundedScore = Number(zScore.toFixed(2));
  if (roundedScore < flagRange[0] || roundedScore > flagRange[1]) {
    return {
      id,
      ...INDICATOR_META[id],
      zScore: roundedScore,
      classification: "Perlu verifikasi data",
      status: "critical",
      note: "Nilai berada di luar batas biologis WHO dan tidak digunakan untuk menetapkan status gizi.",
    };
  }

  const [classification, status] = getIndicatorClassification(id, roundedScore);
  return {
    id,
    ...INDICATOR_META[id],
    zScore: roundedScore,
    classification,
    status,
  };
}

export function assessWhoAnthropometry(
  input: AssessmentInput,
): WhoAnthroAssessment {
  const measurementDate =
    input.measurementDate ??
    `${input.year}-${String(input.month).padStart(2, "0")}-01T00:00:00.000Z`;
  const period = `${String(input.month).padStart(2, "0")}/${input.year}`;
  const { days: ageDays, months: ageMonths } = calculateAge(
    input.birthDate,
    measurementDate,
  );
  const dataIssues: string[] = [];
  const sex: SexCode | null =
    input.sex === "LAKI_LAKI" ? 1 : input.sex === "PEREMPUAN" ? 2 : null;
  const measurementMode: MeasurementMode | null =
    ageDays === null ? null : ageDays < 731 ? "length" : "height";
  const weight =
    input.weightKg !== null && input.weightKg > 0 ? input.weightKg : null;
  const height =
    input.heightCm !== null && input.heightCm > 0 ? input.heightCm : null;

  if (input.measurementDate === undefined) {
    dataIssues.push(
      "Tanggal ukur tidak tersedia; umur dihitung menggunakan tanggal 1 pada bulan pengukuran.",
    );
  }
  if (sex === null) dataIssues.push("Jenis kelamin belum valid.");
  if (ageDays === null || ageMonths === null) {
    dataIssues.push("Umur pada tanggal pengukuran tidak dapat dihitung.");
  } else if (ageMonths >= 60) {
    dataIssues.push(
      "Standar WHO balita pada modul ini hanya berlaku untuk usia di bawah 60 bulan.",
    );
  }
  if (weight === null) dataIssues.push("Berat badan belum valid.");
  if (height === null) dataIssues.push("Panjang/tinggi badan belum valid.");

  const ageIsValid =
    ageDays !== null &&
    ageMonths !== null &&
    ageDays >= 0 &&
    ageDays <= 1856 &&
    ageMonths < 60;
  const canCalculate = sex !== null && ageIsValid;
  const standards = canCalculate ? getStandards() : null;
  const modeCode = measurementMode === "length" ? "L" : "H";

  const heightForAgeStandard =
    standards && ageDays !== null
      ? (standards.lengthForAge.get(`${sex}:${ageDays}:${modeCode}`) ?? null)
      : null;
  const weightForAgeStandard =
    standards && ageDays !== null
      ? (standards.weightForAge.get(`${sex}:${ageDays}`) ?? null)
      : null;
  const bmiForAgeStandard =
    standards && ageDays !== null
      ? (standards.bmiForAge.get(`${sex}:${ageDays}:${modeCode}`) ?? null)
      : null;
  const sizeStandard =
    standards && height !== null && measurementMode !== null
      ? interpolateSizeStandard(
          measurementMode === "length"
            ? standards.weightForLength
            : standards.weightForHeight,
          sex as SexCode,
          height,
        )
      : null;
  const bmi =
    weight !== null && height !== null
      ? Number((weight / Math.pow(height / 100, 2)).toFixed(2))
      : null;

  const haz =
    height !== null && heightForAgeStandard
      ? calculateLmsZScore(height, heightForAgeStandard, false)
      : null;
  const waz =
    weight !== null && weightForAgeStandard
      ? calculateLmsZScore(weight, weightForAgeStandard, true)
      : null;
  const whz =
    weight !== null && sizeStandard
      ? calculateLmsZScore(weight, sizeStandard, true)
      : null;
  const baz =
    bmi !== null && bmiForAgeStandard
      ? calculateLmsZScore(bmi, bmiForAgeStandard, true)
      : null;

  if (
    height !== null &&
    measurementMode === "length" &&
    (height < 45 || height > 110)
  ) {
    dataIssues.push(
      "Panjang badan berada di luar rentang tabel WHO 45-110 cm.",
    );
  }
  if (
    height !== null &&
    measurementMode === "height" &&
    (height < 65 || height > 120)
  ) {
    dataIssues.push("Tinggi badan berada di luar rentang tabel WHO 65-120 cm.");
  }

  const indicators = [
    buildIndicator("haz", haz, [-6, 6]),
    buildIndicator("waz", waz, [-6, 5]),
    buildIndicator("whz", whz, [-5, 5]),
    buildIndicator("baz", baz, [-5, 5]),
  ];
  const hasCalculatedIndicator = indicators.some(
    (indicator) => indicator.zScore !== null,
  );

  if (measurementMode !== null && height !== null && hasCalculatedIndicator) {
    dataIssues.push(
      `Kolom panjang/tinggi diasumsikan sebagai ${
        measurementMode === "length" ? "panjang telentang" : "tinggi berdiri"
      } berdasarkan umur karena posisi pengukuran belum disimpan.`,
    );
  }

  return {
    calculated: hasCalculatedIndicator,
    period,
    measurementDate,
    ageDays,
    ageMonths,
    measurementMode,
    bmi,
    indicators,
    dataIssues,
  };
}
