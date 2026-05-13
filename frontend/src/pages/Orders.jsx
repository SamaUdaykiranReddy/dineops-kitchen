import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  ShoppingCart,
  CheckCircle,
  Clock,
  Filter,
  Trash2,
  CreditCard,
  ChevronRight,
} from "lucide-react";
import { toast } from "sonner";
import { API_BASE } from "../config";

export default function Orders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCompleted, setShowCompleted] = useState(false);
  const [filterStatus, setFilterStatus] = useState("all");
  const navigate = useNavigate();

  /* ── Fetch orders ── */
  const fetchOrders = async () => {
    try {
      const res = await fetch(`${API_BASE}/orders/recent`);
      const data = await res.json();
      setOrders(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Failed to fetch orders:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
    const interval = setInterval(fetchOrders, 5000);
    return () => clearInterval(interval);
  }, []);

  /* ── Status change ── */
  const handleStatusChange = async (order) => {
    const newStatus =
      order.status === "pending"
        ? "preparing"
        : order.status === "preparing"
          ? "ready"
          : "completed";

    try {
      const res = await fetch(`${API_BASE}/orders/${order._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      const updated = await res.json();
      setOrders((prev) =>
        prev.map((o) => (o._id === updated._id ? updated : o)),
      );
      toast.success(`Order #${order._id.slice(-6)} marked as ${newStatus}`);
    } catch {
      toast.error("Failed to update order status");
    }
  };

  /* ── Delete ── */
  const handleDelete = async (_id) => {
    try {
      await fetch(`${API_BASE}/orders/${_id}`, { method: "DELETE" });
      setOrders((prev) => prev.filter((o) => o._id !== _id));
      toast.success("Order removed");
    } catch {
      toast.error("Failed to delete order");
    }
  };

  /* ── Navigate to payment ── */
  const handlePay = (orderId) => navigate(`/payment/${orderId}`);

  /* ── Helpers ── */
  const getStatusStyle = (status) => {
    switch (status) {
      case "pending":
        return "bg-slate-500/20 text-slate-300 border-slate-500/40";
      case "preparing":
        return "bg-orange-500/20 text-orange-400 border-orange-500/40 animate-pulse";
      case "ready":
        return "bg-blue-500/20 text-blue-400 border-blue-500/40 shadow-[0_0_12px_rgba(59,130,246,0.4)]";
      case "completed":
        return "bg-green-500/20 text-green-400 border-green-500/40";
      default:
        return "bg-slate-500/20 text-slate-400 border-slate-500/40";
    }
  };

  const getNextStatusLabel = (status) => {
    switch (status) {
      case "pending":
        return "Start Preparing";
      case "preparing":
        return "Mark Ready";
      case "ready":
        return "Complete";
      default:
        return null;
    }
  };

  const getElapsed = (createdAt) => {
    const sec = Math.floor((Date.now() - new Date(createdAt)) / 1000);
    const min = Math.floor(sec / 60);
    if (min < 1) return "Just now";
    if (min < 60) return `${min}m ago`;
    return `${Math.floor(min / 60)}h ago`;
  };

  /* ── Stats ── */
  const stats = {
    total: orders.length,
    pending: orders.filter((o) => o.status === "pending").length,
    preparing: orders.filter((o) => o.status === "preparing").length,
    ready: orders.filter((o) => o.status === "ready").length,
    completed: orders.filter((o) => o.status === "completed").length,
    revenue: orders
      .filter((o) => o.status === "completed")
      .reduce((sum, o) => sum + (o.total || 0), 0),
  };

  /* ── Filter ── */
  const visibleOrders = orders.filter((o) => {
    if (!showCompleted && o.status === "completed") return false;
    if (filterStatus !== "all" && o.status !== filterStatus) return false;
    return true;
  });

  if (loading) {
    return (
      <div className="p-8 bg-slate-950 min-h-screen text-white space-y-4">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-16 bg-slate-800 rounded-xl animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="p-8 bg-slate-950 min-h-screen text-white space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Orders</h1>
          <p className="text-slate-400 text-sm mt-1">
            Manage and track all restaurant orders
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 px-3 py-1.5 bg-green-500/10 border border-green-500/20 rounded-full">
            <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
            <span className="text-xs text-green-400">Auto-refresh</span>
          </div>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {[
          { label: "Total", value: stats.total, color: "text-white" },
          { label: "Pending", value: stats.pending, color: "text-slate-400" },
          {
            label: "Preparing",
            value: stats.preparing,
            color: "text-orange-400",
          },
          { label: "Ready", value: stats.ready, color: "text-blue-400" },
          {
            label: "Completed",
            value: stats.completed,
            color: "text-green-400",
          },
        ].map((s) => (
          <div
            key={s.label}
            onClick={() =>
              setFilterStatus(
                s.label.toLowerCase() === "total"
                  ? "all"
                  : s.label.toLowerCase(),
              )
            }
            className={`bg-slate-900 border rounded-xl p-4 cursor-pointer transition-all hover:-translate-y-0.5 ${
              filterStatus ===
              (s.label.toLowerCase() === "total"
                ? "all"
                : s.label.toLowerCase())
                ? "border-violet-500/50 bg-violet-500/5"
                : "border-slate-800 hover:border-slate-700"
            }`}
          >
            <p className="text-xs text-slate-400 mb-1">{s.label}</p>
            <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-400" />
          <span className="text-sm text-slate-400">
            Showing {visibleOrders.length} order
            {visibleOrders.length !== 1 ? "s" : ""}
          </span>
        </div>
        <button
          onClick={() => setShowCompleted(!showCompleted)}
          className={`px-4 py-2 rounded-lg text-sm transition-colors ${
            showCompleted
              ? "bg-green-500/20 text-green-400 border border-green-500/30"
              : "bg-slate-800 hover:bg-slate-700 text-slate-300"
          }`}
        >
          {showCompleted ? "✓ Showing Completed" : "Show Completed"}
        </button>
      </div>

      {/* Orders Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-slate-800 bg-slate-800/50">
              <th className="py-3 px-4 text-xs text-slate-400 font-medium">
                Order
              </th>
              <th className="py-3 px-4 text-xs text-slate-400 font-medium">
                Table
              </th>
              <th className="py-3 px-4 text-xs text-slate-400 font-medium">
                Items
              </th>
              <th className="py-3 px-4 text-xs text-slate-400 font-medium">
                Total
              </th>
              <th className="py-3 px-4 text-xs text-slate-400 font-medium">
                Time
              </th>
              <th className="py-3 px-4 text-xs text-slate-400 font-medium">
                Status
              </th>
              <th className="py-3 px-4 text-xs text-slate-400 font-medium">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800">
            {visibleOrders.map((order) => (
              <tr
                key={order._id}
                className="hover:bg-slate-800/40 transition-colors group"
              >
                {/* Order ID */}
                <td className="py-3 px-4">
                  <span className="text-violet-400 font-mono text-sm font-medium">
                    #{order._id.slice(-6)}
                  </span>
                </td>

                {/* Table */}
                <td className="py-3 px-4">
                  <span className="text-sm font-medium">
                    Table {order.table}
                  </span>
                </td>

                {/* Items */}
                <td className="py-3 px-4">
                  <div className="space-y-0.5">
                    {order.items?.map((item, i) => (
                      <div key={i} className="text-xs text-slate-300">
                        <span className="text-violet-400 font-medium">
                          {item.quantity}×
                        </span>{" "}
                        {item.name}
                      </div>
                    ))}
                  </div>
                </td>

                {/* Total */}
                <td className="py-3 px-4">
                  <span className="text-sm font-semibold">
                    $
                    {typeof order.total === "number"
                      ? order.total.toFixed(2)
                      : parseFloat(order.total || 0).toFixed(2)}
                  </span>
                </td>

                {/* Time */}
                <td className="py-3 px-4">
                  <div className="flex items-center gap-1 text-xs text-slate-400">
                    <Clock className="w-3 h-3" />
                    {getElapsed(order.createdAt)}
                  </div>
                </td>

                {/* Status */}
                <td className="py-3 px-4">
                  <span
                    className={`px-2.5 py-1 rounded-full text-xs font-semibold border ${getStatusStyle(order.status)}`}
                  >
                    {order.status}
                  </span>
                </td>

                {/* Actions */}
                <td className="py-3 px-4">
                  <div className="flex items-center gap-2">
                    {/* Pay button */}
                    {order.status !== "completed" &&
                      order.paymentStatus !== "paid" && (
                        <button
                          onClick={() => handlePay(order._id)}
                          className="flex items-center gap-1 px-2.5 py-1.5 bg-blue-600 hover:bg-blue-500 rounded-lg text-xs transition-colors"
                        >
                          <CreditCard className="w-3 h-3" />
                          Pay
                        </button>
                      )}

                    {/* Status advance button */}
                    {order.status !== "completed" && (
                      <button
                        onClick={() => handleStatusChange(order)}
                        className="flex items-center gap-1 px-2.5 py-1.5 bg-violet-600 hover:bg-violet-500 rounded-lg text-xs transition-colors"
                      >
                        <ChevronRight className="w-3 h-3" />
                        {getNextStatusLabel(order.status)}
                      </button>
                    )}

                    {/* Delete */}
                    <button
                      onClick={() => handleDelete(order._id)}
                      className="p-1.5 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Empty state */}
        {visibleOrders.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 text-slate-500">
            <CheckCircle className="w-12 h-12 mb-3 text-green-500/30" />
            <p className="text-lg font-medium">All caught up!</p>
            <p className="text-sm mt-1">No orders to display</p>
          </div>
        )}
      </div>

      {/* Revenue footer */}
      <div className="flex items-center justify-between px-4 py-3 bg-slate-900 border border-slate-800 rounded-xl">
        <div className="flex items-center gap-2 text-slate-400 text-sm">
          <ShoppingCart className="w-4 h-4" />
          <span>{stats.total} total orders</span>
        </div>
        <div className="flex items-center gap-2 text-green-400 text-sm font-semibold">
          <span>Completed Revenue:</span>
          <span>${stats.revenue.toFixed(2)}</span>
        </div>
      </div>
    </div>
  );
}
