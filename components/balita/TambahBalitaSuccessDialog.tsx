import { CheckCircle2, Sparkles } from "lucide-react";
import { formatAgeDetailed } from "@/lib/date-utils";

type TambahBalitaSuccessDialogProps = {
  isOpen: boolean;
  balitaName: string;
  gender: string;
  birthDate: string;
  guardianName: string;
  countdown: number;
  onViewList: () => void;
};

export default function TambahBalitaSuccessDialog({
  isOpen,
  balitaName,
  gender,
  birthDate,
  guardianName,
  countdown,
  onViewList,
}: TambahBalitaSuccessDialogProps) {
  if (!isOpen) return null;

  const rows = [
    { label: "Nama Balita", value: balitaName },
    { label: "Jenis Kelamin", value: gender },
    { label: "Usia", value: formatAgeDetailed(birthDate) },
    { label: "Wali", value: guardianName || "-" },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <div className="relative w-full max-w-sm overflow-hidden rounded-3xl border border-teal-50/50 bg-white p-6 text-center shadow-2xl sm:p-8">
        <div className="absolute left-6 top-4 animate-bounce text-teal-400">
          <Sparkles size={20} />
        </div>
        <div className="absolute bottom-6 right-6 text-[#1fb999] opacity-75">
          <Sparkles size={16} />
        </div>
        <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-[#e6fbf5] shadow-inner">
          <CheckCircle2 size={38} className="text-[#0d9488]" />
        </div>

        <h3 className="mb-2 text-lg font-black text-black">
          Pendaftaran Berhasil
        </h3>
        <p className="mb-6 text-xs leading-relaxed text-gray-600">
          Data balita <strong>{balitaName}</strong> telah berhasil ditambahkan
          ke Posyandu ILP Ceria 9.
        </p>

        <div className="mb-6 space-y-2 rounded-2xl border border-gray-100 bg-[#f8f9fa] p-4 text-left">
          {rows.map((row) => (
            <div key={row.label} className="flex justify-between gap-3 text-xs">
              <span className="font-semibold text-gray-500">{row.label}</span>
              <span className="max-w-[160px] truncate text-right font-black text-black">
                {row.value}
              </span>
            </div>
          ))}
        </div>

        <div className="flex items-center justify-center gap-2 text-xs font-semibold text-gray-400">
          <span className="inline-block h-2 w-2 animate-ping rounded-full bg-teal-500" />
          Kembali ke daftar dalam {countdown} detik...
        </div>

        <button
          type="button"
          onClick={onViewList}
          className="mt-5 w-full rounded-xl bg-[#12b8a6] px-6 py-3 text-xs font-bold text-white shadow-sm transition-all hover:bg-[#0d9488] active:scale-[0.99] sm:text-sm"
        >
          Lihat Daftar Balita Sekarang
        </button>
      </div>
    </div>
  );
}
