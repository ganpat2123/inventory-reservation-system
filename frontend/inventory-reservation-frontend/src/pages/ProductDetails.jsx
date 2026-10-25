
import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  ArrowRight,
  AlertCircle,
  Boxes,
  CheckCircle2,
  Clock3,
  Hash,
  LoaderCircle,
  Package,
  RefreshCw,
  ShieldCheck,
} from "lucide-react";

const API_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api";

const ProductDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [product, setProduct] = useState(null);
  const [quantity, setQuantity] = useState("1");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [reserveError, setReserveError] = useState("");

  // Keep the same key when retrying the same reservation request.
  const reservationAttempt = useRef(null);
  const submittingRef = useRef(false);

const fetchProduct = useCallback(async (signal) => {
    try {
      setLoading(true);
      setError("");

      const response = await fetch(`${API_URL}/products/${id}`, {
        signal,
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Failed to load product.");
      }

      if (!result.data || typeof result.data !== "object") {
        throw new Error("Invalid product data received.");
      }

      if (!signal?.aborted) {
        setProduct(result.data);
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
    fetchProduct(controller.signal);
  }, 0);

  return () => {
    clearTimeout(timer);
    controller.abort();
  };
}, [fetchProduct]);

  const handleQuantityChange = (event) => {
    if (submittingRef.current) return;

    setQuantity(event.target.value);
    setReserveError("");
    reservationAttempt.current = null;
  };

  const handleReservation = async (event) => {
    event.preventDefault();

    if (submittingRef.current || !product) return;

    const requestedQuantity = Number(quantity);
    const available = Number(product.available_quantity);

    if (
      quantity.trim() === "" ||
      !Number.isSafeInteger(requestedQuantity) ||
      requestedQuantity <= 0
    ) {
      setReserveError("Enter a valid positive whole number.");
      return;
    }

   const isRetry =
  reservationAttempt.current?.productId === id &&
  reservationAttempt.current?.quantity === requestedQuantity;

if (!isRetry && requestedQuantity > available) {
  setReserveError(
    `Only ${available} unit${available === 1 ? "" : "s"} available.`
  );
  return;
}

    // New attempt = new key. Network retry = same key and same body.
    if (
      !reservationAttempt.current ||
      reservationAttempt.current.productId !== id ||
      reservationAttempt.current.quantity !== requestedQuantity
    ) {
      reservationAttempt.current = {
        productId: id,
        quantity: requestedQuantity,
        key: crypto.randomUUID(),
      };
    }

    const attempt = reservationAttempt.current;

    submittingRef.current = true;
    setSubmitting(true);
    setReserveError("");

    try {
      const response = await fetch(`${API_URL}/reservations`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Idempotency-Key": attempt.key,
        },
        body: JSON.stringify({
          product_id: attempt.productId,
          quantity: attempt.quantity,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.message || result.error || "Reservation failed."
        );
      }

      if (!result.data?.id) {
        throw new Error("Server did not return a reservation ID.");
      }

      reservationAttempt.current = null;

      navigate(`/reservations/${result.data.id}`, {
        state: {
          success: "Stock reserved successfully.",
        },
      });
    } catch (err) {
      if (err instanceof TypeError) {
        setReserveError(
          "Network error. You can retry using the same reservation key."
        );
      } else {
        setReserveError(err.message);
        // Definitive API errors require a new attempt.
        reservationAttempt.current = null;
      }

      // Refresh stock after an error, in case the reservation
      // succeeded on the server but the response was lost.
      try {
        const response = await fetch(`${API_URL}/products/${id}`);
        if (response.ok) {
          const result = await response.json();
          if (result.data) setProduct(result.data);
        }
      } catch {
        // Preserve the original reservation error.
      }
    } finally {
      submittingRef.current = false;
      setSubmitting(false);
    }
  };

  const available = Number(product?.available_quantity || 0);
  const total = Number(product?.total_quantity || 0);
  const reserved = Math.max(0, total - available);
  const stockPercentage =
    total > 0 ? Math.min(100, (available / total) * 100) : 0;

  return (
    <div className="mx-auto max-w-6xl space-y-7">
      <Link
        to="/products"
        className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 transition hover:text-indigo-600"
      >
        <ArrowLeft size={18} />
        Back to Products
      </Link>

      {loading ? (
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="h-80 animate-pulse rounded-2xl bg-slate-200/60 lg:col-span-2" />
          <div className="h-80 animate-pulse rounded-2xl bg-slate-200/60" />
        </div>
      ) : error ? (
        <div
          role="alert"
          className="rounded-2xl border border-rose-200 bg-white p-10 text-center shadow-sm"
        >
          <AlertCircle size={34} className="mx-auto text-rose-500" />
          <h2 className="mt-4 text-xl font-bold text-slate-900">
            Unable to load product
          </h2>
          <p className="mt-2 text-sm text-slate-500">{error}</p>
          <button
            type="button"
            onClick={() => fetchProduct()}
            className="mt-5 inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-3 text-sm font-bold text-white"
          >
            <RefreshCw size={17} />
            Try Again
          </button>
        </div>
      ) : product ? (
        <>
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600">
                <Package size={27} />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold uppercase tracking-[0.15em] text-indigo-600">
                  Product Details
                </p>
                <h2 className="mt-1 break-words font-display text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">
                  {product.name}
                </h2>
                <p className="mt-2 flex items-center gap-2 text-sm text-slate-500">
                  <Hash size={15} />
                  {product.sku}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => fetchProduct()}
              disabled={submitting}
              className="inline-flex items-center justify-center gap-2 self-start rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
            >
              <RefreshCw size={16} />
              Refresh Stock
            </button>
          </div>

          <div className="grid items-start gap-6 lg:grid-cols-3">
            <div className="space-y-6 lg:col-span-2">
              <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-7">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-widest text-indigo-600">
                      Inventory Overview
                    </p>
                    <h3 className="mt-1 font-display text-lg font-bold text-slate-900">
                      Stock Availability
                    </h3>
                  </div>
                  <Boxes className="text-indigo-500" size={25} />
                </div>

                <div className="mt-7 grid grid-cols-2 gap-4 sm:grid-cols-3">
                  {[
                    {
                      label: "Total Stock",
                      value: total,
                      color: "text-slate-900",
                    },
                    {
                      label: "Available",
                      value: available,
                      color: "text-emerald-600",
                    },
                    {
                      label: "Reserved",
                      value: reserved,
                      color: "text-amber-600",
                    },
                  ].map((item) => (
                    <div
                      key={item.label}
                      className="rounded-xl border border-slate-100 bg-slate-50 p-4"
                    >
                      <p className="text-xs font-semibold text-slate-500">
                        {item.label}
                      </p>
                      <p
                        className={`mt-2 font-display text-2xl font-extrabold ${item.color}`}
                      >
                        {item.value.toLocaleString("en-IN")}
                      </p>
                    </div>
                  ))}
                </div>

                <div className="mt-7">
                  <div className="mb-3 flex justify-between text-sm">
                    <span className="font-semibold text-slate-600">
                      Available inventory
                    </span>
                    <span className="font-bold text-slate-900">
                      {stockPercentage.toFixed(0)}%
                    </span>
                  </div>
                  <div className="h-3 overflow-hidden rounded-full bg-slate-100">
                    <div
                      className="h-full rounded-full bg-indigo-600 transition-all"
                      style={{ width: `${stockPercentage}%` }}
                    />
                  </div>
                </div>

                <div className="mt-6 flex items-center gap-2">
                  <span
                    className={`h-2.5 w-2.5 rounded-full ${
                      available > 0 ? "bg-emerald-500" : "bg-rose-500"
                    }`}
                  />
                  <span
                    className={`text-sm font-bold ${
                      available > 0 ? "text-emerald-700" : "text-rose-700"
                    }`}
                  >
                    {available > 0 ? "In Stock" : "Out of Stock"}
                  </span>
                </div>
              </section>

              <section className="rounded-2xl border border-indigo-100 bg-indigo-50/70 p-6 sm:p-7">
                <div className="flex items-start gap-3">
                  <ShieldCheck
                    size={23}
                    className="mt-0.5 shrink-0 text-indigo-600"
                  />
                  <div>
                    <h3 className="font-bold text-slate-900">
                      Protected Inventory Reservations
                    </h3>
                    <p className="mt-2 text-sm leading-6 text-slate-600">
                      Pending reservations immediately hold stock.
                      Confirming keeps the stock allocated, while releasing
                      or expiring a pending reservation restores it.
                    </p>
                    <p className="mt-3 flex items-center gap-2 text-xs font-semibold text-indigo-700">
                      <Clock3 size={15} />
                      Reservations expire after 10 minutes if not confirmed.
                    </p>
                  </div>
                </div>
              </section>
            </div>

            <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-7">
              <div className="mb-6">
                <p className="text-xs font-bold uppercase tracking-widest text-indigo-600">
                  Create Reservation
                </p>
                <h3 className="mt-1 font-display text-xl font-extrabold text-slate-900">
                  Reserve Stock
                </h3>
                <p className="mt-2 text-sm leading-6 text-slate-500">
                  Choose a quantity to hold for 10 minutes.
                </p>
              </div>

              {reserveError && (
                <div
                  role="alert"
                  className="mb-5 flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700"
                >
                  <AlertCircle size={18} className="mt-0.5 shrink-0" />
                  <span>{reserveError}</span>
                </div>
              )}

              <form onSubmit={handleReservation} className="space-y-5">
                <div>
                  <label
                    htmlFor="reserve-quantity"
                    className="mb-2 block text-sm font-bold text-slate-700"
                  >
                    Quantity to Reserve
                  </label>
                  <input
                    id="reserve-quantity"
                    type="number"
                    min="1"
                    step="1"
                    value={quantity}
                    onChange={handleQuantityChange}
                    disabled={submitting || available === 0}
                    className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-50 disabled:bg-slate-50"
                  />
                  <p className="mt-2 text-xs text-slate-500">
                    Available now:{" "}
                    <span className="font-bold text-slate-800">
                      {available.toLocaleString("en-IN")} units
                    </span>
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={submitting || available === 0}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 py-3.5 text-sm font-bold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {submitting ? (
                    <>
                      <LoaderCircle size={19} className="animate-spin" />
                      Reserving...
                    </>
                  ) : (
                    <>
                      <Boxes size={19} />
                      Reserve Stock
                      <ArrowRight size={17} />
                    </>
                  )}
                </button>
              </form>

              <div className="mt-6 border-t border-slate-100 pt-5">
                <div className="flex items-start gap-2 text-xs leading-5 text-slate-500">
                  <CheckCircle2
                    size={17}
                    className="shrink-0 text-emerald-500"
                  />
                  Reservations use an idempotency key to prevent duplicate
                  stock deductions on retries.
                </div>
              </div>
            </section>
          </div>
        </>
      ) : null}
    </div>
  );
};

export default ProductDetails;
