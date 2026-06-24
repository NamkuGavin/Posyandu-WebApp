"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { AlertCircle, CheckCircle2, Info, UserRoundCheck } from "lucide-react";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import PasswordInput from "@/components/auth/PasswordInput";
import { NIK_LENGTH } from "@/lib/constants";
import { onlyDigits } from "@/lib/form-utils";
import { registerKader } from "@/lib/api";
import { RegisterKaderPayload } from "@/types";

type RegisterField = keyof RegisterKaderPayload | "confirmPassword";
type RegisterErrors = Partial<Record<RegisterField, string>>;

const INITIAL_FORM: RegisterKaderPayload & { confirmPassword: string } = {
  nama: "",
  nik: "",
  username: "",
  email: "",
  password: "",
  confirmPassword: "",
};

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function RegisterForm() {
  const [form, setForm] = useState(INITIAL_FORM);
  const [errors, setErrors] = useState<RegisterErrors>({});
  const [requestError, setRequestError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isRegistered, setIsRegistered] = useState(false);

  const updateField = (field: RegisterField, value: string) => {
    setForm((current) => ({ ...current, [field]: value }));
    setErrors((current) => {
      if (!current[field]) return current;
      const next = { ...current };
      delete next[field];
      return next;
    });
    if (requestError) setRequestError("");
  };

  const validate = () => {
    const nextErrors: RegisterErrors = {};

    if (!form.nama.trim()) nextErrors.nama = "Nama lengkap wajib diisi";
    if (form.nik.length !== NIK_LENGTH) {
      nextErrors.nik = "NIK harus terdiri dari 16 digit angka";
    }
    if (form.username.trim().length < 2) {
      nextErrors.username = "Username minimal 2 karakter";
    }
    if (!EMAIL_PATTERN.test(form.email.trim())) {
      nextErrors.email = "Masukkan alamat email yang valid";
    }
    if (form.password.length < 8) {
      nextErrors.password = "Password minimal 8 karakter";
    }
    if (form.confirmPassword !== form.password) {
      nextErrors.confirmPassword = "Konfirmasi password belum sama";
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setRequestError("");
    if (!validate()) return;

    try {
      setIsSubmitting(true);
      await registerKader({
        nama: form.nama.trim(),
        nik: form.nik,
        username: form.username.trim(),
        email: form.email.trim().toLowerCase(),
        password: form.password,
      });
      setIsRegistered(true);
      setForm(INITIAL_FORM);
    } catch (error: unknown) {
      setRequestError(
        error instanceof Error ? error.message : "Pendaftaran akun gagal",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isRegistered) {
    return (
      <div className="space-y-5 text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
          <CheckCircle2 size={28} />
        </div>
        <div>
          <h3 className="text-lg font-black text-gray-950">
            Akun kader berhasil dibuat
          </h3>
          <p className="mt-2 text-xs font-medium leading-relaxed text-gray-500">
            Gunakan NIK atau username dan password yang baru didaftarkan untuk
            masuk ke dashboard.
          </p>
        </div>
        <Link
          href="/login"
          className="inline-flex min-h-11 w-full items-center justify-center rounded-xl bg-teal-600 px-5 py-3 text-sm font-bold text-white shadow-sm shadow-teal-200 transition-all hover:bg-teal-700 active:scale-95"
        >
          Masuk Sekarang
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4" noValidate>
      <Input
        label="Nama Lengkap"
        placeholder="Nama lengkap kader"
        value={form.nama}
        onChange={(event) => updateField("nama", event.target.value)}
        autoComplete="name"
        error={errors.nama}
      />
      <Input
        label="NIK"
        placeholder="16 digit NIK"
        value={form.nik}
        onChange={(event) =>
          updateField("nik", onlyDigits(event.target.value, NIK_LENGTH))
        }
        inputMode="numeric"
        maxLength={NIK_LENGTH}
        autoComplete="off"
        error={errors.nik}
      />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Input
          label="Username"
          placeholder="Contoh: kader01"
          value={form.username}
          onChange={(event) => updateField("username", event.target.value)}
          autoComplete="username"
          error={errors.username}
        />
        <Input
          label="Email"
          type="email"
          placeholder="kader@example.com"
          value={form.email}
          onChange={(event) => updateField("email", event.target.value)}
          autoComplete="email"
          error={errors.email}
        />
      </div>
      <PasswordInput
        label="Password"
        value={form.password}
        onChange={(value) => updateField("password", value)}
        placeholder="Minimal 8 karakter"
        autoComplete="new-password"
        error={errors.password}
      />
      <PasswordInput
        label="Konfirmasi Password"
        value={form.confirmPassword}
        onChange={(value) => updateField("confirmPassword", value)}
        placeholder="Ulangi password"
        autoComplete="new-password"
        error={errors.confirmPassword}
      />

      {requestError && (
        <div className="flex items-start gap-2 rounded-xl border border-rose-100 bg-rose-50 p-3 text-sm font-bold text-rose-600">
          <AlertCircle size={18} className="mt-0.5 shrink-0" />
          <p>{requestError}</p>
        </div>
      )}

      <div className="space-y-2 rounded-xl border border-teal-100 bg-[#f0fbf9] p-3.5">
        <div className="flex items-start gap-2">
          <UserRoundCheck size={17} className="mt-0.5 shrink-0 text-[#0d9488]" />
          <p className="text-[11px] font-semibold leading-relaxed text-gray-700">
            Registrasi terbuka untuk kader. Gunakan data yang benar dan simpan
            username, email, serta password secara mandiri.
          </p>
        </div>
        <div className="flex items-start gap-2">
          <Info size={17} className="mt-0.5 shrink-0 text-amber-600" />
          <p className="text-[11px] font-semibold leading-relaxed text-gray-700">
            Jika lupa akun atau password, hubungi admin/pengelola yang membuat
            aplikasi ini karena pemulihan akun otomatis belum tersedia.
          </p>
        </div>
      </div>

      <Button type="submit" isLoading={isSubmitting} className="w-full">
        Daftar Akun Kader
      </Button>

      <p className="text-center text-xs font-semibold text-gray-500">
        Sudah memiliki akun?{" "}
        <Link
          href="/login"
          className="font-black text-[#0d9488] hover:text-teal-700 hover:underline"
        >
          Kembali ke login
        </Link>
      </p>
    </form>
  );
}
