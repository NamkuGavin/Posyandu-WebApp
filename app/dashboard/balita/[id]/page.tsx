"use client";

import { useState, useEffect } from "react";
import {
  Activity,
  ArrowLeft,
  Trash2,
  PencilLine,
  User,
  PackageCheck,
  Sparkles,
  Baby,
  ChevronDown,
  AlertTriangle,
  Database,
  Lightbulb,
  ShieldAlert,
  ShieldCheck,
  TrendingUp,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import Navbar from "@/components/layout/Navbar";
import Card from "@/components/ui/Card";
import { InfoPanel, PageStatusState } from "@/components/ui/PageParts";
import { getBalitaById, deleteBalita, getEvaluasi } from "@/lib/api";
import { useCurrentProfile } from "@/lib/useCurrentProfile";
import { isCompletedMeasurement } from "@/lib/measurement-status";
import {
  Balita,
  GrowthInsightResponse,
  GrowthInsightSectionId,
  Pengukuran,
} from "@/types";
import { useToast } from "@/components/ui/Toast";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";

const GrafikPertumbuhan = ({
  riwayat,
  activeTab,
  year,
}: {
  riwayat: Pengukuran[];
  activeTab: string;
  year: string;
}) => {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    let isActive = true;

    Promise.resolve().then(() => {
      if (isActive) setMounted(true);
    });

    return () => {
      isActive = false;
    };
  }, []);

  const keyMap = {
    Berat: "beratBadan",
    Panjang: "tinggiBadan",
    "L. Kepala": "lingkarKepala",
    "L. Lengan": "lingkarLengan",
  };

  const unitMap = {
    Berat: "kg",
    Panjang: "cm",
    "L. Kepala": "cm",
    "L. Lengan": "cm",
  };

  const metricKey = keyMap[activeTab as keyof typeof keyMap];
  const unit = unitMap[activeTab as keyof typeof unitMap];

  const chartData = riwayat
    .filter((p) => p.tahun.toString() === year)
    .sort((a, b) => a.bulan - b.bulan)
    .map((p) => {
      const monthsOrder = [
        "Jan",
        "Feb",
        "Mar",
        "Apr",
        "Mei",
        "Jun",
        "Jul",
        "Ags",
        "Sep",
        "Okt",
        "Nov",
        "Des",
      ];
      return {
        ...p,
        bulanStr: monthsOrder[p.bulan - 1],
      };
    });

  if (!mounted) {
    return (
      <div className="w-full h-[220px] flex items-center justify-center bg-gray-50/50 rounded-xl border border-gray-100">
        <div className="w-6 h-6 border-2 border-teal-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (chartData.length === 0) {
    return (
      <div className="w-full h-[220px] flex items-center justify-center bg-gray-50/50 rounded-xl border border-gray-100 text-xs font-semibold text-gray-400">
        Belum ada data pengukuran pada tahun {year}
      </div>
    );
  }

  return (
    <div className="w-full mt-6 pb-2">
      <div className="w-full h-[220px] relative">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={chartData}
            margin={{ top: 15, right: 15, left: -20, bottom: 5 }}
          >
            <CartesianGrid
              strokeDasharray="3 3"
              vertical={true}
              stroke="#f3f4f6"
            />
            <XAxis
              dataKey="bulanStr"
              tick={{ fill: "#4b5563", fontSize: 11, fontWeight: "bold" }}
              axisLine={{ stroke: "#d1d5db", strokeWidth: 1.5 }}
              tickLine={{ stroke: "#d1d5db" }}
            />
            <YAxis
              tick={{ fill: "#4b5563", fontSize: 11, fontWeight: "bold" }}
              axisLine={{ stroke: "#d1d5db", strokeWidth: 1.5 }}
              tickLine={{ stroke: "#d1d5db" }}
              domain={["auto", "auto"]}
            />
            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const data = payload[0].payload;
                  return (
                    <div className="bg-white px-3 py-2 border border-teal-100 rounded-xl shadow-lg shadow-teal-50/50 text-xs font-bold font-sans">
                      <p className="text-gray-500">
                        {data.bulanStr} {data.tahun}
                      </p>
                      <p className="text-teal-600 mt-0.5">
                        {activeTab}: {data[metricKey]} {unit}
                      </p>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Line
              type="monotone"
              dataKey={metricKey}
              stroke="#1fb999"
              strokeWidth={3}
              dot={{ r: 5, fill: "#fff", stroke: "#1fb999", strokeWidth: 2 }}
              activeDot={{
                r: 7,
                fill: "#1fb999",
                stroke: "#fff",
                strokeWidth: 2,
              }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
      <p className="text-center text-xs font-bold text-gray-400 mt-2">
        Satuan: {unit}
      </p>
    </div>
  );
};

const INSIGHT_TABS: {
  id: GrowthInsightSectionId;
  label: string;
  icon: LucideIcon;
}[] = [
  { id: "analisis", label: "Analisis", icon: Activity },
  { id: "risiko_gizi", label: "Risiko Gizi", icon: ShieldAlert },
  { id: "monitoring", label: "Monitoring", icon: TrendingUp },
  { id: "anomali", label: "Anomali", icon: AlertTriangle },
  {
    id: "rekomendasi",
    label: "Rekomendasi & Tindakan",
    icon: Lightbulb,
  },
];

const CLIENT_INSIGHT_FALLBACK: GrowthInsightResponse = {
  source: "rules",
  providerStatus: "provider_error",
  status: "limited",
  period: {
    label: "Belum tersedia",
    months: [],
    missingMonths: [],
    isConsecutive: false,
    note: "Insight belum dapat dimuat dari server.",
  },
  anthropometry: {
    calculated: false,
    period: null,
    ageDays: null,
    ageMonths: null,
    measurementMode: null,
    bmi: null,
    indicators: [],
    note: "Perhitungan antropometri belum tersedia.",
  },
  sections: INSIGHT_TABS.map((tab) => ({
    id: tab.id,
    title: tab.label,
    tone:
      tab.id === "anomali"
        ? "warning"
        : tab.id === "rekomendasi"
          ? "action"
          : "neutral",
    items: ["Data insight untuk bagian ini belum tersedia."],
  })),
  references: [],
};

export default function DetailBalitaPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const [balita, setBalita] = useState<Balita | null>(null);
  const [loadState, setLoadState] = useState<"loading" | "success" | "error">(
    "loading",
  );
  const { isAdmin, isLoading: isRoleLoading } = useCurrentProfile();

  // State untuk konfirmasi hapus inline & Toast
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [alasanHapus, setAlasanHapus] = useState("Pindah Alamat");
  const [catatanHapus, setCatatanHapus] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const { success, warning } = useToast();

  // State untuk interaktivitas
  const [activeChartTab, setActiveChartTab] = useState("Berat");
  const [selectedYearGraph, setSelectedYearGraph] = useState(
    new Date().getFullYear().toString(),
  );
  const [selectedYearHistory, setSelectedYearHistory] = useState(
    new Date().getFullYear().toString(),
  );
  const chartTabs = ["Berat", "Panjang", "L. Kepala", "L. Lengan"];
  const currentMonth = new Date().getMonth() + 1;
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: currentYear - 2015 + 1 }, (_, i) =>
    (currentYear - i).toString(),
  );

  // State untuk persiapan integrasi AI
  const [isAiLoading, setIsAiLoading] = useState(true);
  const [aiInsight, setAiInsight] = useState<GrowthInsightResponse | null>(
    null,
  );
  const [activeInsightTab, setActiveInsightTab] =
    useState<GrowthInsightSectionId>("analisis");
  const [isInsightFilterOpen, setIsInsightFilterOpen] = useState(false);

  useEffect(() => {
    let isActive = true;

    Promise.resolve().then(() => {
      if (isActive) setLoadState("loading");
    });

    getBalitaById(id)
      .then((found) => {
        if (!isActive) return;
        if (!found) {
          setLoadState("error");
          return;
        }

        setBalita(found);
        setLoadState("success");
      })
      .catch((err) => {
        console.error(err);
        if (isActive) setLoadState("error");
      });

    return () => {
      isActive = false;
    };
  }, [id]);

  useEffect(() => {
    if (!balita) return;
    let isActive = true;

    Promise.resolve().then(() => {
      if (isActive) setIsAiLoading(true);
    });

    getEvaluasi({
      ...balita,
      pengukuran: balita.pengukuran?.filter(isCompletedMeasurement),
    })
      .then((data) => {
        if (isActive) setAiInsight(data);
      })
      .catch(() => {
        if (isActive) setAiInsight(CLIENT_INSIGHT_FALLBACK);
      })
      .finally(() => {
        if (isActive) setIsAiLoading(false);
      });

    return () => {
      isActive = false;
    };
  }, [balita]);

  if (loadState !== "success" || !balita || balita.id !== id) {
    return (
      <div className="min-h-screen bg-gray-50 text-black font-sans pb-10">
        <Navbar title="Detail Balita" />
        <main className="p-4 sm:p-6 max-w-6xl mx-auto mt-2">
          <PageStatusState
            tone={loadState === "error" ? "error" : "loading"}
            title={
              loadState === "error"
                ? "Detail balita belum bisa dimuat"
                : "Memuat detail balita"
            }
            description={
              loadState === "error"
                ? "Terjadi gangguan saat mengambil data balita dan riwayat pengukurannya. Coba muat ulang halaman."
                : "Mengambil data balita dan seluruh riwayat pengukuran."
            }
          />
        </main>
      </div>
    );
  }

  const pengukuranHistory = (balita.pengukuran ?? []).filter(
    isCompletedMeasurement,
  );
  const isMeasuredThisMonth = pengukuranHistory.some(
    (p) =>
      p.bulan === currentMonth &&
      p.tahun === currentYear &&
      isCompletedMeasurement(p),
  );
  const activeInsightSection = aiInsight?.sections.find(
    (section) => section.id === activeInsightTab,
  );
  const activeInsightTabMeta =
    INSIGHT_TABS.find((tab) => tab.id === activeInsightTab) ?? INSIGHT_TABS[0];
  const ActiveInsightIcon = activeInsightTabMeta.icon;
  const isAiProviderActive = aiInsight?.source === "groq";
  const hasAiProviderIssue =
    aiInsight !== null && aiInsight.providerStatus !== "ok";
  const isWarningInsight = activeInsightSection?.tone === "warning";

  const actionButtons = [
    {
      icon: PencilLine,
      label: "Ukur",
      path: `/dashboard/balita/${id}/ukur`,
    },
    {
      icon: User,
      label: "Edit Data",
      path: `/dashboard/balita/${id}/edit`,
    },
    {
      icon: PackageCheck,
      label: "Absen",
      path: `/dashboard/absen`,
    },
  ];
  const isPermintaanWali = alasanHapus === "Permintaan wali";
  const trimmedCatatanHapus = catatanHapus.trim();
  const isDeleteDisabled =
    isDeleting || (isPermintaanWali && trimmedCatatanHapus.length === 0);

  const closeDeleteModal = () => {
    setIsDeleteModalOpen(false);
    setAlasanHapus("Pindah Alamat");
    setCatatanHapus("");
    setIsDeleting(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 text-black font-sans pb-10">
      <Navbar title="Detail Balita" />

      <main className="p-4 sm:p-6 max-w-6xl mx-auto space-y-6 mt-2">
        {/* Header */}
        <div className="flex items-center justify-between relative h-10">
          <Link
            href="/dashboard/balita"
            className="w-10 h-10 rounded-full border border-gray-200 flex items-center justify-center hover:bg-gray-100 transition-colors bg-white shadow-sm z-10"
          >
            <ArrowLeft size={20} className="text-black" />
          </Link>
          <h1 className="text-lg font-bold text-black absolute left-1/2 -translate-x-1/2 w-full text-center pointer-events-none">
            Detail Balita
          </h1>
          {!isRoleLoading && !isAdmin ? (
            <button
              onClick={() => setIsDeleteModalOpen(true)}
              className="text-red-500 p-2 hover:bg-red-50 rounded-xl transition-colors z-10 active:scale-95 cursor-pointer"
            >
              <Trash2 size={20} />
            </button>
          ) : (
            <div className="w-10 h-10" />
          )}
        </div>

        <InfoPanel title="Panduan detail balita">
          Gunakan tombol Ukur untuk menambah pengukuran, Edit Data untuk
          memperbaiki biodata atau pengukuran yang sudah ada, dan lihat grafik
          untuk memantau perubahan dari bulan ke bulan.
        </InfoPanel>

        {isAdmin && (
          <InfoPanel title="Mode admin baca saja" icon={ShieldCheck}>
            Admin dapat melihat detail, grafik, dan riwayat pengukuran balita,
            tetapi aksi ukur, edit, absen, dan hapus hanya dilakukan oleh kader.
          </InfoPanel>
        )}

        {/* Responsive Grid Wrapper */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          {/* Left Column: Profile Card, Actions, & AI Analysis */}
          <div className="space-y-6">
            {/* Profile Card */}
            <Card className="p-5 bg-white border border-gray-100 shadow-sm rounded-xl">
              <div className="flex flex-col gap-4">
                <div className="flex items-center gap-4">
                  <div
                    className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 ${
                      balita.jenisKelamin === "PEREMPUAN"
                        ? "bg-[#fce5f1] text-pink-500"
                        : "bg-[#e5f5fd] text-sky-500"
                    }`}
                  >
                    <Baby size={24} />
                  </div>
                  <div>
                    <h5 className="text-sm font-bold text-black">
                      {balita.nama}
                    </h5>
                    <p className="text-xs text-gray-700 mt-1">
                      {balita.jenisKelamin === "PEREMPUAN"
                        ? "Perempuan"
                        : "Laki-laki"}
                    </p>
                    <p className="text-xs text-gray-700 mt-0.5">
                      {balita.namaWali} • {balita.alamat} RT {balita.rt}/RW{" "}
                      {balita.rw}
                    </p>
                  </div>
                </div>

                <div
                  className={`self-start px-4 py-1.5 rounded-full text-xs font-bold ${
                    isMeasuredThisMonth
                      ? "bg-[#e6fbf5] text-[#0d9488]"
                      : "bg-[#fff5ea] text-orange-600"
                  }`}
                >
                  {isMeasuredThisMonth ? "Sudah diukur" : "Belum diukur"}
                </div>
              </div>
            </Card>

            {/* Action Buttons */}
            {!isRoleLoading && !isAdmin && (
              <div className="grid grid-cols-3 gap-3">
                {actionButtons.map((action, idx) => (
                  <button
                    key={idx}
                    type="button"
                    title={action.label}
                    onClick={() => router.push(action.path)}
                    className="group flex flex-col items-center justify-center gap-2 bg-white border border-gray-100 py-3 rounded-2xl transition-all duration-300 hover:border-teal-200 hover:shadow-md hover:shadow-teal-50 hover:-translate-y-1 active:scale-95 cursor-pointer"
                  >
                    <div className="text-[#0d9488] transition-transform duration-300 group-hover:scale-110">
                      <action.icon size={20} strokeWidth={2.5} />
                    </div>
                    <span className="text-[11px] font-bold text-[#0d9488]">
                      {action.label}
                    </span>
                  </button>
                ))}
              </div>
            )}

            {/* Analisis AI */}
            <div className="border border-[#1fb999]/30 bg-[#f0fbf9] rounded-xl p-5 relative">
              <div className="flex items-start justify-between gap-3 mb-4">
                <div className="flex items-center gap-2 min-w-0">
                  <Sparkles size={18} className="text-[#0d9488] shrink-0" />
                  <div>
                    <h4 className="font-bold text-sm text-[#0d9488]">
                      Insight Pertumbuhan
                    </h4>
                    <p className="text-[10px] font-semibold text-teal-700 mt-0.5">
                      Skrining dini pola yang perlu diperiksa lebih lanjut
                    </p>
                  </div>
                </div>
                {!isAiLoading && aiInsight && (
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-teal-100 bg-white px-2.5 py-1 text-[9px] font-black uppercase text-[#0d9488] whitespace-nowrap">
                    <Database size={11} />
                    {isAiProviderActive ? "AI + Data" : "Mode Data"}
                  </span>
                )}
              </div>

              {isAiLoading ? (
                <div className="space-y-3 mb-4 animate-pulse">
                  <div className="h-16 bg-teal-100 rounded-xl w-full" />
                  <div className="h-10 bg-teal-100 rounded-xl w-full" />
                  <div className="h-20 bg-teal-100 rounded-xl w-full" />
                </div>
              ) : aiInsight && activeInsightSection ? (
                <>
                  <div
                    className={`rounded-xl border p-3 mb-4 ${
                      aiInsight.period.isConsecutive
                        ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                        : "border-amber-200 bg-amber-50 text-amber-800"
                    }`}
                  >
                    <p className="text-[10px] font-black uppercase tracking-widest">
                      Periode Analisis
                    </p>
                    <p className="text-xs font-black mt-1">
                      {aiInsight.period.label}
                    </p>
                    <p className="text-[11px] font-semibold leading-relaxed mt-1">
                      {aiInsight.period.note}
                    </p>
                  </div>

                  {aiInsight.anthropometry.indicators.length > 0 && (
                    <div className="mb-4 border-y border-teal-100 py-3">
                      <div className="flex items-center justify-between gap-3 mb-2">
                        <div>
                          <p className="text-[10px] font-black uppercase text-gray-500">
                            Z-score WHO terbaru
                          </p>
                          <p className="text-[10px] font-semibold text-gray-600 mt-0.5">
                            Periode {aiInsight.anthropometry.period}
                            {aiInsight.anthropometry.ageMonths !== null
                              ? ` | usia ${aiInsight.anthropometry.ageMonths.toFixed(0)} bulan`
                              : ""}
                          </p>
                        </div>
                        {aiInsight.anthropometry.bmi !== null && (
                          <span className="text-[10px] font-black text-[#0d9488] whitespace-nowrap">
                            IMT {aiInsight.anthropometry.bmi.toFixed(2)}
                          </span>
                        )}
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {aiInsight.anthropometry.indicators.map((indicator) => {
                          const statusClass =
                            indicator.status === "critical"
                              ? "text-rose-700"
                              : indicator.status === "warning"
                                ? "text-amber-700"
                                : indicator.status === "normal"
                                  ? "text-emerald-700"
                                  : "text-gray-500";

                          return (
                            <div
                              key={indicator.id}
                              className="flex items-start justify-between gap-3 border-b border-teal-100 py-2 last:border-b-0"
                            >
                              <div className="min-w-0">
                                <p className="text-[10px] font-bold text-gray-600">
                                  {indicator.label}
                                </p>
                                <p
                                  className={`text-[10px] font-black mt-0.5 ${statusClass}`}
                                >
                                  {indicator.classification}
                                </p>
                              </div>
                              <span
                                className={`text-xs font-black whitespace-nowrap ${statusClass}`}
                              >
                                {indicator.zScore === null
                                  ? "N/A"
                                  : indicator.zScore.toFixed(2)}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                      <p className="text-[9px] font-semibold leading-relaxed text-gray-500 mt-2">
                        {aiInsight.anthropometry.note}
                      </p>
                    </div>
                  )}

                  <div className="relative mb-4">
                    <button
                      type="button"
                      aria-haspopup="menu"
                      aria-expanded={isInsightFilterOpen}
                      onClick={() =>
                        setIsInsightFilterOpen((isOpen) => !isOpen)
                      }
                      className="flex h-10 w-full items-center justify-between gap-3 rounded-lg border border-teal-200 bg-white px-3 text-left text-xs font-black text-gray-800 hover:border-teal-400"
                    >
                      <span className="flex min-w-0 items-center gap-2">
                        <ActiveInsightIcon
                          size={15}
                          className="shrink-0 text-[#0d9488]"
                        />
                        <span className="truncate">
                          {activeInsightTabMeta.label}
                        </span>
                      </span>
                      <ChevronDown
                        size={15}
                        className={`shrink-0 text-gray-500 transition-transform ${
                          isInsightFilterOpen ? "rotate-180" : ""
                        }`}
                      />
                    </button>

                    {isInsightFilterOpen && (
                      <div
                        role="menu"
                        className="absolute left-0 right-0 top-11 z-20 overflow-hidden rounded-lg border border-teal-100 bg-white p-1.5 shadow-xl"
                      >
                        {INSIGHT_TABS.map((tab) => {
                          const TabIcon = tab.icon;
                          const isActive = activeInsightTab === tab.id;

                          return (
                            <button
                              key={tab.id}
                              type="button"
                              role="menuitem"
                              onClick={() => {
                                setActiveInsightTab(tab.id);
                                setIsInsightFilterOpen(false);
                              }}
                              className={`flex min-h-9 w-full items-center gap-2 rounded-md px-2.5 py-2 text-left text-[11px] font-bold transition-colors ${
                                isActive
                                  ? "bg-teal-50 text-[#0d9488]"
                                  : "text-gray-700 hover:bg-gray-50"
                              }`}
                            >
                              <TabIcon size={14} className="shrink-0" />
                              <span>{tab.label}</span>
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  <div className="mb-4">
                    <div className="flex items-center gap-2 mb-2">
                      <ActiveInsightIcon
                        size={16}
                        className={
                          isWarningInsight ? "text-amber-600" : "text-[#0d9488]"
                        }
                      />
                      <h5 className="text-xs font-black text-gray-900">
                        {activeInsightSection.title}
                      </h5>
                    </div>
                    <div className="divide-y divide-teal-100">
                      {activeInsightSection.items.map((item, index) => (
                        <div
                          key={`${activeInsightSection.id}-${index}`}
                          className="flex gap-3 py-3 first:pt-1 last:pb-1"
                        >
                          <span
                            className={`mt-1.5 h-2 w-2 rounded-full shrink-0 ${
                              isWarningInsight ? "bg-amber-500" : "bg-[#1fb999]"
                            }`}
                          />
                          <p className="text-xs font-semibold leading-relaxed text-gray-800">
                            {item}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {hasAiProviderIssue && (
                    <p className="text-[10px] font-semibold leading-relaxed text-amber-700 mb-3">
                      Provider AI tidak aktif. Insight tetap dihitung dari
                      urutan periode dan perubahan angka pengukuran.
                    </p>
                  )}
                </>
              ) : (
                <p className="text-xs font-semibold text-gray-600 mb-4">
                  Insight pertumbuhan belum tersedia.
                </p>
              )}

              <p className="text-[10px] italic text-[#0d9488] opacity-80">
                Insight ini mendukung pencatatan dan skrining awal, bukan
                diagnosis atau pengganti pemeriksaan tenaga kesehatan.
              </p>
            </div>
          </div>

          {/* Right Column: Charts & History (spans 2 columns on lg) */}
          <div className="lg:col-span-2 space-y-6">
            {/* Grafik Pertumbuhan */}
            <Card className="p-5 bg-white border border-gray-100 shadow-sm rounded-xl">
              <div className="flex justify-between items-center mb-4">
                <h4 className="font-bold text-sm text-black">
                  Grafik Pertumbuhan
                </h4>
                <div className="relative">
                  <select
                    value={selectedYearGraph}
                    onChange={(e) => setSelectedYearGraph(e.target.value)}
                    className="appearance-none bg-white border border-gray-200 rounded-lg pl-3 pr-8 py-1.5 text-xs text-gray-700 font-bold focus:outline-none focus:ring-1 focus:ring-teal-500 cursor-pointer"
                  >
                    {years.map((y) => (
                      <option key={y} value={y}>
                        {y}
                      </option>
                    ))}
                  </select>
                  <ChevronDown
                    size={14}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 mb-6 overflow-x-auto pb-2 scrollbar-hide">
                {chartTabs.map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveChartTab(tab)}
                    className={`px-4 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all duration-300 active:scale-95 ${
                      activeChartTab === tab
                        ? "bg-[#1fb999] text-white shadow-md shadow-teal-200"
                        : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                    }`}
                  >
                    {tab}
                  </button>
                ))}
              </div>

              <GrafikPertumbuhan
                riwayat={pengukuranHistory}
                activeTab={activeChartTab}
                year={selectedYearGraph}
              />
            </Card>

            {/* Riwayat Pengukuran */}
            <Card className="p-5 bg-white border border-gray-100 shadow-sm rounded-xl overflow-hidden">
              <div className="flex justify-between items-center mb-4">
                <h4 className="font-bold text-sm text-black">
                  Riwayat Pengukuran
                </h4>
                <div className="relative">
                  <select
                    value={selectedYearHistory}
                    onChange={(e) => setSelectedYearHistory(e.target.value)}
                    className="appearance-none bg-white border border-gray-200 rounded-lg pl-3 pr-8 py-1.5 text-xs text-gray-700 font-bold focus:outline-none focus:ring-1 focus:ring-teal-500 cursor-pointer"
                  >
                    {years.map((y) => (
                      <option key={y} value={y}>
                        {y}
                      </option>
                    ))}
                  </select>
                  <ChevronDown
                    size={14}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none"
                  />
                </div>
              </div>

              <div className="w-full mt-2">
                <div className="grid grid-cols-5 text-[11px] font-bold text-gray-500 pb-3 border-b border-gray-100">
                  <div>Bulan</div>
                  <div className="text-center">BB</div>
                  <div className="text-center">PB</div>
                  <div className="text-center">LK</div>
                  <div className="text-center">LL</div>
                </div>
                {pengukuranHistory.filter(
                  (p) => p.tahun.toString() === selectedYearHistory,
                ).length > 0 ? (
                  pengukuranHistory
                    .filter((p) => p.tahun.toString() === selectedYearHistory)
                    .sort((a, b) => b.bulan - a.bulan)
                    .map((p, idx) => {
                      const monthsOrder = [
                        "Jan",
                        "Feb",
                        "Mar",
                        "Apr",
                        "Mei",
                        "Jun",
                        "Jul",
                        "Ags",
                        "Sep",
                        "Okt",
                        "Nov",
                        "Des",
                      ];
                      return (
                        <div
                          key={idx}
                          className="grid grid-cols-5 text-xs font-bold text-black py-3 border-b border-gray-50 last:border-0 hover:bg-gray-50 transition-colors"
                        >
                          <div>{monthsOrder[p.bulan - 1]}</div>
                          <div className="text-center text-gray-700">
                            {p.beratBadan}
                          </div>
                          <div className="text-center text-gray-700">
                            {p.tinggiBadan}
                          </div>
                          <div className="text-center text-gray-700">
                            {p.lingkarKepala}
                          </div>
                          <div className="text-center text-gray-700">
                            {p.lingkarLengan}
                          </div>
                        </div>
                      );
                    })
                ) : (
                  <p className="text-center py-6 text-xs text-gray-400 font-medium">
                    Belum ada riwayat pengukuran pada tahun{" "}
                    {selectedYearHistory}
                  </p>
                )}
              </div>
            </Card>
          </div>
        </div>
      </main>

      {/* Delete Confirmation Modal */}
      {isDeleteModalOpen && balita && !isAdmin && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-sm w-full text-center shadow-2xl relative overflow-hidden border border-red-50/50 animate-in zoom-in-95 slide-in-from-bottom-8 duration-300">
            <div className="mx-auto w-14 h-14 bg-rose-50 rounded-full flex items-center justify-center mb-4 text-rose-500">
              <Trash2 size={26} />
            </div>

            <h3 className="text-lg font-black text-black mb-2">
              Hapus Data Balita
            </h3>
            <p className="text-xs text-gray-600 leading-relaxed mb-6">
              Apakah Anda yakin ingin menghapus data{" "}
              <strong>{balita.nama}</strong>? Tindakan ini tidak dapat
              dibatalkan.
            </p>

            {/* Radio Options for Deletion Reason */}
            <div className="text-left space-y-3 mb-6">
              <p className="text-xs font-bold text-gray-500 ml-1">
                Alasan Penghapusan
              </p>
              {["Pindah Alamat", "Usia > 60", "Permintaan wali"].map((opt) => (
                <div
                  key={opt}
                  onClick={() => {
                    setAlasanHapus(opt);
                    if (opt !== "Permintaan wali") {
                      setCatatanHapus("");
                    }
                  }}
                  className={`flex items-center justify-between p-3.5 rounded-xl border cursor-pointer transition-all active:scale-[0.98] ${
                    alasanHapus === opt
                      ? "border-rose-400 bg-rose-50/30"
                      : "border-gray-200 bg-white"
                  }`}
                >
                  <span className="text-xs font-bold text-black">{opt}</span>
                  <div
                    className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                      alasanHapus === opt
                        ? "border-rose-500"
                        : "border-gray-300"
                    }`}
                  >
                    {alasanHapus === opt && (
                      <div className="w-2 h-2 rounded-full bg-rose-500"></div>
                    )}
                  </div>
                </div>
              ))}
              {isPermintaanWali && (
                <div className="space-y-2">
                  <label
                    htmlFor="catatan-hapus-balita"
                    className="text-xs font-bold text-gray-500 ml-1"
                  >
                    Catatan permintaan wali
                  </label>
                  <textarea
                    id="catatan-hapus-balita"
                    value={catatanHapus}
                    onChange={(event) => setCatatanHapus(event.target.value)}
                    maxLength={200}
                    rows={3}
                    placeholder="Contoh: wali meminta data dihapus karena pindah domisili"
                    className="w-full resize-none rounded-xl border border-gray-200 bg-white p-3 text-xs font-semibold text-black outline-none transition-all focus:border-rose-300 focus:ring-2 focus:ring-rose-100 placeholder:text-gray-400"
                  />
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-[10px] font-semibold text-gray-500">
                      Wajib diisi untuk alasan permintaan wali.
                    </p>
                    <p className="text-[10px] font-bold text-gray-400">
                      {catatanHapus.length}/200
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Warning Message */}
            <div className="flex items-center gap-3 p-3.5 rounded-xl border border-orange-200 bg-[#fffdf0] text-orange-600 text-left mb-6">
              <AlertTriangle size={18} className="shrink-0" />
              <span className="text-[11px] font-bold">
                Data akan dihapus dari daftar aktif
              </span>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-4">
              <button
                type="button"
                onClick={closeDeleteModal}
                className="flex-1 bg-white hover:bg-gray-50 active:scale-[0.99] border border-gray-300 text-gray-700 font-bold py-3 px-6 rounded-2xl shadow-sm transition-all duration-300 text-center cursor-pointer text-xs"
              >
                Batal
              </button>
              <button
                type="button"
                disabled={isDeleteDisabled}
                onClick={async () => {
                  if (isDeleteDisabled) return;

                  try {
                    const alasanMap: Record<string, string> = {
                      "Pindah Alamat": "PINDAH_ALAMAT",
                      "Usia > 60": "USIA_LEBIH_60_BULAN",
                      "Permintaan wali": "PERMINTAAN_WALI",
                    };
                    const mappedAlasan =
                      alasanMap[alasanHapus] || "PINDAH_ALAMAT";

                    if (
                      mappedAlasan === "PERMINTAAN_WALI" &&
                      !trimmedCatatanHapus
                    ) {
                      warning("Catatan permintaan wali wajib diisi.");
                      return;
                    }

                    setIsDeleting(true);
                    await deleteBalita(
                      id,
                      mappedAlasan,
                      mappedAlasan === "PERMINTAAN_WALI"
                        ? trimmedCatatanHapus
                        : undefined,
                    );
                    success(`Data balita ${balita.nama} berhasil dihapus!`);
                    closeDeleteModal();
                    router.push("/dashboard/balita");
                  } catch (err: unknown) {
                    alert(
                      err instanceof Error
                        ? err.message
                        : "Gagal menghapus balita",
                    );
                    setIsDeleting(false);
                  }
                }}
                className="flex-1 bg-rose-600 hover:bg-rose-700 active:scale-[0.99] text-white font-bold py-3.5 px-6 rounded-2xl shadow-lg shadow-rose-600/15 transition-all duration-300 text-center cursor-pointer text-xs disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:bg-rose-600"
              >
                {isDeleting ? "Menghapus..." : "Ya, Hapus"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
