import { useEffect, useState } from "react";
import {
  FileText,
  Download,
  TrendingUp,
  Package,
  Users,
  DollarSign,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { API_BASE } from "../config";
import { toast } from "sonner";

export default function ReportsPage() {
  const [orders, setOrders] = useState([]);
  const [inventory, setInventory] = useState([]);
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeReport, setActiveReport] = useState("sales");

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [o, i, s] = await Promise.all([
          fetch(`${API_BASE}/orders/recent`).then((r) => r.json()),
          fetch(`${API_BASE}/inventory`).then((r) => r.json()),
          fetch(`${API_BASE}/staff`).then((r) => r.json()),
        ]);
        setOrders(Array.isArray(o) ? o : []);
        setInventory(Array.isArray(i) ? i : []);
        setStaff(Array.isArray(s) ? s : []);
      } catch (err) {
        console.error("Failed to fetch report data:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, []);

  /* ── Sales data ── */
  const completedOrders = orders.filter((o) => o.status === "completed");
  const totalRevenue = completedOrders.reduce(
    (sum, o) => sum + (o.total || 0),
    0,
  );
  const avgOrderValue = completedOrders.length
    ? (totalRevenue / completedOrders.length).toFixed(2)
    : 0;

  const revenueByDay = Array.from({ length: 7 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - (6 - i));
    const dateStr = date.toDateString();
    const dayOrders = completedOrders.filter(
      (o) => new Date(o.createdAt).toDateString() === dateStr,
    );
    return {
      day: date.toLocaleDateString("en-US", { weekday: "short" }),
      revenue: dayOrders.reduce((sum, o) => sum + (o.total || 0), 0),
      orders: dayOrders.length,
    };
  });

  /* ── Top items ── */
  const itemCounts = {};
  orders.forEach((o) => {
    o.items?.forEach((item) => {
      itemCounts[item.name] = (itemCounts[item.name] || 0) + item.quantity;
    });
  });
  const topItems = Object.entries(itemCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([name, count]) => ({ name, count }));

  /* ── Inventory report ── */
  const criticalItems = inventory.filter((i) => i.status === "critical");
  const lowItems = inventory.filter((i) => i.status === "low");
  const goodItems = inventory.filter((i) => i.status === "good");

  /* ── Staff report ── */
  const activeStaff = staff.filter((s) => s.status === "active");
  const avgRating = staff.length
    ? (
        staff.reduce((sum, s) => sum + (s.performance?.rating || 0), 0) /
        staff.length
      ).toFixed(1)
    : 0;
  const staffByRole = {};
  staff.forEach((s) => {
    staffByRole[s.role] = (staffByRole[s.role] || 0) + 1;
  });
  const staffRoleData = Object.entries(staffByRole).map(([role, count]) => ({
    role,
    count,
  }));

  /* ── Export CSV ── */
  const exportCSV = (data, filename) => {
    if (!data.length) {
      toast.error("No data to export");
      return;
    }
    const headers = Object.keys(data[0]).join(",");
    const rows = data.map((row) =>
      Object.values(row)
        .map((v) => `"${v}"`)
        .join(","),
    );
    const csv = [headers, ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${filename}-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success(`${filename} exported`);
  };

  const REPORTS = [
    { key: "sales", label: "Sales Report", icon: DollarSign },
    { key: "inventory", label: "Inventory Report", icon: Package },
    { key: "staff", label: "Staff Report", icon: Users },
  ];

  if (loading) {
    return (
      <div className="p-8 bg-slate-950 min-h-screen text-white space-y-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-48 bg-slate-800 rounded-xl animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="p-8 bg-slate-950 min-h-screen text-white space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Reports</h1>
          <p className="text-slate-400 text-sm mt-1">
            Business insights and exportable reports
          </p>
        </div>
      </div>

      {/* Report tabs */}
      <div className="flex gap-3">
        {REPORTS.map((r) => {
          const Icon = r.icon;
          return (
            <button
              key={r.key}
              onClick={() => setActiveReport(r.key)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm transition-colors ${
                activeReport === r.key
                  ? "bg-violet-600 text-white"
                  : "bg-slate-800 text-slate-400 hover:bg-slate-700"
              }`}
            >
              <Icon className="w-4 h-4" />
              {r.label}
            </button>
          );
        })}
      </div>

      {/* ── SALES REPORT ── */}
      {activeReport === "sales" && (
        <div className="space-y-6">
          {/* KPIs */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              {
                label: "Total Revenue",
                value: `$${totalRevenue.toFixed(2)}`,
                color: "text-green-400",
              },
              {
                label: "Completed Orders",
                value: completedOrders.length,
                color: "text-violet-400",
              },
              {
                label: "Avg Order Value",
                value: `$${avgOrderValue}`,
                color: "text-blue-400",
              },
              {
                label: "Total Orders",
                value: orders.length,
                color: "text-white",
              },
            ].map((s) => (
              <div
                key={s.label}
                className="bg-slate-900 border border-slate-800 rounded-xl p-4"
              >
                <p className="text-xs text-slate-400 mb-1">{s.label}</p>
                <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
              </div>
            ))}
          </div>

          {/* Revenue chart */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold">Revenue — Last 7 Days</h2>
              <button
                onClick={() => exportCSV(revenueByDay, "sales-report")}
                className="flex items-center gap-2 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 rounded-xl text-xs transition-colors"
              >
                <Download className="w-3.5 h-3.5" />
                Export CSV
              </button>
            </div>
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={revenueByDay}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis
                  dataKey="day"
                  stroke="#475569"
                  tick={{ fill: "#94a3b8", fontSize: 12 }}
                />
                <YAxis
                  stroke="#475569"
                  tick={{ fill: "#94a3b8", fontSize: 12 }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#1e293b",
                    border: "1px solid #334155",
                    borderRadius: "8px",
                  }}
                  labelStyle={{ color: "#f1f5f9" }}
                />
                <Bar
                  dataKey="revenue"
                  fill="#8b5cf6"
                  radius={[4, 4, 0, 0]}
                  name="Revenue ($)"
                />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Top items */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Top Selling Items</h2>
              <button
                onClick={() => exportCSV(topItems, "top-items")}
                className="flex items-center gap-2 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 rounded-xl text-xs transition-colors"
              >
                <Download className="w-3.5 h-3.5" />
                Export CSV
              </button>
            </div>
            <div className="space-y-3">
              {topItems.map((item, i) => (
                <div key={item.name} className="flex items-center gap-3">
                  <span className="text-xs text-slate-500 w-5">{i + 1}</span>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm text-slate-200">
                        {item.name}
                      </span>
                      <span className="text-sm font-bold text-violet-400">
                        {item.count} sold
                      </span>
                    </div>
                    <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-violet-500 rounded-full"
                        style={{
                          width: `${(item.count / topItems[0].count) * 100}%`,
                        }}
                      />
                    </div>
                  </div>
                </div>
              ))}
              {topItems.length === 0 && (
                <p className="text-slate-500 text-sm">No order data yet</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── INVENTORY REPORT ── */}
      {activeReport === "inventory" && (
        <div className="space-y-6">
          {/* KPIs */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {[
              {
                label: "Total Items",
                value: inventory.length,
                color: "text-white",
                bg: "bg-slate-800/50 border-slate-700",
              },
              {
                label: "Good Stock",
                value: goodItems.length,
                color: "text-green-400",
                bg: "bg-green-500/10 border-green-500/20",
              },
              {
                label: "Needs Attention",
                value: criticalItems.length + lowItems.length,
                color: "text-red-400",
                bg: "bg-red-500/10 border-red-500/20",
              },
            ].map((s) => (
              <div key={s.label} className={`border rounded-xl p-4 ${s.bg}`}>
                <p className="text-xs text-slate-400 mb-1">{s.label}</p>
                <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
              </div>
            ))}
          </div>

          {/* Inventory table */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-slate-800">
              <h2 className="text-lg font-semibold">Full Inventory Status</h2>
              <button
                onClick={() =>
                  exportCSV(
                    inventory.map((i) => ({
                      name: i.name,
                      stock: i.stock,
                      threshold: i.threshold,
                      unit: i.unit,
                      supplier: i.supplier,
                      status: i.status,
                    })),
                    "inventory-report",
                  )
                }
                className="flex items-center gap-2 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 rounded-xl text-xs transition-colors"
              >
                <Download className="w-3.5 h-3.5" />
                Export CSV
              </button>
            </div>
            <table className="w-full text-sm">
              <thead className="bg-slate-800/50">
                <tr>
                  <th className="p-3 text-left text-xs text-slate-400 font-medium">
                    Item
                  </th>
                  <th className="p-3 text-xs text-slate-400 font-medium">
                    Stock
                  </th>
                  <th className="p-3 text-xs text-slate-400 font-medium">
                    Threshold
                  </th>
                  <th className="p-3 text-xs text-slate-400 font-medium">
                    Supplier
                  </th>
                  <th className="p-3 text-xs text-slate-400 font-medium">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {inventory.map((item) => (
                  <tr key={item._id} className="hover:bg-slate-800/30">
                    <td className="p-3 font-medium">{item.name}</td>
                    <td className="p-3 text-center">
                      {item.stock} {item.unit}
                    </td>
                    <td className="p-3 text-center text-slate-400">
                      {item.threshold} {item.unit}
                    </td>
                    <td className="p-3 text-slate-400">{item.supplier}</td>
                    <td className="p-3 text-center">
                      <span
                        className={`px-2 py-0.5 rounded-full text-xs capitalize ${
                          item.status === "good"
                            ? "bg-green-500/20 text-green-400"
                            : item.status === "low"
                              ? "bg-orange-500/20 text-orange-400"
                              : "bg-red-500/20 text-red-400"
                        }`}
                      >
                        {item.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── STAFF REPORT ── */}
      {activeReport === "staff" && (
        <div className="space-y-6">
          {/* KPIs */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              {
                label: "Total Staff",
                value: staff.length,
                color: "text-white",
                bg: "bg-slate-800/50 border-slate-700",
              },
              {
                label: "Active",
                value: activeStaff.length,
                color: "text-green-400",
                bg: "bg-green-500/10 border-green-500/20",
              },
              {
                label: "On Leave",
                value: staff.filter((s) => s.status === "on-leave").length,
                color: "text-orange-400",
                bg: "bg-orange-500/10 border-orange-500/20",
              },
              {
                label: "Avg Rating",
                value: `${avgRating}★`,
                color: "text-yellow-400",
                bg: "bg-yellow-500/10 border-yellow-500/20",
              },
            ].map((s) => (
              <div key={s.label} className={`border rounded-xl p-4 ${s.bg}`}>
                <p className="text-xs text-slate-400 mb-1">{s.label}</p>
                <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
              </div>
            ))}
          </div>

          {/* Staff by role chart */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold">Staff by Role</h2>
              <button
                onClick={() =>
                  exportCSV(
                    staff.map((s) => ({
                      name: s.name,
                      role: s.role,
                      status: s.status,
                      email: s.email,
                      phone: s.phone,
                      salary: s.salary,
                      rating: s.performance?.rating || 0,
                      joinDate: new Date(s.joinDate).toLocaleDateString(),
                    })),
                    "staff-report",
                  )
                }
                className="flex items-center gap-2 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 rounded-xl text-xs transition-colors"
              >
                <Download className="w-3.5 h-3.5" />
                Export CSV
              </button>
            </div>
            {staffRoleData.length > 0 ? (
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={staffRoleData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis
                    dataKey="role"
                    stroke="#475569"
                    tick={{ fill: "#94a3b8", fontSize: 12 }}
                  />
                  <YAxis
                    stroke="#475569"
                    tick={{ fill: "#94a3b8", fontSize: 12 }}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#1e293b",
                      border: "1px solid #334155",
                      borderRadius: "8px",
                    }}
                    labelStyle={{ color: "#f1f5f9" }}
                  />
                  <Bar
                    dataKey="count"
                    fill="#8b5cf6"
                    radius={[4, 4, 0, 0]}
                    name="Count"
                  />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-48 text-slate-500">
                <p>No staff data yet</p>
              </div>
            )}
          </div>

          {/* Staff performance table */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
            <div className="p-4 border-b border-slate-800">
              <h2 className="text-lg font-semibold">Performance Overview</h2>
            </div>
            <table className="w-full text-sm">
              <thead className="bg-slate-800/50">
                <tr>
                  <th className="p-3 text-left text-xs text-slate-400 font-medium">
                    Name
                  </th>
                  <th className="p-3 text-xs text-slate-400 font-medium">
                    Role
                  </th>
                  <th className="p-3 text-xs text-slate-400 font-medium">
                    Status
                  </th>
                  <th className="p-3 text-xs text-slate-400 font-medium">
                    Rating
                  </th>
                  <th className="p-3 text-xs text-slate-400 font-medium">
                    Salary
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {staff.map((member) => (
                  <tr key={member._id} className="hover:bg-slate-800/30">
                    <td className="p-3">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center text-xs font-bold">
                          {member.name.charAt(0)}
                        </div>
                        <span className="font-medium">{member.name}</span>
                      </div>
                    </td>
                    <td className="p-3 text-center capitalize text-slate-400">
                      {member.role}
                    </td>
                    <td className="p-3 text-center">
                      <span
                        className={`px-2 py-0.5 rounded-full text-xs capitalize ${
                          member.status === "active"
                            ? "bg-green-500/20 text-green-400"
                            : member.status === "on-leave"
                              ? "bg-orange-500/20 text-orange-400"
                              : "bg-slate-500/20 text-slate-400"
                        }`}
                      >
                        {member.status}
                      </span>
                    </td>
                    <td className="p-3 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <span className="text-yellow-400">
                          {"★".repeat(member.performance?.rating || 0)}
                        </span>
                        <span className="text-slate-600">
                          {"★".repeat(5 - (member.performance?.rating || 0))}
                        </span>
                      </div>
                    </td>
                    <td className="p-3 text-center text-green-400 font-medium">
                      ${member.salary?.toLocaleString()}/mo
                    </td>
                  </tr>
                ))}
                {staff.length === 0 && (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-slate-500">
                      No staff data yet
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
