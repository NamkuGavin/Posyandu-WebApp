"use client";

import { useState, useEffect, useMemo } from "react";
import { ArrowLeft, ChevronDown } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import Navbar from "@/components/layout/Navbar";
import BalitaSummaryCard from "@/components/balita/BalitaSummaryCard";
import MeasurementInput from "@/components/balita/MeasurementInput";
import { InfoPanel, PageStatusState } from "@/components/ui/PageParts";
import {
  getBalitaById,
  addPengukuran,
  updatePengukuranBalita,
} from "@/lib/api";
import { useCurrentProfile } from "@/lib/useCurrentProfile";
import { isCompletedMeasurement } from "@/lib/measurement-status";
import { MONTH_NAMES } from "@/lib/constants";
import { calculateAgeInMonths } from "@/lib/date-utils";
import {
  getBirthPeriod,
  getLatestAvailableMonth,
  getMeasurementMonthOptions,
  getMeasurementPeriodKey,
  getMeasurementsByPeriod,
  getMeasurementYearOptions,
} from "@/lib/measurement-period";
import { Balita, Pengukuran } from "@/types";
import { useToast } from "@/components/ui/Toast";

export default function UkurBalitaPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const { isAdmin, isLoading: isRoleLoading } = useCurrentProfile();
  const [balita, setBalita] = useState<Balita | null>(null);
  const [measurementByPeriod, setMeasurementByPeriod] = useState<
    Record<string, Pengukuran | null>
  >({});
  const [loadState, setLoadState] = useState<"loading" | "success" | "error">(
    "loading",
  );
  const { success, warning } = useToast();

  // Form states
  const [tinggi, setTinggi] = useState("");
  const [berat, setBerat] = useState("");
  const [lingkarKepala, setLingkarKepala] = useState("");
  const [lingkarLengan, setLingkarLengan] = useState("");
  const currentDate = new Date();
  const currentMonth = currentDate.getMonth() + 1;
  const currentYear = currentDate.getFullYear();
  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [selectedMonth, setSelectedMonth] = useState(currentMonth);
  const [isMeasuredDialogOpen, setIsMeasuredDialogOpen] = useState(false);

  const birthPeriod = useMemo(
    () => getBirthPeriod(balita?.tglLahir),
    [balita?.tglLahir],
  );
  const yearOptions = useMemo(
    () => getMeasurementYearOptions(birthPeriod, currentYear),
    [birthPeriod, currentYear],
  );
  const monthOptions = useMemo(
    () =>
      getMeasurementMonthOptions(
        selectedYear,
        birthPeriod,
        currentMonth,
        currentYear,
      ),
    [birthPeriod, currentMonth, currentYear, selectedYear],
  );
  const hasAvailablePeriod = yearOptions.length > 0 && monthOptions.length > 0;
  const selectedPeriodKey = getMeasurementPeriodKey(
    selectedYear,
    selectedMonth,
  );
  const selectedMeasurement = measurementByPeriod[selectedPeriodKey];
  const selectedMonthName = MONTH_NAMES[selectedMonth - 1] ?? "";
  const isMeasurementLocked = isCompletedMeasurement(selectedMeasurement);
  const ageAtMeasurement = useMemo(
    () =>
      calculateAgeInMonths(
        balita?.tglLahir,
        new Date(selectedYear, selectedMonth - 1, 1),
      ),
    [balita?.tglLahir, selectedMonth, selectedYear],
  );
  const isLilaDisabled =
    ageAtMeasurement === null || ageAtMeasurement <= 6;

  useEffect(() => {
    let isActive = true;

    Promise.resolve().then(() => {
      if (!isActive) return;
      setLoadState("loading");
      setMeasurementByPeriod({});
      setSelectedYear(currentYear);
      setSelectedMonth(currentMonth);
    });

    getBalitaById(id)
      .then((found) => {
        if (!isActive) return;
        if (!found) {
          setLoadState("error");
          return;
        }

        setBalita(found);
        setMeasurementByPeriod(
          getMeasurementsByPeriod(found.pengukuran ?? []),
        );
        setLoadState("success");
      })
      .catch((err) => {
        console.error(err);
        if (isActive) setLoadState("error");
      });

    return () => {
      isActive = false;
    };
  }, [currentMonth, currentYear, id]);

  useEffect(() => {
    if (!birthPeriod) return;
    let isActive = true;

    const yearIsAvailable = yearOptions.includes(selectedYear);
    const availableMonths = getMeasurementMonthOptions(
      selectedYear,
      birthPeriod,
      currentMonth,
      currentYear,
    );
    const monthIsAvailable = availableMonths.some(
      (month) => month.value === selectedMonth,
    );

    Promise.resolve().then(() => {
      if (!isActive) return;

      if (!yearIsAvailable) {
        setSelectedYear(currentYear);
        return;
      }

      if (!monthIsAvailable) {
        setSelectedMonth(
          getLatestAvailableMonth(availableMonths, currentMonth),
        );
      }
    });

    return () => {
      isActive = false;
    };
  }, [
    birthPeriod,
    currentMonth,
    currentYear,
    selectedMonth,
    selectedYear,
    yearOptions,
  ]);

  // LiLA is only accepted after the child is older than 6 months.
  useEffect(() => {
    let isActive = true;

    if (isLilaDisabled) {
      Promise.resolve().then(() => {
        if (isActive) setLingkarLengan("");
      });
    }

    return () => {
      isActive = false;
    };
  }, [isLilaDisabled]);

  useEffect(() => {
    let isActive = true;

    if (isCompletedMeasurement(selectedMeasurement)) {
      Promise.resolve().then(() => {
        if (isActive) setIsMeasuredDialogOpen(true);
      });
    }

    return () => {
      isActive = false;
    };
  }, [selectedMeasurement, selectedMonth, selectedYear]);

  if (loadState !== "success" || !balita || balita.id !== id) {
    return (
      <div className="min-h-screen bg-gray-50 text-black font-sans pb-10">
        <Navbar title="Input Pengukuran" />
        <main className="p-4 sm:p-6 max-w-2xl mx-auto mt-2">
          <PageStatusState
            tone={loadState === "error" ? "error" : "loading"}
            title={
              loadState === "error"
                ? "Data balita belum bisa dimuat"
                : "Memuat data balita"
            }
            description={
              loadState === "error"
                ? "Terjadi gangguan saat mengambil data balita. Coba muat ulang halaman."
                : "Mengambil data balita sebelum membuka form pengukuran."
            }
          />
        </main>
      </div>
    );
  }

  if (isRoleLoading || isAdmin) {
    return (
      <div className="min-h-screen bg-gray-50 text-black font-sans pb-10">
        <Navbar title="Input Pengukuran" />
        <main className="p-4 sm:p-6 max-w-2xl mx-auto mt-2">
          <PageStatusState
            tone={isAdmin ? "error" : "loading"}
            title={
              isAdmin
                ? "Input pengukuran hanya untuk kader"
                : "Memuat akses pengguna"
            }
            description={
              isAdmin
                ? "Admin memiliki akses baca saja untuk data operasional. Pengukuran balita dilakukan oleh kader."
                : "Mengecek role pengguna sebelum menampilkan form pengukuran."
            }
          />
        </main>
      </div>
    );
  }

  if (!hasAvailablePeriod) {
    return (
      <div className="min-h-screen bg-gray-50 text-black font-sans pb-10">
        <Navbar title="Input Pengukuran" />
        <main className="p-4 sm:p-6 max-w-2xl mx-auto mt-2">
          <PageStatusState
            tone="error"
            title="Periode pengukuran belum tersedia"
            description="Tanggal lahir balita belum valid atau berada setelah bulan berjalan, sehingga periode pengukuran belum bisa dipilih."
          />
        </main>
      </div>
    );
  }

  const handleSave = async () => {
    if (isAdmin) {
      warning("Admin hanya dapat melihat data pengukuran tanpa mengubah data.");
      return;
    }

    if (isMeasurementLocked) {
      setIsMeasuredDialogOpen(true);
      return;
    }

    if (
      !tinggi ||
      !berat
    ) {
      warning("Panjang/tinggi dan berat wajib diisi untuk menyimpan pengukuran.");
      return;
    }

    const newMeasurement: Omit<Pengukuran, "id"> = {
      bulan: selectedMonth,
      tahun: selectedYear,
      beratBadan: parseFloat(berat),
      tinggiBadan: parseFloat(tinggi),
      lingkarKepala: lingkarKepala ? parseFloat(lingkarKepala) : null,
      lingkarLengan:
        !isLilaDisabled && lingkarLengan
          ? parseFloat(lingkarLengan)
          : null,
    };

    if (selectedMeasurement?.id) {
      await updatePengukuranBalita(selectedMeasurement.id, {
        bulan: selectedMonth,
        tahun: selectedYear,
        beratBadan: newMeasurement.beratBadan,
        tinggiBadan: newMeasurement.tinggiBadan,
        lingkarKepala: newMeasurement.lingkarKepala,
        ...(newMeasurement.lingkarLengan !== null
          ? { lila: newMeasurement.lingkarLengan }
          : {}),
      });
    } else {
      await addPengukuran(id, newMeasurement);
    }
    success("Pengukuran berhasil disimpan.");
    router.push(`/dashboard/balita/${id}`);
  };

  return (
    <div className="min-h-screen bg-gray-50 text-black font-sans pb-10">
      <Navbar title="Input Pengukuran" />

      <main className="p-4 sm:p-6 max-w-2xl mx-auto space-y-6 mt-2">
        <div className="flex items-center justify-between relative h-10">
          <button
            onClick={() => router.back()}
            className="w-10 h-10 rounded-full border border-gray-200 flex items-center justify-center hover:bg-gray-100 transition-colors bg-white shadow-sm z-10 active:scale-95"
          >
            <ArrowLeft size={20} className="text-black" />
          </button>
          <h1 className="text-lg font-bold text-black absolute left-1/2 -translate-x-1/2 w-full text-center pointer-events-none">
            Input Pengukuran
          </h1>
        </div>

        <InfoPanel title="Cara mengisi pengukuran">
          Pilih bulan pengukuran, lalu isi angka sesuai hasil ukur. Jika bulan
          sudah pernah diukur, field dikunci dan perubahan dilakukan melalui
          Edit Data Balita. Kehadiran tetap dicatat manual melalui halaman
          absensi.
        </InfoPanel>

        <BalitaSummaryCard balita={balita} />

        <div className="rounded-xl border border-teal-100 bg-[#f0fbf9] p-4 shadow-sm space-y-3">
          <p className="text-[10px] font-bold uppercase tracking-widest text-[#0d9488]">
            Periode Pengukuran
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-[120px_1fr] gap-3">
            <div className="relative">
              <select
                value={selectedYear}
                onChange={(e) => {
                  const year = Number(e.target.value);
                  const availableMonths = getMeasurementMonthOptions(
                    year,
                    birthPeriod,
                    currentMonth,
                    currentYear,
                  );

                  setSelectedYear(year);
                  if (
                    !availableMonths.some(
                      (month) => month.value === selectedMonth,
                    )
                  ) {
                    setSelectedMonth(
                      getLatestAvailableMonth(availableMonths, selectedMonth),
                    );
                  }
                }}
                className="w-full appearance-none bg-white border border-teal-100 rounded-xl p-3.5 pr-10 text-sm text-black font-bold focus:outline-none focus:ring-1 focus:ring-teal-500 shadow-sm cursor-pointer"
              >
                {yearOptions.map((year) => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                ))}
              </select>
              <ChevronDown
                size={18}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none"
              />
            </div>
            <div className="relative">
              <select
                value={selectedMonth}
                onChange={(e) => {
                  const month = Number(e.target.value);
                  const periodKey = getMeasurementPeriodKey(
                    selectedYear,
                    month,
                  );

                  setSelectedMonth(month);
                  const alreadyMeasured = measurementByPeriod[periodKey];
                  if (isCompletedMeasurement(alreadyMeasured)) {
                    setIsMeasuredDialogOpen(true);
                  }
                }}
                className="w-full appearance-none bg-white border border-teal-100 rounded-xl p-3.5 pr-10 text-sm text-black font-bold focus:outline-none focus:ring-1 focus:ring-teal-500 shadow-sm cursor-pointer"
              >
                {monthOptions.map((month) => {
                  const periodKey = getMeasurementPeriodKey(
                    selectedYear,
                    month.value,
                  );
                  const isMeasured = isCompletedMeasurement(
                    measurementByPeriod[periodKey],
                  );

                  return (
                    <option key={periodKey} value={month.value}>
                      {month.label} {selectedYear}
                      {` - ${isMeasured ? "Sudah diukur" : "Belum diukur"}`}
                    </option>
                  );
                })}
              </select>
              <ChevronDown
                size={18}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none"
              />
            </div>
          </div>
          <p className="text-xs font-medium leading-relaxed text-gray-600">
            Pilih periode pengukuran mulai dari bulan lahir balita sampai bulan
            berjalan. Jika bulan sudah diukur, ubah datanya lewat Edit Data
            Balita.
          </p>
          {isMeasurementLocked && (
            <p className="text-xs font-bold text-orange-600">
              {selectedMonthName} {selectedYear} sudah memiliki data pengukuran.
              Semua field dikunci, gunakan Edit Data Balita untuk mengubahnya.
            </p>
          )}
          {selectedMeasurement && !isMeasurementLocked && (
            <p className="text-xs font-bold text-teal-700">
              Record awal periode ini belum memiliki berat dan tinggi yang
              valid. Simpan form ini untuk melengkapi pengukuran.
            </p>
          )}
        </div>

        <div className="space-y-4 pt-2">
          <p className="text-xs font-bold text-gray-500 ml-1">
            Data Pengukuran
          </p>
          <MeasurementInput
            label="Panjang / Tinggi"
            suffix="cm"
            value={tinggi}
            onChange={setTinggi}
            disabled={isMeasurementLocked}
            dense
          />
          <MeasurementInput
            label="Berat"
            suffix="kg"
            value={berat}
            onChange={setBerat}
            disabled={isMeasurementLocked}
            dense
          />
          <MeasurementInput
            label="Lingkar Kepala"
            suffix="cm"
            value={lingkarKepala}
            onChange={setLingkarKepala}
            disabled={isMeasurementLocked}
            dense
          />
          <MeasurementInput
            label="Lingkar Lengan Atas"
            suffix="cm"
            value={lingkarLengan}
            onChange={setLingkarLengan}
            hint="Untuk balita usia > 6 bulan"
            disabled={isLilaDisabled || isMeasurementLocked}
            placeholder={
              isLilaDisabled ? "Tidak dapat diisi (≤ 6 bulan)" : "0.0"
            }
            dense
          />
        </div>

        <button
          onClick={handleSave}
          disabled={isMeasurementLocked}
          className={`w-full font-bold py-4 rounded-xl transition-colors active:scale-95 shadow-md mt-6 ${
            isMeasurementLocked
              ? "bg-gray-200 text-gray-400 cursor-not-allowed shadow-none"
              : "bg-[#1fb999] hover:bg-teal-600 text-white shadow-teal-100 cursor-pointer"
          }`}
        >
          Simpan Pengukuran
        </button>
      </main>

      {isMeasuredDialogOpen && isMeasurementLocked && selectedMeasurement && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full text-center shadow-2xl border border-orange-50">
            <div className="mx-auto w-14 h-14 bg-orange-50 rounded-full flex items-center justify-center mb-4 text-orange-600 font-black">
              !
            </div>
            <h3 className="text-lg font-black text-black mb-2">
              Pengukuran Sudah Ada
            </h3>
            <p className="text-xs text-gray-600 leading-relaxed mb-6">
              Balita ini sudah diukur pada {selectedMonthName} {selectedYear}.
              Jika ingin mengubah data pengukuran, gunakan fitur Edit Data
              Balita.
            </p>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setIsMeasuredDialogOpen(false)}
                className="flex-1 bg-white hover:bg-gray-50 active:scale-[0.99] border border-gray-300 text-gray-700 font-bold py-3 px-4 rounded-2xl shadow-sm transition-all text-xs"
              >
                Tutup
              </button>
              <button
                type="button"
                onClick={() => router.push(`/dashboard/balita/${id}/edit`)}
                className="flex-1 bg-[#1fb999] hover:bg-teal-600 active:scale-[0.99] text-white font-bold py-3 px-4 rounded-2xl shadow-sm transition-all text-xs"
              >
                Edit Data
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
