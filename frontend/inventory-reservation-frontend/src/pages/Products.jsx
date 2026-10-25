
import { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  Search,
  Plus,
  Package,
  Boxes,
  ArrowRight,
  RefreshCw,
  AlertCircle,
  PackageX,
  Filter,
  CheckCircle2
} from "lucide-react";

import ProductCard from "../components/ProductCard";
import StatCard from "../components/StatCard";

const API_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api";

const Products = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const successMessage = location.state?.success;

  useEffect(() => {
    if (!successMessage) return;

    // Clear navigation state so the message doesn't appear again on refresh.
    navigate(location.pathname, {
      replace: true,
      state: null,
    });
  }, [successMessage, navigate, location.pathname]);
  const [products, setProducts] = useState([]);
  const [search, setSearch] = useState("");
  const [stockFilter, setStockFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchProducts = async (signal) => {
    try {
      setLoading(true);
      setError("");

      const response = await fetch(`${API_URL}/products`, { signal });
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Unable to load products.");
      }

      if (!Array.isArray(result.data)) {
        throw new Error("Invalid product data received.");
      }

      if (!signal?.aborted) {
        setProducts(result.data);
      }
    } catch (err) {
      if (err.name !== "AbortError" && !signal?.aborted) {
        setError(
          err instanceof TypeError
            ? "Cannot connect to the backend. Make sure the server is running."
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
    fetchProducts(controller.signal);
  }, 0);

  return () => {
    clearTimeout(timer);
    controller.abort();
  };
}, []);

  const filteredProducts = useMemo(() => {
    const keyword = search.trim().toLowerCase();

    return products.filter((product) => {
      const matchesSearch =
        product.name.toLowerCase().includes(keyword) ||
        product.sku.toLowerCase().includes(keyword);

      const available = Number(product.available_quantity);

      const matchesStock =
        stockFilter === "all" ||
        (stockFilter === "available" && available > 0) ||
        (stockFilter === "out" && available === 0);

      return matchesSearch && matchesStock;
    });
  }, [products, search, stockFilter]);

  const totalAvailable = products.reduce(
    (sum, product) => sum + Number(product.available_quantity || 0),
    0
  );

  const outOfStock = products.filter(
    (product) => Number(product.available_quantity) === 0
  ).length;

  return (
    <div className="space-y-7">

      {successMessage && (
        <div
          role="status"
          className="flex items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-5 py-4 text-sm font-semibold text-emerald-800"
        >
          <CheckCircle2 size={20} className="shrink-0" />
          {successMessage}
        </div>
      )}
      {/* Page Heading */}
      <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-center">
        <div>
          <div className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.14em] text-indigo-600">
            <Boxes size={15} />
            Inventory Management
          </div>

          <h2 className="font-display text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">
            Products
          </h2>

          <p className="mt-2 text-sm text-slate-500">
            View products, monitor stock, and manage reservations.
          </p>
        </div>

        <Link
          to="/products/new"
          className="inline-flex items-center justify-center gap-2 self-start rounded-xl bg-indigo-600 px-5 py-3 text-sm font-bold text-white shadow-lg shadow-indigo-100 transition hover:bg-indigo-700"
        >
          <Plus size={18} />
          Add Product
        </Link>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        {[
          {
            label: "Total Products",
            value: products.length,
            icon: Package,
            color: "bg-indigo-50 text-indigo-600"
          },
          {
            label: "Available Units",
            value: totalAvailable,
            icon: Boxes,
            color: "bg-emerald-50 text-emerald-600"
          },
          {
            label: "Out of Stock",
            value: outOfStock,
            icon: PackageX,
            color: "bg-rose-50 text-rose-600"
          }
        ].map((stat) => (
          <StatCard
            key={stat.label}
            label={stat.label}
            value={stat.value}
            icon={stat.icon}
            color={stat.color}
            loading={loading}
            error={Boolean(error)}
          />
        ))}
      </div>

      {/* Product Table */}
      <section className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm">
        <div className="flex flex-col justify-between gap-4 border-b border-slate-100 p-5 sm:flex-row sm:items-center sm:p-6">
          <div>
            <h3 className="font-display text-lg font-bold text-slate-900">
              Product Inventory
            </h3>
            <p className="mt-1 text-xs text-slate-500">
              {loading
                ? "Loading inventory..."
                : `${filteredProducts.length} of ${products.length} products`}
            </p>
          </div>

          <button
            type="button"
            onClick={() => fetchProducts()}
            disabled={loading}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 disabled:opacity-50"
          >
            <RefreshCw
              size={16}
              className={loading ? "animate-spin" : ""}
            />
            Refresh
          </button>
        </div>

        {/* Search & Filters */}
        <div className="flex flex-col gap-3 border-b border-slate-100 p-5 sm:flex-row sm:items-center sm:p-6">
          <div className="relative flex-1">
            <Search
              size={18}
              className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search product name or SKU..."
              aria-label="Search products"
              className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-11 pr-4 text-sm outline-none transition focus:border-indigo-400 focus:bg-white focus:ring-4 focus:ring-indigo-50"
            />
          </div>

          <div className="relative">
            <Filter
              size={16}
              className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <select
              value={stockFilter}
              onChange={(event) => setStockFilter(event.target.value)}
              aria-label="Filter by stock"
              className="w-full appearance-none rounded-xl border border-slate-200 bg-white py-3 pl-10 pr-9 text-sm font-semibold text-slate-600 outline-none focus:border-indigo-400 sm:w-44"
            >
              <option value="all">All Stock</option>
              <option value="available">Available</option>
              <option value="out">Out of Stock</option>
            </select>
          </div>
        </div>

        {/* Loading */}
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
          <div className="flex flex-col items-center px-6 py-16 text-center">
            <AlertCircle size={32} className="text-rose-500" />
            <h4 className="mt-4 font-bold text-slate-900">
              Unable to load products
            </h4>
            <p className="mt-2 max-w-sm text-sm text-slate-500">
              {error}
            </p>
            <button
              type="button"
              onClick={() => fetchProducts()}
              className="mt-5 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-bold text-white hover:bg-indigo-700"
            >
              Try Again
            </button>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="flex flex-col items-center px-6 py-16 text-center">
            <PackageX size={36} className="text-slate-300" />
            <h4 className="mt-4 font-bold text-slate-900">
              {products.length === 0
                ? "No products yet"
                : "No matching products"}
            </h4>
            <p className="mt-2 text-sm text-slate-500">
              {products.length === 0
                ? "Start by adding your first product."
                : "Try changing your search or filter."}
            </p>
            {products.length === 0 && (
              <Link
                to="/products/new"
                className="mt-5 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-bold text-white hover:bg-indigo-700"
              >
                Add Product
              </Link>
            )}
          </div>
        ) : (
          <>
            {/* Desktop Table */}
            <div className="hidden overflow-x-auto md:block">
              <table className="w-full text-left">
                <thead className="bg-slate-50 text-xs uppercase tracking-wider text-slate-500">
                  <tr>
                    <th className="px-6 py-4 font-bold">Product</th>
                    <th className="px-6 py-4 font-bold">SKU</th>
                    <th className="px-6 py-4 font-bold">Total Qty</th>
                    <th className="px-6 py-4 font-bold">Available</th>
                    <th className="px-6 py-4 font-bold">Status</th>
                    <th className="px-6 py-4 text-right font-bold">Action</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">
                  {filteredProducts.map((product) => {
                    const available = Number(product.available_quantity);
                    const total = Number(product.total_quantity);

                    return (
                      <tr
                        key={product.id}
                        className="transition hover:bg-slate-50/80"
                      >
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                              <Package size={19} />
                            </span>
                            <span className="font-bold text-slate-800">
                              {product.name}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-slate-500">
                          {product.sku}
                        </td>
                        <td className="px-6 py-4 text-sm font-semibold text-slate-700">
                          {total}
                        </td>
                        <td className="px-6 py-4 text-sm font-bold text-slate-900">
                          {available}
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className={`inline-flex rounded-full px-3 py-1 text-xs font-bold ${available > 0
                              ? "bg-emerald-50 text-emerald-700"
                              : "bg-rose-50 text-rose-700"
                              }`}
                          >
                            {available > 0 ? "In Stock" : "Out of Stock"}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <Link
                            to={`/products/${product.id}`}
                            className="inline-flex items-center gap-1.5 text-sm font-bold text-indigo-600 hover:text-indigo-800"
                          >
                            View Details
                            <ArrowRight size={16} />
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile Product Cards */}
            <div className="divide-y divide-slate-100 md:hidden">
              {filteredProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          </>
        )}
      </section>
    </div>
  );
};

export default Products;
