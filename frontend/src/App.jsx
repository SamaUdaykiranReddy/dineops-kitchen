import { Routes, Route, useLocation } from "react-router-dom";
import { Elements } from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import { Toaster } from "sonner";
import Sidebar from "./components/SideBar";

import Dashboard from "./pages/Dashboard";
import Orders from "./pages/Orders";
import Menu from "./pages/Menu";
import Kitchen from "./pages/Kitchen";
import TableLayout from "./pages/TableLayout";
import ReservationsPage from "./pages/ReservationsPage";
import InventoryPage from "./pages/InventoryPage";
import SettingsPage from "./pages/SettingsPage";
import PaymentForm from "./pages/PaymentPage";
import Analytics from "./pages/Analytics";
import AIAssistant from "./components/AIAssistant";
import PaymentsPage from "./pages/PaymentsPage";
import StaffPage from "./pages/Staff";
import CustomersPage from "./pages/Customers";
import ReportsPage from "./pages/Reports";

const stripePromise = loadStripe(process.env.REACT_APP_STRIPE_PUBLISHABLE_KEY);

function AnimatedRoutes() {
  const location = useLocation();
  return (
    <div key={location.pathname} className="animate-fadeIn flex-1">
      <Routes location={location}>
        <Route path="/" element={<Dashboard />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/orders" element={<Orders />} />
        <Route path="/menu" element={<Menu />} />
        <Route path="/kitchen" element={<Kitchen />} />
        <Route path="/tables" element={<TableLayout />} />
        <Route path="/reservations" element={<ReservationsPage />} />
        <Route path="/inventory" element={<InventoryPage />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="/analytics" element={<Analytics />} />
        <Route path="/payments" element={<PaymentsPage />} />
        <Route path="/payment/:orderId" element={<PaymentForm />} />
        <Route path="/staff" element={<StaffPage />} />
        <Route path="/customers" element={<CustomersPage />} />
        <Route path="/reports" element={<ReportsPage />} />
      </Routes>
    </div>
  );
}

function App() {
  return (
    <Elements stripe={stripePromise}>
      <div className="flex min-h-screen bg-slate-950 text-white">
        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              background: "#1e293b",
              color: "#f1f5f9",
              border: "1px solid #334155",
            },
          }}
        />
        <Sidebar />
        <AnimatedRoutes />
        <AIAssistant />
      </div>
    </Elements>
  );
}

export default App;
