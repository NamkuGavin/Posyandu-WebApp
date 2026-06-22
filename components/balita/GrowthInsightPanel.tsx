"use client";

import { useState } from "react";
import {
  Activity,
  AlertTriangle,
  ChevronDown,
  Database,
  Lightbulb,
  ShieldAlert,
  Sparkles,
  TrendingUp,
  type LucideIcon,
} from "lucide-react";
import {
  GrowthInsightResponse,
  GrowthInsightSectionId,
} from "@/types";

const INSIGHT_TABS: {
  id: GrowthInsightSectionId;
  label: string;
  icon: LucideIcon;
}[] = [
  { id: "analisis", label: "Analisis", icon: Activity },
  { id: "risiko_gizi", label: "Risiko Gizi", icon: ShieldAlert },
  { id: "monitoring", label: "Monitoring", icon: TrendingUp },
  { id: "anomali", label: "Anomali", icon: AlertTriangle },
  {
    id: "rekomendasi",
    label: "Rekomendasi & Tindakan",
    icon: Lightbulb,
  },
];

export const CLIENT_INSIGHT_FALLBACK: GrowthInsightResponse = {
  source: "rules",
  providerStatus: "provider_error",
  status: "limited",
  period: {
    label: "Belum tersedia",
    months: [],
    missingMonths: [],
    isConsecutive: false,
    note: "Insight belum dapat dimuat dari server.",
  },
  anthropometry: {
    calculated: false,
    period: null,
    ageDays: null,
    ageMonths: null,
    measurementMode: null,
    bmi: null,
    indicators: [],
    note: "Perhitungan antropometri belum tersedia.",
  },
  sections: INSIGHT_TABS.map((tab) => ({
    id: tab.id,
    title: tab.label,
    tone:
      tab.id === "anomali"
        ? "warning"
        : tab.id === "rekomendasi"
          ? "action"
          : "neutral",
    items: ["Data insight untuk bagian ini belum tersedia."],
  })),
  references: [],
};

type GrowthInsightPanelProps = {
  insight: GrowthInsightResponse | null;
  isLoading: boolean;
};

