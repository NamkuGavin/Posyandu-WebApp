import Image from "next/image";
import { ReactNode } from "react";

type AuthPageLayoutProps = {
  children: ReactNode;
  icon: ReactNode;
  title: string;
  description: string;
};

export default function AuthPageLayout({
  children,
  icon,
  title,
  description,
}: AuthPageLayoutProps) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-5 py-8">
      <div className="grid w-full max-w-5xl grid-cols-1 items-center gap-6 lg:grid-cols-[1fr_420px]">
        <div className="space-y-5 text-center lg:text-left">
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
            <p className="text-[11px] font-black uppercase tracking-widest text-[#0d9488]">
              Sistem Kader Posyandu
            </p>
            <h1 className="mt-2 text-3xl font-black text-gray-950 sm:text-4xl">
              Posyandu ILP Ceria 9
            </h1>
            <p className="mx-auto mt-3 max-w-xl text-base font-medium leading-relaxed text-gray-600 lg:mx-0">
              Bantu kader mencatat absensi, pengukuran, dan laporan pertumbuhan
              balita dengan langkah yang lebih mudah.
            </p>
          </div>
        </div>

        <div className="w-full rounded-2xl border border-gray-100 bg-white p-5 shadow-sm sm:p-6">
          <div className="mb-6 flex items-start gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#f0fbf9] text-[#0d9488]">
              {icon}
            </div>
            <div>
              <h2 className="text-lg font-black text-gray-950">{title}</h2>
              <p className="mt-1 text-xs font-medium leading-relaxed text-gray-500">
                {description}
              </p>
            </div>
          </div>
          {children}
        </div>
      </div>
    </div>
  );
}
