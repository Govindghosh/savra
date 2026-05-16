import type { LucideIcon } from "lucide-react";

type SummaryCardProps = {
  label: string;
  value: string | number;
  icon: LucideIcon;
};

export function SummaryCard({ label, value, icon: Icon }: SummaryCardProps) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</p>
          <p className="mt-2 break-words text-xl font-bold leading-tight text-slate-950 sm:text-2xl">{value}</p>
        </div>
        <div className="h-10 w-10 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center">
          <Icon className="h-5 w-5" aria-hidden="true" />
        </div>
      </div>
    </div>
  );
}
