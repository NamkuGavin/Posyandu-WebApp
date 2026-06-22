"use client";

import { useState, useEffect } from "react";
import {
  ArrowLeft,
  Calendar,
  ChevronRight,
  AlertCircle,
} from "lucide-react";
import { useRouter } from "next/navigation";
import Navbar from "@/components/layout/Navbar";
import Card from "@/components/ui/Card";
import { InfoPanel, PageStatusState } from "@/components/ui/PageParts";
import { useToast } from "@/components/ui/Toast";
import MeasurementInput from "@/components/balita/MeasurementInput";
import TambahBalitaSuccessDialog from "@/components/balita/TambahBalitaSuccessDialog";
import { createBalita } from "@/lib/api";
import { NIK_LENGTH, POSYANDU_DEFAULTS } from "@/lib/constants";
import { calculateAgeInMonths, formatAgeDetailed } from "@/lib/date-utils";
import {
  getWhatsappPayload,
  normalizeWhatsappLocalInput,
  onlyDigits,
  validateOptionalWhatsapp,
  WHATSAPP_INPUT_MAX_LENGTH,
} from "@/lib/form-utils";
import { useCurrentProfile } from "@/lib/useCurrentProfile";

export default function TambahBalitaPage() {
  const router = useRouter();
  const { error } = useToast();
  const { isAdmin, isLoading: isRoleLoading } = useCurrentProfile();
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [countdown, setCountdown] = useState(4);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  // Form State
  const [formData, setFormData] = useState({
    // Step 1: Identitas Balita
    namaBalita: "",
    nikBalita: "",
    jenisKelamin: "",
    anakKe: "",
    alamat: POSYANDU_DEFAULTS.alamat,
    rt: "",
    rw: POSYANDU_DEFAULTS.rw,

    // Step 2: Data Wali
    namaWali: "",
    nikWali: "",
    noKk: "",
    whatsapp: "",

    // Step 3: Riwayat & Pengukuran
    tanggalLahir: "",
    panjangLahir: "",
    beratLahir: "",
    lingkarKepalaLahir: "",
    usiaKehamilan: "",

    // Pengukuran Bulan Sekarang
    panjangSekarang: "",
    beratSekarang: "",
    lingkarKepalaSekarang: "",
    lingkarLenganSekarang: "",
  });

  const ageInMonths = calculateAgeInMonths(formData.tanggalLahir);

  // Clear lingkar lengan when age is 6 months or under
  useEffect(() => {
    let isActive = true;

    if (ageInMonths !== null && ageInMonths <= 6) {
      Promise.resolve().then(() => {
        if (!isActive) return;

        setFormData((prev) => ({ ...prev, lingkarLenganSekarang: "" }));
        if (errors.lingkarLenganSekarang) {
          setErrors((prev) => {
            const copy = { ...prev };
            delete copy.lingkarLenganSekarang;
            return copy;
          });
        }
      });
    }

    return () => {
      isActive = false;
    };
  }, [ageInMonths, errors.lingkarLenganSekarang]);

  // Handle countdown redirection
  useEffect(() => {
    if (!showSuccessModal) return;

    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [showSuccessModal]);

  useEffect(() => {
    if (showSuccessModal && countdown === 0) {
      router.push("/dashboard/balita");
    }
  }, [showSuccessModal, countdown, router]);

  // Validation functions
  const validateStep1 = () => {
    const newErrors: { [key: string]: string } = {};
    if (!formData.namaBalita.trim())
      newErrors.namaBalita = "Nama balita wajib diisi";
    if (!formData.jenisKelamin) {
      newErrors.jenisKelamin = "Jenis kelamin wajib dipilih";
    }
    if (formData.nikBalita && formData.nikBalita.length !== NIK_LENGTH) {
      newErrors.nikBalita = "NIK harus terdiri dari 16 digit angka";
    }
    if (formData.anakKe && parseInt(formData.anakKe, 10) <= 0) {
      newErrors.anakKe = "Anak ke- harus lebih besar dari 0";
    }

    setErrors(newErrors);

    // Auto-focus first error field
    if (newErrors.namaBalita) {
      document.getElementById("namaBalita")?.focus();
    } else if (newErrors.nikBalita) {
      document.getElementById("nikBalita")?.focus();
    } else if (newErrors.jenisKelamin) {
      document.getElementById("jenisKelaminLaki")?.focus();
    } else if (newErrors.anakKe) {
      document.getElementById("anakKe")?.focus();
    }

    return Object.keys(newErrors).length === 0;
  };

  const validateStep2 = () => {
    const newErrors: { [key: string]: string } = {};
    if (formData.nikWali && formData.nikWali.length !== NIK_LENGTH) {
      newErrors.nikWali = "NIK wali harus terdiri dari 16 digit angka";
    }
    if (formData.noKk && formData.noKk.length !== NIK_LENGTH) {
      newErrors.noKk = "No. KK harus terdiri dari 16 digit angka";
    }
    if (formData.whatsapp.trim()) {
      const whatsappError = validateOptionalWhatsapp(formData.whatsapp);
      if (whatsappError) newErrors.whatsapp = whatsappError;
    }

    setErrors(newErrors);

    // Auto-focus first error field
    if (newErrors.nikWali) {
      document.getElementById("nikWali")?.focus();
    } else if (newErrors.noKk) {
      document.getElementById("noKk")?.focus();
    } else if (newErrors.whatsapp) {
      document.getElementById("whatsapp")?.focus();
    }

    return Object.keys(newErrors).length === 0;
  };

  const validateStep3 = () => {
    const newErrors: { [key: string]: string } = {};

    // Tanggal Lahir Validation
    if (!formData.tanggalLahir) {
      newErrors.tanggalLahir = "Tanggal lahir wajib diisi";
    } else {
      const selectedDate = new Date(formData.tanggalLahir);
      const today = new Date();
      if (selectedDate > today) {
        newErrors.tanggalLahir = "Tanggal lahir tidak boleh di masa depan";
      } else if (ageInMonths !== null && ageInMonths > 60) {
        newErrors.tanggalLahir = "Usia tidak boleh melebihi 60 bulan (5 tahun)";
      }
    }

    // Optional measurement validation
    if (formData.panjangLahir && parseFloat(formData.panjangLahir) <= 0) {
      newErrors.panjangLahir = "Panjang lahir harus lebih besar dari 0";
    }

    if (formData.beratLahir && parseFloat(formData.beratLahir) < 0.5) {
      newErrors.beratLahir = "Berat lahir minimal 0,5 kg";
    }

    // Optional field validation (>0 check)
    if (
      formData.lingkarKepalaLahir &&
      parseFloat(formData.lingkarKepalaLahir) <= 0
    ) {
      newErrors.lingkarKepalaLahir =
        "Lingkar kepala lahir harus lebih besar dari 0";
    }
    if (formData.usiaKehamilan && parseInt(formData.usiaKehamilan) <= 0) {
      newErrors.usiaKehamilan = "Usia kehamilan harus lebih besar dari 0";
    }

    if (formData.panjangSekarang && parseFloat(formData.panjangSekarang) <= 0) {
      newErrors.panjangSekarang =
        "Panjang/Tinggi sekarang harus lebih besar dari 0";
    }

    if (formData.beratSekarang && parseFloat(formData.beratSekarang) <= 0) {
      newErrors.beratSekarang = "Berat sekarang harus lebih besar dari 0";
    }

    if (
      formData.lingkarKepalaSekarang &&
      parseFloat(formData.lingkarKepalaSekarang) < 0
    ) {
      newErrors.lingkarKepalaSekarang =
        "Lingkar kepala tidak boleh kurang dari 0";
    }

    if (
      formData.lingkarLenganSekarang &&
      parseFloat(formData.lingkarLenganSekarang) < 0
    ) {
      newErrors.lingkarLenganSekarang =
        "Lingkar lengan tidak boleh kurang dari 0";
    }

    setErrors(newErrors);

    // Auto-focus first error field
    if (newErrors.tanggalLahir) {
      document.getElementById("tanggalLahir")?.focus();
    } else if (newErrors.panjangLahir) {
      document.getElementById("panjangLahir")?.focus();
    } else if (newErrors.beratLahir) {
      document.getElementById("beratLahir")?.focus();
    } else if (newErrors.lingkarKepalaLahir) {
      document.getElementById("lingkarKepalaLahir")?.focus();
    } else if (newErrors.usiaKehamilan) {
      document.getElementById("usiaKehamilan")?.focus();
    } else if (newErrors.panjangSekarang) {
      document.getElementById("panjangSekarang")?.focus();
    } else if (newErrors.beratSekarang) {
      document.getElementById("beratSekarang")?.focus();
    } else if (newErrors.lingkarKepalaSekarang) {
      document.getElementById("lingkarKepalaSekarang")?.focus();
    } else if (newErrors.lingkarLenganSekarang) {
      document.getElementById("lingkarLenganSekarang")?.focus();
    }

    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (step === 1) {
      if (validateStep1()) setStep(2);
    } else if (step === 2) {
      if (validateStep2()) setStep(3);
    }
  };

  const handleBack = () => {
    setErrors({});
    if (step === 1) {
      router.push("/dashboard");
    } else {
      setStep((prev) => (prev - 1) as 1 | 2 | 3);
    }
  };
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (step === 1) {
      handleNext();
    } else if (step === 2) {
      handleNext();
    } else if (step === 3) {
      if (validateStep3()) {
        try {
          const whatsapp = getWhatsappPayload(formData.whatsapp);
          const payload: Record<string, unknown> = {
            nama: formData.namaBalita.trim(),
            jenisKelamin:
              formData.jenisKelamin === "Laki-laki" ? "LAKI_LAKI" : "PEREMPUAN",
            tglLahir: formData.tanggalLahir,
          };

          if (formData.nikBalita) payload.nik = formData.nikBalita;
          if (formData.anakKe) payload.anakKe = parseInt(formData.anakKe, 10);
          if (formData.alamat.trim()) payload.alamat = formData.alamat.trim();
          if (formData.rt) payload.rt = parseInt(formData.rt, 10);
          if (formData.rw) payload.rw = parseInt(formData.rw, 10);
          if (formData.namaWali.trim()) {
            payload.namaWali = formData.namaWali.trim();
          }
          if (formData.nikWali) payload.nikWali = formData.nikWali;
          if (formData.noKk) payload.noKk = formData.noKk;
          if (whatsapp) payload.noWhatsapp = whatsapp;
          if (formData.panjangLahir) {
            payload.panjangLahir = parseFloat(formData.panjangLahir);
          }
          if (formData.beratLahir) {
            payload.beratLahir = parseFloat(formData.beratLahir);
          }
          if (formData.lingkarKepalaLahir) {
            payload.lingkarKepalaLahir = parseFloat(
              formData.lingkarKepalaLahir,
            );
          }
          if (formData.usiaKehamilan) {
            payload.usiaKehamilan = parseInt(formData.usiaKehamilan, 10);
          }
          if (formData.beratSekarang) {
            payload.beratBadanAwal = parseFloat(formData.beratSekarang);
          }
          if (formData.panjangSekarang) {
            payload.tinggiBadanAwal = parseFloat(formData.panjangSekarang);
          }
          if (formData.lingkarKepalaSekarang) {
            payload.lingkarKepalaAwal = parseFloat(
              formData.lingkarKepalaSekarang,
            );
          }
          if (formData.lingkarLenganSekarang) {
            payload.lilaAwal = parseFloat(formData.lingkarLenganSekarang);
          }

          await createBalita(payload);

          setShowSuccessModal(true);
        } catch (requestError: unknown) {
          error(
            requestError instanceof Error
              ? requestError.message
              : "Gagal mendaftarkan balita.",
          );
        }
      }
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear validation error when typing
    if (errors[field]) {
      setErrors((prev) => {
        const copy = { ...prev };
        delete copy[field];
        return copy;
      });
    }
  };

  if (isRoleLoading || isAdmin) {
    return (
      <div className="min-h-screen bg-gray-50 text-black font-sans pb-12">
        <Navbar title="Tambah Balita" />
        <main className="p-4 sm:p-6 max-w-md mx-auto mt-2">
          <PageStatusState
            tone={isAdmin ? "error" : "loading"}
            title={
              isAdmin
                ? "Tambah balita hanya untuk kader"
                : "Memuat akses pengguna"
            }
            description={
              isAdmin
                ? "Admin memiliki akses baca saja untuk data operasional. Pendaftaran balita dilakukan oleh kader."
                : "Mengecek role pengguna sebelum menampilkan form tambah balita."
            }
          />
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 text-black font-sans pb-12">
      <Navbar title="Tambah Balita" />

      <main className="p-4 sm:p-6 max-w-md mx-auto mt-2 relative">
        {/* Subheader: Back Button & Step Title */}
        <div className="flex items-center justify-between relative h-12 mb-6">
          <button
            type="button"
            onClick={handleBack}
            className="w-10 h-10 rounded-full border border-gray-200 flex items-center justify-center hover:bg-gray-100 transition-all bg-white shadow-sm hover:shadow active:scale-95 cursor-pointer"
          >
            {/* Custom arrow left pointing back, matching the mockup circle-arrow-left */}
            <ArrowLeft size={18} className="text-gray-700" />
          </button>

          <h2 className="text-base sm:text-lg font-bold text-gray-900 absolute left-1/2 -translate-x-1/2 w-max pointer-events-none">
            {step === 1 && "Identitas Balita"}
            {step === 2 && "Data Wali"}
            {step === 3 && "Riwayat & Pengukuran"}
          </h2>
        </div>

        <div className="mb-6">
          <InfoPanel title="Isi bertahap">
            Hanya nama balita, jenis kelamin, dan tanggal lahir yang wajib
            diisi. Data lain dapat dilengkapi sekarang atau diperbarui nanti.
          </InfoPanel>
        </div>

        {/* Stepper / Progress Bar (Three Horizontal Bars) */}
        <div className="flex gap-2.5 mb-6 px-1">
          <div
            className={`h-2 flex-1 rounded-full transition-all duration-500 ${
              step >= 1 ? "bg-[#0d9488]" : "bg-gray-200"
            }`}
          />
          <div
            className={`h-2 flex-1 rounded-full transition-all duration-500 ${
              step >= 2 ? "bg-[#0d9488]" : "bg-gray-200"
            }`}
          />
          <div
            className={`h-2 flex-1 rounded-full transition-all duration-500 ${
              step >= 3 ? "bg-[#0d9488]" : "bg-gray-200"
            }`}
          />
        </div>

        {/* Form Form Card */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* STEP 1: IDENTITAS BALITA */}
          {step === 1 && (
            <Card className="p-6 space-y-5 bg-white border border-gray-100 shadow-md rounded-2xl animate-in fade-in slide-in-from-right duration-300">
              {/* Nama Balita */}
              <div className="space-y-2">
                <label
                  htmlFor="namaBalita"
                  className="block text-xs font-bold text-gray-700"
                >
                  Nama Balita<span className="text-red-500 ml-0.5">*</span>
                </label>
                <input
                  type="text"
                  id="namaBalita"
                  placeholder="Contoh: Aisyah Putri"
                  value={formData.namaBalita}
                  onChange={(e) =>
                    handleInputChange("namaBalita", e.target.value)
                  }
                  className={`w-full px-4 py-3 border rounded-xl outline-none text-sm text-black transition-all bg-white ${
                    errors.namaBalita
                      ? "border-rose-400 focus:ring-2 focus:ring-rose-200"
                      : "border-gray-200 focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                  }`}
                />
                {errors.namaBalita && (
                  <p className="text-[10px] text-rose-500 flex items-center gap-1 font-medium">
                    <AlertCircle size={10} /> {errors.namaBalita}
                  </p>
                )}
              </div>

              {/* NIK Balita */}
              <div className="space-y-2">
                <label
                  htmlFor="nikBalita"
                  className="block text-xs font-bold text-gray-700"
                >
                  NIK bayi / balita
                  <span className="text-gray-400 ml-1">(opsional)</span>
                </label>
                <input
                  type="text"
                  id="nikBalita"
                  inputMode="numeric"
                  maxLength={NIK_LENGTH}
                  placeholder="16 digit NIK"
                  value={formData.nikBalita}
                  onChange={(e) => {
                    const val = onlyDigits(e.target.value, NIK_LENGTH);
                    handleInputChange("nikBalita", val);
                  }}
                  className={`w-full px-4 py-3 border rounded-xl outline-none text-sm text-black transition-all bg-white ${
                    errors.nikBalita
                      ? "border-rose-400 focus:ring-2 focus:ring-rose-200"
                      : "border-gray-200 focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                  }`}
                />
                {errors.nikBalita && (
                  <p className="text-[10px] text-rose-500 flex items-center gap-1 font-medium">
                    <AlertCircle size={10} /> {errors.nikBalita}
                  </p>
                )}
              </div>

              {/* Jenis Kelamin */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-gray-700">
                  Jenis Kelamin<span className="text-red-500 ml-0.5">*</span>
                </label>
                <div
                  className={`bg-gray-100 p-1.5 rounded-2xl flex gap-1 border ${
                    errors.jenisKelamin ? "border-rose-400" : "border-gray-50"
                  }`}
                >
                  <button
                    type="button"
                    id="jenisKelaminLaki"
                    onClick={() =>
                      handleInputChange("jenisKelamin", "Laki-laki")
                    }
                    className={`flex-1 py-3 text-center text-xs font-bold rounded-xl transition-all cursor-pointer ${
                      formData.jenisKelamin === "Laki-laki"
                        ? "bg-white text-black shadow-md border border-gray-100/50"
                        : "text-gray-400 hover:text-gray-600"
                    }`}
                  >
                    Laki-laki
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      handleInputChange("jenisKelamin", "Perempuan")
                    }
                    className={`flex-1 py-3 text-center text-xs font-bold rounded-xl transition-all cursor-pointer ${
                      formData.jenisKelamin === "Perempuan"
                        ? "bg-white text-black shadow-md border border-gray-100/50"
                        : "text-gray-400 hover:text-gray-600"
                    }`}
                  >
                    Perempuan
                  </button>
                </div>
                {errors.jenisKelamin && (
                  <p className="text-[10px] text-rose-500 flex items-center gap-1 font-medium">
                    <AlertCircle size={10} /> {errors.jenisKelamin}
                  </p>
                )}
              </div>

              {/* Anak Ke- */}
              <div className="space-y-2">
                <label
                  htmlFor="anakKe"
                  className="block text-xs font-bold text-gray-700"
                >
                  Anak ke-
                  <span className="text-gray-400 ml-1">(opsional)</span>
                </label>
                <input
                  type="number"
                  id="anakKe"
                  min={1}
                  placeholder="1"
                  value={formData.anakKe}
                  onChange={(e) => handleInputChange("anakKe", e.target.value)}
                  className={`w-full px-4 py-3 border rounded-xl outline-none text-sm text-black transition-all bg-white ${
                    errors.anakKe
                      ? "border-rose-400 focus:ring-2 focus:ring-rose-200"
                      : "border-gray-200 focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                  }`}
                />
                {errors.anakKe && (
                  <p className="text-[10px] text-rose-500 flex items-center gap-1 font-medium">
                    <AlertCircle size={10} /> {errors.anakKe}
                  </p>
                )}
              </div>

              {/* Alamat, RT, RW */}
              <div className="space-y-4">
                <div className="space-y-2">
                  <label
                    htmlFor="alamat"
                    className="block text-xs font-bold text-gray-700"
                  >
                    Alamat wilayah
                  </label>
                  <input
                    type="text"
                    id="alamat"
                    value={formData.alamat}
                    readOnly
                    aria-readonly="true"
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl outline-none text-sm text-gray-700 transition-all bg-gray-50 cursor-not-allowed"
                  />
                  <span className="block text-[10px] text-gray-400">
                    Alamat sudah ditetapkan sesuai wilayah posyandu.
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label
                      htmlFor="rt"
                      className="block text-xs font-bold text-gray-700"
                    >
                      RT
                      <span className="text-gray-400 ml-1">(opsional)</span>
                    </label>
                    <input
                      type="text"
                      id="rt"
                      placeholder="001"
                      value={formData.rt}
                      onChange={(e) =>
                        handleInputChange(
                          "rt",
                          e.target.value.replace(/\D/g, "").substring(0, 3),
                        )
                      }
                      className={`w-full px-4 py-3 border rounded-xl outline-none text-sm text-black transition-all bg-white ${
                        errors.rt
                          ? "border-rose-400 focus:ring-2 focus:ring-rose-200"
                          : "border-gray-200 focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                      }`}
                    />
                    {errors.rt && (
                      <p className="text-[10px] text-rose-500 flex items-center gap-1 font-medium">
                        <AlertCircle size={10} /> {errors.rt}
                      </p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <label
                      htmlFor="rw"
                      className="block text-xs font-bold text-gray-700"
                    >
                      RW
                    </label>
                    <input
                      type="text"
                      id="rw"
                      value={formData.rw}
                      readOnly
                      aria-readonly="true"
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl outline-none text-sm text-gray-700 transition-all bg-gray-50 cursor-not-allowed"
                    />
                    <span className="block text-[10px] text-gray-400">
                      RW tetap: 09
                    </span>
                  </div>
                </div>
              </div>
            </Card>
          )}

          {/* STEP 2: DATA WALI */}
          {step === 2 && (
            <Card className="p-6 space-y-5 bg-white border border-gray-100 shadow-md rounded-2xl animate-in fade-in slide-in-from-right duration-300">
              {/* Nama Wali */}
              <div className="space-y-2">
                <label
                  htmlFor="namaWali"
                  className="block text-xs font-bold text-gray-700"
                >
                  Nama wali
                  <span className="text-gray-400 ml-1">(opsional)</span>
                </label>
                <input
                  type="text"
                  id="namaWali"
                  placeholder="Nama lengkap wali"
                  value={formData.namaWali}
                  onChange={(e) =>
                    handleInputChange("namaWali", e.target.value)
                  }
                  className={`w-full px-4 py-3 border rounded-xl outline-none text-sm text-black transition-all bg-white ${
                    errors.namaWali
                      ? "border-rose-400 focus:ring-2 focus:ring-rose-200"
                      : "border-gray-200 focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                  }`}
                />
                {errors.namaWali && (
                  <p className="text-[10px] text-rose-500 flex items-center gap-1 font-medium">
                    <AlertCircle size={10} /> {errors.namaWali}
                  </p>
                )}
              </div>

              {/* NIK Wali */}
              <div className="space-y-2">
                <label
                  htmlFor="nikWali"
                  className="block text-xs font-bold text-gray-700"
                >
                  NIK Wali
                  <span className="text-gray-400 ml-1">(opsional)</span>
                </label>
                <input
                  type="text"
                  id="nikWali"
                  inputMode="numeric"
                  maxLength={NIK_LENGTH}
                  placeholder="16 digit NIK"
                  value={formData.nikWali}
                  onChange={(e) => {
                    const val = onlyDigits(e.target.value, NIK_LENGTH);
                    handleInputChange("nikWali", val);
                  }}
                  className={`w-full px-4 py-3 border rounded-xl outline-none text-sm text-black transition-all bg-white ${
                    errors.nikWali
                      ? "border-rose-400 focus:ring-2 focus:ring-rose-200"
                      : "border-gray-200 focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                  }`}
                />
                {errors.nikWali && (
                  <p className="text-[10px] text-rose-500 flex items-center gap-1 font-medium">
                    <AlertCircle size={10} /> {errors.nikWali}
                  </p>
                )}
              </div>

              {/* Nomor KK */}
              <div className="space-y-2">
                <label
                  htmlFor="noKk"
                  className="block text-xs font-bold text-gray-700"
                >
                  No. KK
                  <span className="text-gray-400 ml-1">(opsional)</span>
                </label>
                <input
                  type="text"
                  id="noKk"
                  inputMode="numeric"
                  maxLength={NIK_LENGTH}
                  placeholder="16 digit nomor KK"
                  value={formData.noKk}
                  onChange={(e) => {
                    const val = onlyDigits(e.target.value, NIK_LENGTH);
                    handleInputChange("noKk", val);
                  }}
                  className={`w-full px-4 py-3 border rounded-xl outline-none text-sm text-black transition-all bg-white ${
                    errors.noKk
                      ? "border-rose-400 focus:ring-2 focus:ring-rose-200"
                      : "border-gray-200 focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                  }`}
                />
                {errors.noKk && (
                  <p className="text-[10px] text-rose-500 flex items-center gap-1 font-medium">
                    <AlertCircle size={10} /> {errors.noKk}
                  </p>
                )}
              </div>

              {/* WhatsApp */}
              <div className="space-y-2">
                <label
                  htmlFor="whatsapp"
                  className="block text-xs font-bold text-gray-700"
                >
                  Nomor WhatsApp
                  <span className="text-gray-400 ml-1">(opsional)</span>
                </label>
                <div className="flex gap-2">
                  <div className="px-4 py-3 bg-[#e9ecef] border border-gray-200 rounded-xl text-sm font-bold text-gray-700 flex items-center justify-center select-none shadow-sm">
                    +62
                  </div>
                  <input
                    type="tel"
                    id="whatsapp"
                    inputMode="numeric"
                    maxLength={WHATSAPP_INPUT_MAX_LENGTH}
                    placeholder="81234567890"
                    value={formData.whatsapp}
                    onChange={(e) => {
                      const val = normalizeWhatsappLocalInput(e.target.value);
                      handleInputChange("whatsapp", val);
                    }}
                    className={`flex-1 px-4 py-3 border rounded-xl outline-none text-sm text-black transition-all bg-white ${
                      errors.whatsapp
                        ? "border-rose-400 focus:ring-2 focus:ring-rose-200"
                        : "border-gray-200 focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                    }`}
                  />
                </div>
                <span className="block text-[10px] text-gray-400 italic">
                  Boleh dikosongkan jika wali belum memiliki nomor aktif.
                </span>
                {errors.whatsapp && (
                  <p className="text-[10px] text-rose-500 flex items-center gap-1 font-medium">
                    <AlertCircle size={10} /> {errors.whatsapp}
                  </p>
                )}
              </div>
            </Card>
          )}

          {/* STEP 3: RIWAYAT & PENGUKURAN */}
          {step === 3 && (
            <Card className="p-6 space-y-6 bg-white border border-gray-100 shadow-md rounded-2xl animate-in fade-in slide-in-from-right duration-300">
              {/* Tanggal Lahir */}
              <div className="space-y-2">
                <label
                  htmlFor="tanggalLahir"
                  className="block text-xs font-bold text-gray-700"
                >
                  Tanggal lahir<span className="text-red-500 ml-0.5">*</span>
                </label>
                <div className="relative">
                  <input
                    type="date"
                    id="tanggalLahir"
                    value={formData.tanggalLahir}
                    onChange={(e) =>
                      handleInputChange("tanggalLahir", e.target.value)
                    }
                    max={new Date().toISOString().split("T")[0]}
                    className={`w-full px-4 py-3 border rounded-xl outline-none text-sm text-black transition-all bg-white ${
                      errors.tanggalLahir
                        ? "border-rose-400 focus:ring-2 focus:ring-rose-200"
                        : "border-gray-200 focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                    }`}
                  />
                </div>
                {errors.tanggalLahir && (
                  <p className="text-[10px] text-rose-500 flex items-center gap-1 font-medium">
                    <AlertCircle size={10} /> {errors.tanggalLahir}
                  </p>
                )}
              </div>

              {/* Dynamic Age Badge */}
              <div className="bg-[#f0fbf9] border border-[#1fb999]/20 p-3.5 rounded-xl flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-[#b8f5e6]/70 flex items-center justify-center text-teal-700 shrink-0">
                  <Calendar size={16} />
                </div>
                <div className="text-xs">
                  <span className="font-bold text-teal-800">
                    Usia:{" "}
                    {formData.tanggalLahir ? (
                      <span className="font-black text-sm bg-teal-100 text-teal-900 px-2 py-0.5 rounded-md">
                        {formatAgeDetailed(formData.tanggalLahir)}
                      </span>
                    ) : (
                      <span className="text-gray-400 font-medium">
                        Pilih tanggal lahir dulu
                      </span>
                    )}
                  </span>
                </div>
              </div>

              {/* Grid 2 Columns: Panjang Lahir & Berat Lahir */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Panjang Lahir */}
                <MeasurementInput
                  id="panjangLahir"
                  label="Panjang Lahir"
                  suffix="cm"
                  optional
                  value={formData.panjangLahir}
                  onChange={(value) => handleInputChange("panjangLahir", value)}
                  error={errors.panjangLahir}
                />

                {/* Berat Lahir */}
                <MeasurementInput
                  id="beratLahir"
                  label="Berat Lahir"
                  suffix="kg"
                  optional
                  value={formData.beratLahir}
                  onChange={(value) => handleInputChange("beratLahir", value)}
                  error={errors.beratLahir}
                  step="0.01"
                  placeholder="0.00"
                />
              </div>

              {/* Grid 2 Columns: Lingkar Kepala Lahir & Usia Kehamilan */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Lingkar Kepala Lahir */}
                <MeasurementInput
                  id="lingkarKepalaLahir"
                  label="Lingkar Kepala Lahir"
                  suffix="cm"
                  optional
                  value={formData.lingkarKepalaLahir}
                  onChange={(value) =>
                    handleInputChange("lingkarKepalaLahir", value)
                  }
                  error={errors.lingkarKepalaLahir}
                />

                {/* Usia Kehamilan */}
                <div className="space-y-2">
                  <label
                    htmlFor="usiaKehamilan"
                    className="block text-xs font-bold text-gray-700"
                  >
                    Usia Kehamilan
                    <span className="text-gray-400 ml-1">(opsional)</span>
                  </label>
                  <div className="relative flex rounded-xl border border-gray-200 overflow-hidden focus-within:ring-2 focus-within:ring-teal-500/20 focus-within:border-teal-500 transition-all bg-white shadow-sm">
                    <input
                      type="number"
                      id="usiaKehamilan"
                      placeholder="Minggu"
                      value={formData.usiaKehamilan}
                      onChange={(e) =>
                        handleInputChange("usiaKehamilan", e.target.value)
                      }
                      className="w-full px-3 py-3 outline-none text-sm text-black"
                    />
                  </div>
                </div>
              </div>

              {/* Divider */}
              <div className="border-t border-gray-100 my-2"></div>

              {/* Subsection: Pengukuran Bulan Sekarang */}
              <div className="space-y-4">
                <h3 className="text-xs font-black uppercase tracking-wider text-gray-400">
                  Pengukuran bulan sekarang
                </h3>

                {/* Grid 2 Columns: Panjang Sekarang & Berat Sekarang */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Panjang Sekarang */}
                  <MeasurementInput
                    id="panjangSekarang"
                    label="Panjang/Tinggi Sekarang"
                    suffix="cm"
                    optional
                    value={formData.panjangSekarang}
                    onChange={(value) =>
                      handleInputChange("panjangSekarang", value)
                    }
                    error={errors.panjangSekarang}
                  />

                  {/* Berat Sekarang */}
                  <MeasurementInput
                    id="beratSekarang"
                    label="Berat Sekarang"
                    suffix="kg"
                    optional
                    value={formData.beratSekarang}
                    onChange={(value) =>
                      handleInputChange("beratSekarang", value)
                    }
                    error={errors.beratSekarang}
                    step="0.01"
                    placeholder="0.00"
                  />
                </div>

                {/* Grid 2 Columns: Lingkar Kepala & Lingkar Lengan */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Lingkar Kepala Sekarang */}
                  <MeasurementInput
                    id="lingkarKepalaSekarang"
                    label="Lingkar Kepala"
                    suffix="cm"
                    optional
                    value={formData.lingkarKepalaSekarang}
                    onChange={(value) =>
                      handleInputChange("lingkarKepalaSekarang", value)
                    }
                    error={errors.lingkarKepalaSekarang}
                  />

                  {/* Lingkar Lengan Sekarang */}
                  <MeasurementInput
                    id="lingkarLenganSekarang"
                    label="Lingkar lengan"
                    suffix="cm"
                    optional
                    value={formData.lingkarLenganSekarang}
                    onChange={(value) =>
                      handleInputChange("lingkarLenganSekarang", value)
                    }
                    error={errors.lingkarLenganSekarang}
                    disabled={ageInMonths === null || ageInMonths <= 6}
                    placeholder={
                      ageInMonths === null
                        ? "Isi tanggal lahir dulu"
                        : ageInMonths <= 6
                          ? "Tidak wajib (<= 6 bulan)"
                          : "0.0"
                    }
                    hint="Dapat diisi untuk balita usia > 6 bulan"
                  />
                </div>
              </div>
            </Card>
          )}

          {/* ACTION BUTTONS (BOTTOM OF FORM LAYOUT) */}
          <div className="pt-2 px-1">
            {step === 1 && (
              <button
                type="button"
                onClick={handleNext}
                className="w-full bg-[#12b8a6] hover:bg-[#0d9488] active:scale-[0.99] text-white font-bold py-3.5 px-6 rounded-2xl shadow-lg shadow-teal-600/10 hover:shadow-teal-600/20 transition-all duration-300 text-center flex items-center justify-center gap-2 cursor-pointer text-sm sm:text-base"
              >
                Lanjut
                <ChevronRight size={18} />
              </button>
            )}

            {step === 2 && (
              <div className="flex gap-4">
                <button
                  type="button"
                  onClick={handleBack}
                  className="flex-1 bg-white hover:bg-gray-50 active:scale-[0.99] border border-gray-300 text-gray-700 font-bold py-3.5 px-6 rounded-2xl shadow-sm transition-all duration-300 text-center cursor-pointer text-sm"
                >
                  Kembali
                </button>
                <button
                  type="button"
                  onClick={handleNext}
                  className="flex-1 bg-[#12b8a6] hover:bg-[#0d9488] active:scale-[0.99] text-white font-bold py-3.5 px-6 rounded-2xl shadow-lg shadow-teal-600/10 hover:shadow-teal-600/20 transition-all duration-300 text-center flex items-center justify-center gap-2 cursor-pointer text-sm"
                >
                  Lanjut
                  <ChevronRight size={16} />
                </button>
              </div>
            )}

            {step === 3 && (
              <div className="flex gap-4">
                <button
                  type="button"
                  onClick={handleBack}
                  className="flex-1 bg-white hover:bg-gray-50 active:scale-[0.99] border border-gray-300 text-gray-700 font-bold py-3.5 px-6 rounded-2xl shadow-sm transition-all duration-300 text-center cursor-pointer text-sm"
                >
                  Kembali
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-[#12b8a6] hover:bg-[#0d9488] active:scale-[0.99] text-white font-bold py-3.5 px-6 rounded-2xl shadow-lg shadow-teal-600/15 hover:shadow-teal-600/25 transition-all duration-300 text-center flex items-center justify-center gap-2 cursor-pointer text-sm"
                >
                  Simpan
                </button>
              </div>
            )}
          </div>
        </form>

        <TambahBalitaSuccessDialog
          isOpen={showSuccessModal}
          balitaName={formData.namaBalita}
          gender={formData.jenisKelamin}
          birthDate={formData.tanggalLahir}
          guardianName={formData.namaWali}
          countdown={countdown}
          onViewList={() => router.push("/dashboard/balita")}
        />
      </main>
    </div>
  );
}
