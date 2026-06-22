import { SHORT_MONTH_NAMES } from "@/lib/constants";
import { Pengukuran } from "@/types";

type MeasurementHistoryProps = {
  measurements: Pengukuran[];
  year: string;
};

export default function MeasurementHistory({
  measurements,
  year,
}: MeasurementHistoryProps) {
  const filteredMeasurements = measurements
    .filter((measurement) => measurement.tahun.toString() === year)
    .sort((left, right) => right.bulan - left.bulan);

  return (
    <div className="mt-2 w-full">
      <div className="grid grid-cols-5 border-b border-gray-100 pb-3 text-[11px] font-bold text-gray-500">
        <div>Bulan</div>
        <div className="text-center">BB</div>
        <div className="text-center">PB</div>
        <div className="text-center">LK</div>
        <div className="text-center">LL</div>
      </div>
      {filteredMeasurements.length > 0 ? (
        filteredMeasurements.map((measurement) => (
          <div
            key={
              measurement.id ??
              `${measurement.tahun}-${measurement.bulan}`
            }
            className="grid grid-cols-5 border-b border-gray-50 py-3 text-xs font-bold text-black transition-colors last:border-0 hover:bg-gray-50"
          >
            <div>{SHORT_MONTH_NAMES[measurement.bulan - 1]}</div>
            <div className="text-center text-gray-700">
              {measurement.beratBadan}
            </div>
            <div className="text-center text-gray-700">
              {measurement.tinggiBadan}
            </div>
            <div className="text-center text-gray-700">
              {measurement.lingkarKepala ?? "-"}
            </div>
            <div className="text-center text-gray-700">
              {measurement.lingkarLengan ?? "-"}
            </div>
          </div>
        ))
      ) : (
        <p className="py-6 text-center text-xs font-medium text-gray-400">
          Belum ada riwayat pengukuran pada tahun {year}
        </p>
      )}
    </div>
  );
}
