import { NextResponse } from "next/server";

type InsightMeasurement = {
  bulan?: number;
  tahun?: number;
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

const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";
const GROQ_MODEL = "llama-3.1-8b-instant";
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

const AI_UNAVAILABLE_MESSAGE =
  "Insight AI sedang tidak tersedia. Untuk sementara, gunakan grafik dan riwayat pengukuran untuk melihat perubahan berat badan, panjang/tinggi badan, lingkar kepala, dan lingkar lengan.";

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

function normalizeMeasurements(measurements: InsightMeasurement[] = []) {
  return measurements
    .map((measurement) => ({
      bulan: toNumber(measurement.bulan),
      tahun: toNumber(measurement.tahun),
      beratBadan: toNumber(measurement.beratBadan),
      tinggiBadan: toNumber(measurement.tinggiBadan),
      lingkarKepala: toNumber(measurement.lingkarKepala),
      lingkarLengan: toNumber(
        measurement.lingkarLengan ?? measurement.lila,
      ),
    }))
    .filter((measurement) => measurement.bulan && measurement.tahun)
    .sort((a, b) => {
      if (a.tahun !== b.tahun) return Number(a.tahun) - Number(b.tahun);
      return Number(a.bulan) - Number(b.bulan);
    });
}

function formatMeasurement(measurement: ReturnType<typeof normalizeMeasurements>[number]) {
  const monthName = MONTH_NAMES[Number(measurement.bulan) - 1] ?? "Bulan";
  const lilaText =
    measurement.lingkarLengan === null
      ? "tidak ada"
      : `${measurement.lingkarLengan} cm`;

  return [
    `${monthName} ${measurement.tahun}`,
    `BB ${measurement.beratBadan ?? "tidak ada"} kg`,
    `PB/TB ${measurement.tinggiBadan ?? "tidak ada"} cm`,
    `LK ${measurement.lingkarKepala ?? "tidak ada"} cm`,
    `LILA ${lilaText}`,
  ].join(", ");
}

function buildPrompt(balita: InsightBalita) {
  const ageInMonths = calculateAgeInMonths(balita.tglLahir);
  const measurements = normalizeMeasurements(balita.pengukuran);
  const latestMeasurements = measurements.slice(-6);
  const latestThree = measurements.slice(-3);
  const analysisMode =
    measurements.length >= 3
      ? "Analisis tren berdasarkan 3 data pengukuran terakhir."
      : "Data kurang dari 3, berikan insight terbatas dari data yang tersedia dan jangan menyimpulkan tren 3 bulan.";

  return {
    hasMeasurements: measurements.length > 0,
    messages: [
      {
        role: "system",
        content:
          "Kamu adalah asisten AI untuk kader Posyandu. Jawab dalam Bahasa Indonesia yang ringkas, praktis, dan hati-hati. Gunakan prinsip pemantauan pertumbuhan balita Posyandu/WHO: pantau tren BB, PB/TB, LK, dan LILA sesuai usia dan jenis kelamin; kenaikan yang konsisten umumnya baik; berat turun/mandek atau pertumbuhan tidak bertambah perlu dicermati. Jangan membuat diagnosis, jangan memberi status gizi pasti, dan jangan mengarang angka standar WHO. Ingatkan bahwa kepastian perlu plotting KMS/Buku KIA atau kurva WHO dan pemeriksaan tenaga kesehatan bila ada tanda risiko.",
      },
      {
        role: "user",
        content: [
          "Buat insight pertumbuhan balita untuk kader.",
          `Jenis kelamin: ${balita.jenisKelamin ?? "tidak diketahui"}.`,
          `Usia saat ini: ${
            ageInMonths === null ? "tidak diketahui" : `${ageInMonths} bulan`
          }.`,
          `Jumlah data pengukuran: ${measurements.length}.`,
          analysisMode,
          `Data terbaru yang tersedia: ${latestMeasurements
            .map(formatMeasurement)
            .join(" | ")}.`,
          `Fokus 3 data terakhir jika ada: ${latestThree
            .map(formatMeasurement)
            .join(" | ") || "belum ada"}.`,
          "Format jawaban 3-5 kalimat. Sebutkan pengamatan utama, hal yang perlu dipantau, dan tindak lanjut yang aman untuk kader.",
        ].join("\n"),
      },
    ],
  };
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const balita = body?.balita as InsightBalita | undefined;

    if (!balita) {
      return NextResponse.json(
        { analisis: "Data balita tidak ditemukan untuk dibuat insight." },
        { status: 400 },
      );
    }

    const prompt = buildPrompt(balita);

    if (!prompt.hasMeasurements) {
      return NextResponse.json({
        analisis:
          "Belum ada riwayat pengukuran yang bisa dianalisis. Isi data pengukuran terlebih dahulu, lalu pantau grafik dan riwayat untuk melihat perubahan pertumbuhan balita.",
        source: "placeholder",
      });
    }

    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      return NextResponse.json({
        analisis: AI_UNAVAILABLE_MESSAGE,
        source: "placeholder",
      });
    }

    const response = await fetch(GROQ_API_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: GROQ_MODEL,
        messages: prompt.messages,
        temperature: 0.2,
        max_completion_tokens: 320,
      }),
    });

    if (!response.ok) {
      return NextResponse.json({
        analisis: AI_UNAVAILABLE_MESSAGE,
        source: "placeholder",
      });
    }

    const data = await response.json();
    const analisis = data?.choices?.[0]?.message?.content?.trim();

    return NextResponse.json({
      analisis: analisis || AI_UNAVAILABLE_MESSAGE,
      source: analisis ? "groq" : "placeholder",
    });
  } catch {
    return NextResponse.json({
      analisis: AI_UNAVAILABLE_MESSAGE,
      source: "placeholder",
    });
  }
}
