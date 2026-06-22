"use client";

import { useEffect, useState, type ComponentType } from "react";
import {
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import Card from "@/components/ui/Card";
import { formatPercent } from "@/components/dashboard/ProgressMetric";

export type GenderChartDatum = {
  name: "Laki-laki" | "Perempuan";
  value: number;
  color: string;
};

type GenderPieSummaryProps = {
  title: string;
  description: string;
  data: GenderChartDatum[];
  emptyMessage: string;
  icon: ComponentType<{ size?: number; className?: string }>;
};

export default function GenderPieSummary({
  title,
  description,
  data,
  emptyMessage,
  icon: Icon,
}: GenderPieSummaryProps) {
  const [mounted, setMounted] = useState(false);
  const total = data.reduce((sum, item) => sum + item.value, 0);

  useEffect(() => {
    let isActive = true;
    Promise.resolve().then(() => {
      if (isActive) setMounted(true);
    });
    return () => {
      isActive = false;
    };
  }, []);

  return (
    <Card className="min-w-0 rounded-xl p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="text-sm font-black text-gray-900">{title}</h3>
          <p className="mt-1 text-xs font-medium leading-relaxed text-gray-500">
            {description}
          </p>
        </div>
        <Icon size={22} className="shrink-0 text-[#0d9488]" />
      </div>

      {!mounted ? (
        <div className="mt-4 h-[250px] animate-pulse rounded-xl bg-gray-50" />
      ) : total === 0 ? (
        <div className="mt-4 flex h-[250px] items-center justify-center rounded-xl border border-dashed border-gray-200 bg-gray-50 px-6 text-center">
          <p className="text-xs font-bold leading-relaxed text-gray-400">
            {emptyMessage}
          </p>
        </div>
      ) : (
        <>
          <div className="relative mt-3 h-[250px] min-w-0 w-full">
            <ResponsiveContainer
              width="100%"
              height="100%"
              minWidth={0}
              minHeight={250}
              initialDimension={{ width: 320, height: 250 }}
            >
              <PieChart>
                <Pie
                  data={data}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={54}
                  outerRadius={88}
                  paddingAngle={3}
                  stroke="#ffffff"
                  strokeWidth={3}
                >
                  {data.map((item) => (
                    <Cell key={item.name} fill={item.color} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value) => [`${value} balita`, "Jumlah"]}
                  contentStyle={{
                    borderRadius: 8,
                    borderColor: "#e5e7eb",
                    fontSize: 12,
                    fontWeight: 700,
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-3xl font-black text-gray-950">{total}</span>
              <span className="text-[10px] font-bold uppercase text-gray-400">
                Balita
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-10 sm:grid-cols-2">
            {data.map((item) => {
              const percentage =
                total > 0 ? Number(((item.value / total) * 100).toFixed(1)) : 0;

              return (
                <div
                  key={item.name}
                  className="flex items-center justify-between gap-3 border-t border-gray-100 pt-3"
                >
                  <div className="flex min-w-0 items-center gap-2">
                    <span
                      className="h-3 w-3 shrink-0 rounded-sm"
                      style={{ backgroundColor: item.color }}
                    />
                    <span className="truncate text-xs font-bold text-gray-700">
                      {item.name}
                    </span>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-black text-gray-950">
                      {item.value}
                    </p>
                    <p className="text-[10px] font-bold text-gray-400">
                      {formatPercent(percentage)}%
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </Card>
  );
}
