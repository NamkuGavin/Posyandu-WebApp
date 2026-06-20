import LoginForm from "@/components/auth/LoginForm";
import Image from "next/image";
import { ShieldCheck } from "lucide-react";

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-gray-50 px-5 py-8 flex items-center justify-center">
      <div className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-[1fr_420px] gap-6 items-center">
        <div className="text-center lg:text-left space-y-5">
          <div className="flex justify-center lg:justify-start">
            <Image
              src="/icons/logo-original.png"
              alt="Mitra Posyandu Logo"
              width={132}
              height={132}
              className="rounded-2xl shadow-sm"
              priority
            />
          </div>
          <div>
            <p className="text-[11px] font-black text-[#0d9488] uppercase tracking-widest">
              Khusus Kader Posyandu
            </p>
            <h1 className="text-3xl sm:text-4xl font-black text-gray-950 mt-2">
              Posyandu ILP Ceria 9
            </h1>
            <p className="text-base font-medium text-gray-600 leading-relaxed mt-3 max-w-xl mx-auto lg:mx-0">
              Bantu kader mencatat absensi, pengukuran, dan laporan pertumbuhan
              balita dengan langkah yang lebih mudah.
            </p>
          </div>
        </div>

        <div className="w-full bg-white p-5 sm:p-6 rounded-2xl shadow-sm border border-gray-100">
          <div className="flex items-start gap-3 mb-6">
            <div className="w-11 h-11 rounded-xl bg-[#f0fbf9] text-[#0d9488] flex items-center justify-center shrink-0">
              <ShieldCheck size={22} />
            </div>
            <div>
              <h2 className="text-lg font-black text-gray-950">Masuk Akun</h2>
              <p className="text-xs font-medium text-gray-500 mt-1 leading-relaxed">
                Gunakan NIK atau username yang sudah didaftarkan admin.
              </p>
            </div>
          </div>
          <LoginForm />
        </div>
      </div>
    </div>
  );
}
