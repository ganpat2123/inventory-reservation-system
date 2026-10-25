
import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  AlertCircle,
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  ClipboardList,
  Clock3,
  FilterX,
  Package,
  RefreshCw,
  Search,
  XCircle
} from "lucide-react";

import StatusBadge from "../components/StatusBadge";

const API_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api";

const formatDate = (value) => {
  if (!value) return "—";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";

  return date.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  });
};

const Reservations = () => {
  const [reservations, setReservations] = useState([]);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [date, setDate] = useState("");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadReservations = useCallback(async (signal) => {
    try {
      setLoading(true);
      setError("");

      const params = new URLSearchParams();

      if (search.trim()) params.set("search", search.trim());
      if (status) params.set("status", status);
      if (date) params.set("date", date);

      const url = `${API_URL}/reservations${params.toString() ? `?${params.toString()}` : ""
        }`;

      const response = await fetch(url, { signal });
      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.message || result.error || "Unable to load reservations."
        );
      }

      if (!Array.isArray(result.data)) {
        throw new Error("Invalid reservation history received.");
      }

      if (!signal?.aborted) {
        setReservations(result.data);
      }
    } catch (err) {
      if (err.name !== "AbortError" && !signal?.aborted) {
        setError(
          err instanceof TypeError
            ? "Cannot connect to the backend. Check that the server is running."
            : err.message
        );
      }
    } finally {
      if (!signal?.aborted) setLoading(false);
    }
  }, [search, status, date]);

  useEffect(() => {
    const controller = new AbortController();

    // Small delay so typing doesn't trigger an API request per keystroke.
    const timer = setTimeout(() => {
      loadReservations(controller.signal);
    }, search ? 350 : 0);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
 }, [loadReservations, search]);

  const clearFilters = () => {
    setSearch("");
    setStatus("");
    setDate("");
  };

  const hasFilters = Boolean(search || status || date);

  const summary = {
    total: reservations.length,
    pending: reservations.filter((r) => r.status === "PENDING").length,
    confirmed: reservations.filter((r) => r.status === "CONFIRMED").length,
    expired: reservations.filter((r) => r.status === "EXPIRED").length
  };

  return (
    <div className="space-y-7">
      <div>
        <p className="text-xs font-bold uppercase tracking-[0.15em] text-indigo-600">
          Inventory Management
        </p>
        <h2 className="mt-1 font-display text-2xl font-extrabold text-slate-900 sm:text-3xl">
          Reservations
        </h2>
        <p className="mt-2 text-sm text-slate-500">
          Track reservation history, statuses, and expiry information.
        </p>
      </div>

      {/* Summary */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          {
            label: "Total Reservations",
            count: summary.total,
            icon: ClipboardList,
            color: "bg-indigo-50 text-indigo-600"
          },
          {
            label: "Pending",
            count: summary.pending,
            icon: Clock3,
            color: "bg-amber-50 text-amber-600"
          },
          {
            label: "Confirmed",
            count: summary.confirmed,
            icon: CheckCircle2,
            color: "bg-emerald-50 text-emerald-600"
          },
          {
            label: "Expired",
            count: summary.expired,
            icon: XCircle,
            color: "bg-rose-50 text-rose-600"
          }
        ].map((item) => {
          const Icon = item.icon;

          return (
            <div
              key={item.label}
              className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
            >
              <div className={`inline-flex rounded-xl p-3 ${item.color}`}>
                <Icon size={21} />
              </div>
              <p className="mt-4 text-sm font-semibold text-slate-500">
                {item.label}
              </p>
              <p className="mt-2 font-display text-3xl font-extrabold text-slate-900">
                {loading || error ? "—" : item.count}
              </p>
            </div>
          );
        })}
      </div>

      {/* Filters and Table */}
      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 p-5 sm:p-6">
          <div>
            <h3 className="font-display text-lg font-bold text-slate-900">
              Reservation History
            </h3>
            <p className="mt-1 text-xs text-slate-500">
              {loading
                ? "Loading reservations..."
                : error
                  ? "Unable to load"
                  : `${reservations.length} matching reservations`}
            </p>
          </div>

          <button
            type="button"
            disabled={loading}
            onClick={() => loadReservations()}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 disabled:opacity-50"
          >
            <RefreshCw
              size={16}
              className={loading ? "animate-spin" : ""}
            />
            Refresh
          </button>
        </div>

        <div className="grid gap-3 border-b border-slate-100 p-5 sm:grid-cols-2 sm:p-6 lg:grid-cols-[1fr_180px_190px_auto]">
          <div className="relative">
            <Search
              size={17}
              className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search product name or SKU"
              aria-label="Search reservations"
              className="w-full rounded-xl border border-slate-200 bg-white py-3 pl-10 pr-4 text-sm outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-50"
            />
          </div>

          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            aria-label="Filter by reservation status"
            className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none focus:border-indigo-500"
          >
            <option value="">All Statuses</option>
            <option value="PENDING">Pending</option>
            <option value="CONFIRMED">Confirmed</option>
            <option value="RELEASED">Released</option>
            <option value="EXPIRED">Expired</option>
          </select>

          <div className="relative">
            <CalendarDays
              size={17}
              className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              aria-label="Filter by creation date"
              className="w-full rounded-xl border border-slate-200 bg-white py-3 pl-10 pr-3 text-sm text-slate-700 outline-none focus:border-indigo-500"
            />
          </div>

          <button
            type="button"
            onClick={clearFilters}
            disabled={!hasFilters}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-600 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <FilterX size={16} />
            Clear
          </button>
        </div>

        {loading ? (
          <div className="space-y-4 p-6">
            {[1, 2, 3, 4].map((item) => (
              <div
                key={item}
                className="h-16 animate-pulse rounded-xl bg-slate-100"
              />
            ))}
          </div>
        ) : error ? (
          <div role="alert" className="px-6 py-14 text-center">
            <AlertCircle size={32} className="mx-auto text-rose-500" />
            <h4 className="mt-3 font-bold text-slate-900">
              Failed to load reservations
            </h4>
            <p className="mt-2 text-sm text-slate-500">{error}</p>
            <button
              type="button"
              onClick={() => loadReservations()}
              className="mt-4 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-bold text-white"
            >
              Try Again
            </button>
          </div>
        ) : reservations.length === 0 ? (
          <div className="px-6 py-16 text-center">
            <ClipboardList size={36} className="mx-auto text-slate-300" />
            <h4 className="mt-4 font-bold text-slate-900">
              {hasFilters ? "No matching reservations" : "No reservations yet"}
            </h4>
            <p className="mt-2 text-sm text-slate-500">
              {hasFilters
                ? "Try changing or clearing your filters."
                : "Reservations will appear after stock is reserved."}
            </p>
            {hasFilters && (
              <button
                type="button"
                onClick={clearFilters}
                className="mt-4 text-sm font-bold text-indigo-600"
              >
                Clear Filters
              </button>
            )}
          </div>
        ) : (
          <>
            {/* Desktop Table */}
            <div className="hidden overflow-x-auto md:block">
              <table className="w-full text-left">
                <thead className="bg-slate-50 text-xs uppercase tracking-wider text-slate-500">
                  <tr>
                    <th className="px-5 py-4 font-bold">Product</th>
                    <th className="px-5 py-4 font-bold">Quantity</th>
                    <th className="px-5 py-4 font-bold">Status</th>
                    <th className="px-5 py-4 font-bold">Created</th>
                    <th className="px-5 py-4 font-bold">Expires</th>
                    <th className="px-5 py-4 text-right font-bold">Action</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">
                  {reservations.map((reservation) => (
                    <tr
                      key={reservation.id}
                      className="transition hover:bg-slate-50"
                    >
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <span className="rounded-xl bg-indigo-50 p-2.5 text-indigo-600">
                            <Package size={18} />
                          </span>
                          <div className="min-w-0">
                            <p className="max-w-48 truncate text-sm font-bold text-slate-900">
                              {reservation.product_name || "Product"}
                            </p>
                            <p className="mt-1 text-xs text-slate-400">
                              {reservation.sku || "—"}
                            </p>
                          </div>
                        </div>
                      </td>

                      <td className="px-5 py-4 text-sm font-bold text-slate-800">
                        {reservation.quantity}
                      </td>

                      <td className="px-5 py-4">
                        <StatusBadge status={reservation.status} />
                      </td>

                      <td className="whitespace-nowrap px-5 py-4 text-xs text-slate-500">
                        {formatDate(reservation.created_at)}
                      </td>

                      <td className="whitespace-nowrap px-5 py-4 text-xs text-slate-500">
                        {formatDate(reservation.expires_at)}
                      </td>

                      <td className="px-5 py-4 text-right">
                        <Link
                          to={`/reservations/${reservation.id}`}
                          className="inline-flex items-center gap-1 text-sm font-bold text-indigo-600 hover:text-indigo-800"
                        >
                          Details
                          <ArrowRight size={16} />
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards */}
            <div className="divide-y divide-slate-100 md:hidden">
              {reservations.map((reservation) => (
                <Link
                  key={reservation.id}
                  to={`/reservations/${reservation.id}`}
                  className="block p-5 transition hover:bg-slate-50"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-bold text-slate-900">
                        {reservation.product_name || "Product"}
                      </p>
                      <p className="mt-1 text-xs text-slate-400">
                        {reservation.sku || "—"}
                      </p>
                    </div>
                    <StatusBadge status={reservation.status} showIcon={false} />
                  </div>

                  <div className="mt-4 flex items-center justify-between">
                    <div>
                      <p className="text-xs text-slate-400">
                        Qty:{" "}
                        <strong className="text-slate-700">
                          {reservation.quantity}
                        </strong>
                      </p>
                      <p className="mt-1 text-xs text-slate-400">
                        {formatDate(reservation.created_at)}
                      </p>
                    </div>

                    <ArrowRight size={18} className="text-indigo-600" />
                  </div>
                </Link>
              ))}
            </div>
          </>
        )}
      </section>
    </div>
  );
};

export default Reservations;
