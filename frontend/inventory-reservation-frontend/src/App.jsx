
import { useState } from "react";
import {
  BrowserRouter,
  Routes,
  Route,
  useLocation
} from "react-router-dom";

import Sidebar from "./components/Sidebar";
import Header from "./components/Header";
import Dashboard from "./pages/Dashboard";
import Products from "./pages/Products";
import AddProduct from "./pages/AddProduct";
import ProductDetails from "./pages/ProductDetails";
import ReservationDetails from "./pages/ReservationDetails";
import Reservations from "./pages/Reservations";
import NotFound from "./pages/NotFound";

const CURRENT_YEAR = new Date().getFullYear();

const AppLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();

  return (
    <div className="min-h-screen bg-[#F7F9FC]">
      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      <div className="min-h-screen lg:pl-[270px]">
        <Header onMenuClick={() => setSidebarOpen(true)} />

        <main
          key={location.pathname}
          className="mx-auto w-full max-w-[1600px] px-4 py-6 sm:px-6 lg:px-8 lg:py-8"
        >
          <Routes>
            <Route path="/" element={<Dashboard />} />

          <Route path="/products" element={<Products />} />

          <Route path="/products/new" element={<AddProduct />} />

           <Route path="/products/:id" element={<ProductDetails />} />

            <Route path="/reservations" element={<Reservations />} />

           <Route
  path="/reservations/:id"
  element={<ReservationDetails />}
/>

          <Route path="*" element={<NotFound />} />
          </Routes>
        </main>

        <footer className="px-4 pb-6 text-center text-xs text-slate-400 sm:px-6 lg:px-8">
          © {CURRENT_YEAR} StockFlow · Inventory Reservation System
        </footer>
      </div>
    </div>
  );
};

const App = () => {
  return (
    <BrowserRouter>
      <AppLayout />
    </BrowserRouter>
  );
};

export default App;