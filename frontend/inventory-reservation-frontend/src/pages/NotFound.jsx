import { Link } from "react-router-dom";
import { ArrowLeft, Home, SearchX } from "lucide-react";

const NotFound = () => {
  return (
    <div className="flex min-h-[65vh] flex-col items-center justify-center px-4 text-center">
      <div className="flex h-24 w-24 items-center justify-center rounded-3xl bg-indigo-50 text-indigo-600">
        <SearchX size={44} strokeWidth={1.5} />
      </div>

      <p className="mt-7 font-display text-7xl font-extrabold tracking-tight text-indigo-600">
        404
      </p>

      <h2 className="mt-4 font-display text-2xl font-extrabold text-slate-900">
        Page Not Found
      </h2>

      <p className="mt-3 max-w-md text-sm leading-7 text-slate-500">
        The page you're looking for doesn't exist or may have been moved.
        Please check the URL or return to your dashboard.
      </p>

      <div className="mt-7 flex flex-wrap justify-center gap-3">
        <Link
          to="/"
          className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-3 text-sm font-bold text-white transition hover:bg-indigo-700"
        >
          <Home size={18} />
          Back to Dashboard
        </Link>

        <Link
          to="/products"
          className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-bold text-slate-700 transition hover:bg-slate-50"
        >
          <ArrowLeft size={18} />
          View Products
        </Link>
      </div>
    </div>
  );
};

export default NotFound;