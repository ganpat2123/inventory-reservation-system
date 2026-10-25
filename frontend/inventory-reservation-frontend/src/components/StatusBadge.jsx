
import {
  Clock3,
  CheckCircle2,
  RotateCcw,
  XCircle,
  HelpCircle
} from "lucide-react";

const statusConfig = {
  PENDING: {
    label: "Pending",
    icon: Clock3,
    className: "bg-amber-50 text-amber-700 ring-amber-200"
  },
  CONFIRMED: {
    label: "Confirmed",
    icon: CheckCircle2,
    className: "bg-emerald-50 text-emerald-700 ring-emerald-200"
  },
  RELEASED: {
    label: "Released",
    icon: RotateCcw,
    className: "bg-sky-50 text-sky-700 ring-sky-200"
  },
  EXPIRED: {
    label: "Expired",
    icon: XCircle,
    className: "bg-rose-50 text-rose-700 ring-rose-200"
  }
};

const StatusBadge = ({ status, showIcon = true, size = "sm" }) => {
  const config = statusConfig[status] || {
    label: status || "Unknown",
    icon: HelpCircle,
    className: "bg-slate-100 text-slate-600 ring-slate-200"
  };

  const Icon = config.icon;

  const sizeClasses =
    size === "lg"
      ? "px-3.5 py-2 text-sm"
      : "px-3 py-1.5 text-xs";

  return (
    <span
      className={`inline-flex w-fit items-center gap-1.5 rounded-full font-bold ring-1 ring-inset ${sizeClasses} ${config.className}`}
    >
      {showIcon && <Icon size={size === "lg" ? 17 : 14} />}
      {config.label}
    </span>
  );
};

export default StatusBadge;
