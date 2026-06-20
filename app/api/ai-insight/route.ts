import { NextResponse } from "next/server";
import {
  GrowthInsightResponse,
  GrowthInsightSection,
  GrowthInsightSectionId,
} from "@/types";
import { assessWhoAnthropometry, WhoAnthroAssessment } from "@/lib/who-anthro";

export const runtime = "nodejs";

type InsightMeasurement = {
  bulan?: number;
  tahun?: number;
  tglUkur?: string;
  beratBadan?: number | null;
  tinggiBadan?: number | null;
  lingkarKepala?: number | null;
  lingkarLengan?: number | null;
  lila?: number | null;
};

type InsightBalita = {
  jenisKelamin?: "LAKI_LAKI" | "PEREMPUAN";
  tglLahir?: string;
  pengukuran?: InsightMeasurement[];
};

type NormalizedMeasurement = {
  bulan: number;
  tahun: number;
  tglUkur?: string;
  beratBadan: number | null;
  tinggiBadan: number | null;
  lingkarKepala: number | null;
  lingkarLengan: number | null;
};

type AnalysisContext = {
  ageInMonths: number | null;
  measurements: NormalizedMeasurement[];
  windowMeasurements: NormalizedMeasurement[];
  assessments: WhoAnthroAssessment[];
  period: GrowthInsightResponse["period"];
};

const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";
const GROQ_MODEL = process.env.GROQ_MODEL?.trim() || "llama-3.1-8b-instant";
const MONTH_NAMES = [
  "Januari",
  "Februari",
  "Maret",
  "April",
  "Mei",
  "Juni",
  "Juli",
  "Agustus",
  "September",
  "Oktober",
  "November",
  "Desember",
];
const INSIGHT_REFERENCES = [
  {
    label: "WHO Child Growth Standards",
    url: "https://www.who.int/tools/child-growth-standards",
  },
  {
    label: "UNICEF Nutrition",
    url: "https://www.unicef.org/nutrition",
  },
  {
    label: "Buku KIA Kementerian Kesehatan RI",
    url: "https://ayosehat.kemkes.go.id/buku-kia-kesehatan-ibu-dan-anak",
  },
  {
    label: "Permenkes No. 2 Tahun 2020",
    url: "https://peraturan.bpk.go.id/Details/152505/permenkes-no-2-tahun-2020",
  },
];
const SECTION_META: Record<
  GrowthInsightSectionId,
  Pick<GrowthInsightSection, "title" | "tone">
> = {
  analisis: { title: "Analisis", tone: "neutral" },
  risiko_gizi: { title: "Sinyal Risiko Gizi", tone: "warning" },
  monitoring: { title: "Monitoring Pertumbuhan", tone: "info" },
  anomali: { title: "Anomali dan Kualitas Data", tone: "warning" },
  rekomendasi: { title: "Rekomendasi dan Tindakan", tone: "action" },
};

function calculateAgeInMonths(birthDate?: string) {
  if (!birthDate) return null;

  const birth = new Date(birthDate);
  if (Number.isNaN(birth.getTime())) return null;

  const now = new Date();
  let age =
    (now.getFullYear() - birth.getFullYear()) * 12 +
    now.getMonth() -
    birth.getMonth();

  if (now.getDate() < birth.getDate()) {
    age -= 1;
  }

  return Math.max(age, 0);
}

function toNumber(value: unknown) {
  if (value === null || value === undefined || value === "") return null;
  const numberValue = Number(value);
  return Number.isFinite(numberValue) ? numberValue : null;
}

function toPeriodIndex(year: number, month: number) {
  return year * 12 + month - 1;
}

function fromPeriodIndex(index: number) {
  return {
    year: Math.floor(index / 12),
    month: (index % 12) + 1,
  };
}

function formatPeriod(year: number, month: number) {
  return `${MONTH_NAMES[month - 1]} ${year}`;
}

