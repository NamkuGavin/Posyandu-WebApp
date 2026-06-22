import {
  GrowthInsightSection,
  GrowthInsightSectionId,
} from "@/types";

export const GROQ_API_URL =
  process.env.GROQ_API_URL?.trim() ||
  "https://api.groq.com/openai/v1/chat/completions";

export const GROQ_MODEL =
  process.env.GROQ_MODEL?.trim() || "llama-3.1-8b-instant";

export const INSIGHT_REFERENCES = [
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

export const SECTION_META: Record<
  GrowthInsightSectionId,
  Pick<GrowthInsightSection, "title" | "tone">
> = {
  analisis: { title: "Analisis", tone: "neutral" },
  risiko_gizi: { title: "Sinyal Risiko Gizi", tone: "warning" },
  monitoring: { title: "Monitoring Pertumbuhan", tone: "info" },
  anomali: { title: "Anomali dan Kualitas Data", tone: "warning" },
  rekomendasi: { title: "Rekomendasi dan Tindakan", tone: "action" },
};
