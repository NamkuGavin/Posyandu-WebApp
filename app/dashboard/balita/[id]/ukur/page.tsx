"use client";

import { useState, useEffect, useMemo } from "react";
import { ArrowLeft, Baby, ChevronDown } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import Navbar from "@/components/layout/Navbar";
import Card from "@/components/ui/Card";
import { InfoPanel, PageStatusState } from "@/components/ui/PageParts";
import { getBalitaById, addPengukuran, getPengukuranList } from "@/lib/api";
import { useCurrentProfile } from "@/lib/useCurrentProfile";
import { Balita, Pengukuran } from "@/types";

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

function calculateAgeInMonths(birthDate: string): number {
  const birth = new Date(birthDate);
  const now = new Date();
  const diffYears = now.getFullYear() - birth.getFullYear();
  const diffMonths = now.getMonth() - birth.getMonth();
  return diffYears * 12 + diffMonths;
}

type MeasurementPeriod = {
  month: number;
  year: number;
};

type MeasurementMonthOption = {
  label: string;
  value: number;
};

function getBirthPeriod(dateString?: string | null): MeasurementPeriod | null {
  if (!dateString) return null;

  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return null;

  return {
    month: date.getUTCMonth() + 1,
    year: date.getUTCFullYear(),
  };
}

function getMeasurementYearOptions(
  birthPeriod: MeasurementPeriod | null,
  currentYear: number,
) {
  if (!birthPeriod || birthPeriod.year > currentYear) return [];

  const years = [];
  for (let year = currentYear; year >= birthPeriod.year; year -= 1) {
    years.push(year);
  }

  return years;
}

function getMeasurementMonthOptions(
  year: number,
  birthPeriod: MeasurementPeriod | null,
  currentMonth: number,
  currentYear: number,
  monthNames: string[],
): MeasurementMonthOption[] {
  if (!birthPeriod || year < birthPeriod.year || year > currentYear) {
    return [];
  }

  const startMonth = year === birthPeriod.year ? birthPeriod.month : 1;
  const endMonth = year === currentYear ? currentMonth : 12;

  if (startMonth > endMonth) return [];

  return monthNames
    .slice(startMonth - 1, endMonth)
    .map((label, index) => ({
      label,
      value: startMonth + index,
    }));
}

function getMeasurementPeriodKey(year: number, month: number) {
  return `${year}-${month}`;
}

function getLatestAvailableMonth(
  monthOptions: MeasurementMonthOption[],
  fallback: number,
) {
  return monthOptions[monthOptions.length - 1]?.value ?? fallback;
}
import { useToast } from "@/components/ui/Toast";

