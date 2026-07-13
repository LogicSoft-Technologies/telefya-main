import type { LucideIcon } from "lucide-react";

export function StatCard({
  label,
  value,
  helper,
  icon: Icon,
}: {
  label: string;
  value: string;
  helper: string;
  icon: LucideIcon;
}) {
  return (
    <article className="border border-border bg-white p-5 transition-shadow hover:shadow-soft">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-navy-300">{label}</p>
          <strong className="mt-3 block text-3xl font-black tabular-nums text-navy-900">
            {value}
          </strong>
          <p className="mt-1.5 text-xs font-semibold text-navy-400">{helper}</p>
        </div>

        <div className="grid h-10 w-10 shrink-0 place-items-center rounded-md bg-blue-50 text-telefya-blue">
          <Icon size={19} />
        </div>
      </div>
    </article>
  );
}