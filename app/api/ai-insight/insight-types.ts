import { GrowthInsightResponse } from "@/types";
import { WhoAnthroAssessment } from "@/lib/who-anthro";

export type InsightMeasurement = {
  bulan?: number;
  tahun?: number;
  tglUkur?: string;
  beratBadan?: number | null;
  tinggiBadan?: number | null;
  lingkarKepala?: number | null;
  lingkarLengan?: number | null;
  lila?: number | null;
};

export type InsightBalita = {
  jenisKelamin?: "LAKI_LAKI" | "PEREMPUAN";
  tglLahir?: string;
  pengukuran?: InsightMeasurement[];
};

export type NormalizedMeasurement = {
  bulan: number;
  tahun: number;
  tglUkur?: string;
  beratBadan: number | null;
  tinggiBadan: number | null;
  lingkarKepala: number | null;
  lingkarLengan: number | null;
};

export type AnalysisContext = {
  ageInMonths: number | null;
  measurements: NormalizedMeasurement[];
  windowMeasurements: NormalizedMeasurement[];
  assessments: WhoAnthroAssessment[];
  period: GrowthInsightResponse["period"];
};