function normalizeMeasurements(
  measurements: InsightMeasurement[] = [],
): NormalizedMeasurement[] {
  const measurementsByPeriod = new Map<string, NormalizedMeasurement>();

  measurements.forEach((measurement) => {
    const bulan = toNumber(measurement.bulan);
    const tahun = toNumber(measurement.tahun);

    if (
      bulan === null ||
      tahun === null ||
      bulan < 1 ||
      bulan > 12 ||
      tahun < 1900
    ) {
      return;
    }

    measurementsByPeriod.set(`${tahun}-${bulan}`, {
      bulan,
      tahun,
      tglUkur: measurement.tglUkur,
      beratBadan: toNumber(measurement.beratBadan),
      tinggiBadan: toNumber(measurement.tinggiBadan),
      lingkarKepala: toNumber(measurement.lingkarKepala),
      lingkarLengan: toNumber(measurement.lingkarLengan ?? measurement.lila),
    });
  });

  return Array.from(measurementsByPeriod.values()).sort(
    (a, b) => toPeriodIndex(a.tahun, a.bulan) - toPeriodIndex(b.tahun, b.bulan),
  );
}

function buildAnalysisContext(balita: InsightBalita): AnalysisContext {
  const measurements = normalizeMeasurements(balita.pengukuran);
  const latest = measurements[measurements.length - 1];

  if (!latest) {
    return {
      ageInMonths: calculateAgeInMonths(balita.tglLahir),
      measurements,
      windowMeasurements: [],
      assessments: [],
      period: {
        label: "Belum tersedia",
        months: [],
        missingMonths: [],
        isConsecutive: false,
        note: "Belum ada pengukuran yang dapat dianalisis.",
      },
    };
  }

  const latestIndex = toPeriodIndex(latest.tahun, latest.bulan);
  const requiredIndexes = [latestIndex - 2, latestIndex - 1, latestIndex];
  const measurementByIndex = new Map(
    measurements.map((measurement) => [
      toPeriodIndex(measurement.tahun, measurement.bulan),
      measurement,
    ]),
  );
  const requiredPeriods = requiredIndexes.map(fromPeriodIndex);
  const windowMeasurements = requiredIndexes
    .map((index) => measurementByIndex.get(index))
    .filter((measurement): measurement is NormalizedMeasurement =>
      Boolean(measurement),
    );
  const months = requiredPeriods.map(({ year, month }) =>
    formatPeriod(year, month),
  );
  const missingMonths = requiredIndexes
    .filter((index) => !measurementByIndex.has(index))
    .map((index) => {
      const { year, month } = fromPeriodIndex(index);
      return formatPeriod(year, month);
    });
  const isConsecutive = missingMonths.length === 0;
  const assessments = windowMeasurements.map((measurement) =>
    assessWhoAnthropometry({
      sex: balita.jenisKelamin,
      birthDate: balita.tglLahir,
      measurementDate: measurement.tglUkur,
      year: measurement.tahun,
      month: measurement.bulan,
      weightKg: measurement.beratBadan,
      heightCm: measurement.tinggiBadan,
    }),
  );

  return {
    ageInMonths: calculateAgeInMonths(balita.tglLahir),
    measurements,
    windowMeasurements,
    assessments,
    period: {
      label: `${months[0]} - ${months[months.length - 1]}`,
      months,
      missingMonths,
      isConsecutive,
      note: isConsecutive
        ? ""
        : `Tren tiga bulan belum dapat disimpulkan karena data ${missingMonths.join(
            ", ",
          )} belum tersedia.`,
    },
  };
}

function formatNumber(value: number) {
  return Number.isInteger(value) ? value.toString() : value.toFixed(1);
}

function describeMetricChange(
  label: string,
  first: number | null,
  latest: number | null,
  unit: string,
) {
  if (first === null || latest === null) return null;

  const difference = Number((latest - first).toFixed(2));
  if (difference === 0) {
    return `${label} tercatat tetap ${formatNumber(latest)} ${unit}.`;
  }

  return `${label} ${difference > 0 ? "naik" : "turun"} ${formatNumber(
    Math.abs(difference),
  )} ${unit}, dari ${formatNumber(first)} menjadi ${formatNumber(latest)} ${unit}.`;
}

