import { useEffect, useState } from "react";
import {
  CheckCircle,
  Flame,
  ChefHat,
  Timer,
  AlertTriangle,
} from "lucide-react";
import { toast } from "sonner";
import { API_BASE } from "../config";

const URGENT_THRESHOLD = 10; // minutes — card turns red
const WARNING_THRESHOLD = 5; // minutes — card turns orange

export default function Kitchen() {
  const [orders, setOrders] = useState([]);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState(null);

  /* ── Fetch orders ── */
  const fetchOrders = async () => {
    try {
      const res = await fetch(`${API_BASE}/orders/recent`);
      const data = await res.json();
      setOrders(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Kitchen fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
    const interval = setInterval(fetchOrders, 5000);
    return () => clearInterval(interval);
  }, []);

  /* ── Clock — updates every second ── */
  useEffect(() => {
    const clock = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(clock);
  }, []);

  /* ── Update order status ── */
  const updateStatus = async (id, status) => {
    setUpdatingId(id);
    try {
      const res = await fetch(`${API_BASE}/orders/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error();
      await fetchOrders();
      toast.success(`Order marked as ${status}`);
    } catch {
      toast.error("Failed to update order");
    } finally {
      setUpdatingId(null);
    }
  };

  /* ── Elapsed time ── */
  const getElapsedSeconds = (createdAt) =>
    Math.floor((Date.now() - new Date(createdAt)) / 1000);

  const formatElapsed = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  const getElapsedMinutes = (createdAt) =>
    Math.floor(getElapsedSeconds(createdAt) / 60);

  /* ── Card urgency styling ── */
  const getCardStyle = (order) => {
    const min = getElapsedMinutes(order.createdAt);
    if (order.status === "pending")
      return "border-yellow-500 bg-yellow-500/5 shadow-yellow-500/10";
    if (min >= URGENT_THRESHOLD)
      return "border-red-500 bg-red-500/10 shadow-red-500/20 shadow-lg";
    if (min >= WARNING_THRESHOLD)
      return "border-orange-500 bg-orange-500/10 shadow-orange-500/20";
    return "border-blue-500 bg-blue-500/5 shadow-blue-500/10";
  };

  const getTimerColor = (createdAt) => {
    const min = getElapsedMinutes(createdAt);
    if (min >= URGENT_THRESHOLD) return "text-red-400";
    if (min >= WARNING_THRESHOLD) return "text-orange-400";
    return "text-green-400";
  };

  /* ── Active + ready orders ── */
  const activeOrders = orders.filter(
    (o) => o.status === "pending" || o.status === "preparing",
  );
  const readyOrders = orders.filter((o) => o.status === "ready");

  /* ── Stats ── */
  const avgTime = activeOrders.length
    ? Math.floor(
        activeOrders.reduce(
          (sum, o) => sum + getElapsedMinutes(o.createdAt),
          0,
        ) / activeOrders.length,
      )
    : 0;

  const urgentCount = activeOrders.filter(
    (o) => getElapsedMinutes(o.createdAt) >= URGENT_THRESHOLD,
  ).length;

  if (loading) {
    return (
      <div className="p-6 bg-slate-950 min-h-screen text-white">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => (
            <div
              key={i}
              className="h-64 bg-slate-800 rounded-xl animate-pulse"
            />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-slate-950 min-h-screen text-white space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center">
            <ChefHat className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">Kitchen Display</h1>
            <p className="text-slate-400 text-sm">Live order tracking</p>
          </div>
        </div>

        {/* Clock + stats */}
        <div className="flex items-center gap-4">
          {urgentCount > 0 && (
            <div className="flex items-center gap-2 px-3 py-2 bg-red-500/10 border border-red-500/30 rounded-xl">
              <AlertTriangle className="w-4 h-4 text-red-400" />
              <span className="text-red-400 text-sm font-medium">
                {urgentCount} urgent
              </span>
            </div>
          )}
          <div className="text-right">
            <p className="text-2xl font-bold tabular-nums">
              {currentTime.toLocaleTimeString()}
            </p>
            <p className="text-xs text-slate-400">
              {currentTime.toLocaleDateString("en-US", {
                weekday: "short",
                month: "short",
                day: "numeric",
              })}
            </p>
          </div>
        </div>
      </div>

      {/* Stats bar */}
      <div className="grid grid-cols-4 gap-4">
        {[
          {
            label: "Active",
            value: activeOrders.length,
            color: "text-orange-400",
            bg: "bg-orange-500/10 border-orange-500/20",
          },
          {
            label: "Pending",
            value: activeOrders.filter((o) => o.status === "pending").length,
            color: "text-yellow-400",
            bg: "bg-yellow-500/10 border-yellow-500/20",
          },
          {
            label: "Avg Time",
            value: `${avgTime}m`,
            color:
              avgTime >= URGENT_THRESHOLD ? "text-red-400" : "text-green-400",
            bg: "bg-slate-800/50 border-slate-700",
          },
          {
            label: "Ready",
            value: readyOrders.length,
            color: "text-blue-400",
            bg: "bg-blue-500/10 border-blue-500/20",
          },
        ].map((s) => (
          <div key={s.label} className={`border rounded-xl p-4 ${s.bg}`}>
            <p className="text-xs text-slate-400 mb-1">{s.label}</p>
            <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Active Orders Grid */}
      {activeOrders.length > 0 && (
        <div>
          <h2 className="text-sm font-medium text-slate-400 uppercase tracking-wider mb-3">
            Active Orders
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {activeOrders
              .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))
              .map((order) => {
                const elapsedMin = getElapsedMinutes(order.createdAt);
                const isUrgent = elapsedMin >= URGENT_THRESHOLD;
                const isUpdating = updatingId === order._id;

                return (
                  <div
                    key={order._id}
                    className={`rounded-xl border-2 p-5 transition-all duration-300 ${getCardStyle(order)} ${
                      isUrgent ? "animate-pulse" : ""
                    }`}
                  >
                    {/* Card header */}
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <div className="flex items-center gap-2">
                          <h2 className="text-lg font-bold text-violet-400 font-mono">
                            #{order._id.slice(-6)}
                          </h2>
                          {isUrgent && (
                            <span className="text-xs px-2 py-0.5 bg-red-500/20 text-red-400 rounded-full border border-red-500/30">
                              URGENT
                            </span>
                          )}
                        </div>
                        <p className="text-slate-300 text-sm mt-0.5">
                          Table {order.table}
                        </p>
                      </div>

                      {/* Timer */}
                      <div className="text-right">
                        <div
                          className={`text-2xl font-bold tabular-nums ${getTimerColor(order.createdAt)}`}
                        >
                          <LiveTimer createdAt={order.createdAt} />
                        </div>
                        <span
                          className={`text-xs px-2 py-0.5 rounded-full capitalize ${
                            order.status === "pending"
                              ? "bg-yellow-500/20 text-yellow-400"
                              : "bg-blue-500/20 text-blue-400"
                          }`}
                        >
                          {order.status}
                        </span>
                      </div>
                    </div>

                    {/* Items */}
                    <div className="space-y-2 mb-4">
                      {order.items?.map((item, i) => (
                        <div
                          key={i}
                          className="flex items-center justify-between bg-slate-900/60 px-3 py-2 rounded-lg"
                        >
                          <span className="text-sm text-slate-200">
                            {item.name}
                          </span>
                          <span className="text-sm font-bold text-violet-400 bg-violet-500/10 px-2 py-0.5 rounded">
                            ×{item.quantity}
                          </span>
                        </div>
                      ))}
                    </div>

                    {/* Action button */}
                    {order.status === "pending" ? (
                      <button
                        onClick={() => updateStatus(order._id, "preparing")}
                        disabled={isUpdating}
                        className="w-full py-2.5 bg-orange-600 hover:bg-orange-500 disabled:opacity-50 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                      >
                        <Flame className="w-4 h-4" />
                        {isUpdating ? "Starting..." : "Start Cooking"}
                      </button>
                    ) : (
                      <button
                        onClick={() => updateStatus(order._id, "ready")}
                        disabled={isUpdating}
                        className="w-full py-2.5 bg-green-600 hover:bg-green-500 disabled:opacity-50 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                      >
                        <CheckCircle className="w-4 h-4" />
                        {isUpdating ? "Updating..." : "Mark Ready"}
                      </button>
                    )}
                  </div>
                );
              })}
          </div>
        </div>
      )}

      {/* Ready Orders */}
      {readyOrders.length > 0 && (
        <div>
          <h2 className="text-sm font-medium text-slate-400 uppercase tracking-wider mb-3">
            Ready for Pickup
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
            {readyOrders.map((order) => (
              <div
                key={order._id}
                className="border-2 border-green-500/50 bg-green-500/5 rounded-xl p-4 flex items-center justify-between"
              >
                <div>
                  <p className="font-mono text-green-400 font-bold">
                    #{order._id.slice(-6)}
                  </p>
                  <p className="text-sm text-slate-400">Table {order.table}</p>
                </div>
                <CheckCircle className="w-8 h-8 text-green-500" />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty state */}
      {activeOrders.length === 0 && readyOrders.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 border border-slate-800 rounded-xl">
          <div className="w-16 h-16 rounded-full bg-green-500/10 flex items-center justify-center mb-4">
            <CheckCircle className="w-8 h-8 text-green-500" />
          </div>
          <h2 className="text-xl font-semibold">All Clear!</h2>
          <p className="text-slate-400 text-sm mt-1">
            No active orders in the kitchen
          </p>
        </div>
      )}
    </div>
  );
}

/* ── Live timer component — updates every second independently ── */
function LiveTimer({ createdAt }) {
  const [elapsed, setElapsed] = useState(
    Math.floor((Date.now() - new Date(createdAt)) / 1000),
  );

  useEffect(() => {
    const t = setInterval(() => {
      setElapsed(Math.floor((Date.now() - new Date(createdAt)) / 1000));
    }, 1000);
    return () => clearInterval(t);
  }, [createdAt]);

  const m = Math.floor(elapsed / 60);
  const s = elapsed % 60;
  return <>{`${m}:${s.toString().padStart(2, "0")}`}</>;
}
