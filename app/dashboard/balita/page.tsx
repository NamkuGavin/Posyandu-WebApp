"use client";

import { useMemo, useState } from "react";
import {
  Baby,
  Check,
  Plus,
  RotateCcw,
  Search,
  ShieldCheck,
  SlidersHorizontal,
  X,
} from "lucide-react";
import Link from "next/link";
import Navbar from "@/components/layout/Navbar";
import Card from "@/components/ui/Card";
import {
  EmptyState,
  InfoPanel,
  PageHeader,
  PageStatusState,
} from "@/components/ui/PageParts";
import {
  calculateAgeInMonths,
  formatAgeInMonths,
} from "@/lib/date-utils";
import { getMeasuredBalitaIds } from "@/lib/measurement-status";
import { useCurrentProfile } from "@/lib/useCurrentProfile";
import { usePeriodData } from "@/lib/usePeriodData";
import { Balita } from "@/types";

type GenderFilter = "SEMUA" | Balita["jenisKelamin"];
type AgeUnit = "bulan" | "tahun";
type SortOrder = "default" | "asc" | "desc";

type BalitaFilters = {
  gender: GenderFilter;
  rt: string;
  birthYear: string;
  ageUnit: AgeUnit;
  ageMin: string;
  ageMax: string;
  sortOrder: SortOrder;
};

const EMPTY_FILTERS: BalitaFilters = {
  gender: "SEMUA",
  rt: "SEMUA",
  birthYear: "SEMUA",
  ageUnit: "bulan",
  ageMin: "",
  ageMax: "",
  sortOrder: "default",
};

const GENDER_FILTER_OPTIONS: { label: string; value: GenderFilter }[] = [
  { label: "Semua", value: "SEMUA" },
  { label: "Laki-laki", value: "LAKI_LAKI" },
  { label: "Perempuan", value: "PEREMPUAN" },
];

const SORT_OPTIONS: { label: string; value: SortOrder; description: string }[] =
  [
    {
      label: "Urutan asli",
      value: "default",
      description: "Sesuai data dari sistem",
    },
    { label: "A ke Z", value: "asc", description: "Nama dari abjad awal" },
    { label: "Z ke A", value: "desc", description: "Nama dari abjad akhir" },
  ];

function getBirthYear(birthDateString: string): string {
  const birthDate = new Date(birthDateString);
  if (Number.isNaN(birthDate.getTime())) return "-";
  return String(birthDate.getFullYear());
}

function getAgeFilterValue(balita: Balita, unit: AgeUnit): number {
  const ageInMonths = calculateAgeInMonths(balita.tglLahir) ?? 0;
  return unit === "tahun" ? Math.floor(ageInMonths / 12) : ageInMonths;
}

