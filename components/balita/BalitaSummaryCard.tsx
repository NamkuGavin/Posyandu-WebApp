import { Baby } from "lucide-react";
import Card from "@/components/ui/Card";
import { Balita } from "@/types";

type BalitaSummaryCardProps = {
  balita: Balita;
  measurementStatus?: "measured" | "unmeasured";
};

export default function BalitaSummaryCard({
  balita,
  measurementStatus,
}: BalitaSummaryCardProps) {
  return (
    <Card className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-4">
          <div
            className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full ${
              balita.jenisKelamin === "PEREMPUAN"
                ? "bg-[#fce5f1] text-pink-500"
                : "bg-[#e5f5fd] text-sky-500"
            }`}
          >
            <Baby size={24} />
          </div>
          <div className="min-w-0">
            <h5 className="truncate text-sm font-bold text-black">
              {balita.nama}
            </h5>
            <p className="mt-1 text-xs text-gray-700">
              {balita.jenisKelamin === "PEREMPUAN" ? "Perempuan" : "Laki-laki"}
            </p>
            <p className="mt-0.5 text-xs text-gray-700">
              {balita.namaWali || "-"} | {balita.alamat || "-"} RT{" "}
              {balita.rt || "-"}/RW {balita.rw || "-"}
            </p>
          </div>
        </div>

        {measurementStatus && (
          <div
            className={`self-start rounded-full px-4 py-1.5 text-xs font-bold ${
              measurementStatus === "measured"
                ? "bg-[#e6fbf5] text-[#0d9488]"
                : "bg-[#fff5ea] text-orange-600"
            }`}
          >
            {measurementStatus === "measured"
              ? "Sudah diukur"
              : "Belum diukur"}
          </div>
        )}
      </div>
    </Card>
  );
}