function getAdjacentPairs(measurements: NormalizedMeasurement[]) {
  return measurements
    .slice(1)
    .map((current, index) => ({
      previous: measurements[index],
      current,
    }))
    .filter(
      ({ previous, current }) =>
        toPeriodIndex(current.tahun, current.bulan) -
          toPeriodIndex(previous.tahun, previous.bulan) ===
        1,
    );
}

function buildAnthropometrySummary(
  context: AnalysisContext,
): GrowthInsightResponse["anthropometry"] {
  const latestAssessment = context.assessments.at(-1);

  if (!latestAssessment) {
    return {
      calculated: false,
      period: null,
      ageDays: null,
      ageMonths: null,
      measurementMode: null,
      bmi: null,
      indicators: [],
      note: "Belum ada pengukuran yang dapat dihitung dengan standar antropometri WHO.",
    };
  }

  return {
    calculated: latestAssessment.calculated,
    period: latestAssessment.period,
    ageDays: latestAssessment.ageDays,
    ageMonths: latestAssessment.ageMonths,
    measurementMode: latestAssessment.measurementMode,
    bmi: latestAssessment.bmi,
    indicators: latestAssessment.indicators,
    note: latestAssessment.calculated
      ? "Z-score dihitung secara lokal dengan tabel LMS WHO. Interpretasi klinis tetap perlu dikonfirmasi oleh tenaga kesehatan."
      : latestAssessment.dataIssues.join(" "),
  };
}

function buildZScoreTrendItems(context: AnalysisContext) {
  if (!context.period.isConsecutive || context.assessments.length !== 3) {
    return [];
  }

  const first = context.assessments[0];
  const latest = context.assessments[2];
  const indicatorIds = ["haz", "waz", "whz", "baz"] as const;

  return indicatorIds.flatMap((id) => {
    const firstIndicator = first.indicators.find(
      (indicator) => indicator.id === id,
    );
    const latestIndicator = latest.indicators.find(
      (indicator) => indicator.id === id,
    );

    if (
      firstIndicator?.zScore === null ||
      firstIndicator?.zScore === undefined ||
      latestIndicator?.zScore === null ||
      latestIndicator?.zScore === undefined
    ) {
      return [];
    }

    const change = Number(
      (latestIndicator.zScore - firstIndicator.zScore).toFixed(2),
    );
    if (Math.abs(change) < 0.1) return [];

    return [
      `${latestIndicator.label} berubah dari z-score ${firstIndicator.zScore.toFixed(
        2,
      )} menjadi ${latestIndicator.zScore.toFixed(2)} (${change > 0 ? "naik" : "turun"} ${Math.abs(
        change,
      ).toFixed(2)} SD).`,
    ];
  });
}

function buildNutritionRiskItems(context: AnalysisContext) {
  const latestAssessment = context.assessments.at(-1);

  if (!latestAssessment?.calculated) {
    return [
      "Z-score belum dapat dihitung karena data umur, jenis kelamin, berat, atau panjang/tinggi belum memenuhi syarat kalkulasi.",
      ...(latestAssessment?.dataIssues ?? [
        "Belum ada pengukuran yang dapat dinilai.",
      ]),
    ];
  }

  return latestAssessment.indicators.map((indicator) => {
    if (indicator.zScore === null) {
      return `${indicator.label}: belum dapat dihitung. ${indicator.note ?? ""}`.trim();
    }

    const riskMeaning =
      indicator.id === "haz"
        ? indicator.zScore < -2
          ? "Hasil ini merupakan sinyal antropometri stunting yang perlu dikonfirmasi."
          : "Indikator ini digunakan untuk skrining stunting."
        : indicator.id === "waz"
          ? "Indikator ini menyaring berat badan kurang menurut umur."
          : indicator.id === "whz"
            ? "Indikator ini menyaring wasting dan kelebihan berat relatif terhadap panjang/tinggi."
            : "Indikator ini menyaring wasting, risiko gizi lebih, gizi lebih, dan obesitas menurut umur.";

    return `${indicator.label}: z-score ${indicator.zScore.toFixed(2)}, kategori ${indicator.classification}. ${indicator.note ?? riskMeaning}`;
  });
}

