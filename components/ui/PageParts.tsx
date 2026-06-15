import type { ReactNode } from "react";
import { LucideIcon, Info, Search } from "lucide-react";

export function PageHeader({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
      <div>
        {eyebrow && (
          <p className="text-[11px] font-black text-[#0d9488] uppercase tracking-widest">
            {eyebrow}
          </p>
        )}
        <h1 className="text-xl sm:text-2xl font-black text-gray-950 mt-1">
          {title}
        </h1>
        {description && (
          <p className="text-sm font-medium text-gray-600 mt-2 leading-relaxed max-w-2xl">
            {description}
          </p>
        )}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}

export function InfoPanel({
  title,
  children,
  icon: Icon = Info,
  tone = "teal",
}: {
  title: string;
  children: ReactNode;
  icon?: LucideIcon;
  tone?: "teal" | "blue" | "amber" | "rose";
}) {
  const styles = {
    teal: "bg-[#f0fbf9] border-teal-100 text-[#0d9488]",
    blue: "bg-blue-50 border-blue-100 text-blue-700",
    amber: "bg-amber-50 border-amber-100 text-amber-700",
    rose: "bg-rose-50 border-rose-100 text-rose-700",
  };

  return (
    <div className={`rounded-xl border p-4 flex items-start gap-3 ${styles[tone]}`}>
      <div className="w-8 h-8 rounded-xl bg-white flex items-center justify-center shrink-0 shadow-sm">
        <Icon size={18} strokeWidth={2.5} />
      </div>
      <div>
        <p className="text-sm font-black">{title}</p>
        <div className="text-xs font-semibold leading-relaxed mt-1 text-gray-700">
          {children}
        </div>
      </div>
    </div>
  );
}

export function EmptyState({
  title,
  description,
  icon: Icon = Search,
  action,
}: {
  title: string;
  description?: string;
  icon?: LucideIcon;
  action?: ReactNode;
}) {
  return (
    <div className="text-center py-10 px-4">
      <div className="bg-gray-100 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 text-gray-400">
        <Icon size={30} />
      </div>
      <p className="text-sm font-black text-gray-700">{title}</p>
      {description && (
        <p className="text-xs font-medium text-gray-500 mt-1 leading-relaxed">
          {description}
        </p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
