
import { useLocation } from "react-router-dom";
import {
  Menu,
  CalendarDays,
  BookOpen,
  ExternalLink,
  ChevronRight,
  Boxes
} from "lucide-react";

const CURRENT_DATE = new Date().toLocaleDateString("en-IN", {
  day: "numeric",
  month: "short",
  year: "numeric"
});

const pageTitles = {
  "/": "Dashboard",
  "/products": "Products",
  "/products/new": "Add Product",
  "/reservations": "Reservations"
};

const Header = ({ onMenuClick }) => {
  const location = useLocation();

  const getPageTitle = () => {
    if (pageTitles[location.pathname]) {
      return pageTitles[location.pathname];
    }

    if (location.pathname.startsWith("/products/")) {
      return "Product Details";
    }

    if (location.pathname.startsWith("/reservations/")) {
      return "Reservation Details";
    }

    return "Inventory Management";
  };

  return (
    <header className="sticky top-0 z-30 flex min-h-20 items-center justify-between gap-4 border-b border-slate-200/80 bg-white/95 px-4 py-3 backdrop-blur-xl sm:px-6 lg:px-8">
      <div className="flex min-w-0 items-center gap-4">
        {/* Mobile Menu */}
        <button
          type="button"
          onClick={onMenuClick}
          aria-label="Open navigation menu"
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-200 text-slate-700 transition hover:bg-slate-50 lg:hidden"
        >
          <Menu size={21} />
        </button>

        {/* Page Heading */}
        <div className="min-w-0">
          <div className="mb-1 flex items-center gap-1 text-xs font-medium text-slate-400">
            <span className="hidden sm:inline">Workspace</span>
            <ChevronRight size={13} className="hidden sm:inline" />
            <span className="truncate">{getPageTitle()}</span>
          </div>

          <h1 className="truncate font-display text-lg font-extrabold tracking-tight text-slate-900 sm:text-xl">
            {getPageTitle()}
          </h1>
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-3">
        {/* Current Date */}
        <div className="hidden items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-xs font-semibold text-slate-600 md:flex">
          <CalendarDays size={17} className="text-indigo-500" />
          {CURRENT_DATE}
        </div>

        {/* Swagger Documentation */}
        <a
          href="http://localhost:5000/api-docs"
          target="_blank"
          rel="noopener noreferrer"
          className="hidden items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-bold text-slate-700 transition hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-600 sm:inline-flex"
        >
          <BookOpen size={17} />
          API Docs
          <ExternalLink size={14} />
        </a>

        {/* Brand Icon */}
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
          <Boxes size={20} />
        </div>
      </div>
    </header>
  );
};

export default Header;
