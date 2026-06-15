"use client";

import { useState, useEffect } from "react";
import {
  ArrowLeft,
  Trash2,
  PencilLine,
  User,
  PackageCheck,
  Sparkles,
  Baby,
  ChevronDown,
  AlertTriangle,
} from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import Navbar from "@/components/layout/Navbar";
import Card from "@/components/ui/Card";
import { InfoPanel } from "@/components/ui/PageParts";
import { getBalitaById, deleteBalita, getEvaluasi } from "@/lib/api";
import { Balita } from "@/types";
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
  riwayat: any[];
  activeTab: string;
  year: string;
}) => {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
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

const AI_FALLBACK_TEXT =
  "Insight AI sedang tidak tersedia. Untuk sementara, gunakan grafik dan riwayat pengukuran untuk melihat perkembangan balita.";

export default function DetailBalitaPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const [balita, setBalita] = useState<Balita | null>(null);

  // State untuk konfirmasi hapus inline & Toast
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [alasanHapus, setAlasanHapus] = useState("Pindah Alamat");
  const { success } = useToast();

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
  const [aiAnalysisText, setAiAnalysisText] = useState("");

  useEffect(() => {
    getBalitaById(id).then((found) => {
      setBalita(found);
    });
  }, [id]);

  useEffect(() => {
    if (!balita) return;
    setIsAiLoading(true);
    getEvaluasi(balita)
      .then((data) => {
        setAiAnalysisText(data.analisis);
      })
      .catch(() => {
        setAiAnalysisText(AI_FALLBACK_TEXT);
      })
      .finally(() => {
        setIsAiLoading(false);
      });
  }, [balita]);

  if (!balita) {
    return (
      <div className="min-h-screen bg-gray-50 text-black font-sans flex items-center justify-center">
        <div className="text-center space-y-2">
          <div className="w-8 h-8 border-4 border-teal-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-xs font-semibold text-gray-500 font-sans">
            Memuat data balita...
          </p>
        </div>
      </div>
    );
  }

  const isMeasuredThisMonth =
    balita.pengukuran?.some(
      (p) => p.bulan === currentMonth && p.tahun === currentYear,
    ) ?? false;

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
          <button
            onClick={() => setIsDeleteModalOpen(true)}
            className="text-red-500 p-2 hover:bg-red-50 rounded-xl transition-colors z-10 active:scale-95 cursor-pointer"
          >
            <Trash2 size={20} />
          </button>
        </div>

        <InfoPanel title="Panduan detail balita">
          Gunakan tombol Ukur untuk menambah pengukuran, Edit Data untuk memperbaiki biodata atau pengukuran yang sudah ada, dan lihat grafik untuk memantau perubahan dari bulan ke bulan.
        </InfoPanel>

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

            {/* Analisis AI */}
            <div className="border border-[#1fb999]/30 bg-[#f0fbf9] rounded-xl p-5 relative overflow-hidden">
              <div className="flex items-center gap-2 mb-3">
                <Sparkles size={18} className="text-[#0d9488]" />
                <h4 className="font-bold text-sm text-[#0d9488]">
                  Insight AI Pertumbuhan
                </h4>
              </div>

              {isAiLoading ? (
                <div className="space-y-2 mb-4 animate-pulse">
                  <div className="h-3 bg-teal-100 rounded w-full"></div>
                  <div className="h-3 bg-teal-100 rounded w-5/6"></div>
                  <div className="h-3 bg-teal-100 rounded w-4/6"></div>
                </div>
              ) : (
                <p className="text-xs text-gray-800 leading-relaxed mb-4">
                  {aiAnalysisText}
                </p>
              )}

              <p className="text-[10px] italic text-[#0d9488] opacity-80">
                Analisis AI bersifat pendukung pencatatan, bukan diagnosis
                medis.
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
                riwayat={balita.pengukuran || []}
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
                {balita.pengukuran &&
                balita.pengukuran.filter(
                  (p) => p.tahun.toString() === selectedYearHistory,
                ).length > 0 ? (
                  balita.pengukuran
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
      {isDeleteModalOpen && balita && (
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
                  onClick={() => setAlasanHapus(opt)}
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
                onClick={() => setIsDeleteModalOpen(false)}
                className="flex-1 bg-white hover:bg-gray-50 active:scale-[0.99] border border-gray-300 text-gray-700 font-bold py-3 px-6 rounded-2xl shadow-sm transition-all duration-300 text-center cursor-pointer text-xs"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={async () => {
                  try {
                    const alasanMap: Record<string, string> = {
                      "Pindah Alamat": "PINDAH_ALAMAT",
                      "Usia > 60": "USIA_LEBIH_60_BULAN",
                      "Permintaan wali": "PERMINTAAN_WALI",
                    };
                    const mappedAlasan =
                      alasanMap[alasanHapus] || "PINDAH_ALAMAT";
                    await deleteBalita(id, mappedAlasan);
                    success(`Data balita ${balita.nama} berhasil dihapus!`);
                    setIsDeleteModalOpen(false);
                    router.push("/dashboard/balita");
                  } catch (err: any) {
                    alert(err.message);
                  }
                }}
                className="flex-1 bg-rose-600 hover:bg-rose-700 active:scale-[0.99] text-white font-bold py-3.5 px-6 rounded-2xl shadow-lg shadow-rose-600/15 transition-all duration-300 text-center cursor-pointer text-xs"
              >
                Ya, Hapus
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
