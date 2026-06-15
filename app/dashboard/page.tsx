"use client";

import { useEffect, useRef, useState } from "react";
import {
  Activity,
  AlertCircle,
  ArrowRight,
  Baby,
  BarChart3,
  CalendarDays,
  ClipboardCheck,
  PackageCheck,
  PencilLine,
  Plus,
  Ruler,
  Search,
  ShieldCheck,
  Users,
  type LucideIcon,
} from "lucide-react";
import { useRouter } from "next/navigation";
import Navbar from "@/components/layout/Navbar";
import Card from "@/components/ui/Card";
import { PageStatusState } from "@/components/ui/PageParts";
import { getAbsensiList, getBalitaList, getPengukuranList } from "@/lib/api";
import { useCurrentProfile } from "@/lib/useCurrentProfile";
import { Absensi, Balita, Pengukuran } from "@/types";

const formatPercent = (value: number) => {
  if (!Number.isFinite(value)) return "0";
  return Number.isInteger(value) ? value.toString() : value.toFixed(1);
};

function SummaryCard({
  label,
  value,
  helper,
  icon: Icon,
  tone,
}: {
  label: string;
  value: number | string;
  helper: string;
  icon: LucideIcon;
  tone: string;
}) {
  return (
    <Card className="p-4 rounded-xl bg-white border-gray-100">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
            {label}
          </p>
          <p className="text-2xl font-black text-gray-950 mt-2">{value}</p>
        </div>
        <div
          className={`w-10 h-10 rounded-xl flex items-center justify-center ${tone}`}
        >
          <Icon size={20} strokeWidth={2.5} />
        </div>
      </div>
      <p className="text-[11px] font-semibold text-gray-500 mt-3 leading-relaxed">
        {helper}
      </p>
    </Card>
  );
}

