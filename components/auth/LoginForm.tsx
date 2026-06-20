"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { AlertCircle, Eye, EyeOff } from "lucide-react";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import { login } from "@/lib/api";

export default function LoginForm() {
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
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

      <div className="relative">
        <Input
          label="Password"
          type={showPassword ? "text" : "password"}
          placeholder="Masukkan password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="pr-12"
          autoComplete="current-password"
        />
        <button
          type="button"
          aria-label={
            showPassword ? "Sembunyikan password" : "Tampilkan password"
          }
          onClick={() => setShowPassword(!showPassword)}
          className="absolute right-3 top-[36px] p-2 text-gray-500 hover:text-teal-600 transition-colors rounded-lg"
        >
          {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
        </button>
      </div>

      {error && (
        <div className="flex items-start gap-2 text-sm font-bold text-rose-600 bg-rose-50 p-3 rounded-xl border border-rose-100">
          <AlertCircle size={18} className="shrink-0 mt-0.5" />
          <p>{error}</p>
        </div>
      )}

      <Button type="submit" isLoading={loading} className="w-full">
        Masuk ke Dashboard
      </Button>

      <div className="flex items-center justify-center gap-2 pt-2">
        <div className="w-1.5 h-1.5 bg-teal-500 rounded-full animate-pulse"></div>
        <p className="text-xs text-gray-500 font-bold tracking-wide">
          AKSES KADER & ADMIN POSYANDU
        </p>
      </div>
    </form>
  );
}