function buildAnomalyItems(context: AnalysisContext) {
  const items: string[] = [];
  const latestAssessment = context.assessments.at(-1);

  if (context.period.missingMonths.length > 0) {
    items.push(
      `Ada jeda pencatatan pada ${context.period.missingMonths.join(
        ", ",
      )}. Ini adalah keterbatasan data, bukan otomatis anomali pertumbuhan.`,
    );
  }

  getAdjacentPairs(context.windowMeasurements).forEach(
    ({ previous, current }) => {
      const currentPeriod = formatPeriod(current.tahun, current.bulan);

      if (
        previous.beratBadan !== null &&
        current.beratBadan !== null &&
        current.beratBadan < previous.beratBadan
      ) {
        items.push(
          `Berat badan turun pada ${currentPeriod}. Verifikasi hasil ukur, tanyakan kondisi sakit dan pola makan, lalu plot pada KMS sebelum menentukan tindak lanjut.`,
        );
      }

      if (
        previous.tinggiBadan !== null &&
        current.tinggiBadan !== null &&
        current.tinggiBadan < previous.tinggiBadan
      ) {
        items.push(
          `Panjang/tinggi badan lebih rendah pada ${currentPeriod}. Ulangi pengukuran karena panjang atau tinggi secara biologis tidak diharapkan berkurang.`,
        );
      }

      if (
        previous.lingkarKepala !== null &&
        current.lingkarKepala !== null &&
        current.lingkarKepala < previous.lingkarKepala
      ) {
        items.push(
          `Lingkar kepala lebih rendah pada ${currentPeriod}. Periksa posisi pita ukur dan lakukan pengukuran ulang.`,
        );
      }
    },
  );

  latestAssessment?.dataIssues.forEach((issue) => {
    items.push(issue);
  });
  latestAssessment?.indicators
    .filter((indicator) => indicator.note?.includes("batas biologis WHO"))
    .forEach((indicator) => {
      items.push(
        `${indicator.label}: ${indicator.note} Ulangi pengukuran sebelum hasil dipakai untuk keputusan.`,
      );
    });

  if (items.length === 0) {
    items.push(
      "Tidak terlihat penurunan angka yang jelas pada data berurutan yang tersedia. Hal ini belum membuktikan status gizi normal tanpa plotting kurva pertumbuhan.",
    );
  }

  return Array.from(new Set(items));
}

