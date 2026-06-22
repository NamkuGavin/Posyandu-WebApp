"use client";

import { useState, useEffect } from "react";
import {
  ArrowLeft,
  Trash2,
  PencilLine,
  User,
  PackageCheck,
  ChevronDown,
  ShieldCheck,
} from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import Navbar from "@/components/layout/Navbar";
import Card from "@/components/ui/Card";
import BalitaSummaryCard from "@/components/balita/BalitaSummaryCard";
import DeleteBalitaDialog from "@/components/balita/DeleteBalitaDialog";
import GrowthChart, {
  GROWTH_CHART_TABS,
  GrowthChartTab,
} from "@/components/balita/GrowthChart";
import GrowthInsightPanel, {
  CLIENT_INSIGHT_FALLBACK,
} from "@/components/balita/GrowthInsightPanel";
import MeasurementHistory from "@/components/balita/MeasurementHistory";
import { InfoPanel, PageStatusState } from "@/components/ui/PageParts";
import { getBalitaById, deleteBalita, getEvaluasi } from "@/lib/api";
import { useCurrentProfile } from "@/lib/useCurrentProfile";
import { isCompletedMeasurement } from "@/lib/measurement-status";
import { Balita, GrowthInsightResponse } from "@/types";
import { useToast } from "@/components/ui/Toast";

export default function DetailBalitaPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const [balita, setBalita] = useState<Balita | null>(null);
  const [loadState, setLoadState] = useState<"loading" | "success" | "error">(
    "loading",
  );
  const { isAdmin, isLoading: isRoleLoading } = useCurrentProfile();

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const { error, success } = useToast();

  const [activeChartTab, setActiveChartTab] =
    useState<GrowthChartTab>("Berat");
  const [selectedYearGraph, setSelectedYearGraph] = useState(
    new Date().getFullYear().toString(),
  );
  const [selectedYearHistory, setSelectedYearHistory] = useState(
    new Date().getFullYear().toString(),
  );
  const currentMonth = new Date().getMonth() + 1;
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: currentYear - 2015 + 1 }, (_, i) =>
    (currentYear - i).toString(),
  );

  const [isAiLoading, setIsAiLoading] = useState(true);
  const [aiInsight, setAiInsight] = useState<GrowthInsightResponse | null>(
    null,
  );

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
            <BalitaSummaryCard
              balita={balita}
              measurementStatus={
                isMeasuredThisMonth ? "measured" : "unmeasured"
              }
            />

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

            <GrowthInsightPanel insight={aiInsight} isLoading={isAiLoading} />
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
                {GROWTH_CHART_TABS.map((tab) => (
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

              <GrowthChart
                measurements={pengukuranHistory}
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

              <MeasurementHistory
                measurements={pengukuranHistory}
                year={selectedYearHistory}
              />
            </Card>
          </div>
        </div>
      </main>

      {!isAdmin && (
        <DeleteBalitaDialog
          isOpen={isDeleteModalOpen}
          balitaName={balita.nama}
          onClose={() => setIsDeleteModalOpen(false)}
          onConfirm={async (reason, note) => {
            try {
              await deleteBalita(id, reason, note);
              success(`Data balita ${balita.nama} berhasil dihapus!`);
              setIsDeleteModalOpen(false);
              router.push("/dashboard/balita");
            } catch (requestError: unknown) {
              error(
                requestError instanceof Error
                  ? requestError.message
                  : "Gagal menghapus balita",
              );
              throw requestError;
            }
          }}
        />
      )}
    </div>
  );
}
