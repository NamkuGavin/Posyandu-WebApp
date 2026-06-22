export function formatPercent(value: number) {
  if (!Number.isFinite(value)) return "0";
  return Number.isInteger(value) ? value.toString() : value.toFixed(1);
}

type ProgressMetricProps = {
  label: string;
  value: number;
  helper: string;
  color: string;
};

export default function ProgressMetric({
  label,
  value,
  helper,
  color,
}: ProgressMetricProps) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-xs font-bold text-gray-800">{label}</p>
          <p className="mt-0.5 text-[11px] font-semibold text-gray-500">
            {helper}
          </p>
        </div>
        <span className="text-sm font-black text-gray-950">
          {formatPercent(value)}%
        </span>
      </div>
      <div className="h-3 w-full overflow-hidden rounded-full bg-gray-100">
        <div
          className={`h-full rounded-full transition-all duration-700 ${color}`}
          style={{ width: `${Math.min(Math.max(value, 0), 100)}%` }}
        />
      </div>
    </div>
  );
}
