
import { ArrowUpRight } from "lucide-react";

const StatCard = ({
  label,
  value,
  icon: Icon,
  color = "bg-indigo-50 text-indigo-600",
  description = "",
  loading = false,
  error = false,
}) => {
  return (
    <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg hover:shadow-slate-200/60">
      <div className="flex items-start justify-between">
        <div
          className={`flex h-12 w-12 items-center justify-center rounded-2xl ${color}`}
        >
          {Icon && <Icon size={23} />}
        </div>

        <ArrowUpRight size={17} className="text-slate-300" />
      </div>

      <p className="mt-6 text-sm font-semibold text-slate-500">
        {label}
      </p>

      <div className="mt-2 font-display text-3xl font-extrabold tracking-tight text-slate-900">
        {loading ? (
          <div className="h-9 w-20 animate-pulse rounded-lg bg-slate-100" />
        ) : error ? (
          "—"
        ) : typeof value === "number" ? (
          value.toLocaleString("en-IN")
        ) : (
          value ?? "—"
        )}
      </div>

      {description && (
        <p className="mt-2 text-xs text-slate-400">
          {description}
        </p>
      )}
    </div>
  );
};

export default StatCard;
