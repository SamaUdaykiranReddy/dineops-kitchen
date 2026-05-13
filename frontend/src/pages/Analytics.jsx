import { useEffect, useState } from "react";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import {
  TrendingUp,
  ShoppingCart,
  DollarSign,
  Package,
  Users,
  Clock,
} from "lucide-react";
import { API_BASE } from "../config";

const COLORS = ["#8b5cf6", "#06b6d4", "#10b981", "#f59e0b", "#ef4444"];

export default function Analytics() {
  const [orders, setOrders] = useState([]);
  const [inventory, setInventory] = useState([]);
  const [tables, setTables] = useState([]);
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [o, i, t, r] = await Promise.all([
          fetch(`${API_BASE}/orders/recent`).then((r) => r.json()),
          fetch(`${API_BASE}/inventory`).then((r) => r.json()),
          fetch(`${API_BASE}/tables`).then((r) => r.json()),
          fetch(`${API_BASE}/reservations`).then((r) => r.json()),
        ]);
        setOrders(o);
        setInventory(i);
        setTables(t);
        setReservations(r);
      } catch (err) {
        console.error("Failed to fetch analytics data:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, []);

  /* ── Derived stats ── */
  const totalRevenue = orders
    .filter((o) => o.status === "completed")
    .reduce((sum, o) => sum + (o.total || 0), 0);

  const avgOrderValue = orders.length
    ? (
        orders.reduce((sum, o) => sum + (o.total || 0), 0) / orders.length
      ).toFixed(2)
    : 0;

  const activeOrders = orders.filter(
    (o) => o.status === "preparing" || o.status === "pending",
  ).length;

  const lowStockItems = inventory.filter(
    (i) => i.status === "low" || i.status === "critical",
  ).length;

  /* ── Revenue by hour chart data ── */
  const revenueByHour = Array.from({ length: 12 }, (_, i) => {
    const hour = i + 8; // 8am to 8pm
    const hourOrders = orders.filter((o) => {
      const orderHour = new Date(o.createdAt).getHours();
      return orderHour === hour && o.status === "completed";
    });
    return {
      time: `${hour > 12 ? hour - 12 : hour}${hour >= 12 ? "pm" : "am"}`,
      revenue: hourOrders.reduce((sum, o) => sum + (o.total || 0), 0),
      orders: hourOrders.length,
    };
  });

  /* ── Order status distribution ── */
  const statusCounts = ["pending", "preparing", "ready", "completed"]
    .map((s) => ({
      name: s.charAt(0).toUpperCase() + s.slice(1),
      value: orders.filter((o) => o.status === s).length,
    }))
    .filter((s) => s.value > 0);

  /* ── Table status distribution ── */
  const tableStatus = ["available", "occupied", "reserved", "cleaning"]
    .map((s) => ({
      name: s.charAt(0).toUpperCase() + s.slice(1),
      value: tables.filter((t) => t.status === s).length,
    }))
    .filter((s) => s.value > 0);

  /* ── Top menu items ── */
  const itemCounts = {};
  orders.forEach((o) => {
    o.items?.forEach((item) => {
      itemCounts[item.name] = (itemCounts[item.name] || 0) + item.quantity;
    });
  });
  const topItems = Object.entries(itemCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([name, count]) => ({ name, count }));

  /* ── Inventory status ── */
  const inventoryStatus = ["good", "low", "critical"]
    .map((s) => ({
      name: s.charAt(0).toUpperCase() + s.slice(1),
      value: inventory.filter((i) => i.status === s).length,
    }))
    .filter((s) => s.value > 0);

  /* ── Reservation status ── */
  const reservationsByStatus = ["pending", "confirmed", "seated", "cancelled"]
    .map((s) => ({
      name: s.charAt(0).toUpperCase() + s.slice(1),
      value: reservations.filter((r) => r.status === s).length,
    }))
    .filter((s) => s.value > 0);

  if (loading) {
    return (
      <div className="p-8 bg-slate-950 min-h-screen text-white">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          {[...Array(4)].map((_, i) => (
            <div
              key={i}
              className="h-32 bg-slate-800 rounded-xl animate-pulse"
            />
          ))}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[...Array(4)].map((_, i) => (
            <div
              key={i}
              className="h-72 bg-slate-800 rounded-xl animate-pulse"
            />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 bg-slate-950 min-h-screen text-white space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Analytics</h1>
        <p className="text-slate-400">
          Real-time restaurant performance insights
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          {
            title: "Total Revenue",
            value: `$${totalRevenue.toFixed(2)}`,
            icon: DollarSign,
            color: "from-green-500 to-teal-500",
            sub: "From completed orders",
          },
          {
            title: "Active Orders",
            value: activeOrders,
            icon: ShoppingCart,
            color: "from-violet-500 to-purple-600",
            sub: "Preparing or pending",
          },
          {
            title: "Avg Order Value",
            value: `$${avgOrderValue}`,
            icon: TrendingUp,
            color: "from-blue-500 to-indigo-600",
            sub: "Across all orders",
          },
          {
            title: "Low Stock Items",
            value: lowStockItems,
            icon: Package,
            color: "from-orange-500 to-red-500",
            sub: "Need restocking",
          },
        ].map((card) => {
          const Icon = card.icon;
          return (
            <div
              key={card.title}
              className="bg-slate-900 border border-slate-800 rounded-xl p-6 hover:border-violet-500/30 transition-colors"
            >
              <div className="flex justify-between items-start mb-4">
                <div>
                  <p className="text-sm text-slate-400">{card.title}</p>
                  <p className="text-2xl font-bold mt-1">{card.value}</p>
                </div>
                <div
                  className={`w-12 h-12 rounded-lg bg-gradient-to-br ${card.color} flex items-center justify-center`}
                >
                  <Icon className="w-6 h-6 text-white" />
                </div>
              </div>
              <p className="text-xs text-slate-500">{card.sub}</p>
            </div>
          );
        })}
      </div>

      {/* Revenue Over Time */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
        <h2 className="text-lg font-semibold mb-6">Revenue & Orders by Hour</h2>
        <ResponsiveContainer width="100%" height={280}>
          <AreaChart data={revenueByHour}>
            <defs>
              <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="ordersGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#06b6d4" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
            <XAxis
              dataKey="time"
              stroke="#475569"
              tick={{ fill: "#94a3b8", fontSize: 12 }}
            />
            <YAxis stroke="#475569" tick={{ fill: "#94a3b8", fontSize: 12 }} />
            <Tooltip
              contentStyle={{
                backgroundColor: "#1e293b",
                border: "1px solid #334155",
                borderRadius: "8px",
              }}
              labelStyle={{ color: "#f1f5f9" }}
            />
            <Legend />
            <Area
              type="monotone"
              dataKey="revenue"
              stroke="#8b5cf6"
              fill="url(#revenueGrad)"
              strokeWidth={2}
              name="Revenue ($)"
            />
            <Area
              type="monotone"
              dataKey="orders"
              stroke="#06b6d4"
              fill="url(#ordersGrad)"
              strokeWidth={2}
              name="Orders"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Row 2 — Top Items + Order Status */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Top Menu Items */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
          <h2 className="text-lg font-semibold mb-6">Top Menu Items</h2>
          {topItems.length === 0 ? (
            <div className="flex items-center justify-center h-48 text-slate-500">
              No order data yet
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={topItems} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis
                  type="number"
                  stroke="#475569"
                  tick={{ fill: "#94a3b8", fontSize: 12 }}
                />
                <YAxis
                  dataKey="name"
                  type="category"
                  stroke="#475569"
                  tick={{ fill: "#94a3b8", fontSize: 12 }}
                  width={80}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#1e293b",
                    border: "1px solid #334155",
                    borderRadius: "8px",
                  }}
                  labelStyle={{ color: "#f1f5f9" }}
                />
                <Bar dataKey="count" name="Qty Sold" radius={[0, 4, 4, 0]}>
                  {topItems.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Order Status Pie */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
          <h2 className="text-lg font-semibold mb-6">
            Order Status Distribution
          </h2>
          {statusCounts.length === 0 ? (
            <div className="flex items-center justify-center h-48 text-slate-500">
              No order data yet
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={240}>
              <PieChart>
                <Pie
                  data={statusCounts}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {statusCounts.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#1e293b",
                    border: "1px solid #334155",
                    borderRadius: "8px",
                  }}
                  labelStyle={{ color: "#f1f5f9" }}
                />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Row 3 — Tables + Inventory + Reservations */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Table Status */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
          <h2 className="text-lg font-semibold mb-4">Table Status</h2>
          <div className="space-y-3">
            {tableStatus.map((t, i) => (
              <div key={t.name} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: COLORS[i] }}
                  />
                  <span className="text-sm text-slate-300">{t.name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-24 h-2 bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${(t.value / tables.length) * 100}%`,
                        backgroundColor: COLORS[i],
                      }}
                    />
                  </div>
                  <span className="text-sm font-medium w-4">{t.value}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Inventory Health */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
          <h2 className="text-lg font-semibold mb-4">Inventory Health</h2>
          <div className="space-y-3">
            {inventoryStatus.map((s, i) => (
              <div key={s.name} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: COLORS[i] }}
                  />
                  <span className="text-sm text-slate-300">{s.name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-24 h-2 bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${(s.value / inventory.length) * 100}%`,
                        backgroundColor: COLORS[i],
                      }}
                    />
                  </div>
                  <span className="text-sm font-medium w-4">{s.value}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Reservations */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
          <h2 className="text-lg font-semibold mb-4">Reservations</h2>
          <div className="space-y-3">
            {reservationsByStatus.map((r, i) => (
              <div key={r.name} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: COLORS[i] }}
                  />
                  <span className="text-sm text-slate-300">{r.name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-24 h-2 bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: reservations.length
                          ? `${(r.value / reservations.length) * 100}%`
                          : "0%",
                        backgroundColor: COLORS[i],
                      }}
                    />
                  </div>
                  <span className="text-sm font-medium w-4">{r.value}</span>
                </div>
              </div>
            ))}
            {reservations.length === 0 && (
              <p className="text-slate-500 text-sm">No reservations yet</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