const InputWithSuffix = ({
  label,
  suffix,
  value,
  onChange,
  sublabel = "",
  disabled = false,
  placeholder = "0.0",
}: {
  label: string;
  suffix: string;
  value: string;
  onChange: (val: string) => void;
  sublabel?: string;
  disabled?: boolean;
  placeholder?: string;
}) => (
  <div className="space-y-1">
    <div className="flex justify-between items-end">
      <label className="text-xs font-bold text-black">{label}</label>
      {sublabel && <span className="text-[9px] text-gray-400">{sublabel}</span>}
    </div>
    <div
      className={`relative flex rounded-xl border overflow-hidden transition-all shadow-sm ${
        disabled
          ? "border-gray-100 bg-gray-50"
          : "border-gray-200 focus-within:ring-2 focus-within:ring-teal-500/20 focus-within:border-teal-500 bg-white"
      }`}
    >
      <input
        type="number"
        step="any"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        className="w-full p-3.5 pr-12 text-sm text-black font-bold outline-none bg-transparent placeholder:text-gray-300 disabled:text-gray-400 disabled:cursor-not-allowed"
      />
      <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-gray-400">
        {suffix}
      </span>
    </div>
  </div>
);

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
  const [measurementLoadState, setMeasurementLoadState] = useState<
    "loading" | "success" | "error"
  >("loading");
  const { success, warning } = useToast();
  const [ageInMonths, setAgeInMonths] = useState<number | null>(null);

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
        MONTH_NAMES,
      ),
    [birthPeriod, currentMonth, currentYear, selectedYear],
  );
  const hasAvailablePeriod = yearOptions.length > 0 && monthOptions.length > 0;
  const selectedPeriodKey = getMeasurementPeriodKey(
    selectedYear,
    selectedMonth,
  );
  const selectedMeasurement = measurementByPeriod[selectedPeriodKey];
  const isMeasurementStatusLoaded =
    measurementLoadState === "success" &&
    selectedPeriodKey in measurementByPeriod;
  const selectedMonthName = MONTH_NAMES[selectedMonth - 1] ?? "";
  const isMeasurementLocked = Boolean(selectedMeasurement);

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
        if (found.tglLahir) {
          setAgeInMonths(calculateAgeInMonths(found.tglLahir));
        }
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
    let isActive = true;

    Promise.resolve().then(() => {
      if (!isActive) return;
      setMeasurementByPeriod({});
      setSelectedYear(currentYear);
      setSelectedMonth(currentMonth);
      setMeasurementLoadState("loading");
    });

    return () => {
      isActive = false;
    };
  }, [currentMonth, currentYear, id]);

  useEffect(() => {
    let isActive = true;

    if (!birthPeriod || !hasAvailablePeriod) {
      Promise.resolve().then(() => {
        if (isActive) setMeasurementLoadState("loading");
      });
      return () => {
        isActive = false;
      };
    }

    const validMonth = monthOptions.some(
      (month) => month.value === selectedMonth,
    );

    if (!validMonth) {
      Promise.resolve().then(() => {
        if (isActive) setMeasurementLoadState("loading");
      });
      return () => {
        isActive = false;
      };
    }

    if (selectedPeriodKey in measurementByPeriod) {
      Promise.resolve().then(() => {
        if (isActive) setMeasurementLoadState("success");
      });
      return () => {
        isActive = false;
      };
    }

    Promise.resolve().then(() => {
      if (isActive) setMeasurementLoadState("loading");
    });

    getPengukuranList(selectedMonth, selectedYear)
      .then((list) => {
        if (!isActive) return;
        const measurement =
          list.find((pengukuran) => pengukuran.balitaId === id) ?? null;
        setMeasurementByPeriod((prev) => ({
          ...prev,
          [selectedPeriodKey]: measurement,
        }));
        setMeasurementLoadState("success");
      })
      .catch((err) => {
        console.error(err);
        if (isActive) setMeasurementLoadState("error");
      });

    return () => {
      isActive = false;
    };
  }, [
    birthPeriod,
    currentMonth,
    currentYear,
    hasAvailablePeriod,
    id,
    measurementByPeriod,
    monthOptions,
    selectedMonth,
    selectedPeriodKey,
    selectedYear,
  ]);

  useEffect(() => {
    if (!birthPeriod) return;
    let isActive = true;

    const yearIsAvailable = yearOptions.includes(selectedYear);
    const availableMonths = getMeasurementMonthOptions(
      selectedYear,
      birthPeriod,
      currentMonth,
      currentYear,
      MONTH_NAMES,
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

  // Clean lingkarLengan if child is 6 months or under
  useEffect(() => {
    let isActive = true;

    if (ageInMonths !== null && ageInMonths <= 6) {
      Promise.resolve().then(() => {
        if (isActive) setLingkarLengan("");
      });
    }

    return () => {
      isActive = false;
    };
  }, [ageInMonths]);

  useEffect(() => {
    let isActive = true;

    if (selectedMeasurement) {
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

  if (!isMeasurementStatusLoaded) {
    return (
      <div className="min-h-screen bg-gray-50 text-black font-sans pb-10">
        <Navbar title="Input Pengukuran" />
        <main className="p-4 sm:p-6 max-w-2xl mx-auto mt-2">
          <PageStatusState
            tone={measurementLoadState === "error" ? "error" : "loading"}
            title={
              measurementLoadState === "error"
                ? "Status pengukuran belum bisa dicek"
                : "Mengecek status pengukuran"
            }
            description={
              measurementLoadState === "error"
                ? "Terjadi gangguan saat mengambil data pengukuran periode ini. Coba muat ulang halaman."
                : `Mengambil status pengukuran ${selectedMonthName} ${selectedYear}.`
            }
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

    const isOver6Months = ageInMonths !== null && ageInMonths > 6;

    if (!isMeasurementStatusLoaded) {
      warning("Status pengukuran periode ini masih dicek. Coba lagi sebentar.");
      return;
    }

    if (isMeasurementLocked) {
      setIsMeasuredDialogOpen(true);
      return;
    }

    if (
      !tinggi ||
      !berat ||
      !lingkarKepala ||
      (isOver6Months && !lingkarLengan)
    ) {
      warning(
        isOver6Months
          ? "Harap isi semua data pengukuran!"
          : "Harap isi data panjang, berat, dan lingkar kepala!",
      );
      return;
    }

    const newMeasurement: Omit<Pengukuran, "id"> = {
      bulan: selectedMonth,
      tahun: selectedYear,
      beratBadan: parseFloat(berat),
      tinggiBadan: parseFloat(tinggi),
      lingkarKepala: lingkarKepala ? parseFloat(lingkarKepala) : null,
      lingkarLengan: lingkarLengan ? parseFloat(lingkarLengan) : null,
    };

    await addPengukuran(id, newMeasurement);
    success("Pengukuran berhasil disimpan dan kehadiran otomatis tercatat.");
    router.push(`/dashboard/balita/${id}`);
  };

  const isLlaDisabled = ageInMonths !== null && ageInMonths <= 6;

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
          Edit Data Balita. Saat disimpan, kehadiran periode tersebut otomatis
          tercatat.
        </InfoPanel>

        <Card className="p-5 bg-white border border-gray-100 shadow-sm rounded-xl flex items-center gap-4">
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
            <h5 className="text-sm font-bold text-black">{balita.nama}</h5>
            <p className="text-xs text-gray-700 mt-1">
              {balita.jenisKelamin === "PEREMPUAN" ? "Perempuan" : "Laki-laki"}
            </p>
            <p className="text-xs text-gray-700 mt-0.5">
              {balita.namaWali} • {balita.alamat} RT {balita.rt}/RW {balita.rw}
            </p>
          </div>
        </Card>

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
                    MONTH_NAMES,
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
                  if (alreadyMeasured) {
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
                  const isStatusLoaded = periodKey in measurementByPeriod;
                  const isMeasured = Boolean(measurementByPeriod[periodKey]);

                  return (
                    <option key={periodKey} value={month.value}>
                      {month.label} {selectedYear}
                      {isStatusLoaded
                        ? ` - ${isMeasured ? "Sudah diukur" : "Belum diukur"}`
                        : ""}
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
          {selectedMeasurement && (
            <p className="text-xs font-bold text-orange-600">
              {selectedMonthName} {selectedYear} sudah memiliki data pengukuran.
              Semua field dikunci, gunakan Edit Data Balita untuk mengubahnya.
            </p>
          )}
        </div>

        <div className="space-y-4 pt-2">
          <p className="text-xs font-bold text-gray-500 ml-1">
            Data Pengukuran
          </p>
          <InputWithSuffix
            label="Panjang / Tinggi"
            suffix="cm"
            value={tinggi}
            onChange={setTinggi}
            disabled={isMeasurementLocked}
          />
          <InputWithSuffix
            label="Berat"
            suffix="kg"
            value={berat}
            onChange={setBerat}
            disabled={isMeasurementLocked}
          />
          <InputWithSuffix
            label="Lingkar Kepala"
            suffix="cm"
            value={lingkarKepala}
            onChange={setLingkarKepala}
            disabled={isMeasurementLocked}
          />
          <InputWithSuffix
            label="Lingkar Lengan Atas"
            suffix="cm"
            value={lingkarLengan}
            onChange={setLingkarLengan}
            sublabel="Untuk balita usia > 6 bulan"
            disabled={isLlaDisabled || isMeasurementLocked}
            placeholder={isLlaDisabled ? "Tidak wajib (≤ 6 bulan)" : "0.0"}
          />
        </div>

        <button
          onClick={handleSave}
          disabled={!isMeasurementStatusLoaded || Boolean(selectedMeasurement)}
          className={`w-full font-bold py-4 rounded-xl transition-colors active:scale-95 shadow-md mt-6 ${
            !isMeasurementStatusLoaded || selectedMeasurement
              ? "bg-gray-200 text-gray-400 cursor-not-allowed shadow-none"
              : "bg-[#1fb999] hover:bg-teal-600 text-white shadow-teal-100 cursor-pointer"
          }`}
        >
          {isMeasurementStatusLoaded
            ? "Simpan Pengukuran"
            : "Mengecek Status..."}
        </button>
      </main>

      {isMeasuredDialogOpen && selectedMeasurement && (
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
