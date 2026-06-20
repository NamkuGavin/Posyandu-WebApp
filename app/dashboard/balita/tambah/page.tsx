"use client";

import { useState, useEffect } from "react";
import {
  ArrowLeft,
  Calendar,
  CheckCircle2,
  ChevronRight,
  AlertCircle,
  Sparkles,
} from "lucide-react";
import { useRouter } from "next/navigation";
import Navbar from "@/components/layout/Navbar";
import Card from "@/components/ui/Card";
import { InfoPanel, PageStatusState } from "@/components/ui/PageParts";
import { createBalita } from "@/lib/api";
import { useCurrentProfile } from "@/lib/useCurrentProfile";

const FIXED_ALAMAT = "Kecamatan Sidorejo Kidul";
const FIXED_RW = "09";
const NIK_LENGTH = 16;
const PHONE_MIN_LENGTH = 10;
const PHONE_MAX_LENGTH = 13;
const WHATSAPP_LOCAL_MAX_LENGTH = PHONE_MAX_LENGTH - 1;
const WHATSAPP_INPUT_MAX_LENGTH = PHONE_MAX_LENGTH + 3;
const PHONE_NUMBER_PATTERN = /^(08|62|\+62)[0-9]{9,13}$/;

function onlyDigits(value: string, maxLength: number) {
  return value.replace(/\D/g, "").slice(0, maxLength);
}

function normalizeWhatsappLocalInput(value: string) {
  const trimmed = value.trim();
  let digits = trimmed.startsWith("+62")
    ? trimmed.slice(3).replace(/\D/g, "")
    : trimmed.replace(/\D/g, "");

  if (digits.startsWith("62")) {
    digits = digits.slice(2);
  }

  if (digits.startsWith("0")) {
    digits = digits.slice(1);
  }

  return digits.slice(0, WHATSAPP_LOCAL_MAX_LENGTH);
}

function getWhatsappPayload(localNumber: string) {
  const normalized = normalizeWhatsappLocalInput(localNumber);
  return normalized ? `0${normalized}` : "";
}

function formatAgeDetailed(birthDateString: string): string {
  if (!birthDateString) return "";
  const birthDate = new Date(birthDateString);
  const today = new Date();

  let years = today.getFullYear() - birthDate.getFullYear();
  let months = today.getMonth() - birthDate.getMonth();
  let days = today.getDate() - birthDate.getDate();

  if (days < 0) {
    const prevMonth = new Date(today.getFullYear(), today.getMonth(), 0);
    days += prevMonth.getDate();
    months--;
  }

  if (months < 0) {
    months += 12;
    years--;
  }

  const parts = [];
  if (years > 0) parts.push(`${years} tahun`);
  if (months > 0) parts.push(`${months} bulan`);
  if (days > 0 || parts.length === 0) parts.push(`${days} hari`);

  return parts.join(" ");
}

type MeasurementInputFieldProps = {
  id: string;
  label: string;
  suffix: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  disabled?: boolean;
  placeholder?: string;
  step?: string;
  hint?: string;
};

function MeasurementInputField({
  id,
  label,
  suffix,
  value,
  onChange,
  error,
  disabled = false,
  placeholder = "0.0",
  step = "0.1",
  hint,
}: MeasurementInputFieldProps) {
  return (
    <div className="space-y-2">
      <label htmlFor={id} className="block text-xs font-bold text-gray-700">
        {label}
        <span className="text-gray-400 ml-1">(opsional)</span>
      </label>
      <div
        className={`relative rounded-xl border overflow-hidden transition-all shadow-sm ${
          disabled
            ? "border-gray-100 bg-gray-50"
            : error
              ? "border-rose-400 bg-white focus-within:ring-2 focus-within:ring-rose-200"
              : "border-gray-200 bg-white focus-within:ring-2 focus-within:ring-teal-500/20 focus-within:border-teal-500"
        }`}
      >
        <input
          type="number"
          id={id}
          step={step}
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          className="w-full px-3 py-3 pr-12 outline-none text-sm text-black bg-transparent disabled:text-gray-400 disabled:cursor-not-allowed placeholder:text-gray-300"
        />
        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-gray-500 pointer-events-none">
          {suffix}
        </span>
      </div>
      {hint && <span className="block text-[9px] text-gray-400">{hint}</span>}
      {error && (
        <p className="text-[10px] text-rose-500 flex items-center gap-1 font-medium">
          <AlertCircle size={10} /> {error}
        </p>
      )}
    </div>
  );
}