export default function GrowthInsightPanel({
  insight,
  isLoading,
}: GrowthInsightPanelProps) {
  const [activeTab, setActiveTab] =
    useState<GrowthInsightSectionId>("analisis");
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const activeSection = insight?.sections.find(
    (section) => section.id === activeTab,
  );
  const activeTabMeta =
    INSIGHT_TABS.find((tab) => tab.id === activeTab) ?? INSIGHT_TABS[0];
  const ActiveIcon = activeTabMeta.icon;
  const providerHasIssue = insight && insight.providerStatus !== "ok";
  const isWarning = activeSection?.tone === "warning";

  return (
    <div className="relative rounded-xl border border-[#1fb999]/30 bg-[#f0fbf9] p-5">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2">
          <Sparkles size={18} className="shrink-0 text-[#0d9488]" />
          <div>
            <h4 className="text-sm font-bold text-[#0d9488]">
              Insight Pertumbuhan
            </h4>
            <p className="mt-0.5 text-[10px] font-semibold text-teal-700">
              Skrining dini pola yang perlu diperiksa lebih lanjut
            </p>
          </div>
        </div>
        {!isLoading && insight && (
          <span className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border border-teal-100 bg-white px-2.5 py-1 text-[9px] font-black uppercase text-[#0d9488]">
            <Database size={11} />
            {insight.source === "groq" ? "AI + Data" : "Mode Data"}
          </span>
        )}
      </div>

      {isLoading ? (
        <div className="mb-4 animate-pulse space-y-3">
          <div className="h-16 w-full rounded-xl bg-teal-100" />
          <div className="h-10 w-full rounded-xl bg-teal-100" />
          <div className="h-20 w-full rounded-xl bg-teal-100" />
        </div>
      ) : insight && activeSection ? (
        <>
          <div
            className={`mb-4 rounded-xl border p-3 ${
              insight.period.isConsecutive
                ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                : "border-amber-200 bg-amber-50 text-amber-800"
            }`}
          >
            <p className="text-[10px] font-black uppercase tracking-widest">
              Periode Analisis
            </p>
            <p className="mt-1 text-xs font-black">{insight.period.label}</p>
            <p className="mt-1 text-[11px] font-semibold leading-relaxed">
              {insight.period.note}
            </p>
          </div>

          {insight.anthropometry.indicators.length > 0 && (
            <div className="mb-4 border-y border-teal-100 py-3">
              <div className="mb-2 flex items-center justify-between gap-3">
                <div>
                  <p className="text-[10px] font-black uppercase text-gray-500">
                    Z-score WHO terbaru
                  </p>
                  <p className="mt-0.5 text-[10px] font-semibold text-gray-600">
                    Periode {insight.anthropometry.period}
                    {insight.anthropometry.ageMonths !== null
                      ? ` | usia ${insight.anthropometry.ageMonths.toFixed(0)} bulan`
                      : ""}
                  </p>
                </div>
                {insight.anthropometry.bmi !== null && (
                  <span className="whitespace-nowrap text-[10px] font-black text-[#0d9488]">
                    IMT {insight.anthropometry.bmi.toFixed(2)}
                  </span>
                )}
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {insight.anthropometry.indicators.map((indicator) => {
                  const statusClass =
                    indicator.status === "critical"
                      ? "text-rose-700"
                      : indicator.status === "warning"
                        ? "text-amber-700"
                        : indicator.status === "normal"
                          ? "text-emerald-700"
                          : "text-gray-500";

                  return (
                    <div
                      key={indicator.id}
                      className="flex items-start justify-between gap-3 border-b border-teal-100 py-2 last:border-b-0"
                    >
                      <div className="min-w-0">
                        <p className="text-[10px] font-bold text-gray-600">
                          {indicator.label}
                        </p>
                        <p
                          className={`mt-0.5 text-[10px] font-black ${statusClass}`}
                        >
                          {indicator.classification}
                        </p>
                      </div>
                      <span
                        className={`whitespace-nowrap text-xs font-black ${statusClass}`}
                      >
                        {indicator.zScore === null
                          ? "N/A"
                          : indicator.zScore.toFixed(2)}
                      </span>
                    </div>
                  );
                })}
              </div>
              <p className="mt-2 text-[9px] font-semibold leading-relaxed text-gray-500">
                {insight.anthropometry.note}
              </p>
            </div>
          )}

          <div className="relative mb-4">
            <button
              type="button"
              aria-haspopup="menu"
              aria-expanded={isFilterOpen}
              onClick={() => setIsFilterOpen((isOpen) => !isOpen)}
              className="flex h-10 w-full items-center justify-between gap-3 rounded-lg border border-teal-200 bg-white px-3 text-left text-xs font-black text-gray-800 hover:border-teal-400"
            >
              <span className="flex min-w-0 items-center gap-2">
                <ActiveIcon size={15} className="shrink-0 text-[#0d9488]" />
                <span className="truncate">{activeTabMeta.label}</span>
              </span>
              <ChevronDown
                size={15}
                className={`shrink-0 text-gray-500 transition-transform ${
                  isFilterOpen ? "rotate-180" : ""
                }`}
              />
            </button>

            {isFilterOpen && (
              <div
                role="menu"
                className="absolute left-0 right-0 top-11 z-20 overflow-hidden rounded-lg border border-teal-100 bg-white p-1.5 shadow-xl"
              >
                {INSIGHT_TABS.map((tab) => {
                  const TabIcon = tab.icon;
                  const isActive = activeTab === tab.id;

                  return (
                    <button
                      key={tab.id}
                      type="button"
                      role="menuitem"
                      onClick={() => {
                        setActiveTab(tab.id);
                        setIsFilterOpen(false);
                      }}
                      className={`flex min-h-9 w-full items-center gap-2 rounded-md px-2.5 py-2 text-left text-[11px] font-bold transition-colors ${
                        isActive
                          ? "bg-teal-50 text-[#0d9488]"
                          : "text-gray-700 hover:bg-gray-50"
                      }`}
                    >
                      <TabIcon size={14} className="shrink-0" />
                      <span>{tab.label}</span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          <div className="mb-4">
            <div className="mb-2 flex items-center gap-2">
              <ActiveIcon
                size={16}
                className={isWarning ? "text-amber-600" : "text-[#0d9488]"}
              />
              <h5 className="text-xs font-black text-gray-900">
                {activeSection.title}
              </h5>
            </div>
            <div className="divide-y divide-teal-100">
              {activeSection.items.map((item, index) => (
                <div
                  key={`${activeSection.id}-${index}`}
                  className="flex gap-3 py-3 first:pt-1 last:pb-1"
                >
                  <span
                    className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${
                      isWarning ? "bg-amber-500" : "bg-[#1fb999]"
                    }`}
                  />
                  <p className="text-xs font-semibold leading-relaxed text-gray-800">
                    {item}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {providerHasIssue && (
            <p className="mb-3 text-[10px] font-semibold leading-relaxed text-amber-700">
              Provider AI tidak aktif. Insight tetap dihitung dari urutan
              periode dan perubahan angka pengukuran.
            </p>
          )}
        </>
      ) : (
        <p className="mb-4 text-xs font-semibold text-gray-600">
          Insight pertumbuhan belum tersedia.
        </p>
      )}

      <p className="text-[10px] italic text-[#0d9488] opacity-80">
        Insight ini mendukung pencatatan dan skrining awal, bukan diagnosis atau
        pengganti pemeriksaan tenaga kesehatan.
      </p>
    </div>
  );
}