function buildRuleBasedResponse(
  context: AnalysisContext,
  providerStatus: GrowthInsightResponse["providerStatus"],
): GrowthInsightResponse {
  const anthropometry = buildAnthropometrySummary(context);

  if (context.measurements.length === 0) {
    return {
      source: "rules",
      providerStatus,
      status: "limited",
      period: context.period,
      anthropometry,
      sections: [
        {
          id: "analisis",
          ...SECTION_META.analisis,
          items: ["Belum ada riwayat pengukuran yang dapat dianalisis."],
        },
        {
          id: "risiko_gizi",
          ...SECTION_META.risiko_gizi,
          items: [
            "Risiko gizi belum dapat disaring karena data pengukuran belum tersedia.",
          ],
        },
        {
          id: "monitoring",
          ...SECTION_META.monitoring,
          items: [
            "Lakukan pengukuran berat, panjang/tinggi, dan lingkar kepala dengan alat serta teknik yang sesuai.",
          ],
        },
        {
          id: "anomali",
          ...SECTION_META.anomali,
          items: [
            "Anomali belum dapat diperiksa karena data pengukuran belum tersedia.",
          ],
        },
        {
          id: "rekomendasi",
          ...SECTION_META.rekomendasi,
          items: [
            "Kader: isi pengukuran awal dengan alat dan teknik yang sesuai, lalu catat pada sistem serta Buku KIA/KMS.",
            "Tenaga kesehatan: lakukan penilaian klinis apabila ada keluhan, tanda bahaya, atau hasil pengukuran yang meragukan.",
          ],
        },
      ],
      references: INSIGHT_REFERENCES,
    };
  }

  const first = context.windowMeasurements[0];
  const latest =
    context.windowMeasurements[context.windowMeasurements.length - 1];
  const analysisItems = context.period.isConsecutive
    ? [
        `Data ${context.period.label} lengkap dan dapat digunakan untuk membaca tren tiga bulan.`,
        ...[
          describeMetricChange(
            "Berat badan",
            first?.beratBadan ?? null,
            latest?.beratBadan ?? null,
            "kg",
          ),
          describeMetricChange(
            "Panjang/tinggi badan",
            first?.tinggiBadan ?? null,
            latest?.tinggiBadan ?? null,
            "cm",
          ),
          describeMetricChange(
            "Lingkar kepala",
            first?.lingkarKepala ?? null,
            latest?.lingkarKepala ?? null,
            "cm",
          ),
          describeMetricChange(
            "Lingkar lengan",
            first?.lingkarLengan ?? null,
            latest?.lingkarLengan ?? null,
            "cm",
          ),
        ].filter((item): item is string => Boolean(item)),
      ]
    : [
        "Tren tiga bulan berturut-turut belum dapat disimpulkan.",
        `Jendela analisis adalah ${context.period.label}, tetapi data ${context.period.missingMonths.join(
          ", ",
        )} belum tersedia.`,
        "Perbandingan antarbulan yang tersedia hanya boleh dipakai sebagai observasi terbatas, bukan kesimpulan tren tiga bulan.",
      ];

  const anomalyItems = buildAnomalyItems(context);
  const nutritionRiskItems = buildNutritionRiskItems(context);
  const zScoreTrendItems = buildZScoreTrendItems(context);
  const concerningIndicators = anthropometry.indicators.filter(
    (indicator) =>
      indicator.status === "warning" || indicator.status === "critical",
  );
  const hasNutritionWarning = concerningIndicators.length > 0;
  const nutritionAction = hasNutritionWarning
    ? `Kader: ulangi dan verifikasi pengukuran, tandai hasil ${concerningIndicators
        .map((indicator) => indicator.label)
        .join(
          ", ",
        )}, lalu konsultasikan ke bidan, nutrisionis, atau Puskesmas untuk konfirmasi dan tindak lanjut.`
    : "Kader: lanjutkan pemantauan dan konfirmasi hasil pada KMS/Buku KIA; tenaga kesehatan menilai kebutuhan konseling, pemantauan lebih sering, atau rujukan.";
  const hasMeasurementWarning = anomalyItems.some(
    (item) =>
      item.includes("turun") ||
      item.includes("lebih rendah") ||
      item.includes("jeda"),
  );
  const followUpAction =
    !hasNutritionWarning && hasMeasurementWarning
      ? "Kader: ulangi pengukuran yang meragukan, lengkapi KMS/Buku KIA, lalu konsultasikan hasil yang tetap bermasalah ke bidan, nutrisionis, atau Puskesmas."
      : nutritionAction;

  return {
    source: "rules",
    providerStatus,
    status:
      context.period.isConsecutive && anthropometry.calculated
        ? "ready"
        : "limited",
    period: context.period,
    anthropometry,
    sections: [
      {
        id: "analisis",
        ...SECTION_META.analisis,
        items: [
          ...analysisItems,
          ...zScoreTrendItems,
          context.period.isConsecutive
            ? "Perubahan angka dan z-score digunakan untuk skrining dini, kemudian dikonfirmasi melalui kurva pertumbuhan dan pemeriksaan tenaga kesehatan."
            : "Karena periodenya tidak lengkap, sistem tidak memberikan kesimpulan risiko pertumbuhan tiga bulan.",
        ],
      },
      {
        id: "risiko_gizi",
        ...SECTION_META.risiko_gizi,
        items: nutritionRiskItems,
      },
      {
        id: "monitoring",
        ...SECTION_META.monitoring,
        items: [
          "Pantau perubahan z-score PB/TB/U, BB/U, BB/PB-TB, dan IMT/U setiap bulan, bukan hanya perubahan angka mentah.",
          "Gunakan alat, posisi tubuh, dan teknik pengukuran yang konsisten setiap bulan.",
          "Catat riwayat makan, nafsu makan, sakit, diare, demam, serta perubahan aktivitas yang dapat memengaruhi hasil.",
        ],
      },
      {
        id: "anomali",
        ...SECTION_META.anomali,
        items: anomalyItems,
      },
      {
        id: "rekomendasi",
        ...SECTION_META.rekomendasi,
        items: [
          ...(context.period.missingMonths.length > 0
            ? [
                `Periksa apakah hasil ${context.period.missingMonths.join(
                  ", ",
                )} pernah dicatat di Buku KIA atau arsip Posyandu.`,
              ]
            : []),
          "Lanjutkan pengukuran pada bulan berikutnya agar tren tetap berurutan.",
          followUpAction,
          "Keluhan, tanda bahaya, atau dugaan penyakit tidak dapat dinilai dari antropometri saja dan memerlukan pemeriksaan tenaga kesehatan.",
        ],
      },
    ],
    references: INSIGHT_REFERENCES,
  };
}

