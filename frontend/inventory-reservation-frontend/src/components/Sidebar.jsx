
import { NavLink } from "react-router-dom";
import {
  Boxes,
  LayoutDashboard,
  Package,
  PlusCircle,
  ClipboardList,
  BookOpen,
  X,
  ExternalLink,
  ShieldCheck
} from "lucide-react";

const menuItems = [
  {
    name: "Dashboard",
    path: "/",
    icon: LayoutDashboard
  },
  {
    name: "Products",
    path: "/products",
    icon: Package
  },
  {
    name: "Add Product",
    path: "/products/new",
    icon: PlusCircle
  },
  {
    name: "Reservations",
    path: "/reservations",
    icon: ClipboardList
  }
];

const Sidebar = ({ isOpen, onClose }) => {
  return (
    <>
      {isOpen && (
        <button
          type="button"
          aria-label="Close sidebar"
          onClick={onClose}
          className="fixed inset-0 z-40 bg-slate-950/60 lg:hidden"
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-[270px] flex-col bg-[#0F172A] text-white shadow-2xl transition-transform duration-300 lg:translate-x-0 ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex h-20 items-center justify-between border-b border-white/10 px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-indigo-600 shadow-lg shadow-indigo-950/40">
              <Boxes size={24} />
            </div>

            <div>
              <h1 className="font-display text-lg font-extrabold tracking-tight">
                StockFlow
              </h1>
              <p className="text-[11px] text-slate-400">
                Inventory Management
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close menu"
            className="rounded-lg p-2 text-slate-400 hover:bg-white/10 lg:hidden"
          >
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-7">
          <p className="mb-4 px-3 text-[11px] font-bold uppercase tracking-[0.16em] text-slate-500">
            Main Menu
          </p>

          <nav className="space-y-1.5">
            {menuItems.map((item) => {
              const Icon = item.icon;

              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  end={item.path === "/"}
                  onClick={onClose}
                  className={({ isActive }) =>
                    `flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold transition-all ${
                      isActive
                        ? "bg-indigo-600 text-white shadow-lg shadow-indigo-950/25"
                        : "text-slate-400 hover:bg-white/10 hover:text-white"
                    }`
                  }
                >
                  <Icon size={19} strokeWidth={1.9} />
                  {item.name}
                </NavLink>
              );
            })}
          </nav>

          <p className="mb-4 mt-10 px-3 text-[11px] font-bold uppercase tracking-[0.16em] text-slate-500">
            Developer
          </p>

          <a
            href="http://localhost:5000/api-docs"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold text-slate-400 transition hover:bg-white/10 hover:text-white"
          >
            <BookOpen size={19} />
            API Documentation
            <ExternalLink size={15} className="ml-auto" />
          </a>
        </div>

        <div className="border-t border-white/10 p-5">
          <div className="flex items-center gap-3 rounded-2xl bg-white/5 p-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-400">
              <ShieldCheck size={20} />
            </div>

            <div>
              <p className="text-xs font-semibold text-white">
                Stock Protection
              </p>
              <p className="text-[11px] text-slate-400">
                Concurrency-safe inventory
              </p>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