export default function TambahBalitaPage() {
  const router = useRouter();
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
    alamat: FIXED_ALAMAT,
    rt: "",
    rw: FIXED_RW,

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

  // Dynamic age calculation in months
  const [ageInMonths, setAgeInMonths] = useState<number | null>(null);

  useEffect(() => {
    let isActive = true;

    Promise.resolve().then(() => {
      if (!isActive) return;

      if (!formData.tanggalLahir) {
        setAgeInMonths(null);
        return;
      }

      const birthDate = new Date(formData.tanggalLahir);
      const today = new Date();

      const years = today.getFullYear() - birthDate.getFullYear();
      let months = today.getMonth() - birthDate.getMonth();

      if (today.getDate() < birthDate.getDate()) {
        months--;
      }

      const totalMonths = years * 12 + months;
      const finalMonths = totalMonths >= 0 ? totalMonths : 0;
      setAgeInMonths(finalMonths);
    });

    return () => {
      isActive = false;
    };
  }, [formData.tanggalLahir]);

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
      const whatsappPayload = getWhatsappPayload(formData.whatsapp);
      const savedPhoneLength = whatsappPayload.length;
      if (
        savedPhoneLength < PHONE_MIN_LENGTH ||
        savedPhoneLength > PHONE_MAX_LENGTH
      ) {
        newErrors.whatsapp = "Nomor WhatsApp harus 10-13 digit jika diisi";
      } else if (!PHONE_NUMBER_PATTERN.test(whatsappPayload)) {
        newErrors.whatsapp =
          "Nomor WhatsApp harus mengikuti format 08, 62, atau +62";
      }
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
        } catch (err: unknown) {
          alert(
            err instanceof Error ? err.message : "Gagal mendaftarkan balita.",
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
                <MeasurementInputField
                  id="panjangLahir"
                  label="Panjang Lahir"
                  suffix="cm"
                  value={formData.panjangLahir}
                  onChange={(value) => handleInputChange("panjangLahir", value)}
                  error={errors.panjangLahir}
                />

                {/* Berat Lahir */}
                <MeasurementInputField
                  id="beratLahir"
                  label="Berat Lahir"
                  suffix="kg"
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
                <MeasurementInputField
                  id="lingkarKepalaLahir"
                  label="Lingkar Kepala Lahir"
                  suffix="cm"
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
                  <MeasurementInputField
                    id="panjangSekarang"
                    label="Panjang/Tinggi Sekarang"
                    suffix="cm"
                    value={formData.panjangSekarang}
                    onChange={(value) =>
                      handleInputChange("panjangSekarang", value)
                    }
                    error={errors.panjangSekarang}
                  />

                  {/* Berat Sekarang */}
                  <MeasurementInputField
                    id="beratSekarang"
                    label="Berat Sekarang"
                    suffix="kg"
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
                  <MeasurementInputField
                    id="lingkarKepalaSekarang"
                    label="Lingkar Kepala"
                    suffix="cm"
                    value={formData.lingkarKepalaSekarang}
                    onChange={(value) =>
                      handleInputChange("lingkarKepalaSekarang", value)
                    }
                    error={errors.lingkarKepalaSekarang}
                  />

                  {/* Lingkar Lengan Sekarang */}
                  <MeasurementInputField
                    id="lingkarLenganSekarang"
                    label="Lingkar lengan"
                    suffix="cm"
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

        {/* HIGH-FIDELITY SUCCESS MODAL */}
        {showSuccessModal && (
          <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-300">
            <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-sm w-full text-center shadow-2xl relative overflow-hidden border border-teal-50/50 animate-in zoom-in-95 slide-in-from-bottom-8 duration-300">
              {/* Decorative particles */}
              <div className="absolute top-4 left-6 text-teal-400 animate-bounce">
                <Sparkles size={20} />
              </div>
              <div className="absolute bottom-6 right-6 text-[#1fb999] opacity-75">
                <Sparkles size={16} />
              </div>

              {/* Success Checkmark Circle */}
              <div className="mx-auto w-16 h-16 bg-[#e6fbf5] rounded-full flex items-center justify-center mb-5 shadow-inner">
                <CheckCircle2 size={38} className="text-[#0d9488]" />
              </div>

              {/* Success message */}
              <h3 className="text-lg font-black text-black mb-2">
                Pendaftaran Berhasil! 🎉
              </h3>
              <p className="text-xs text-gray-600 leading-relaxed mb-6">
                Data balita <strong>{formData.namaBalita}</strong> telah
                berhasil ditambahkan ke Posyandu ILP Ceria 9.
              </p>

              {/* Info Recap */}
              <div className="bg-[#f8f9fa] rounded-2xl p-4 text-left space-y-2 mb-6 border border-gray-100">
                <div className="flex justify-between text-xs">
                  <span className="text-gray-500 font-semibold">
                    Nama Balita
                  </span>
                  <span className="text-black font-black truncate max-w-[160px]">
                    {formData.namaBalita}
                  </span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-gray-500 font-semibold">
                    Jenis Kelamin
                  </span>
                  <span className="text-black font-black">
                    {formData.jenisKelamin}
                  </span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-gray-500 font-semibold">Usia</span>
                  <span className="text-black font-black">
                    {formatAgeDetailed(formData.tanggalLahir)}
                  </span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-gray-500 font-semibold">Wali</span>
                  <span className="text-black font-black truncate max-w-[160px]">
                    {formData.namaWali}
                  </span>
                </div>
              </div>

              {/* Redirect timer */}
              <div className="flex items-center justify-center gap-2 text-xs text-gray-400 font-semibold">
                <span className="inline-block w-2 h-2 rounded-full bg-teal-500 animate-ping"></span>
                Kembali ke Beranda dalam {countdown} detik...
              </div>

              <button
                type="button"
                onClick={() => router.push("/dashboard/balita")}
                className="w-full mt-5 bg-[#12b8a6] hover:bg-[#0d9488] active:scale-[0.99] text-white font-bold py-3 px-6 rounded-xl transition-all cursor-pointer text-xs sm:text-sm shadow-sm"
              >
                Lihat Daftar Balita Sekarang
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