function formatMeasurement(
  measurement: NormalizedMeasurement,
  assessment?: WhoAnthroAssessment,
) {
  return {
    periode: formatPeriod(measurement.tahun, measurement.bulan),
    tanggalUkur: measurement.tglUkur ?? null,
    beratBadanKg: measurement.beratBadan,
    tinggiBadanCm: measurement.tinggiBadan,
    lingkarKepalaCm: measurement.lingkarKepala,
    lingkarLenganCm: measurement.lingkarLengan,
    umurHari: assessment?.ageDays ?? null,
    zScores:
      assessment?.indicators.map((indicator) => ({
        id: indicator.id,
        nilai: indicator.zScore,
        kategori: indicator.classification,
        catatan: indicator.note ?? null,
      })) ?? [],
  };
}

function buildPrompt(
  balita: InsightBalita,
  context: AnalysisContext,
  ruleBased: GrowthInsightResponse,
) {
  return [
    {
      role: "system",
      content:
        "Kamu adalah asisten skrining pertumbuhan untuk kader Posyandu dengan cara berpikir klinis yang hati-hati dan bahasa dokter anak yang profesional, tetapi bukan dokter pengganti. Sistem sudah menghitung z-score secara deterministik dari tabel LMS WHO; jangan menghitung ulang, mengubah nilai, atau mengubah kategori yang diberikan. Analisis pola tiga bulan berturut-turut yang mungkin terlewat kader: z-score memburuk atau melewati ambang, berat turun atau tidak naik, pertumbuhan linear stagnan, angka antropometri menurun secara biologis, data hilang, dan ketidakseimbangan berat terhadap tinggi. Gunakan WHO Child Growth Standards, Permenkes No. 2 Tahun 2020, KMS/Buku KIA Kementerian Kesehatan RI, dan prinsip UNICEF mengenai pencegahan, konseling pengasuh, serta rujukan. TB/PB menurut umur menyaring stunting, BB menurut umur menyaring underweight, sedangkan BB menurut PB/TB dan IMT menurut umur menyaring wasting atau kelebihan gizi. Antropometri tidak dapat mendiagnosis penyakit penyerta. Jangan mengarang gejala, ambang, pemeriksaan, obat, atau diagnosis. Tren tiga bulan hanya boleh disebut bila period.isConsecutive bernilai true; jika false, jelaskan bias bulan yang hilang.",
    },
    {
      role: "user",
      content: JSON.stringify({
        task: "Perkaya insight menjadi JSON untuk lima kategori. Gunakan hanya data, hasil z-score, dan temuan awal yang diberikan.",
        outputSchema: {
          analisis: ["maksimal 3 kalimat singkat"],
          risiko_gizi: [
            "maksimal 4 hasil indeks antropometri tanpa mengubah nilai atau kategori",
          ],
          monitoring: ["maksimal 3 tindakan pemantauan"],
          anomali: ["maksimal 3 temuan atau keterbatasan data"],
          rekomendasi: [
            "maksimal 3 rekomendasi dan tindakan yang membedakan kader dengan tenaga kesehatan",
          ],
        },
        child: {
          jenisKelamin: balita.jenisKelamin ?? "tidak diketahui",
          usiaBulan: ruleBased.anthropometry.ageMonths ?? context.ageInMonths,
        },
        period: context.period,
        latestAnthropometry: ruleBased.anthropometry,
        measurements: context.windowMeasurements.map((measurement, index) =>
          formatMeasurement(measurement, context.assessments[index]),
        ),
        ruleBasedSections: Object.fromEntries(
          ruleBased.sections.map((section) => [section.id, section.items]),
        ),
      }),
    },
  ];
}