function parseFilterNumber(value: string): number | null {
  if (!value.trim()) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function formatAgeLabel(birthDateString: string): string {
  return formatAgeInMonths(calculateAgeInMonths(birthDateString) ?? 0);
}

export default function DaftarBalitaPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [appliedFilters, setAppliedFilters] =
    useState<BalitaFilters>(EMPTY_FILTERS);
  const [draftFilters, setDraftFilters] =
    useState<BalitaFilters>(EMPTY_FILTERS);
  const { isAdmin, isLoading: isRoleLoading } = useCurrentProfile();
  const currentMonth = new Date().getMonth() + 1;
  const currentYear = new Date().getFullYear();
  const {
    balita: balitaList,
    loadState,
    measurements: currentPengukuran,
  } = usePeriodData(currentMonth, currentYear);

  const rtOptions = useMemo(
    () =>
      Array.from(
        new Set(
          balitaList
            .map((balita) => String(balita.rt || "").trim())
            .filter(Boolean),
        ),
      ).sort((a, b) => a.localeCompare(b, "id", { numeric: true })),
    [balitaList],
  );

  const birthYearOptions = useMemo(
    () =>
      Array.from(
        new Set(
          balitaList
            .map((balita) => getBirthYear(balita.tglLahir))
            .filter((year) => year !== "-"),
        ),
      ).sort((a, b) => Number(b) - Number(a)),
    [balitaList],
  );

  const measuredBalitaIds = getMeasuredBalitaIds(currentPengukuran);
  const measuredCount = balitaList.filter((balita) =>
    measuredBalitaIds.has(balita.id),
  ).length;
  const draftAgeMin = parseFilterNumber(draftFilters.ageMin);
  const draftAgeMax = parseFilterNumber(draftFilters.ageMax);
  const isAgeRangeInvalid =
    draftAgeMin !== null && draftAgeMax !== null && draftAgeMin > draftAgeMax;
  const activeFilterCount = [
    appliedFilters.gender !== "SEMUA",
    appliedFilters.rt !== "SEMUA",
    appliedFilters.birthYear !== "SEMUA",
    Boolean(appliedFilters.ageMin || appliedFilters.ageMax),
    appliedFilters.sortOrder !== "default",
  ].filter(Boolean).length;

  const filteredData = useMemo(() => {
    const searchValue = searchTerm.trim().toLowerCase();
    const ageMin = parseFilterNumber(appliedFilters.ageMin);
    const ageMax = parseFilterNumber(appliedFilters.ageMax);

    return balitaList
      .filter((balita) => {
        if (searchValue && !balita.nama.toLowerCase().includes(searchValue)) {
          return false;
        }

        if (
          appliedFilters.gender !== "SEMUA" &&
          balita.jenisKelamin !== appliedFilters.gender
        ) {
          return false;
        }

        if (
          appliedFilters.rt !== "SEMUA" &&
          String(balita.rt || "").trim() !== appliedFilters.rt
        ) {
          return false;
        }

        if (
          appliedFilters.birthYear !== "SEMUA" &&
          getBirthYear(balita.tglLahir) !== appliedFilters.birthYear
        ) {
          return false;
        }

        if (ageMin !== null || ageMax !== null) {
          const ageValue = getAgeFilterValue(balita, appliedFilters.ageUnit);

          if (ageMin !== null && ageValue < ageMin) return false;
          if (ageMax !== null && ageValue > ageMax) return false;
        }

        return true;
      })
      .sort((a, b) => {
        if (appliedFilters.sortOrder === "default") return 0;

        const comparison = a.nama.localeCompare(b.nama, "id", {
          sensitivity: "base",
        });

        return appliedFilters.sortOrder === "asc" ? comparison : -comparison;
      });
  }, [appliedFilters, balitaList, searchTerm]);

  const openFilterDialog = () => {
    setDraftFilters(appliedFilters);
    setIsFilterOpen(true);
  };

  const applyFilters = () => {
    if (isAgeRangeInvalid) return;
    setAppliedFilters(draftFilters);
    setIsFilterOpen(false);
  };

  const resetDraftFilters = () => {
    setDraftFilters({ ...EMPTY_FILTERS });
  };

  if (loadState !== "success") {
    return (
      <div className="min-h-screen bg-gray-50 text-black font-sans pb-10">
        <Navbar title="Daftar Balita" />
        <main className="p-4 sm:p-6 max-w-6xl mx-auto mt-2">
          <PageStatusState
            tone={loadState === "error" ? "error" : "loading"}
            title={
              loadState === "error"
                ? "Daftar balita belum bisa dimuat"
                : "Memuat daftar balita"
            }
            description={
              loadState === "error"
                ? "Terjadi gangguan saat mengambil data balita atau status pengukuran bulan ini. Coba muat ulang halaman."
                : "Mengambil data balita dan pengukuran bulan ini."
            }
          />
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 text-black font-sans pb-10">
      <Navbar title="Daftar Balita" />

      <main className="p-4 sm:p-6 max-w-6xl mx-auto space-y-6 mt-2">
        <PageHeader
          eyebrow="Data Balita"
          title="Daftar Balita Posyandu"
          description="Cari balita, cek status pengukuran bulan ini, lalu buka detail untuk melihat riwayat lengkap."
          action={
            isAdmin || isRoleLoading ? (
              <span className="inline-flex items-center justify-center gap-2 rounded-xl border border-teal-100 bg-[#f0fbf9] px-4 py-3 text-sm font-black text-[#0d9488]">
                <ShieldCheck size={18} />
                {isRoleLoading ? "Memuat Akses" : "Mode Baca Saja"}
              </span>
            ) : (
              <Link
                href="/dashboard/balita/tambah"
                className="inline-flex items-center justify-center gap-2 bg-[#1fb999] hover:bg-teal-600 text-white font-black px-4 py-3 rounded-xl shadow-sm transition-colors"
              >
                <Plus size={18} />
                Tambah Balita
              </Link>
            )
          }
        />

        {isAdmin && (
          <InfoPanel title="Mode admin baca saja" icon={ShieldCheck}>
            Admin dapat melihat data balita dan status pengukuran, tetapi tambah,
            edit, hapus, dan input pengukuran hanya dilakukan oleh kader.
          </InfoPanel>
        )}

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          <Card className="p-4 rounded-xl">
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
              Total
            </p>
            <p className="text-2xl font-black text-gray-950 mt-2">
              {balitaList.length}
            </p>
          </Card>
          <Card className="p-4 rounded-xl">
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
              Sudah Diukur
            </p>
            <p className="text-2xl font-black text-[#0d9488] mt-2">
              {measuredCount}
            </p>
          </Card>
          <Card className="p-4 rounded-xl col-span-2 sm:col-span-1">
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
              Belum Diukur
            </p>
            <p className="text-2xl font-black text-orange-600 mt-2">
              {Math.max(balitaList.length - measuredCount, 0)}
            </p>
          </Card>
        </div>

        <div className="space-y-3">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search
                className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 z-10"
                size={20}
              />
              <input
                type="text"
                placeholder="Ketik nama balita"
                className="pl-12 pr-4 py-4 border border-gray-200 rounded-xl bg-white w-full focus:outline-none focus:ring-2 focus:ring-teal-100 text-base shadow-sm font-semibold"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <button
              type="button"
              onClick={openFilterDialog}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-teal-100 bg-white px-5 py-4 text-sm font-black text-[#0d9488] shadow-sm hover:bg-[#f0fbf9] active:scale-[0.99] transition-all"
            >
              <SlidersHorizontal size={18} />
              Filter
              {activeFilterCount > 0 && (
                <span className="min-w-6 h-6 px-2 rounded-full bg-[#0d9488] text-white text-xs font-black inline-flex items-center justify-center">
                  {activeFilterCount}
                </span>
              )}
            </button>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 rounded-xl border border-gray-100 bg-white px-4 py-3 shadow-sm">
            <p className="text-xs font-bold text-gray-600">
              Menampilkan {filteredData.length} dari {balitaList.length} balita
            </p>
            {activeFilterCount > 0 && (
              <button
                type="button"
                onClick={() => {
                  setAppliedFilters({ ...EMPTY_FILTERS });
                  setDraftFilters({ ...EMPTY_FILTERS });
                }}
                className="inline-flex items-center gap-1.5 text-xs font-black text-orange-600 hover:text-orange-700"
              >
                <RotateCcw size={14} />
                Reset filter
              </button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredData.length > 0 ? (
            filteredData.map((balita) => {
              const isMeasured = measuredBalitaIds.has(balita.id);

              return (
                <Card
                  key={balita.id}
                  className="flex flex-col border border-gray-100 shadow-sm rounded-xl bg-white overflow-hidden"
                >
                  <div className="flex items-start gap-4">
                    <div
                      className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${
                        balita.jenisKelamin === "PEREMPUAN"
                          ? "bg-[#fce5f1] text-pink-500"
                          : "bg-[#e5f5fd] text-sky-500"
                      }`}
                    >
                      <Baby size={24} />
                    </div>
                    <div className="min-w-0">
                      <h2 className="text-base font-black text-black truncate">
                        {balita.nama}
                      </h2>
                      <p className="text-sm text-gray-700 mt-1">
                        {balita.jenisKelamin === "PEREMPUAN"
                          ? "Perempuan"
                          : "Laki-laki"}
                      </p>
                      <p className="text-xs text-gray-600 mt-1">
                        Usia {formatAgeLabel(balita.tglLahir)}. Lahir{" "}
                        {getBirthYear(balita.tglLahir)}
                      </p>
                      <p className="text-xs text-gray-600 mt-1 leading-relaxed">
                        Wali: {balita.namaWali}. RT {balita.rt}/RW {balita.rw}
                      </p>
                    </div>
                  </div>

                  <div className="border-t border-gray-100 mt-4 pt-4 flex items-center justify-between gap-3">
                    <div
                      className={`px-4 py-2 rounded-full text-xs font-black ${
                        isMeasured
                          ? "bg-[#e6fbf5] text-[#0d9488]"
                          : "bg-[#fff5ea] text-orange-600"
                      }`}
                    >
                      {isMeasured ? "Sudah diukur" : "Belum diukur"}
                    </div>
                    <Link
                      href={`/dashboard/balita/${balita.id}`}
                      className="text-sm font-black text-[#0d9488] hover:text-teal-900 transition-colors"
                    >
                      Lihat detail
                    </Link>
                  </div>
                </Card>
              );
            })
          ) : (
            <div className="md:col-span-2">
              <EmptyState
                title="Data tidak ditemukan"
                description="Coba ketik nama lain, ubah pilihan filter, atau reset filter yang sedang aktif."
              />
            </div>
          )}
        </div>

        {isFilterOpen && (
          <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4">
            <div
              role="dialog"
              aria-modal="true"
              aria-labelledby="filter-balita-title"
              className="w-full sm:max-w-2xl max-h-[92vh] overflow-y-auto bg-white shadow-2xl border border-gray-100"
            >
              <div className="sticky top-0 z-10 bg-white border-b border-gray-100 px-5 py-4 rounded-t-3xl sm:rounded-t-3xl">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-[10px] font-black text-[#0d9488] uppercase tracking-widest">
                      Filter Data
                    </p>
                    <h3
                      id="filter-balita-title"
                      className="text-lg font-black text-gray-950 mt-1"
                    >
                      Pilih Balita yang Ingin Dilihat
                    </h3>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsFilterOpen(false)}
                    className="w-10 h-10 rounded-full border border-gray-200 bg-white text-gray-600 inline-flex items-center justify-center hover:bg-gray-50 active:scale-95"
                    aria-label="Tutup filter"
                  >
                    <X size={18} />
                  </button>
                </div>
              </div>

              <div className="p-5 space-y-5">
                <section className="rounded-2xl border border-gray-100 bg-gray-50/70 p-4 space-y-3">
                  <div>
                    <h4 className="text-sm font-black text-gray-900">
                      Jenis Kelamin
                    </h4>
                    <p className="text-xs font-medium text-gray-500 mt-1">
                      Tampilkan semua balita atau pilih salah satu jenis
                      kelamin.
                    </p>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    {GENDER_FILTER_OPTIONS.map((option) => {
                      const isSelected = draftFilters.gender === option.value;

                      return (
                        <button
                          key={option.value}
                          type="button"
                          onClick={() =>
                            setDraftFilters((prev) => ({
                              ...prev,
                              gender: option.value,
                            }))
                          }
                          className={`rounded-xl border px-4 py-3 text-sm font-black transition-all ${
                            isSelected
                              ? "border-[#0d9488] bg-[#e6fbf5] text-[#0d9488]"
                              : "border-gray-200 bg-white text-gray-600 hover:bg-gray-50"
                          }`}
                        >
                          {option.label}
                        </button>
                      );
                    })}
                  </div>
                </section>

                <section className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="rounded-2xl border border-gray-100 bg-white p-4 space-y-2">
                    <label className="text-sm font-black text-gray-900">
                      RT
                    </label>
                    <select
                      value={draftFilters.rt}
                      onChange={(e) =>
                        setDraftFilters((prev) => ({
                          ...prev,
                          rt: e.target.value,
                        }))
                      }
                      className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm font-bold text-gray-900 outline-none focus:ring-2 focus:ring-teal-100 focus:border-teal-500"
                    >
                      <option value="SEMUA">Semua RT</option>
                      {rtOptions.map((rt) => (
                        <option key={rt} value={rt}>
                          RT {rt}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="rounded-2xl border border-gray-100 bg-white p-4 space-y-2">
                    <label className="text-sm font-black text-gray-900">
                      Tahun Lahir
                    </label>
                    <select
                      value={draftFilters.birthYear}
                      onChange={(e) =>
                        setDraftFilters((prev) => ({
                          ...prev,
                          birthYear: e.target.value,
                        }))
                      }
                      className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm font-bold text-gray-900 outline-none focus:ring-2 focus:ring-teal-100 focus:border-teal-500"
                    >
                      <option value="SEMUA">Semua tahun</option>
                      {birthYearOptions.map((year) => (
                        <option key={year} value={year}>
                          Lahir tahun {year}
                        </option>
                      ))}
                    </select>
                  </div>
                </section>

                <section className="rounded-2xl border border-gray-100 bg-white p-4 space-y-4">
                  <div>
                    <h4 className="text-sm font-black text-gray-900">
                      Umur Balita
                    </h4>
                    <p className="text-xs font-medium text-gray-500 mt-1">
                      Pakai bulan untuk bayi, atau tahun untuk balita yang lebih
                      besar.
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-2 rounded-2xl bg-gray-100 p-1.5">
                    {(["bulan", "tahun"] as AgeUnit[]).map((unit) => {
                      const isSelected = draftFilters.ageUnit === unit;

                      return (
                        <button
                          key={unit}
                          type="button"
                          onClick={() =>
                            setDraftFilters((prev) => ({
                              ...prev,
                              ageUnit: unit,
                            }))
                          }
                          className={`rounded-xl px-4 py-3 text-sm font-black capitalize transition-all ${
                            isSelected
                              ? "bg-white text-[#0d9488] shadow-sm"
                              : "text-gray-500 hover:text-gray-900"
                          }`}
                        >
                          {unit}
                        </button>
                      );
                    })}
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <label className="text-xs font-black text-gray-600">
                        Dari
                      </label>
                      <input
                        type="number"
                        min={0}
                        value={draftFilters.ageMin}
                        onChange={(e) =>
                          setDraftFilters((prev) => ({
                            ...prev,
                            ageMin: e.target.value.replace(/\D/g, ""),
                          }))
                        }
                        placeholder={`0 ${draftFilters.ageUnit}`}
                        className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm font-bold text-gray-900 outline-none focus:ring-2 focus:ring-teal-100 focus:border-teal-500"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-black text-gray-600">
                        Sampai
                      </label>
                      <input
                        type="number"
                        min={0}
                        value={draftFilters.ageMax}
                        onChange={(e) =>
                          setDraftFilters((prev) => ({
                            ...prev,
                            ageMax: e.target.value.replace(/\D/g, ""),
                          }))
                        }
                        placeholder={`60 ${draftFilters.ageUnit}`}
                        className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm font-bold text-gray-900 outline-none focus:ring-2 focus:ring-teal-100 focus:border-teal-500"
                      />
                    </div>
                  </div>
                  {isAgeRangeInvalid && (
                    <p className="rounded-xl bg-rose-50 border border-rose-100 px-3 py-2 text-xs font-bold text-rose-600">
                      Batas awal umur tidak boleh lebih besar dari batas akhir.
                    </p>
                  )}
                </section>

                <section className="rounded-2xl border border-gray-100 bg-gray-50/70 p-4 space-y-3">
                  <div>
                    <h4 className="text-sm font-black text-gray-900">
                      Urutan Nama
                    </h4>
                    <p className="text-xs font-medium text-gray-500 mt-1">
                      Pilih urutan daftar berdasarkan abjad nama balita.
                    </p>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    {SORT_OPTIONS.map((option) => {
                      const isSelected =
                        draftFilters.sortOrder === option.value;

                      return (
                        <button
                          key={option.value}
                          type="button"
                          onClick={() =>
                            setDraftFilters((prev) => ({
                              ...prev,
                              sortOrder: option.value,
                            }))
                          }
                          className={`text-left rounded-xl border px-4 py-3 transition-all ${
                            isSelected
                              ? "border-[#0d9488] bg-[#e6fbf5] text-[#0d9488]"
                              : "border-gray-200 bg-white text-gray-600 hover:bg-gray-50"
                          }`}
                        >
                          <span className="block text-sm font-black">
                            {option.label}
                          </span>
                          <span className="block text-[10px] font-bold opacity-70 mt-1">
                            {option.description}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </section>
              </div>

              <div className="sticky bottom-0 bg-white border-t border-gray-100 p-4 flex flex-col sm:flex-row gap-3">
                <button
                  type="button"
                  onClick={resetDraftFilters}
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-5 py-3.5 text-sm font-black text-gray-700 hover:bg-gray-50 active:scale-[0.99]"
                >
                  <RotateCcw size={17} />
                  Reset
                </button>
                <button
                  type="button"
                  onClick={applyFilters}
                  disabled={isAgeRangeInvalid}
                  className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-[#1fb999] px-5 py-3.5 text-sm font-black text-white shadow-sm hover:bg-teal-600 active:scale-[0.99] disabled:bg-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed"
                >
                  <Check size={17} />
                  Terapkan Filter
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
