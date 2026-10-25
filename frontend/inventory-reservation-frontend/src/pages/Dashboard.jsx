
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Package,
  Boxes,
  Clock3,
  ShieldCheck,
  ArrowRight,
  Plus,
  RefreshCw,
  AlertCircle,
  ClipboardList,
  Activity,
  CalendarClock
} from "lucide-react";

import StatCard from "../components/StatCard";

import StatusBadge from "../components/StatusBadge";

const CURRENT_TIME = Date.now();

const API_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api";

const formatDate = (date) => {
  if (!date) return "—";

  const value = new Date(date);

  if (Number.isNaN(value.getTime())) return "—";

  return value.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  });
};

const Dashboard = () => {
  const [products, setProducts] = useState([]);
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchDashboard = async (signal) => {
    try {
      setLoading(true);
      setError("");

      const [productResponse, reservationResponse] = await Promise.all([
        fetch(`${API_URL}/products`, { signal }),
        fetch(`${API_URL}/reservations`, { signal })
      ]);

      if (!productResponse.ok || !reservationResponse.ok) {
        throw new Error("Unable to load dashboard data.");
      }

      const [productResult, reservationResult] = await Promise.all([
        productResponse.json(),
        reservationResponse.json()
      ]);

      if (
        !Array.isArray(productResult.data) ||
        !Array.isArray(reservationResult.data)
      ) {
        throw new Error("Unexpected response received from the server.");
      }

      setProducts(productResult.data);
      setReservations(reservationResult.data);
    } catch (err) {
      if (err.name !== "AbortError") {
        setError(
          err instanceof TypeError
            ? "Cannot connect to the backend. Please check that the server is running."
            : err.message
        );
      }
    } finally {
      if (!signal?.aborted) {
        setLoading(false);
      }
    }
  };

 useEffect(() => {
  const controller = new AbortController();

  const timer = setTimeout(() => {
    fetchDashboard(controller.signal);
  }, 0);

  return () => {
    clearTimeout(timer);
    controller.abort();
  };
}, []);

  const availableStock = products.reduce(
    (total, product) => total + Number(product.available_quantity || 0),
    0
  );

const pendingCount = reservations.filter(
  (reservation) =>
    reservation.status === "PENDING" &&
    new Date(reservation.expires_at).getTime() > CURRENT_TIME
).length;

  const confirmedCount = reservations.filter(
    (reservation) => reservation.status === "CONFIRMED"
  ).length;

  const stats = [
    {
      label: "Total Products",
      value: products.length,
      icon: Package,
      color: "bg-indigo-50 text-indigo-600",
      description: "Products in inventory"
    },
    {
      label: "Available Stock",
      value: availableStock,
      icon: Boxes,
      color: "bg-emerald-50 text-emerald-600",
      description: "Units available to reserve"
    },
    {
      label: "Pending Reservations",
      value: pendingCount,
      icon: Clock3,
      color: "bg-amber-50 text-amber-600",
      description: "Active pending reservations"
    },
    {
      label: "Confirmed",
      value: confirmedCount,
      icon: ShieldCheck,
      color: "bg-sky-50 text-sky-600",
      description: "Confirmed reservations"
    }
  ];

  return (
    <div className="space-y-7">
      {/* Welcome Banner */}
      <section className="relative overflow-hidden rounded-[26px] bg-[#0F172A] p-7 text-white shadow-xl shadow-slate-200/60 sm:p-9">
        <div className="pointer-events-none absolute -right-12 -top-24 h-72 w-72 rounded-full bg-indigo-500/20 blur-3xl" />
        <div className="pointer-events-none absolute bottom-0 right-24 h-40 w-40 rounded-full bg-sky-400/10 blur-3xl" />

        <div className="relative flex flex-col justify-between gap-6 lg:flex-row lg:items-center">
          <div>
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-xs font-medium text-indigo-100">
              <Activity size={14} />
              Inventory overview
            </div>

            <h2 className="font-display text-2xl font-extrabold tracking-tight sm:text-3xl">
              Welcome to StockFlow
            </h2>

            <p className="mt-3 max-w-xl text-sm leading-6 text-slate-300">
              Track your inventory, manage products and monitor reservations
              from one organized workspace.
            </p>
          </div>

          <Link
            to="/products/new"
            className="inline-flex shrink-0 items-center justify-center gap-2 self-start rounded-xl bg-indigo-600 px-5 py-3 text-sm font-bold text-white shadow-lg shadow-indigo-950/20 transition hover:bg-indigo-500"
          >
            <Plus size={18} />
            Add New Product
          </Link>
        </div>
      </section>

      {/* Page Heading */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.15em] text-indigo-600">
            Performance overview
          </p>
          <h3 className="mt-1 font-display text-xl font-extrabold tracking-tight text-slate-900 sm:text-2xl">
            Inventory at a glance
          </h3>
        </div>

        <button
          type="button"
          onClick={() => fetchDashboard()}
          disabled={loading}
          className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 disabled:opacity-50"
        >
          <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
          Refresh
        </button>
      </div>

      {/* Error */}
      {error && (
        <div
          role="alert"
          className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700"
        >
          <div className="flex items-center gap-2">
            <AlertCircle size={19} />
            {error}
          </div>
          <button
            type="button"
            onClick={() => fetchDashboard()}
            className="font-bold underline"
          >
            Try again
          </button>
        </div>
      )}
      
     {/* Statistics */}
<div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
  {stats.map((stat) => (
    <StatCard
      key={stat.label}
      label={stat.label}
      value={stat.value}
      icon={stat.icon}
      color={stat.color}
      description={stat.description}
      loading={loading}
      error={Boolean(error)}
    />
  ))}
</div>

      {/* Data Sections */}
      <div className="grid gap-6 xl:grid-cols-5">
        {/* Product Inventory */}
        <section className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm xl:col-span-3">
          <div className="flex items-center justify-between gap-3 border-b border-slate-100 p-5 sm:p-6">
            <div>
              <h3 className="font-display text-lg font-bold text-slate-900">
                Product Inventory
              </h3>
              <p className="mt-1 text-xs text-slate-500">
                Your latest inventory items
              </p>
            </div>

            <Link
              to="/products"
              className="inline-flex items-center gap-1 text-sm font-bold text-indigo-600 hover:text-indigo-700"
            >
              View all <ArrowRight size={16} />
            </Link>
          </div>

          <div className="divide-y divide-slate-100">
            {loading ? (
              <div className="space-y-4 p-6">
                {[1, 2, 3].map((item) => (
                  <div
                    key={item}
                    className="h-14 animate-pulse rounded-xl bg-slate-100"
                  />
                ))}
              </div>
            ) : error ? (
              <div className="p-8 text-center text-sm text-slate-500">
                Products are unavailable.
              </div>
            ) : products.length === 0 ? (
              <div className="flex flex-col items-center py-14 text-center">
                <Package size={30} className="text-slate-300" />
                <p className="mt-3 text-sm font-semibold text-slate-700">
                  No products yet
                </p>
                <Link
                  to="/products/new"
                  className="mt-2 text-sm font-bold text-indigo-600"
                >
                  Create your first product
                </Link>
              </div>
            ) : (
              products.slice(0, 5).map((product) => (
                <Link
                  key={product.id}
                  to={`/products/${product.id}`}
                  className="flex items-center justify-between gap-3 px-5 py-4 transition hover:bg-slate-50 sm:px-6"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                      <Package size={19} />
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-bold text-slate-800">
                        {product.name}
                      </p>
                      <p className="mt-0.5 text-xs text-slate-400">
                        {product.sku}
                      </p>
                    </div>
                  </div>

                  <div className="text-right">
                    <p className="text-sm font-bold text-slate-900">
                      {product.available_quantity} available
                    </p>
                    <p className="text-xs text-slate-400">
                      of {product.total_quantity} total
                    </p>
                  </div>
                </Link>
              ))
            )}
          </div>
        </section>

        {/* Recent Reservations */}
        <section className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm xl:col-span-2">
          <div className="flex items-center justify-between gap-3 border-b border-slate-100 p-5 sm:p-6">
            <div>
              <h3 className="font-display text-lg font-bold text-slate-900">
                Recent Reservations
              </h3>
              <p className="mt-1 text-xs text-slate-500">
                Latest reservation activity
              </p>
            </div>

            <Link
              to="/reservations"
              className="text-sm font-bold text-indigo-600 hover:text-indigo-700"
            >
              View all
            </Link>
          </div>

          <div className="divide-y divide-slate-100">
            {loading ? (
              <div className="space-y-4 p-6">
                {[1, 2, 3].map((item) => (
                  <div
                    key={item}
                    className="h-16 animate-pulse rounded-xl bg-slate-100"
                  />
                ))}
              </div>
            ) : error ? (
              <div className="p-8 text-center text-sm text-slate-500">
                Reservations are unavailable.
              </div>
            ) : reservations.length === 0 ? (
              <div className="flex flex-col items-center py-14 text-center">
                <ClipboardList size={30} className="text-slate-300" />
                <p className="mt-3 text-sm font-semibold text-slate-700">
                  No reservations yet
                </p>
                <p className="mt-1 text-xs text-slate-400">
                  New reservations will appear here.
                </p>
              </div>
            ) : (
              reservations.slice(0, 5).map((reservation) => (
                <Link
                  key={reservation.id}
                  to={`/reservations/${reservation.id}`}
                  className="block px-5 py-4 transition hover:bg-slate-50 sm:px-6"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-bold text-slate-800">
                        {reservation.product_name || "Product"}
                      </p>
                      <p className="mt-1 text-xs text-slate-400">
                        Qty: {reservation.quantity} ·{" "}
                        {formatDate(reservation.created_at)}
                      </p>
                    </div>

                    <StatusBadge
                      status={reservation.status}
                      showIcon={false}
                    />
                  </div>
                </Link>
              ))
            )}
          </div>
        </section>
      </div>

      {/* Quick Actions */}
      <section className="grid gap-4 md:grid-cols-2">
        <Link
          to="/products"
          className="group flex items-center justify-between rounded-2xl border border-indigo-100 bg-indigo-50/70 p-5 transition hover:bg-indigo-100/60"
        >
          <div className="flex items-center gap-4">
            <span className="rounded-xl bg-white p-3 text-indigo-600">
              <Package size={22} />
            </span>
            <div>
              <p className="font-bold text-slate-900">Manage Products</p>
              <p className="mt-1 text-xs text-slate-500">
                Browse inventory and reserve stock
              </p>
            </div>
          </div>
          <ArrowRight
            size={20}
            className="text-indigo-500 transition group-hover:translate-x-1"
          />
        </Link>

        <Link
          to="/reservations"
          className="group flex items-center justify-between rounded-2xl border border-emerald-100 bg-emerald-50/70 p-5 transition hover:bg-emerald-100/60"
        >
          <div className="flex items-center gap-4">
            <span className="rounded-xl bg-white p-3 text-emerald-600">
              <CalendarClock size={22} />
            </span>
            <div>
              <p className="font-bold text-slate-900">Reservations</p>
              <p className="mt-1 text-xs text-slate-500">
                Track, confirm, or release reservations
              </p>
            </div>
          </div>
          <ArrowRight
            size={20}
            className="text-emerald-500 transition group-hover:translate-x-1"
          />
        </Link>
      </section>
    </div>
  );
};

export default Dashboard;