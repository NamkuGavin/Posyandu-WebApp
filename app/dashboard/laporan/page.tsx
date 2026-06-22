"use client";

import { useState } from "react";
import {
  AlertCircle,
  BarChart3,
  ChevronDown,
  ClipboardCheck,
  Users,
  FileSpreadsheet,
  Download,
  MapPinned,
  Ruler,
  UserRound,
} from "lucide-react";
import Navbar from "@/components/layout/Navbar";
import Card from "@/components/ui/Card";
import MetricCard from "@/components/dashboard/MetricCard";
import ProgressMetric from "@/components/dashboard/ProgressMetric";
import GenderPieSummary, {
  GenderChartDatum,
} from "@/components/laporan/GenderPieSummary";
import { PageStatusState } from "@/components/ui/PageParts";
import {
  exportLaporanExcel,
} from "@/lib/api";
import { useToast } from "@/components/ui/Toast";
import {
  getEffectiveAttendance,
  getMeasuredBalitaIds,
} from "@/lib/measurement-status";
import {
  MONTH_NAMES as months,
  SHORT_MONTH_NAMES as shortMonths,
} from "@/lib/constants";
import { usePeriodData } from "@/lib/usePeriodData";

export default function LaporanPage() {
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth() + 1;
  const years = Array.from({ length: currentYear - 2015 + 1 }, (_, i) =>
    (currentYear - i).toString(),
  );

  const [selectedMonth, setSelectedMonth] = useState(currentMonth);
  const [selectedYear, setSelectedYear] = useState(currentYear.toString());
  const { success, error } = useToast();
  const selectedYearNumber = parseInt(selectedYear);
  const {
    attendance: absenList,
    balita: balitaList,
    loadState,
    measurements: pengukuranList,
  } = usePeriodData(selectedMonth, selectedYearNumber, {
    includeAttendance: true,
  });
  const availableMonths =
    selectedYearNumber === currentYear ? months.slice(0, currentMonth) : months;
  const selectedMonthName = months[selectedMonth - 1];

  const measuredBalitaIds = getMeasuredBalitaIds(pengukuranList);
  const isBalitaHadir = (balitaId: string) =>
    getEffectiveAttendance(balitaId, absenList);
  const totalBalita = balitaList.length;
  const hadir = balitaList.filter((balita) => isBalitaHadir(balita.id)).length;
  const belumHadir = Math.max(totalBalita - hadir, 0);
  const sudahDiukur = balitaList.filter((balita) =>
    measuredBalitaIds.has(balita.id),
  ).length;
  const belumDiukur = Math.max(totalBalita - sudahDiukur, 0);
  const perempuan = balitaList.filter(
    (balita) => balita.jenisKelamin === "PEREMPUAN",
  ).length;
  const lakiLaki = Math.max(totalBalita - perempuan, 0);
  const totalPerluCek = balitaList.filter((balita) => {
    const isHadir = isBalitaHadir(balita.id);
    const isMeasured = measuredBalitaIds.has(balita.id);

    return !isHadir || !isMeasured;
  }).length;

  const attendanceRate =
    totalBalita > 0 ? parseFloat(((hadir / totalBalita) * 100).toFixed(1)) : 0;
  const measurementRate =
    totalBalita > 0
      ? parseFloat(((sudahDiukur / totalBalita) * 100).toFixed(1))
      : 0;
  const attendanceGenderData: GenderChartDatum[] = [
    {
      name: "Laki-laki",
      value: balitaList.filter(
        (balita) =>
          balita.jenisKelamin === "LAKI_LAKI" && isBalitaHadir(balita.id),
      ).length,
      color: "#0ea5e9",
    },
    {
      name: "Perempuan",
      value: balitaList.filter(
        (balita) =>
          balita.jenisKelamin === "PEREMPUAN" && isBalitaHadir(balita.id),
      ).length,
      color: "#ec4899",
    },
  ];
  const measurementGenderData: GenderChartDatum[] = [
    {
      name: "Laki-laki",
      value: balitaList.filter(
        (balita) =>
          balita.jenisKelamin === "LAKI_LAKI" &&
          measuredBalitaIds.has(balita.id),
      ).length,
      color: "#0ea5e9",
    },
    {
      name: "Perempuan",
      value: balitaList.filter(
        (balita) =>
          balita.jenisKelamin === "PEREMPUAN" &&
          measuredBalitaIds.has(balita.id),
      ).length,
      color: "#ec4899",
    },
  ];
  const followUpList = balitaList
    .map((balita) => {
      const isHadir = isBalitaHadir(balita.id);
      const isMeasured = measuredBalitaIds.has(balita.id);

      return {
        balita,
        isHadir: Boolean(isHadir),
        isMeasured: Boolean(isMeasured),
      };
    })
    .filter((item) => !item.isHadir || !item.isMeasured)
    .slice(0, 5);
  const rtStats = Object.values(
    balitaList.reduce<
      Record<
        string,
        { rt: string; total: number; hadir: number; diukur: number }
      >
    >((acc, balita) => {
      const rt = String(balita.rt || "-");
      const isHadir = isBalitaHadir(balita.id);
      const isMeasured = measuredBalitaIds.has(balita.id);

      if (!acc[rt]) {
        acc[rt] = { rt, total: 0, hadir: 0, diukur: 0 };
      }

      acc[rt].total += 1;
      if (isHadir) acc[rt].hadir += 1;
      if (isMeasured) acc[rt].diukur += 1;
      return acc;
    }, {}),
  ).sort((a, b) => a.rt.localeCompare(b.rt, "id", { numeric: true }));

  const handleExportExcel = async () => {
    try {
      const blob = await exportLaporanExcel(selectedMonth, selectedYearNumber);
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.setAttribute("href", url);
      link.setAttribute(
        "download",
        `Laporan_Posyandu_${selectedMonthName}_${selectedYear}.xlsx`,
      );
      link.style.visibility = "hidden";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      success(`Laporan ${selectedMonthName} ${selectedYear} berhasil diunduh.`);
    } catch (err) {
      error(err instanceof Error ? err.message : "Gagal export laporan Excel");
    }
  };

  if (loadState !== "success") {
    return (
      <div className="min-h-screen bg-gray-50 text-black font-sans pb-10">
        <Navbar title="Laporan" />
        <main className="p-4 sm:p-6 max-w-6xl mx-auto mt-2">
          <PageStatusState
            tone={loadState === "error" ? "error" : "loading"}
            title={
              loadState === "error"
                ? "Laporan belum bisa dimuat"
                : "Memuat laporan"
            }
            description={
              loadState === "error"
                ? "Terjadi gangguan saat mengambil data balita, absensi, atau pengukuran periode ini. Coba muat ulang halaman."
                : "Mengambil data balita, absensi, dan pengukuran periode ini."
            }
          />
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 text-black font-sans pb-10">
      <Navbar title="Laporan" />

      <main className="p-4 sm:p-6 max-w-6xl mx-auto space-y-6 mt-2">
        <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4">
          <div>
            <p className="text-[10px] font-bold text-[#0d9488] uppercase tracking-widest">
              Laporan Statistik Posyandu
            </p>
            <h1 className="text-xl sm:text-2xl font-black text-gray-950 mt-1">
              Rekap {selectedMonthName} {selectedYear}
            </h1>
            <p className="text-xs font-medium text-gray-500 mt-1">
              Pantau absensi, kelengkapan pengukuran, dan sasaran yang perlu
              ditindaklanjuti sebagai dua status yang terpisah.
            </p>
          </div>

          <button
            type="button"
            onClick={handleExportExcel}
            className="inline-flex items-center justify-center gap-2 bg-[#1fb999] hover:bg-teal-600 active:scale-[0.99] text-white font-bold px-5 py-3 rounded-xl shadow-md shadow-teal-100 transition-all text-sm cursor-pointer"
          >
            <Download size={18} />
            Unduh Excel
          </button>
        </div>

        <Card className="p-4 sm:p-5 rounded-xl">
          <div className="grid grid-cols-1 md:grid-cols-[1fr_1fr_auto] gap-4 items-end">
            <div>
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                Bulan
              </span>
              <div className="relative flex items-center mt-2">
                <select
                  value={selectedMonth}
                  onChange={(e) => {
                    setSelectedMonth(Number(e.target.value));
                  }}
                  className="w-full appearance-none bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 pr-10 text-sm font-bold text-gray-800 focus:outline-none focus:ring-2 focus:ring-teal-100 cursor-pointer"
                >
                  {availableMonths.map((month, index) => (
                    <option key={month} value={index + 1}>
                      {month}
                    </option>
                  ))}
                </select>
                <ChevronDown
                  size={16}
                  className="absolute right-4 text-gray-500 pointer-events-none"
                />
              </div>
            </div>

            <div>
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                Tahun
              </span>
              <div className="relative flex items-center mt-2">
                <select
                  value={selectedYear}
                  onChange={(e) => {
                    const nextYear = Number(e.target.value);
                    setSelectedYear(e.target.value);
                    if (
                      nextYear === currentYear &&
                      selectedMonth > currentMonth
                    ) {
                      setSelectedMonth(currentMonth);
                    }
                  }}
                  className="w-full appearance-none bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 pr-10 text-sm font-bold text-gray-800 focus:outline-none focus:ring-2 focus:ring-teal-100 cursor-pointer"
                >
                  {years.map((year) => (
                    <option key={year} value={year}>
                      {year}
                    </option>
                  ))}
                </select>
                <ChevronDown
                  size={16}
                  className="absolute right-4 text-gray-500 pointer-events-none"
                />
              </div>
            </div>

            <div className="bg-[#f0fbf9] border border-teal-100 rounded-xl px-4 py-3">
              <p className="text-[10px] font-bold text-[#0d9488] uppercase tracking-widest">
                Format
              </p>
              <div className="flex items-center gap-2 mt-1">
                <FileSpreadsheet size={18} className="text-[#0d9488]" />
                <span className="text-sm font-black text-gray-900">Excel</span>
              </div>
            </div>
          </div>
        </Card>

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          <MetricCard
            label="Total Sasaran"
            value={totalBalita}
            helper="Balita aktif dalam data posyandu."
            icon={Users}
            tone="bg-blue-50 text-blue-600"
          />
          <MetricCard
            label="Hadir"
            value={hadir}
            helper={`${belumHadir} balita belum tercatat hadir.`}
            icon={ClipboardCheck}
            tone="bg-emerald-50 text-emerald-600"
          />
          <MetricCard
            label="Sudah Diukur"
            value={sudahDiukur}
            helper={`${belumDiukur} balita belum punya pengukuran periode ini.`}
            icon={Ruler}
            tone="bg-teal-50 text-[#0d9488]"
          />
          <MetricCard
            label="Perlu Cek"
            value={totalPerluCek}
            helper="Belum hadir atau belum lengkap pengukurannya."
            icon={AlertCircle}
            tone="bg-orange-50 text-orange-600"
          />
        </div>

        <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <GenderPieSummary
            title="Rekap Kehadiran"
            description={`Komposisi balita yang hadir pada ${selectedMonthName} ${selectedYear}.`}
            data={attendanceGenderData}
            emptyMessage={`Belum ada balita yang tercatat hadir pada ${selectedMonthName} ${selectedYear}.`}
            icon={ClipboardCheck}
          />
          <GenderPieSummary
            title="Rekap Pengukuran"
            description={`Komposisi balita dengan berat dan tinggi valid pada ${selectedMonthName} ${selectedYear}.`}
            data={measurementGenderData}
            emptyMessage={`Belum ada pengukuran balita yang lengkap pada ${selectedMonthName} ${selectedYear}.`}
            icon={Ruler}
          />
        </section>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          <div className="lg:col-span-2 space-y-6">
            <Card className="p-5 rounded-xl">
              <div className="flex items-center justify-between gap-4 mb-5">
                <div>
                  <h4 className="text-sm font-bold text-gray-900">
                    Kinerja Periode
                  </h4>
                  <p className="text-xs font-medium text-gray-500 mt-1">
                    Kehadiran berasal dari absensi manual, bukan dari data
                    pengukuran.
                  </p>
                </div>
                <BarChart3 size={22} className="text-[#0d9488]" />
              </div>

              <div className="space-y-5">
                <ProgressMetric
                  label="Cakupan Kehadiran"
                  value={attendanceRate}
                  helper={`${hadir} hadir dari ${totalBalita} sasaran`}
                  color="bg-emerald-500"
                />
                <ProgressMetric
                  label="Kelengkapan Pengukuran"
                  value={measurementRate}
                  helper={`${sudahDiukur} sudah diukur dari ${totalBalita} sasaran`}
                  color="bg-[#1fb999]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3 mt-6">
                <div className="rounded-xl bg-gray-50 border border-gray-100 p-4">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                    Belum Hadir
                  </p>
                  <p className="text-2xl font-black text-gray-950 mt-2">
                    {belumHadir}
                  </p>
                </div>
                <div className="rounded-xl bg-gray-50 border border-gray-100 p-4">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                    Belum Diukur
                  </p>
                  <p className="text-2xl font-black text-gray-950 mt-2">
                    {belumDiukur}
                  </p>
                </div>
              </div>
            </Card>

            <Card className="p-5 rounded-xl">
              <div className="flex items-center justify-between gap-4 mb-5">
                <div>
                  <h4 className="text-sm font-bold text-gray-900">
                    Rekap Per RT
                  </h4>
                  <p className="text-xs font-medium text-gray-500 mt-1">
                    Ringkasan kehadiran dan pengukuran per RT di RW 09.
                  </p>
                </div>
                <MapPinned size={22} className="text-[#0d9488]" />
              </div>

              <div className="overflow-x-auto">
                <div className="min-w-[520px]">
                  <div className="grid grid-cols-4 text-[11px] font-bold text-gray-400 pb-3 border-b border-gray-100">
                    <div>RT</div>
                    <div className="text-center">Sasaran</div>
                    <div className="text-center">Hadir</div>
                    <div className="text-center">Diukur</div>
                  </div>
                  {rtStats.length > 0 ? (
                    rtStats.map((item) => (
                      <div
                        key={item.rt}
                        className="grid grid-cols-4 items-center text-xs font-bold text-gray-800 py-3 border-b border-gray-50 last:border-0"
                      >
                        <div>RT {item.rt}</div>
                        <div className="text-center">{item.total}</div>
                        <div className="text-center text-emerald-600">
                          {item.hadir}
                        </div>
                        <div className="text-center text-[#0d9488]">
                          {item.diukur}
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-center py-6 text-xs font-semibold text-gray-400">
                      Belum ada data RT untuk periode ini.
                    </p>
                  )}
                </div>
              </div>
            </Card>
          </div>

          <div className="space-y-6">
            <Card className="p-5 rounded-xl">
              <div className="flex items-center justify-between gap-4 mb-5">
                <div>
                  <h4 className="text-sm font-bold text-gray-900">
                    Komposisi Sasaran
                  </h4>
                  <p className="text-xs font-medium text-gray-500 mt-1">
                    Sebaran berdasarkan jenis kelamin.
                  </p>
                </div>
                <UserRound size={22} className="text-[#0d9488]" />
              </div>

              <div className="space-y-4">
                <ProgressMetric
                  label="Perempuan"
                  value={
                    totalBalita > 0
                      ? parseFloat(((perempuan / totalBalita) * 100).toFixed(1))
                      : 0
                  }
                  helper={`${perempuan} balita`}
                  color="bg-pink-400"
                />
                <ProgressMetric
                  label="Laki-laki"
                  value={
                    totalBalita > 0
                      ? parseFloat(((lakiLaki / totalBalita) * 100).toFixed(1))
                      : 0
                  }
                  helper={`${lakiLaki} balita`}
                  color="bg-sky-500"
                />
              </div>
            </Card>

            <Card className="p-5 rounded-xl">
              <div className="flex items-start justify-between gap-4 mb-4">
                <div>
                  <h4 className="text-sm font-bold text-gray-900">
                    Perlu Tindak Lanjut
                  </h4>
                  <p className="text-xs font-medium text-gray-500 mt-1">
                    Maksimal 5 balita prioritas dari periode ini.
                  </p>
                </div>
                <AlertCircle size={22} className="text-orange-600" />
              </div>

              <div className="space-y-3">
                {followUpList.length > 0 ? (
                  followUpList.map(({ balita, isHadir, isMeasured }) => (
                    <div
                      key={balita.id}
                      className="rounded-xl border border-gray-100 bg-gray-50 p-3"
                    >
                      <p className="text-xs font-black text-gray-900">
                        {balita.nama}
                      </p>
                      <p className="text-[11px] font-semibold text-gray-500 mt-1">
                        RT {balita.rt}/RW {balita.rw}
                      </p>
                      <div className="flex flex-wrap gap-2 mt-3">
                        {!isHadir && (
                          <span className="px-2.5 py-1 rounded-full bg-orange-50 text-orange-600 text-[10px] font-bold">
                            Belum hadir
                          </span>
                        )}
                        {!isMeasured && (
                          <span className="px-2.5 py-1 rounded-full bg-teal-50 text-[#0d9488] text-[10px] font-bold">
                            Belum diukur
                          </span>
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="rounded-xl border border-emerald-100 bg-emerald-50 p-4 text-center">
                    <p className="text-xs font-bold text-emerald-700">
                      Semua sasaran periode ini sudah hadir dan diukur.
                    </p>
                  </div>
                )}
              </div>
            </Card>

            <div className="rounded-xl bg-[#eff6ff] border border-blue-100 p-4">
              <p className="text-[10px] font-bold text-blue-700 uppercase tracking-widest">
                Periode Aktif
              </p>
              <p className="text-sm font-black text-blue-950 mt-1">
                {shortMonths[selectedMonth - 1]} {selectedYear}
              </p>
              <p className="text-xs font-medium text-blue-900 mt-2 leading-relaxed">
                Data statistik mengikuti periode yang dipilih. File Excel tetap
                bisa diunduh walaupun data periode kosong.
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
