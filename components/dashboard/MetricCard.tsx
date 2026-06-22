import { type LucideIcon } from "lucide-react";
import Card from "@/components/ui/Card";

type MetricCardProps = {
  label: string;
  value: string | number;
  helper: string;
  icon: LucideIcon;
  tone: string;
};

export default function MetricCard({
  label,
  value,
  helper,
  icon: Icon,
  tone,
}: MetricCardProps) {
  return (
    <Card className="rounded-xl border-gray-100 bg-white p-4 sm:p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">
            {label}
          </p>
          <p className="mt-2 text-2xl font-black text-gray-950 sm:text-3xl">
            {value}
          </p>
        </div>
        <div
          className={`flex h-10 w-10 items-center justify-center rounded-xl ${tone}`}
        >
          <Icon size={20} strokeWidth={2.5} />
        </div>
      </div>
      <p className="mt-3 text-[11px] font-semibold leading-relaxed text-gray-500">
        {helper}
      </p>
    </Card>
  );
}