function ProgressMetric({
  label,
  value,
  helper,
  color,
}: {
  label: string;
  value: number;
  helper: string;
  color: string;
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-sm font-black text-gray-900">{label}</p>
          <p className="text-xs font-semibold text-gray-500 mt-0.5">{helper}</p>
        </div>
        <span className="text-sm font-black text-gray-950">
          {formatPercent(value)}%
        </span>
      </div>
      <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-700 ${color}`}
          style={{ width: `${Math.min(value, 100)}%` }}
        />
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [isFocused, setIsFocused] = useState(false);
  const [balitaList, setBalitaList] = useState<Balita[]>([]);
  const [currentPengukuran, setCurrentPengukuran] = useState<Pengukuran[]>([]);
  const [currentAbsensi, setCurrentAbsensi] = useState<Absensi[]>([]);
  const [loadState, setLoadState] = useState<"loading" | "success" | "error">(
    "loading",
  );
  const { isAdmin, isLoading: isRoleLoading } = useCurrentProfile();
  const router = useRouter();
  const searchRef = useRef<HTMLDivElement>(null);
  const currentMonth = new Date().getMonth() + 1;
  const currentYear = new Date().getFullYear();
  const currentPeriod = new Date().toLocaleDateString("id-ID", {
    month: "long",
    year: "numeric",
  });

  useEffect(() => {
    let isActive = true;

    Promise.resolve().then(() => {
      if (isActive) setLoadState("loading");
    });

    Promise.all([
      getBalitaList(),
      getPengukuranList(currentMonth, currentYear),
      getAbsensiList(currentMonth, currentYear),
    ])
      .then(([balitaData, pengukuranData, absensiData]) => {
        if (!isActive) return;
        setBalitaList(balitaData);
        setCurrentPengukuran(pengukuranData);
        setCurrentAbsensi(absensiData);
        setLoadState("success");
      })
      .catch((err) => {
        console.error(err);
        if (isActive) setLoadState("error");
      });

    return () => {
      isActive = false;
    };
  }, [currentMonth, currentYear]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        searchRef.current &&
        !searchRef.current.contains(event.target as Node)
      ) {
        setIsFocused(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const measuredBalitaIds = new Set(
    currentPengukuran.map((pengukuran) => pengukuran.balitaId).filter(Boolean),
  );

  const filteredSuggestions = balitaList
    .filter((balita) =>
      balita.nama.toLowerCase().includes(searchTerm.toLowerCase()),
    )
    .slice(0, 4);

  const belumDiukurList = balitaList.filter((balita) => {
    const isMeasured = measuredBalitaIds.has(balita.id);
    return !isMeasured;
  });

  const hadirBalitaIds = new Set(
    currentAbsensi
      .filter((absensi) => absensi.isHadir)
      .map((absensi) => absensi.balitaId)
      .filter(Boolean),
  );
  const totalBalita = balitaList.length;
  const hadirBulanIni = balitaList.filter((balita) =>
    hadirBalitaIds.has(balita.id),
  ).length;
  const belumHadir = Math.max(totalBalita - hadirBulanIni, 0);
  const belumDiukur = belumDiukurList.length;
  const sudahDiukur = Math.max(totalBalita - belumDiukur, 0);
  const attendanceRate =
    totalBalita > 0
      ? parseFloat(((hadirBulanIni / totalBalita) * 100).toFixed(1))
      : 0;
  const measurementRate =
    totalBalita > 0
      ? parseFloat(((sudahDiukur / totalBalita) * 100).toFixed(1))
      : 0;
  const priorityList = belumDiukurList.slice(0, 4);
  const quickActions = isAdmin
    ? [
        {
          icon: ShieldCheck,
          label: "Kelola Kader",
          helper: "Manajemen akun kader",
          onClick: () => router.push("/dashboard/admin/kader"),
          disabled: false,
        },
        {
          icon: Baby,
          label: "Lihat Balita",
          helper: "Pantau data balita",
          onClick: () => router.push("/dashboard/balita"),
          disabled: false,
        },
        {
          icon: BarChart3,
          label: "Lihat Laporan",
          helper: "Pantau rekap periode",
          onClick: () => router.push("/dashboard/laporan"),
          disabled: false,
        },
      ]
    : [
        {
          icon: Plus,
          label: "Tambah Balita",
          helper: "Registrasi balita baru",
          onClick: () => router.push("/dashboard/balita/tambah"),
          disabled: isRoleLoading,
        },
        {
          icon: PencilLine,
          label: "Input Pengukuran",
          helper: "Pilih balita yang belum diukur",
          onClick: () => router.push("/dashboard/cari?mode=ukur"),
          disabled: isRoleLoading,
        },
        {
          icon: PackageCheck,
          label: "Absen Bulanan",
          helper: "Catat hadir atau tidak hadir",
          onClick: () => router.push("/dashboard/absen"),
          disabled: isRoleLoading,
        },
      ];

  if (loadState !== "success") {
    return (
      <div className="min-h-screen bg-gray-50 font-sans text-black pb-10">
        <Navbar />
        <main className="p-4 sm:p-6 md:p-8 max-w-6xl mx-auto mt-2">
          <PageStatusState
            tone={loadState === "error" ? "error" : "loading"}
            title={
              loadState === "error"
                ? "Data dashboard belum bisa dimuat"
                : "Memuat data dashboard"
            }
            description={
              loadState === "error"
                ? "Terjadi gangguan saat mengambil data balita, absensi, atau pengukuran bulan ini. Coba muat ulang halaman."
                : "Mengambil data balita, absensi, dan status pengukuran bulan ini"
            }
          />
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 font-sans text-black pb-10">
      <Navbar />

      <main className="p-4 sm:p-6 md:p-8 space-y-6 max-w-6xl mx-auto mt-2">
        <section className="bg-[#0d9488] rounded-2xl p-5 sm:p-7 md:p-8 text-white shadow-sm relative overflow-visible border border-teal-700/10">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-6 relative z-10">
            <div>
              <p className="text-teal-50 text-xs font-black uppercase tracking-widest mb-2">
                Posyandu Sidorejo Kidul
              </p>
              <h1 className="text-2xl sm:text-3xl font-black">
                Pemantauan Bulan Ini
              </h1>
              <p className="text-sm sm:text-base font-medium text-teal-50 mt-2 max-w-xl leading-relaxed">
                Mulai dari cari balita, input pengukuran, absen bulanan, sampai
                lihat laporan.
              </p>
            </div>
            <div className="bg-white/15 px-3 py-2 rounded-xl flex items-center gap-2 text-xs font-bold tracking-wide whitespace-nowrap self-start">
              <CalendarDays size={18} />
              {currentPeriod}
            </div>
          </div>

          <div className="relative z-10" ref={searchRef}>
            <Search
              className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
              size={20}
            />
            <input
              type="text"
              placeholder="Cari nama balita"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onFocus={() => setIsFocused(true)}
              className="w-full pl-12 pr-6 py-4 rounded-xl text-gray-900 focus:outline-none shadow-sm bg-white placeholder:text-gray-400 font-bold transition-all focus:ring-2 focus:ring-teal-200"
            />

            {isFocused && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                <div className="p-2">
                  {filteredSuggestions.length > 0 ? (
                    filteredSuggestions.map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => {
                          setSearchTerm(item.nama);
                          setIsFocused(false);
                          router.push(`/dashboard/balita/${item.id}`);
                        }}
                        className="w-full flex items-center gap-3 p-3 hover:bg-gray-50 rounded-xl transition-colors text-left group cursor-pointer"
                      >
                        <div
                          className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                            item.jenisKelamin === "PEREMPUAN"
                              ? "bg-pink-50 text-pink-500"
                              : "bg-sky-50 text-sky-500"
                          }`}
                        >
                          <Baby size={19} />
                        </div>
                        <div>
                          <p className="text-sm font-black text-gray-900">
                            {item.nama}
                          </p>
                          <p className="text-xs text-gray-500 font-semibold">
                            {item.jenisKelamin === "PEREMPUAN"
                              ? "Perempuan"
                              : "Laki-laki"}
                          </p>
                        </div>
                      </button>
                    ))
                  ) : (
                    <p className="p-4 text-center text-sm text-gray-500 font-bold">
                      Nama tidak ditemukan.
                    </p>
                  )}

                  <button
                    type="button"
                    onClick={() => router.push("/dashboard/cari")}
                    className="w-full p-3 mt-1 text-center text-xs font-black text-[#0d9488] hover:bg-gray-50 rounded-xl border-t border-gray-50 transition-colors cursor-pointer"
                  >
                    Buka halaman pencarian
                  </button>
                </div>
              </div>
            )}
          </div>
        </section>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <SummaryCard
            label="Total Balita"
            value={totalBalita}
            helper="Sasaran aktif"
            icon={Users}
            tone="bg-blue-50 text-blue-600"
          />
          <SummaryCard
            label="Hadir"
            value={hadirBulanIni}
            helper={`${belumHadir} belum hadir`}
            icon={ClipboardCheck}
            tone="bg-emerald-50 text-emerald-600"
          />
          <SummaryCard
            label="Diukur"
            value={sudahDiukur}
            helper={`${belumDiukur} belum diukur`}
            icon={Ruler}
            tone="bg-teal-50 text-[#0d9488]"
          />
          <SummaryCard
            label="Prioritas"
            value={belumDiukurList.length}
            helper="Perlu pengukuran"
            icon={AlertCircle}
            tone="bg-orange-50 text-orange-600"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          <section className="lg:col-span-2 space-y-6">
            <Card className="p-5 rounded-xl shadow-sm border border-gray-100 bg-white">
              <div className="flex items-center justify-between gap-4 mb-5">
                <div>
                  <h2 className="text-base font-black text-gray-900">
                    Cakupan Bulanan
                  </h2>
                  <p className="text-sm font-medium text-gray-500 mt-1">
                    Absensi dan pengukuran periode {currentPeriod}.
                  </p>
                </div>
                <BarChart3 size={24} className="text-[#0d9488]" />
              </div>
              <div className="space-y-5">
                <ProgressMetric
                  label="Kehadiran"
                  value={attendanceRate}
                  helper={`${hadirBulanIni} dari ${totalBalita} balita`}
                  color="bg-emerald-500"
                />
                <ProgressMetric
                  label="Pengukuran"
                  value={measurementRate}
                  helper={`${sudahDiukur} dari ${totalBalita} balita`}
                  color="bg-[#1fb999]"
                />
              </div>
            </Card>

            <Card className="p-5 rounded-xl shadow-sm border border-gray-100 bg-white">
              <div className="flex items-center justify-between gap-4 mb-5">
                <div>
                  <h2 className="text-base font-black text-gray-900">
                    Aksi Cepat
                  </h2>
                  <p className="text-sm font-medium text-gray-500 mt-1">
                    Pilih pekerjaan yang ingin dilakukan.
                  </p>
                </div>
                <Activity size={24} className="text-[#0d9488]" />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {quickActions.map((action) => (
                  <button
                    key={action.label}
                    type="button"
                    onClick={action.disabled ? undefined : action.onClick}
                    disabled={action.disabled}
                    className="group text-left bg-gray-50 hover:bg-white p-4 rounded-xl transition-all duration-300 hover:shadow-md hover:shadow-teal-50 active:scale-[0.99] border border-gray-100 hover:border-teal-200 cursor-pointer disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:bg-gray-50 disabled:hover:shadow-none"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="w-11 h-11 rounded-xl bg-white flex items-center justify-center text-[#0d9488] shadow-sm transition-transform duration-300 group-hover:scale-105">
                        <action.icon size={22} strokeWidth={2.4} />
                      </div>
                      <ArrowRight
                        size={17}
                        className="text-gray-300 group-hover:text-[#0d9488] transition-colors"
                      />
                    </div>
                    <p className="text-sm font-black text-gray-900 mt-4">
                      {action.label}
                    </p>
                    <p className="text-xs font-semibold text-gray-500 mt-1 leading-relaxed">
                      {action.helper}
                    </p>
                  </button>
                ))}
              </div>
            </Card>
          </section>

          <section className="space-y-4">
            <div className="flex justify-between items-start px-1">
              <div>
                <h2 className="text-base font-black text-black">
                  Prioritas Pengukuran
                </h2>
                <p className="text-xs font-medium text-gray-500 mt-0.5">
                  {currentPeriod}
                </p>
              </div>
              <span className="text-sm font-black text-orange-600">
                {belumDiukurList.length}
              </span>
            </div>

            <div className="space-y-3">
              {priorityList.length > 0 ? (
                priorityList.map((item) => (
                  <Card
                    key={item.id}
                    onClick={() =>
                      router.push(
                        isAdmin
                          ? `/dashboard/balita/${item.id}`
                          : `/dashboard/balita/${item.id}/ukur`,
                      )
                    }
                    className="p-4 rounded-xl flex items-center justify-between group cursor-pointer hover:border-teal-200 hover:shadow-md hover:shadow-teal-50 transition-all shadow-sm bg-white"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${
                          item.jenisKelamin === "PEREMPUAN"
                            ? "bg-[#fce5f1] text-pink-500"
                            : "bg-[#e5f5fd] text-sky-500"
                        }`}
                      >
                        <Baby size={22} />
                      </div>
                      <div className="min-w-0">
                        <h3 className="text-sm font-black text-black truncate">
                          {item.nama}
                        </h3>
                        <p className="text-xs text-gray-600 mt-0.5 truncate">
                          RT {item.rt}/RW {item.rw}
                        </p>
                      </div>
                    </div>
                    <ArrowRight
                      size={17}
                      className="text-gray-300 group-hover:text-[#0d9488] transition-colors shrink-0"
                    />
                  </Card>
                ))
              ) : (
                <div className="rounded-xl border border-emerald-100 bg-emerald-50 p-5 text-center">
                  <div className="w-11 h-11 rounded-xl bg-white text-emerald-600 flex items-center justify-center mx-auto mb-3">
                    <ClipboardCheck size={22} />
                  </div>
                  <p className="text-sm font-black text-emerald-700">
                    Semua balita sudah diukur bulan ini.
                  </p>
                </div>
              )}
            </div>

            {belumDiukurList.length > priorityList.length && (
              <button
                type="button"
                onClick={() =>
                  router.push(
                    isAdmin ? "/dashboard/balita" : "/dashboard/cari?mode=ukur",
                  )
                }
                className="w-full rounded-xl bg-white border border-gray-100 px-4 py-3 text-sm font-black text-[#0d9488] hover:border-teal-200 transition-colors cursor-pointer"
              >
                {isAdmin
                  ? "Lihat semua data balita"
                  : "Lihat semua balita belum diukur"}
              </button>
            )}
          </section>
        </div>
      </main>
    </div>
  );
}