function getStringArray(value: unknown) {
  if (!Array.isArray(value)) return null;

  const items = value
    .filter((item): item is string => typeof item === "string")
    .map((item) => item.trim())
    .filter(Boolean)
    .slice(0, 3);

  return items.length > 0 ? items : null;
}

function mergeAiSections(
  content: string,
  ruleBased: GrowthInsightResponse,
): GrowthInsightSection[] | null {
  try {
    const parsed = JSON.parse(content) as Record<string, unknown>;
    const sectionIds = Object.keys(SECTION_META) as GrowthInsightSectionId[];
    const sections = sectionIds.map((id) => {
      const aiItems = getStringArray(parsed[id]);
      const ruleSection = ruleBased.sections.find(
        (section) => section.id === id,
      );
      const mustUseRules =
        id === "risiko_gizi" ||
        id === "anomali" ||
        id === "rekomendasi" ||
        (!ruleBased.period.isConsecutive && id === "analisis");

      return {
        id,
        ...SECTION_META[id],
        items:
          !mustUseRules && aiItems
            ? aiItems
            : (ruleSection?.items ?? ["Belum ada insight untuk bagian ini."]),
      };
    });

    return sections;
  } catch {
    return null;
  }
}

function withProviderStatus(
  response: GrowthInsightResponse,
  providerStatus: GrowthInsightResponse["providerStatus"],
) {
  return {
    ...response,
    providerStatus,
  };
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const balita = body?.balita as InsightBalita | undefined;

    if (!balita) {
      return NextResponse.json(
        { message: "Data balita tidak ditemukan untuk dibuat insight." },
        { status: 400 },
      );
    }

    const context = buildAnalysisContext(balita);
    const apiKey = process.env.GROQ_API_KEY;
    const ruleBased = buildRuleBasedResponse(
      context,
      apiKey ? "ok" : "not_configured",
    );

    if (!apiKey || context.measurements.length === 0) {
      return NextResponse.json(ruleBased);
    }

    let response: Response;

    try {
      response = await fetch(GROQ_API_URL, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: GROQ_MODEL,
          messages: buildPrompt(balita, context, ruleBased),
          temperature: 0.1,
          max_completion_tokens: 900,
          response_format: { type: "json_object" },
        }),
      });
    } catch (error) {
      console.error("[ai-insight] Groq connection failed", error);
      return NextResponse.json(withProviderStatus(ruleBased, "provider_error"));
    }

    if (!response.ok) {
      const providerError = await response.json().catch(() => null);
      console.error("[ai-insight] Groq request failed", {
        status: response.status,
        message: providerError?.error?.message ?? "Unknown provider error",
      });
      return NextResponse.json(withProviderStatus(ruleBased, "provider_error"));
    }

    const data = await response.json();
    const content = data?.choices?.[0]?.message?.content?.trim();
    const sections =
      typeof content === "string" ? mergeAiSections(content, ruleBased) : null;

    if (!sections) {
      console.error("[ai-insight] Groq returned an invalid structured result");
      return NextResponse.json(
        withProviderStatus(ruleBased, "invalid_response"),
      );
    }

    return NextResponse.json({
      ...ruleBased,
      source: "groq",
      providerStatus: "ok",
      sections,
    } satisfies GrowthInsightResponse);
  } catch (error) {
    console.error("[ai-insight] Unexpected failure", error);

    return NextResponse.json(
      {
        message: "Insight pertumbuhan belum dapat diproses.",
      },
      { status: 500 },
    );
  }
}
