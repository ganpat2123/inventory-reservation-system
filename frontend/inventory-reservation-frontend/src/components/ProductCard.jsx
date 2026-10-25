
import { Link } from "react-router-dom";
import { ArrowRight, Package } from "lucide-react";

const ProductCard = ({ product }) => {
  if (!product) return null;

  const available = Number(product.available_quantity || 0);
  const total = Number(product.total_quantity || 0);
  const isAvailable = available > 0;

  return (
    <Link
      to={`/products/${product.id}`}
      className="block p-5 transition-colors hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-indigo-500"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex min-w-0 items-center gap-3">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
            <Package size={19} />
          </span>

          <div className="min-w-0">
            <p className="truncate text-sm font-bold text-slate-900">
              {product.name}
            </p>

            <p className="mt-1 truncate text-xs text-slate-400">
              {product.sku}
            </p>
          </div>
        </div>

        <ArrowRight size={18} className="shrink-0 text-slate-400" />
      </div>

      <div className="mt-4 flex items-center justify-between gap-3">
        <span className="text-xs text-slate-500">
          Available:{" "}
          <strong className="text-slate-800">
            {available.toLocaleString("en-IN")} / {total.toLocaleString("en-IN")}
          </strong>
        </span>

        <span
          className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-bold ${
            isAvailable
              ? "bg-emerald-50 text-emerald-700"
              : "bg-rose-50 text-rose-700"
          }`}
        >
          {isAvailable ? "In Stock" : "Out of Stock"}
        </span>
      </div>
    </Link>
  );
};

export default ProductCard;
