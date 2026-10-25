
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  ArrowRight,
  PackagePlus,
  Package,
  Hash,
  Boxes,
  AlertCircle,
  CheckCircle2,
  Info,
  LoaderCircle,
  ShieldCheck
} from "lucide-react";

const API_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api";

const AddProduct = () => {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: "",
    sku: "",
    total_quantity: ""
  });

  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleChange = (event) => {
    const { name, value } = event.target;

    setForm((prev) => ({
      ...prev,
      [name]: value
    }));

    setErrors((prev) => ({
      ...prev,
      [name]: ""
    }));

    setServerError("");
  };

  const validate = () => {
    const newErrors = {};

    if (!form.name.trim()) {
      newErrors.name = "Product name is required.";
    }

    if (!form.sku.trim()) {
      newErrors.sku = "SKU is required.";
    }

    const quantity = Number(form.total_quantity);

    if (form.total_quantity.trim() === "") {
      newErrors.total_quantity = "Total quantity is required.";
    } else if (
      !Number.isSafeInteger(quantity) ||
      quantity <= 0
    ) {
      newErrors.total_quantity =
        "Enter a valid positive whole number.";
    }

    setErrors(newErrors);

    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (submitting || !validate()) return;

    setSubmitting(true);
    setServerError("");

    try {
      const response = await fetch(`${API_URL}/products`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          name: form.name.trim(),
          sku: form.sku.trim(),
          total_quantity: Number(form.total_quantity)
        })
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.message ||
          result.error ||
          "Failed to create product."
        );
      }

      navigate("/products", {
        state: {
          success: "Product created successfully."
        }
      });
    } catch (error) {
      setServerError(
        error instanceof TypeError
          ? "Unable to connect to the server. Please check your backend."
          : error.message
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-5xl space-y-7">
      {/* Back Navigation */}
      <Link
        to="/products"
        className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 transition hover:text-indigo-600"
      >
        <ArrowLeft size={18} />
        Back to Products
      </Link>

      {/* Page Heading */}
      <div className="flex items-start gap-4">
        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600">
          <PackagePlus size={28} />
        </div>

        <div>
          <p className="text-xs font-bold uppercase tracking-[0.15em] text-indigo-600">
            Inventory Management
          </p>
          <h2 className="mt-1 font-display text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">
            Add New Product
          </h2>
          <p className="mt-2 text-sm text-slate-500">
            Create a product and set its initial inventory quantity.
          </p>
        </div>
      </div>

      <div className="grid items-start gap-6 lg:grid-cols-3">
        {/* Product Form */}
        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm lg:col-span-2">
          <div className="border-b border-slate-100 px-6 py-5">
            <h3 className="font-display text-lg font-bold text-slate-900">
              Product Information
            </h3>
            <p className="mt-1 text-xs text-slate-500">
              Fields marked with * are required.
            </p>
          </div>

          <form onSubmit={handleSubmit} noValidate className="space-y-6 p-6">
            {/* Server Error */}
            {serverError && (
              <div
                role="alert"
                className="flex items-start gap-3 rounded-xl border border-rose-200 bg-rose-50 p-4"
              >
                <AlertCircle
                  size={20}
                  className="mt-0.5 shrink-0 text-rose-600"
                />
                <div>
                  <p className="text-sm font-bold text-rose-800">
                    Unable to create product
                  </p>
                  <p className="mt-1 text-sm text-rose-700">
                    {serverError}
                  </p>
                </div>
              </div>
            )}

            {/* Name */}
            <div>
              <label
                htmlFor="product-name"
                className="mb-2 flex items-center gap-2 text-sm font-bold text-slate-700"
              >
                <Package size={17} className="text-slate-400" />
                Product Name *
              </label>

              <input
                id="product-name"
                type="text"
                name="name"
                value={form.name}
                onChange={handleChange}
                maxLength={150}
                placeholder="e.g. Samsung Galaxy S25"
                aria-invalid={Boolean(errors.name)}
                className={`w-full rounded-xl border bg-white px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:ring-4 ${
                  errors.name
                    ? "border-rose-400 focus:ring-rose-50"
                    : "border-slate-200 focus:border-indigo-500 focus:ring-indigo-50"
                }`}
              />

              {errors.name && (
                <p className="mt-2 text-xs font-medium text-rose-600">
                  {errors.name}
                </p>
              )}
            </div>

            {/* SKU */}
            <div>
              <label
                htmlFor="product-sku"
                className="mb-2 flex items-center gap-2 text-sm font-bold text-slate-700"
              >
                <Hash size={17} className="text-slate-400" />
                SKU (Stock Keeping Unit) *
              </label>

              <input
                id="product-sku"
                type="text"
                name="sku"
                value={form.sku}
                onChange={handleChange}
                maxLength={100}
                placeholder="e.g. SAM-S25-002"
                aria-invalid={Boolean(errors.sku)}
                className={`w-full rounded-xl border bg-white px-4 py-3 text-sm uppercase text-slate-900 outline-none transition placeholder:normal-case placeholder:text-slate-400 focus:ring-4 ${
                  errors.sku
                    ? "border-rose-400 focus:ring-rose-50"
                    : "border-slate-200 focus:border-indigo-500 focus:ring-indigo-50"
                }`}
              />

              <p className="mt-2 text-xs text-slate-400">
                Every product must have a unique SKU.
              </p>

              {errors.sku && (
                <p className="mt-2 text-xs font-medium text-rose-600">
                  {errors.sku}
                </p>
              )}
            </div>

            {/* Quantity */}
            <div>
              <label
                htmlFor="product-quantity"
                className="mb-2 flex items-center gap-2 text-sm font-bold text-slate-700"
              >
                <Boxes size={17} className="text-slate-400" />
                Initial Stock Quantity *
              </label>

              <input
                id="product-quantity"
                type="number"
                name="total_quantity"
                value={form.total_quantity}
                onChange={handleChange}
                min="1"
                step="1"
                placeholder="e.g. 100"
                aria-invalid={Boolean(errors.total_quantity)}
                className={`w-full rounded-xl border bg-white px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:ring-4 ${
                  errors.total_quantity
                    ? "border-rose-400 focus:ring-rose-50"
                    : "border-slate-200 focus:border-indigo-500 focus:ring-indigo-50"
                }`}
              />

              <p className="mt-2 text-xs text-slate-400">
                Available quantity will initially equal total quantity.
              </p>

              {errors.total_quantity && (
                <p className="mt-2 text-xs font-medium text-rose-600">
                  {errors.total_quantity}
                </p>
              )}
            </div>

            <div className="border-t border-slate-100 pt-6">
              <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                <Link
                  to="/products"
                  className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-bold text-slate-700 transition hover:bg-slate-50"
                >
                  Cancel
                </Link>

                <button
                  type="submit"
                  disabled={submitting}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-6 py-3 text-sm font-bold text-white shadow-lg shadow-indigo-100 transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {submitting ? (
                    <>
                      <LoaderCircle size={18} className="animate-spin" />
                      Creating...
                    </>
                  ) : (
                    <>
                      <PlusIcon />
                      Create Product
                      <ArrowRight size={17} />
                    </>
                  )}
                </button>
              </div>
            </div>
          </form>
        </section>

        {/* Info Sidebar */}
        <div className="space-y-5">
          <div className="rounded-2xl border border-indigo-100 bg-indigo-50/70 p-6">
            <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-white text-indigo-600">
              <Info size={22} />
            </div>

            <h3 className="font-display text-base font-bold text-slate-900">
              How Inventory Works
            </h3>

            <p className="mt-3 text-sm leading-6 text-slate-600">
              When you create a product, its available stock is initialized
              to the total quantity you enter.
            </p>

            <p className="mt-3 text-sm leading-6 text-slate-600">
              Creating a pending reservation immediately reduces available
              stock to prevent overselling.
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
              <ShieldCheck size={22} />
            </div>

            <h3 className="font-display text-base font-bold text-slate-900">
              Built-in Protection
            </h3>

            <div className="mt-4 space-y-3">
              {[
                "Unique product SKU validation",
                "Positive inventory quantities",
                "Concurrency-safe reservations"
              ].map((item) => (
                <div key={item} className="flex items-start gap-2.5">
                  <CheckCircle2
                    size={17}
                    className="mt-0.5 shrink-0 text-emerald-500"
                  />
                  <p className="text-xs leading-5 text-slate-600">
                    {item}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Small inline icon — no separate file needed
const PlusIcon = () => <PackagePlus size={18} />;

export default AddProduct;
