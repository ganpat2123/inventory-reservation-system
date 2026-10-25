
import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useLocation, useParams } from "react-router-dom";
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  ClipboardList,
  Clock3,
  Copy,
  LoaderCircle,
  Package,
  RefreshCw,
  RotateCcw,
  ShieldCheck,
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

const formatCountdown = (milliseconds) => {
  const totalSeconds = Math.max(0, Math.ceil(milliseconds / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
};

const ReservationDetails = () => {
  const { id } = useParams();
  const location = useLocation();

  const [reservation, setReservation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState("");
  const [error, setError] = useState("");
  const [actionError, setActionError] = useState("");
  const [success, setSuccess] = useState(location.state?.success || "");
 const [now, setNow] = useState(() => Date.now());
  const [copied, setCopied] = useState(false);

  const actionLock = useRef(false);
  const expiryRefreshRef = useRef(false);

  const loadReservation = useCallback(async (signal) => {
    try {
      setLoading(true);
      setError("");

      const response = await fetch(`${API_URL}/reservations/${id}`, {
        signal
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.message || result.error || "Unable to load reservation."
        );
      }

      if (!result.data || typeof result.data !== "object") {
        throw new Error("Invalid reservation data received.");
      }

      if (!signal?.aborted) {
        setReservation(result.data);
        setNow(Date.now());
      }
    } catch (err) {
      if (err.name !== "AbortError" && !signal?.aborted) {
        setError(
          err instanceof TypeError
            ? "Cannot connect to the backend server."
            : err.message
        );
      }
    } finally {
      if (!signal?.aborted) {
        setLoading(false);
      }
    }
  }, [id]);

 useEffect(() => {
  const controller = new AbortController();

  const timer = setTimeout(() => {
    loadReservation(controller.signal);
  }, 0);

  return () => {
    clearTimeout(timer);
    controller.abort();
  };
}, [loadReservation]);

  useEffect(() => {
    if (reservation?.status !== "PENDING") return;

    const interval = setInterval(() => {
      setNow(Date.now());
    }, 1000);

    return () => clearInterval(interval);
  }, [reservation?.status]);

  const expiryTime = reservation?.expires_at
    ? new Date(reservation.expires_at).getTime()
    : 0;

  const timeRemaining = Number.isFinite(expiryTime)
    ? expiryTime - now
    : 0;

  const isPending = reservation?.status === "PENDING";
  const isExpiredByTime = isPending && timeRemaining <= 0;
  const canAct = isPending && !isExpiredByTime;

  useEffect(() => {
    if (!reservation || !isExpiredByTime) {
      expiryRefreshRef.current = false;
      return;
    }

    if (expiryRefreshRef.current) return;

    expiryRefreshRef.current = true;

    const timeout = setTimeout(() => {
      loadReservation();
    }, 35000);

    return () => clearTimeout(timeout);
  }, [reservation, isExpiredByTime, loadReservation]);

  const handleAction = async (action) => {
    if (!canAct || actionLock.current) return;

    actionLock.current = true;
    setActionLoading(action);
    setActionError("");
    setSuccess("");

    try {
      const response = await fetch(
        `${API_URL}/reservations/${id}/${action}`,
        { method: "POST" }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.message ||
          result.error ||
          `Unable to ${action} reservation.`
        );
      }

      if (!result.data?.id || !result.data?.status) {
        throw new Error(
          "Unable to verify the updated reservation status. Please refresh."
        );
      }

      setReservation(result.data);
      setNow(Date.now());

      if (action === "confirm" && result.data.status === "CONFIRMED") {
        setSuccess("Reservation confirmed successfully.");
      } else if (
        action === "release" &&
        result.data.status === "RELEASED"
      ) {
        setSuccess("Reservation released. Available stock has been restored.");
      } else {
        setSuccess("");
        setActionError(
          `Reservation status is ${result.data.status}. Please review the latest details.`
        );
      }
    } catch (err) {
      setActionError(
        err instanceof TypeError
          ? "Network error. Refresh the reservation to check its latest status before trying again."
          : err.message
      );
    } finally {
      // Always fetch the latest status after an action.
      try {
        const response = await fetch(`${API_URL}/reservations/${id}`);
        if (response.ok) {
          const result = await response.json();
          if (result.data) {
            setReservation(result.data);
            setNow(Date.now());
          }
        }
      } catch {
        // Keep the original action result or error visible.
      }

      actionLock.current = false;
      setActionLoading("");
    }
  };

  const copyReservationId = async () => {
    try {
      await navigator.clipboard.writeText(id);
      setCopied(true);
    } catch {
      setCopied(false);
    }
  };

  const detailRows = reservation
    ? [
      ["Reservation ID", reservation.id],
      ["Product", reservation.product_name || "—"],
      ["SKU", reservation.sku || "—"],
      ["Quantity", reservation.quantity],
      ["Created At", formatDate(reservation.created_at)],
      ["Expires At", formatDate(reservation.expires_at)]
    ]
    : [];

  return (
    <div className="mx-auto max-w-6xl space-y-7">
      <Link
        to="/reservations"
        className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 transition hover:text-indigo-600"
      >
        <ArrowLeft size={18} />
        Back to Reservations
      </Link>

      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600">
            <ClipboardList size={27} />
          </div>

          <div>
            <p className="text-xs font-bold uppercase tracking-[0.15em] text-indigo-600">
              Inventory Reservations
            </p>
            <h2 className="mt-1 font-display text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">
              Reservation Details
            </h2>
            <p className="mt-2 text-sm text-slate-500">
              View reservation information and manage its status.
            </p>
          </div>
        </div>

        <button
          type="button"
          disabled={loading || Boolean(actionLoading)}
          onClick={() => loadReservation()}
          className="inline-flex items-center justify-center gap-2 self-start rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
        >
          <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
          Refresh
        </button>
      </div>

      {success && (
        <div
          role="status"
          className="flex items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-medium text-emerald-800"
        >
          <CheckCircle2 size={20} className="shrink-0" />
          {success}
        </div>
      )}

      {actionError && (
        <div
          role="alert"
          className="flex items-start gap-3 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700"
        >
          <AlertCircle size={20} className="shrink-0" />
          {actionError}
        </div>
      )}

      {loading ? (
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="h-96 animate-pulse rounded-2xl bg-slate-200/60 lg:col-span-2" />
          <div className="h-80 animate-pulse rounded-2xl bg-slate-200/60" />
        </div>
      ) : error ? (
        <div
          role="alert"
          className="rounded-2xl border border-rose-200 bg-white p-10 text-center shadow-sm"
        >
          <AlertCircle size={36} className="mx-auto text-rose-500" />
          <h3 className="mt-4 text-xl font-bold text-slate-900">
            Unable to load reservation
          </h3>
          <p className="mt-2 text-sm text-slate-500">{error}</p>
          <button
            type="button"
            onClick={() => loadReservation()}
            className="mt-5 rounded-xl bg-indigo-600 px-5 py-3 text-sm font-bold text-white"
          >
            Try Again
          </button>
        </div>
      ) : reservation ? (
        <div className="grid items-start gap-6 lg:grid-cols-3">
          <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm lg:col-span-2">
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 p-6">
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-indigo-600">
                  Reservation Record
                </p>
                <h3 className="mt-1 font-display text-lg font-bold text-slate-900">
                  Reservation Information
                </h3>
              </div>

              <StatusBadge status={reservation.status} size="lg" />
            </div>

            <div className="p-6">
              <div className="mb-6 flex items-center gap-3 rounded-xl bg-slate-50 p-4">
                <span className="rounded-xl bg-indigo-50 p-3 text-indigo-600">
                  <Package size={23} />
                </span>
                <div className="min-w-0">
                  <p className="text-xs text-slate-500">Reserved Product</p>
                  <p className="mt-1 break-words text-base font-bold text-slate-900">
                    {reservation.product_name || "Product"}
                  </p>
                </div>
              </div>

              <div className="divide-y divide-slate-100">
                {detailRows.map(([label, value]) => (
                  <div
                    key={label}
                    className="flex flex-col gap-1.5 py-4 sm:flex-row sm:items-center sm:justify-between sm:gap-4"
                  >
                    <span className="text-sm font-medium text-slate-500">
                      {label}
                    </span>
                    <span className="flex min-w-0 items-center gap-2 break-all text-sm font-bold text-slate-900 sm:text-right">
                      {value}
                      {label === "Reservation ID" && (
                        <button
                          type="button"
                          onClick={copyReservationId}
                          aria-label="Copy reservation ID"
                          title={copied ? "Copied!" : "Copy reservation ID"}
                          className="shrink-0 rounded-lg p-1.5 text-indigo-600 hover:bg-indigo-50"
                        >
                          <Copy size={15} />
                        </button>
                      )}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </section>

          <div className="space-y-6">
            <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <h3 className="font-display text-lg font-bold text-slate-900">
                Reservation Status
              </h3>

              <div className="mt-5 flex items-center gap-3">
                <span
                  className={`rounded-xl p-3 ${canAct
                      ? "bg-amber-50 text-amber-600"
                      : reservation.status === "CONFIRMED"
                        ? "bg-emerald-50 text-emerald-600"
                        : "bg-slate-100 text-slate-600"
                    }`}
                >
                  {reservation.status === "CONFIRMED" ? (
                    <ShieldCheck size={23} />
                  ) : canAct ? (
                    <Clock3 size={23} />
                  ) : (
                    <XCircle size={23} />
                  )}
                </span>

                <div>
                  <p className="text-xs text-slate-500">Current status</p>
                  <p className="font-bold text-slate-900">
                    {isExpiredByTime
                      ? "Time Limit Reached"
                      : reservation.status}
                  </p>
                </div>
              </div>

              {isPending && (
                <div className="mt-5 rounded-xl bg-slate-50 p-4">
                  <p className="text-xs font-semibold text-slate-500">
                    {isExpiredByTime
                      ? "Reservation time has ended"
                      : "Time remaining"}
                  </p>
                  <p
                    className={`mt-2 font-display text-3xl font-extrabold ${isExpiredByTime
                        ? "text-rose-600"
                        : "text-amber-600"
                      }`}
                  >
                    {formatCountdown(timeRemaining)}
                  </p>
                  {isExpiredByTime && (
                    <p className="mt-2 text-xs leading-5 text-rose-600">
                      Actions are disabled. Refresh to see the latest
                      expiration status from the server.
                    </p>
                  )}
                </div>
              )}

              {canAct && (
                <div className="mt-6 space-y-3">
                  <button
                    type="button"
                    onClick={() => handleAction("confirm")}
                    disabled={Boolean(actionLoading)}
                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 py-3 text-sm font-bold text-white transition hover:bg-indigo-700 disabled:opacity-50"
                  >
                    {actionLoading === "confirm" ? (
                      <LoaderCircle size={18} className="animate-spin" />
                    ) : (
                      <CheckCircle2 size={18} />
                    )}
                    Confirm Reservation
                  </button>

                  <button
                    type="button"
                    onClick={() => handleAction("release")}
                    disabled={Boolean(actionLoading)}
                    className="flex w-full items-center justify-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-5 py-3 text-sm font-bold text-rose-700 transition hover:bg-rose-100 disabled:opacity-50"
                  >
                    {actionLoading === "release" ? (
                      <LoaderCircle size={18} className="animate-spin" />
                    ) : (
                      <RotateCcw size={18} />
                    )}
                    Release Reservation
                  </button>
                </div>
              )}

              {reservation.status === "CONFIRMED" && (
                <p className="mt-5 text-sm leading-6 text-emerald-700">
                  This reservation is confirmed. The reserved stock
                  remains allocated.
                </p>
              )}

              {reservation.status === "RELEASED" && (
                <p className="mt-5 text-sm leading-6 text-sky-700">
                  This reservation was released, and its stock was
                  returned to inventory.
                </p>
              )}

              {reservation.status === "EXPIRED" && (
                <p className="mt-5 text-sm leading-6 text-rose-700">
                  This reservation expired without confirmation. Its
                  stock has been returned to inventory.
                </p>
              )}
            </section>

            <Link
              to="/reservations"
              className="flex items-center justify-between rounded-2xl border border-indigo-100 bg-indigo-50 p-5 text-sm font-bold text-indigo-700 transition hover:bg-indigo-100"
            >
              View All Reservations
              <ArrowRight size={19} />
            </Link>
          </div>
        </div>
      ) : null}
    </div>
  );
};

export default ReservationDetails;
