"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import Link from "next/link";
import { AlertCircle } from "lucide-react";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import PasswordInput from "@/components/auth/PasswordInput";
import { login } from "@/lib/api";

export default function LoginForm() {
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await login(identifier, password);
      if (!res.success) {
        throw new Error(res.error || "NIK/Username atau password salah");
      }

      router.push("/dashboard");
      router.refresh();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Login gagal");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <Input
        label="NIK / Username"
        type="text"
        placeholder="Masukkan NIK atau username"
        value={identifier}
        onChange={(e) => setIdentifier(e.target.value)}
        autoComplete="username"
      />

      <PasswordInput
        label="Password"
        value={password}
        onChange={setPassword}
      />

      {error && (
        <div className="flex items-start gap-2 text-sm font-bold text-rose-600 bg-rose-50 p-3 rounded-xl border border-rose-100">
          <AlertCircle size={18} className="shrink-0 mt-0.5" />
          <p>{error}</p>
        </div>
      )}

      <Button type="submit" isLoading={loading} className="w-full">
        Masuk ke Dashboard
      </Button>

      <p className="text-center text-xs font-semibold text-gray-500">
        Belum memiliki akun kader?{" "}
        <Link
          href="/register"
          className="font-black text-[#0d9488] hover:text-teal-700 hover:underline"
        >
          Daftar sekarang
        </Link>
      </p>

      <div className="flex items-center justify-center gap-2 pt-2">
        <div className="w-1.5 h-1.5 bg-teal-500 rounded-full animate-pulse"></div>
        <p className="text-xs text-gray-500 font-bold tracking-wide">
          AKSES KADER & ADMIN POSYANDU
        </p>
      </div>
    </form>
  );
}
