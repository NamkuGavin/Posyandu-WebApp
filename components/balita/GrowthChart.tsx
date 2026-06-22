"use client";

import { useEffect, useMemo, useState } from "react";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { SHORT_MONTH_NAMES } from "@/lib/constants";
import { Pengukuran } from "@/types";

export const GROWTH_CHART_TABS = [
  "Berat",
  "Panjang",
  "L. Kepala",
  "L. Lengan",
] as const;

export type GrowthChartTab = (typeof GROWTH_CHART_TABS)[number];

const METRICS: Record<
  GrowthChartTab,
  { key: keyof Pengukuran; unit: string }
> = {
  Berat: { key: "beratBadan", unit: "kg" },
  Panjang: { key: "tinggiBadan", unit: "cm" },
  "L. Kepala": { key: "lingkarKepala", unit: "cm" },
  "L. Lengan": { key: "lingkarLengan", unit: "cm" },
};

type GrowthChartProps = {
  measurements: Pengukuran[];
  activeTab: GrowthChartTab;
  year: string;
};

export default function GrowthChart({
  measurements,
  activeTab,
  year,
}: GrowthChartProps) {
  const [mounted, setMounted] = useState(false);
  const metric = METRICS[activeTab];
  const chartData = useMemo(
    () =>
      measurements
        .filter((measurement) => measurement.tahun.toString() === year)
        .sort((left, right) => left.bulan - right.bulan)
        .map((measurement) => ({
          ...measurement,
          bulanStr: SHORT_MONTH_NAMES[measurement.bulan - 1],
        })),
    [measurements, year],
  );

  useEffect(() => {
    let isActive = true;
    Promise.resolve().then(() => {
      if (isActive) setMounted(true);
    });
    return () => {
      isActive = false;
    };
  }, []);

  if (!mounted) {
    return (
      <div className="flex h-[220px] w-full items-center justify-center rounded-xl border border-gray-100 bg-gray-50/50">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-teal-500 border-t-transparent" />
      </div>
    );
  }

  if (chartData.length === 0) {
    return (
      <div className="flex h-[220px] w-full items-center justify-center rounded-xl border border-gray-100 bg-gray-50/50 text-xs font-semibold text-gray-400">
        Belum ada data pengukuran pada tahun {year}
      </div>
    );
  }

  return (
    <div className="mt-6 w-full pb-2">
      <div className="relative h-[220px] min-h-[220px] min-w-0 w-full">
        <ResponsiveContainer
          width="100%"
          height="100%"
          minWidth={0}
          minHeight={220}
          initialDimension={{ width: 640, height: 220 }}
        >
          <LineChart
            data={chartData}
            margin={{ top: 15, right: 15, left: -20, bottom: 5 }}
          >
            <CartesianGrid
              strokeDasharray="3 3"
              vertical
              stroke="#f3f4f6"
            />
            <XAxis
              dataKey="bulanStr"
              tick={{ fill: "#4b5563", fontSize: 11, fontWeight: "bold" }}
              axisLine={{ stroke: "#d1d5db", strokeWidth: 1.5 }}
              tickLine={{ stroke: "#d1d5db" }}
            />
            <YAxis
              tick={{ fill: "#4b5563", fontSize: 11, fontWeight: "bold" }}
              axisLine={{ stroke: "#d1d5db", strokeWidth: 1.5 }}
              tickLine={{ stroke: "#d1d5db" }}
              domain={["auto", "auto"]}
            />
            <Tooltip
              content={({ active, payload }) => {
                if (!active || !payload?.length) return null;
                const data = payload[0].payload;

                return (
                  <div className="rounded-xl border border-teal-100 bg-white px-3 py-2 font-sans text-xs font-bold shadow-lg shadow-teal-50/50">
                    <p className="text-gray-500">
                      {data.bulanStr} {data.tahun}
                    </p>
                    <p className="mt-0.5 text-teal-600">
                      {activeTab}: {data[metric.key]} {metric.unit}
                    </p>
                  </div>
                );
              }}
            />
            <Line
              type="monotone"
              dataKey={metric.key}
              stroke="#1fb999"
              strokeWidth={3}
              dot={{ r: 5, fill: "#fff", stroke: "#1fb999", strokeWidth: 2 }}
              activeDot={{
                r: 7,
                fill: "#1fb999",
                stroke: "#fff",
                strokeWidth: 2,
              }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
      <p className="mt-2 text-center text-xs font-bold text-gray-400">
        Satuan: {metric.unit}
      </p>
    </div>
  );
}
