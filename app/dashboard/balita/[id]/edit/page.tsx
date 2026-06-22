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
  updateBalita,
  updatePengukuranBalita,
} from "@/lib/api";
import { useCurrentProfile } from "@/lib/useCurrentProfile";
import { isCompletedMeasurement } from "@/lib/measurement-status";
import { MONTH_NAMES, NIK_LENGTH } from "@/lib/constants";
import { calculateAgeInMonths } from "@/lib/date-utils";
import { onlyDigits, toOptionalNumber } from "@/lib/form-utils";
import {
  getBirthPeriod,
  getLatestAvailableMonth,
  getMeasurementFieldValues,
  getMeasurementMonthOptions,
  getMeasurementPeriodKey,
  getMeasurementsByPeriod,
  getMeasurementYearOptions,
} from "@/lib/measurement-period";
import { Balita, Pengukuran } from "@/types";
import { useToast } from "@/components/ui/Toast";

export default function EditBalitaPage() {
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
  const { success, warning, error } = useToast();
  const currentMonth = new Date().getMonth() + 1;
  const currentYear = new Date().getFullYear();

  // Bind fields to state
  const [name, setName] = useState("");
  const [mom, setMom] = useState("");
  const [address, setAddress] = useState("");
  const [rt, setRt] = useState("");
  const [rw, setRw] = useState("");
  const [gender, setGender] = useState("");
  const [nikBayi, setNikBayi] = useState("");
  const [nikWali, setNikWali] = useState("");
  const [noKk, setNoKk] = useState("");
  const [selectedMeasurementYear, setSelectedMeasurementYear] =
    useState(currentYear);
  const [selectedMeasurementMonth, setSelectedMeasurementMonth] =
    useState(currentMonth);
  const [panjangPengukuran, setPanjangPengukuran] = useState("");
  const [beratPengukuran, setBeratPengukuran] = useState("");
  const [lingkarKepalaPengukuran, setLingkarKepalaPengukuran] = useState("");
  const [lingkarLenganPengukuran, setLingkarLenganPengukuran] = useState("");
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
        selectedMeasurementYear,
        birthPeriod,
        currentMonth,
        currentYear,
      ),
    [birthPeriod, currentMonth, currentYear, selectedMeasurementYear],
  );
  const hasAvailablePeriod = yearOptions.length > 0 && monthOptions.length > 0;
  const selectedMeasurementPeriodKey = getMeasurementPeriodKey(
    selectedMeasurementYear,
    selectedMeasurementMonth,
  );

  useEffect(() => {
    let isActive = true;

    Promise.resolve().then(() => {
      if (!isActive) return;
      setLoadState("loading");
      setMeasurementByPeriod({});
      setSelectedMeasurementYear(currentYear);
      setSelectedMeasurementMonth(currentMonth);
    });

    getBalitaById(id)
      .then((found) => {
        if (!isActive) return;
        if (!found) {
          setLoadState("error");
          return;
        }

        setBalita(found);
        const measurementsByPeriod = getMeasurementsByPeriod(
          found.pengukuran ?? [],
        );
        const currentMeasurement =
          measurementsByPeriod[
            getMeasurementPeriodKey(currentYear, currentMonth)
          ];
        const currentMeasurementFields =
          getMeasurementFieldValues(currentMeasurement);

        setMeasurementByPeriod(measurementsByPeriod);
        setPanjangPengukuran(currentMeasurementFields.panjang);
        setBeratPengukuran(currentMeasurementFields.berat);
        setLingkarKepalaPengukuran(currentMeasurementFields.lingkarKepala);
        setLingkarLenganPengukuran(currentMeasurementFields.lingkarLengan);
        setName(found.nama || "");
        setMom(found.namaWali || "");
        setAddress(found.alamat || "");
        setRt(found.rt || "");
        setRw(found.rw || "");
        setGender(
          found.jenisKelamin === "LAKI_LAKI" ? "Laki laki" : "Perempuan",
        );
        setNikBayi(found.nik || "");
        setNikWali(found.nikWali || "");
        setNoKk(found.noKk || "");
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
    let isActive = true;
    const fields = getMeasurementFieldValues(
      measurementByPeriod[selectedMeasurementPeriodKey],
    );

    Promise.resolve().then(() => {
      if (!isActive) return;
      setPanjangPengukuran(fields.panjang);
      setBeratPengukuran(fields.berat);
      setLingkarKepalaPengukuran(fields.lingkarKepala);
      setLingkarLenganPengukuran(fields.lingkarLengan);
    });

    return () => {
      isActive = false;
    };
  }, [
    measurementByPeriod,
    selectedMeasurementPeriodKey,
  ]);

  useEffect(() => {
    if (!birthPeriod) return;
    let isActive = true;

    const yearIsAvailable = yearOptions.includes(selectedMeasurementYear);
    const availableMonths = getMeasurementMonthOptions(
      selectedMeasurementYear,
      birthPeriod,
      currentMonth,
      currentYear,
    );
    const monthIsAvailable = availableMonths.some(
      (month) => month.value === selectedMeasurementMonth,
    );

    Promise.resolve().then(() => {
      if (!isActive) return;

      if (!yearIsAvailable) {
        setSelectedMeasurementYear(currentYear);
        return;
      }

      if (!monthIsAvailable) {
        setSelectedMeasurementMonth(
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
    selectedMeasurementMonth,
    selectedMeasurementYear,
    yearOptions,
  ]);

  const selectedMeasurement = measurementByPeriod[selectedMeasurementPeriodKey];

  if (loadState !== "success" || !balita || balita.id !== id) {
    return (
      <div className="min-h-screen bg-gray-50 text-black font-sans pb-10">
        <Navbar title="Edit Data Balita" />
        <main className="p-4 sm:p-6 max-w-4xl mx-auto mt-2">
          <PageStatusState
            tone={loadState === "error" ? "error" : "loading"}
            title={
              loadState === "error"
                ? "Data balita belum bisa dimuat"
                : "Memuat data balita"
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

  const selectedMonthName = MONTH_NAMES[selectedMeasurementMonth - 1] ?? "";
  if (isRoleLoading || isAdmin) {
    return (
      <div className="min-h-screen bg-gray-50 text-black font-sans pb-10">
        <Navbar title="Edit Data Balita" />
        <main className="p-4 sm:p-6 max-w-4xl mx-auto mt-2">
          <PageStatusState
            tone={isAdmin ? "error" : "loading"}
            title={
              isAdmin ? "Edit data hanya untuk kader" : "Memuat akses pengguna"
            }
            description={
              isAdmin
                ? "Admin memiliki akses baca saja untuk data operasional. Perubahan data balita dan pengukuran dilakukan oleh kader."
                : "Mengecek role pengguna sebelum menampilkan form edit."
            }
          />
        </main>
      </div>
    );
  }

  if (!hasAvailablePeriod) {
    return (
      <div className="min-h-screen bg-gray-50 text-black font-sans pb-10">
        <Navbar title="Edit Data Balita" />
        <main className="p-4 sm:p-6 max-w-4xl mx-auto mt-2">
          <PageStatusState
            tone="error"
            title="Periode pengukuran belum tersedia"
            description="Tanggal lahir balita belum valid atau berada setelah bulan berjalan, sehingga periode pengukuran belum bisa dipilih."
          />
        </main>
      </div>
    );
  }

  const ageInMonths = calculateAgeInMonths(balita.tglLahir);
  const isLilaDisabled = ageInMonths !== null && ageInMonths <= 6;
  const isMeasurementMissing = !selectedMeasurement;

  const handleSave = async () => {
    if (isAdmin) {
      warning("Admin hanya dapat melihat data tanpa mengubah data operasional.");
      return;
    }

    const jenisKelamin = gender.toLowerCase().includes("perempuan")
      ? "PEREMPUAN"
      : "LAKI_LAKI";
    const normalizedNikBayi = nikBayi.trim();
    const normalizedNikWali = nikWali.trim();
    const normalizedNoKk = noKk.trim();

    if (normalizedNikBayi && normalizedNikBayi.length !== NIK_LENGTH) {
      warning("NIK bayi / balita harus 16 digit angka.");
      return;
    }

    if (normalizedNikWali && normalizedNikWali.length !== NIK_LENGTH) {
      warning("NIK wali harus 16 digit angka.");
      return;
    }

    if (normalizedNoKk && normalizedNoKk.length !== NIK_LENGTH) {
      warning("No. KK harus 16 digit angka.");
      return;
    }

    const balitaPayload: Partial<Balita> = {};

    if (name !== (balita.nama || "")) balitaPayload.nama = name;
    if (mom !== (balita.namaWali || "")) balitaPayload.namaWali = mom;
    if (address !== (balita.alamat || "")) balitaPayload.alamat = address;
    if (rt !== (balita.rt || "")) balitaPayload.rt = rt;
    if (rw !== (balita.rw || "")) balitaPayload.rw = rw;
    if (jenisKelamin !== balita.jenisKelamin) {
      balitaPayload.jenisKelamin = jenisKelamin;
    }
    if (normalizedNikBayi !== (balita.nik || "")) {
      balitaPayload.nik = normalizedNikBayi;
    }
    if (normalizedNikWali !== (balita.nikWali || "")) {
      balitaPayload.nikWali = normalizedNikWali;
    }
    if (normalizedNoKk !== (balita.noKk || "")) {
      balitaPayload.noKk = normalizedNoKk;
    }

    const tinggiBadan = toOptionalNumber(panjangPengukuran);
    const beratBadan = toOptionalNumber(beratPengukuran);
    const lingkarKepala = toOptionalNumber(lingkarKepalaPengukuran);
    const shouldSendLila =
      !isLilaDisabled && lingkarLenganPengukuran.trim() !== "";
    const lila = shouldSendLila
      ? toOptionalNumber(lingkarLenganPengukuran)
      : null;

    const hasMeasurementInput =
      [panjangPengukuran, beratPengukuran, lingkarKepalaPengukuran].some(
        (value) => value.trim() !== "",
      ) || shouldSendLila;

    const hasMeasurementChanges = selectedMeasurement
      ? tinggiBadan !== selectedMeasurement.tinggiBadan ||
        beratBadan !== selectedMeasurement.beratBadan ||
        lingkarKepala !== selectedMeasurement.lingkarKepala ||
        (shouldSendLila && lila !== selectedMeasurement.lingkarLengan)
      : hasMeasurementInput;

    const hasBalitaChanges = Object.keys(balitaPayload).length > 0;

    if (!hasBalitaChanges && !hasMeasurementChanges) {
      warning("Tidak ada perubahan data untuk disimpan.");
      return;
    }

    let pengukuranPayload: {
      bulan: number;
      tahun: number;
      beratBadan: number;
      tinggiBadan: number;
      lingkarKepala: number | null;
      lila?: number;
    } | null = null;
    let pengukuranId: string | null = null;

    if (hasMeasurementChanges) {
      if (!selectedMeasurement) {
        warning(
          `Belum ada data pengukuran untuk ${selectedMonthName} ${selectedMeasurementYear}.`,
        );
        return;
      }

      if (!selectedMeasurement.id) {
        warning("ID pengukuran tidak ditemukan untuk periode ini.");
        return;
      }

      if (tinggiBadan === null || beratBadan === null) {
        warning("Panjang dan berat wajib diisi untuk update pengukuran.");
        return;
      }

      if (shouldSendLila && lila === null) {
        warning("Lingkar lengan harus berupa angka yang valid.");
        return;
      }

      pengukuranPayload = {
        bulan: selectedMeasurementMonth,
        tahun: selectedMeasurementYear,
        beratBadan,
        tinggiBadan,
        lingkarKepala,
      };

      if (shouldSendLila && lila !== null) {
        pengukuranPayload.lila = lila;
      }
      pengukuranId = selectedMeasurement.id;
    }

    try {
      if (hasBalitaChanges) {
        await updateBalita(id, balitaPayload);
      }

      if (pengukuranPayload && pengukuranId) {
        await updatePengukuranBalita(pengukuranId, pengukuranPayload);
      }

      if (hasBalitaChanges && hasMeasurementChanges) {
        success("Data balita dan pengukuran berhasil diedit!");
      } else if (hasMeasurementChanges) {
        success("Data pengukuran berhasil diedit!");
      } else {
        success("Data balita berhasil diedit!");
      }

      router.back();
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Gagal menyimpan perubahan.";
      error(message);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 text-black font-sans pb-10">
      <Navbar title="Edit Data Balita" />
      <main className="p-4 sm:p-6 max-w-4xl mx-auto space-y-6 mt-2">
        <div className="flex items-center justify-between relative h-10">
          <button
            onClick={() => router.back()}
            className="w-10 h-10 rounded-full border border-gray-200 flex items-center justify-center hover:bg-gray-100 transition-colors bg-white shadow-sm z-10 active:scale-95"
          >
            <ArrowLeft size={20} className="text-black" />
          </button>
          <h1 className="text-lg font-bold text-black absolute left-1/2 -translate-x-1/2 w-full text-center pointer-events-none">
            Edit Data Balita
          </h1>
        </div>

        <InfoPanel title="Panduan edit data">
          Ubah biodata balita di kolom kiri. Pilih bulan pengukuran di kolom
          kanan; jika belum ada data pada bulan tersebut, isi pengukuran baru
          lewat halaman Input Pengukuran.
        </InfoPanel>

        <BalitaSummaryCard balita={balita} />

        {/* Two Column Grid on Desktop */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Left Column: Data Utama Balita */}
          <div className="space-y-4">
            <p className="text-xs font-bold text-gray-500 ml-1">
              Data Utama Balita
            </p>
            <div className="space-y-1">
              <label className="text-xs font-bold text-black">
                Nama Balita
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full border border-gray-200 rounded-xl p-3.5 text-sm text-black font-bold focus:outline-none focus:ring-1 focus:ring-teal-500 bg-white shadow-sm"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-black">
                Nama Wali / Ibu
              </label>
              <input
                type="text"
                value={mom}
                onChange={(e) => setMom(e.target.value)}
                className="w-full border border-gray-200 rounded-xl p-3.5 text-sm text-black font-bold focus:outline-none focus:ring-1 focus:ring-teal-500 bg-white shadow-sm"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-black">
                Alamat Lengkap
              </label>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="w-full border border-gray-200 rounded-xl p-3.5 text-sm text-black font-bold focus:outline-none focus:ring-1 focus:ring-teal-500 bg-white shadow-sm"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-black">RT</label>
                <input
                  type="text"
                  value={rt}
                  onChange={(e) =>
                    setRt(e.target.value.replace(/\D/g, "").substring(0, 3))
                  }
                  className="w-full border border-gray-200 rounded-xl p-3.5 text-sm text-black font-bold focus:outline-none focus:ring-1 focus:ring-teal-500 bg-white shadow-sm"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-black">RW</label>
                <input
                  type="text"
                  value={rw}
                  onChange={(e) =>
                    setRw(e.target.value.replace(/\D/g, "").substring(0, 3))
                  }
                  className="w-full border border-gray-200 rounded-xl p-3.5 text-sm text-black font-bold focus:outline-none focus:ring-1 focus:ring-teal-500 bg-white shadow-sm"
                />
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-black">
                Jenis Kelamin
              </label>
              <div className="relative">
                <select
                  value={gender}
                  onChange={(e) => setGender(e.target.value)}
                  className="w-full appearance-none bg-white border border-gray-200 rounded-xl p-3.5 text-sm font-bold text-black focus:outline-none focus:ring-1 focus:ring-teal-500 shadow-sm cursor-pointer"
                >
                  <option value="Laki laki">Laki laki</option>
                  <option value="Perempuan">Perempuan</option>
                </select>
                <ChevronDown
                  size={20}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-black pointer-events-none"
                />
              </div>
            </div>
          </div>

          {/* Right Column: Identitas Tambahan & Data Pengukuran Terbaru */}
          <div className="space-y-6">
            <div className="space-y-4">
              <p className="text-xs font-bold text-gray-500 ml-1">
                Identitas Tambahan
              </p>
              <div className="space-y-1">
                <label className="text-xs font-bold text-black">
                  NIK bayi / balita
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={NIK_LENGTH}
                  placeholder="16 digit NIK"
                  value={nikBayi}
                  onChange={(e) =>
                    setNikBayi(onlyDigits(e.target.value, NIK_LENGTH))
                  }
                  className="w-full border border-gray-200 rounded-xl p-3.5 text-sm text-black font-bold focus:outline-none focus:ring-1 focus:ring-teal-500 bg-white shadow-sm"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-black">NIK Wali</label>
                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={NIK_LENGTH}
                  placeholder="16 digit NIK"
                  value={nikWali}
                  onChange={(e) =>
                    setNikWali(onlyDigits(e.target.value, NIK_LENGTH))
                  }
                  className="w-full border border-gray-200 rounded-xl p-3.5 text-sm text-black font-bold focus:outline-none focus:ring-1 focus:ring-teal-500 bg-white shadow-sm"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-black">
                  No. KK
                  <span className="text-gray-400 ml-1">(opsional)</span>
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={NIK_LENGTH}
                  placeholder="16 digit nomor KK"
                  value={noKk}
                  onChange={(e) =>
                    setNoKk(onlyDigits(e.target.value, NIK_LENGTH))
                  }
                  className="w-full border border-gray-200 rounded-xl p-3.5 text-sm text-black font-bold focus:outline-none focus:ring-1 focus:ring-teal-500 bg-white shadow-sm"
                />
              </div>
            </div>

            <div className="space-y-4 pt-4 border-t border-gray-100">
              <div className="flex flex-col gap-1">
                <p className="text-xs font-bold text-gray-500 ml-1">
                  Data Pengukuran
                </p>
                <p className="text-[10px] font-medium text-gray-400 ml-1">
                  Pilih periode mulai dari bulan lahir balita sampai bulan
                  berjalan.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-[120px_1fr] gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-black">Tahun</label>
                  <div className="relative">
                    <select
                      value={selectedMeasurementYear}
                      onChange={(e) => {
                        const year = Number(e.target.value);
                        const availableMonths = getMeasurementMonthOptions(
                          year,
                          birthPeriod,
                          currentMonth,
                          currentYear,
                        );

                        setSelectedMeasurementYear(year);
                        if (
                          !availableMonths.some(
                            (month) => month.value === selectedMeasurementMonth,
                          )
                        ) {
                          setSelectedMeasurementMonth(
                            getLatestAvailableMonth(
                              availableMonths,
                              selectedMeasurementMonth,
                            ),
                          );
                        }
                      }}
                      className="w-full appearance-none bg-white border border-gray-200 rounded-xl p-3.5 text-sm font-bold text-black focus:outline-none focus:ring-1 focus:ring-teal-500 shadow-sm cursor-pointer"
                    >
                      {yearOptions.map((year) => (
                        <option key={year} value={year}>
                          {year}
                        </option>
                      ))}
                    </select>
                    <ChevronDown
                      size={20}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-black pointer-events-none"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-black">
                    Bulan Pengukuran
                  </label>
                  <div className="relative">
                    <select
                      value={selectedMeasurementMonth}
                      onChange={(e) =>
                        setSelectedMeasurementMonth(Number(e.target.value))
                      }
                      className="w-full appearance-none bg-white border border-gray-200 rounded-xl p-3.5 text-sm font-bold text-black focus:outline-none focus:ring-1 focus:ring-teal-500 shadow-sm cursor-pointer"
                    >
                      {monthOptions.map((month) => {
                        const periodKey = getMeasurementPeriodKey(
                          selectedMeasurementYear,
                          month.value,
                        );
                        const isMeasured = isCompletedMeasurement(
                          measurementByPeriod[periodKey],
                        );

                        return (
                          <option key={periodKey} value={month.value}>
                            {month.label} {selectedMeasurementYear}
                            {` - ${isMeasured ? "Sudah diukur" : "Belum diukur"}`}
                          </option>
                        );
                      })}
                    </select>
                    <ChevronDown
                      size={20}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-black pointer-events-none"
                    />
                  </div>
                </div>
              </div>

              <div
                className={`rounded-xl border p-3.5 text-xs font-bold ${
                  selectedMeasurement
                    ? "border-teal-100 bg-[#f0fbf9] text-[#0d9488]"
                    : "border-orange-100 bg-[#fff5ea] text-orange-600"
                }`}
              >
                {selectedMeasurement
                  ? `Data pengukuran ${selectedMonthName} ${selectedMeasurementYear} ditemukan.`
                  : `Belum ada data pengukuran untuk ${selectedMonthName} ${selectedMeasurementYear}. Input pengukuran baru melalui halaman Input Pengukuran.`}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <MeasurementInput
                  label="Panjang"
                  suffix="cm"
                  value={panjangPengukuran}
                  onChange={setPanjangPengukuran}
                  disabled={isMeasurementMissing}
                  dense
                />

                <MeasurementInput
                  label="Berat"
                  suffix="kg"
                  value={beratPengukuran}
                  onChange={setBeratPengukuran}
                  disabled={isMeasurementMissing}
                  dense
                />

                <MeasurementInput
                  label="L. Kepala"
                  suffix="cm"
                  value={lingkarKepalaPengukuran}
                  onChange={setLingkarKepalaPengukuran}
                  disabled={isMeasurementMissing}
                  dense
                />

                <MeasurementInput
                  label="L. Lengan"
                  suffix="cm"
                  value={isLilaDisabled ? "" : lingkarLenganPengukuran}
                  onChange={setLingkarLenganPengukuran}
                  placeholder={isLilaDisabled ? "Tidak wajib" : "0.0"}
                  disabled={isLilaDisabled || isMeasurementMissing}
                  hint="Hanya untuk balita usia > 6 bulan"
                  dense
                />
              </div>
            </div>
          </div>
        </div>

        <button
          onClick={handleSave}
          className="w-full bg-[#1fb999] hover:bg-teal-600 text-white font-bold py-4 rounded-xl transition-colors active:scale-95 shadow-md shadow-teal-100 mt-6 cursor-pointer"
        >
          Simpan Perubahan Data Balita
        </button>
      </main>
    </div>
  );
}
