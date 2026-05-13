import { useEffect, useState } from "react";
import {
  ShoppingCart,
  DollarSign,
  Package,
  Users,
  TrendingUp,
  Clock,
  AlertTriangle,
  CheckCircle,
} from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { API_BASE } from "../config";

export default function Dashboard() {
  const [orders, setOrders] = useState([]);
  const [tables, setTables] = useState([]);
  const [inventory, setInventory] = useState([]);
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentTime, setCurrentTime] = useState(new Date());

  /* ── Clock ── */
  useEffect(() => {
    const clock = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(clock);
  }, []);

  /* ── Fetch all data ── */
  const fetchAll = async () => {
    try {
      const [o, t, i, r] = await Promise.all([
        fetch(`${API_BASE}/orders/recent`).then((r) => r.json()),
        fetch(`${API_BASE}/tables`).then((r) => r.json()),
        fetch(`${API_BASE}/inventory`).then((r) => r.json()),
        fetch(`${API_BASE}/reservations`).then((r) => r.json()),
      ]);
      setOrders(
        Array.isArray(o)
          ? o.map((order) => ({
              ...order,
              status: order.status.toLowerCase().trim(),
            }))
          : [],
      );
      setTables(Array.isArray(t) ? t : []);
      setInventory(Array.isArray(i) ? i : []);
      setReservations(Array.isArray(r) ? r : []);
    } catch (err) {
      console.error("Dashboard fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAll();
    const interval = setInterval(fetchAll, 5000);
    return () => clearInterval(interval);
  }, []);

  /* ── Derived stats ── */
  const totalRevenue = orders
    .filter((o) => o.status === "completed")
    .reduce(
      (sum, o) =>
        sum +
        (typeof o.total === "number" ? o.total : parseFloat(o.total) || 0),
      0,
    );

  const activeOrders = orders.filter(
    (o) => o.status === "preparing" || o.status === "pending",
  );

  const availableTables = tables.filter((t) => t.status === "available").length;
  const occupiedTables = tables.filter((t) => t.status === "occupied").length;

  const criticalStock = inventory.filter((i) => i.status === "critical");
  const lowStock = inventory.filter((i) => i.status === "low");

  const todayReservations = reservations.filter(
    (r) => r.date === new Date().toISOString().split("T")[0],
  );

  /* ── Revenue sparkline data ── */
  const revenueByHour = Array.from({ length: 8 }, (_, i) => {
    const hour = i + 9;
    const hourRevenue = orders
      .filter((o) => {
        const h = new Date(o.createdAt).getHours();
        return h === hour && o.status === "completed";
      })
      .reduce((sum, o) => sum + (o.total || 0), 0);
    return {
      time: `${hour > 12 ? hour - 12 : hour}${hour >= 12 ? "pm" : "am"}`,
      revenue: hourRevenue,
    };
  });

  const statsCards = [
    {
      title: "Total Revenue",
      value: `$${totalRevenue.toFixed(2)}`,
      sub: `${orders.filter((o) => o.status === "completed").length} completed orders`,
      icon: DollarSign,
      color: "from-green-500 to-teal-500",
      glow: "shadow-green-500/20",
    },
    {
      title: "Active Orders",
      value: activeOrders.length,
      sub: `${orders.length} total orders`,
      icon: ShoppingCart,
      color: "from-violet-500 to-purple-600",
      glow: "shadow-violet-500/20",
    },
    {
      title: "Tables",
      value: `${availableTables} free`,
      sub: `${occupiedTables} occupied · ${tables.length} total`,
      icon: Package,
      color: "from-orange-500 to-red-500",
      glow: "shadow-orange-500/20",
    },
    {
      title: "Reservations Today",
      value: todayReservations.length,
      sub: `${reservations.filter((r) => r.status === "pending").length} pending confirmation`,
      icon: Users,
      color: "from-blue-500 to-indigo-600",
      glow: "shadow-blue-500/20",
    },
  ];

  if (loading) {
    return (
      <div className="p-8 bg-slate-950 min-h-screen text-white">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {[...Array(4)].map((_, i) => (
            <div
              key={i}
              className="h-32 bg-slate-800 rounded-xl animate-pulse"
            />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 h-72 bg-slate-800 rounded-xl animate-pulse" />
          <div className="h-72 bg-slate-800 rounded-xl animate-pulse" />
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 bg-slate-950 min-h-screen text-white space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-slate-400 text-sm mt-1">
            {currentTime.toLocaleDateString("en-US", {
              weekday: "long",
              month: "long",
              day: "numeric",
            })}
          </p>
        </div>
        <div className="flex items-center gap-3">
          {/* Live indicator */}
          <div className="flex items-center gap-2 px-3 py-1.5 bg-green-500/10 border border-green-500/20 rounded-full">
            <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
            <span className="text-xs text-green-400">Live</span>
          </div>
          <div className="text-right">
            <p className="text-lg font-semibold">
              {currentTime.toLocaleTimeString()}
            </p>
          </div>
        </div>
      </div>

      {/* Alert Banner — shows only when critical stock exists */}
      {criticalStock.length > 0 && (
        <div className="flex items-center gap-3 p-4 bg-red-500/10 border border-red-500/20 rounded-xl">
          <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0" />
          <p className="text-sm text-red-300">
            <span className="font-semibold">
              {criticalStock.length} item{criticalStock.length > 1 ? "s" : ""}{" "}
              critically low:
            </span>{" "}
            {criticalStock.map((i) => i.name).join(", ")}
          </p>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statsCards.map((stat) => {
          const Icon = stat.icon;
          return (
            <div
              key={stat.title}
              className={`p-6 bg-slate-900 border border-slate-800 rounded-xl shadow-lg ${stat.glow} hover:border-violet-500/30 transition-all duration-300 hover:-translate-y-0.5`}
            >
              <div className="flex justify-between items-start mb-4">
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-slate-400 truncate">
                    {stat.title}
                  </p>
                  <p className="text-2xl font-bold mt-1 truncate">
                    {stat.value}
                  </p>
                </div>
                <div
                  className={`w-12 h-12 rounded-lg bg-gradient-to-br ${stat.color} flex items-center justify-center ml-4 flex-shrink-0 shadow-lg`}
                >
                  <Icon className="w-6 h-6 text-white" />
                </div>
              </div>
              <p className="text-xs text-slate-500 truncate">{stat.sub}</p>
            </div>
          );
        })}
      </div>

      {/* Revenue Chart + Active Orders */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Revenue Chart */}
        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-xl p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold">Revenue Today</h2>
            <div className="flex items-center gap-2 text-green-400 text-sm">
              <TrendingUp className="w-4 h-4" />
              <span>${totalRevenue.toFixed(2)}</span>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={revenueByHour}>
              <defs>
                <linearGradient id="dashRevGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis
                dataKey="time"
                stroke="#475569"
                tick={{ fill: "#94a3b8", fontSize: 11 }}
              />
              <YAxis
                stroke="#475569"
                tick={{ fill: "#94a3b8", fontSize: 11 }}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#1e293b",
                  border: "1px solid #334155",
                  borderRadius: "8px",
                }}
                labelStyle={{ color: "#f1f5f9" }}
              />
              <Area
                type="monotone"
                dataKey="revenue"
                stroke="#8b5cf6"
                fill="url(#dashRevGrad)"
                strokeWidth={2}
                name="Revenue ($)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Active Orders Feed */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Active Orders</h2>
            <span className="text-xs px-2 py-1 bg-violet-500/20 text-violet-300 rounded-full">
              {activeOrders.length} live
            </span>
          </div>
          <div className="space-y-3 overflow-y-auto max-h-[200px]">
            {activeOrders.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-32 text-slate-500">
                <CheckCircle className="w-8 h-8 mb-2 text-green-500/50" />
                <p className="text-sm">All caught up!</p>
              </div>
            ) : (
              activeOrders.map((order) => (
                <div
                  key={order._id}
                  className="flex items-center justify-between p-3 bg-slate-800 rounded-lg"
                >
                  <div>
                    <p className="text-sm font-medium">Table {order.table}</p>
                    <p className="text-xs text-slate-400">
                      {order.items?.length} item
                      {order.items?.length !== 1 ? "s" : ""}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold">
                      ${order.total?.toFixed(2)}
                    </p>
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full ${
                        order.status === "preparing"
                          ? "bg-orange-500/20 text-orange-400"
                          : "bg-blue-500/20 text-blue-400"
                      }`}
                    >
                      {order.status}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Bottom Row — Recent Orders Table + Quick Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Orders Table */}
        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Recent Orders</h2>
            <Clock className="w-4 h-4 text-slate-400" />
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-slate-800">
                  <th className="py-2 px-3 text-xs text-slate-400 font-medium">
                    Order
                  </th>
                  <th className="py-2 px-3 text-xs text-slate-400 font-medium">
                    Table
                  </th>
                  <th className="py-2 px-3 text-xs text-slate-400 font-medium">
                    Items
                  </th>
                  <th className="py-2 px-3 text-xs text-slate-400 font-medium">
                    Total
                  </th>
                  <th className="py-2 px-3 text-xs text-slate-400 font-medium">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody>
                {orders.slice(0, 8).map((order) => (
                  <tr
                    key={order._id}
                    className="border-b border-slate-800/50 hover:bg-slate-800/30 transition-colors"
                  >
                    <td className="py-2.5 px-3 text-violet-400 text-sm font-mono">
                      #{order._id.slice(-6)}
                    </td>
                    <td className="py-2.5 px-3 text-sm">
                      {order.table || "-"}
                    </td>
                    <td className="py-2.5 px-3 text-slate-300 text-sm truncate max-w-[180px]">
                      {order.items
                        ?.map((i) => `${i.quantity}x ${i.name}`)
                        .join(", ")}
                    </td>
                    <td className="py-2.5 px-3 text-sm font-medium">
                      $
                      {typeof order.total === "number"
                        ? order.total.toFixed(2)
                        : order.total}
                    </td>
                    <td className="py-2.5 px-3">
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${
                          order.status === "completed"
                            ? "bg-green-500/20 text-green-400"
                            : order.status === "preparing"
                              ? "bg-orange-500/20 text-orange-400 animate-pulse"
                              : order.status === "ready"
                                ? "bg-blue-500/20 text-blue-400"
                                : "bg-slate-500/20 text-slate-400"
                        }`}
                      >
                        {order.status}
                      </span>
                    </td>
                  </tr>
                ))}
                {orders.length === 0 && (
                  <tr>
                    <td
                      colSpan={5}
                      className="py-8 text-center text-slate-500 text-sm"
                    >
                      No orders yet
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="space-y-4">
          {/* Inventory Alerts */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
            <h3 className="text-sm font-semibold text-slate-300 mb-3">
              Inventory Alerts
            </h3>
            {criticalStock.length === 0 && lowStock.length === 0 ? (
              <div className="flex items-center gap-2 text-green-400 text-sm">
                <CheckCircle className="w-4 h-4" />
                <span>All stock levels healthy</span>
              </div>
            ) : (
              <div className="space-y-2">
                {[...criticalStock, ...lowStock].slice(0, 4).map((item) => (
                  <div
                    key={item._id}
                    className="flex items-center justify-between"
                  >
                    <span className="text-sm text-slate-300 truncate">
                      {item.name}
                    </span>
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full flex-shrink-0 ml-2 ${
                        item.status === "critical"
                          ? "bg-red-500/20 text-red-400"
                          : "bg-orange-500/20 text-orange-400"
                      }`}
                    >
                      {item.stock} {item.unit}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Table Overview */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
            <h3 className="text-sm font-semibold text-slate-300 mb-3">
              Table Overview
            </h3>
            <div className="space-y-2">
              {[
                {
                  label: "Available",
                  count: availableTables,
                  color: "bg-green-500",
                },
                {
                  label: "Occupied",
                  count: occupiedTables,
                  color: "bg-red-500",
                },
                {
                  label: "Reserved",
                  count: tables.filter((t) => t.status === "reserved").length,
                  color: "bg-blue-500",
                },
                {
                  label: "Cleaning",
                  count: tables.filter((t) => t.status === "cleaning").length,
                  color: "bg-orange-500",
                },
              ].map((row) => (
                <div
                  key={row.label}
                  className="flex items-center justify-between"
                >
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${row.color}`} />
                    <span className="text-sm text-slate-400">{row.label}</span>
                  </div>
                  <span className="text-sm font-medium">{row.count}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Today's Reservations */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
            <h3 className="text-sm font-semibold text-slate-300 mb-3">
              Today's Reservations
            </h3>
            {todayReservations.length === 0 ? (
              <p className="text-sm text-slate-500">No reservations today</p>
            ) : (
              <div className="space-y-2">
                {todayReservations.slice(0, 3).map((r) => (
                  <div
                    key={r._id}
                    className="flex items-center justify-between"
                  >
                    <div>
                      <p className="text-sm text-slate-300">{r.customerName}</p>
                      <p className="text-xs text-slate-500">
                        {r.time} · {r.guests} guests
                      </p>
                    </div>
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full ${
                        r.status === "seated"
                          ? "bg-green-500/20 text-green-400"
                          : r.status === "confirmed"
                            ? "bg-blue-500/20 text-blue-400"
                            : "bg-slate-500/20 text-slate-400"
                      }`}
                    >
                      {r.status}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
