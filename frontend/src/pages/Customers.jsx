import { useEffect, useState } from "react";
import {
  Plus,
  Search,
  X,
  Star,
  Phone,
  Mail,
  Trash2,
  UserCircle,
  Gift,
} from "lucide-react";
import { toast } from "sonner";
import { API_BASE } from "../config";

const STATUS_CONFIG = {
  active: {
    badge: "bg-green-500/20 text-green-400 border-green-500/30",
    dot: "bg-green-400",
  },
  vip: {
    badge: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
    dot: "bg-yellow-400",
  },
  inactive: {
    badge: "bg-slate-500/20 text-slate-400 border-slate-500/30",
    dot: "bg-slate-400",
  },
};

const EMPTY_FORM = { name: "", phone: "", email: "", notes: "" };

export default function CustomersPage() {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [showForm, setShowForm] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);

  /* ── Fetch ── */
  const fetchCustomers = async () => {
    try {
      const res = await fetch(`${API_BASE}/customers`);
      const data = await res.json();
      setCustomers(Array.isArray(data) ? data : []);
    } catch {
      toast.error("Failed to fetch customers");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  /* ── Add customer ── */
  const handleAdd = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch(`${API_BASE}/customers`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error);
      }
      toast.success(`${form.name} added`);
      setShowForm(false);
      setForm(EMPTY_FORM);
      fetchCustomers();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  /* ── Update loyalty points ── */
  const updatePoints = async (id, points) => {
    try {
      await fetch(`${API_BASE}/customers/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ loyaltyPoints: points }),
      });
      fetchCustomers();
      toast.success("Loyalty points updated");
    } catch {
      toast.error("Failed to update points");
    }
  };

  /* ── Delete ── */
  const handleDelete = async (id) => {
    try {
      await fetch(`${API_BASE}/customers/${id}`, { method: "DELETE" });
      toast.success("Customer removed");
      setSelectedCustomer(null);
      fetchCustomers();
    } catch {
      toast.error("Failed to delete customer");
    }
  };

  /* ── Stats ── */
  const stats = {
    total: customers.length,
    vip: customers.filter((c) => c.status === "vip").length,
    totalRevenue: customers.reduce((sum, c) => sum + (c.totalSpent || 0), 0),
    avgPoints: customers.length
      ? Math.round(
          customers.reduce((sum, c) => sum + (c.loyaltyPoints || 0), 0) /
            customers.length,
        )
      : 0,
  };

  /* ── Filter ── */
  const filtered = customers.filter((c) => {
    const matchesSearch =
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.phone.includes(searchTerm) ||
      c.email?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === "all" || c.status === filterStatus;
    return matchesSearch && matchesStatus;
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
          <h1 className="text-3xl font-bold">Customers</h1>
          <p className="text-slate-400 text-sm mt-1">
            Manage customer relationships and loyalty
          </p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-violet-600 hover:bg-violet-500 rounded-xl transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add Customer
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          {
            label: "Total Customers",
            value: stats.total,
            color: "text-white",
            bg: "bg-slate-800/50 border-slate-700",
          },
          {
            label: "VIP Members",
            value: stats.vip,
            color: "text-yellow-400",
            bg: "bg-yellow-500/10 border-yellow-500/20",
          },
          {
            label: "Total Revenue",
            value: `$${stats.totalRevenue.toFixed(2)}`,
            color: "text-green-400",
            bg: "bg-green-500/10 border-green-500/20",
          },
          {
            label: "Avg Points",
            value: stats.avgPoints,
            color: "text-violet-400",
            bg: "bg-violet-500/10 border-violet-500/20",
          },
        ].map((s) => (
          <div key={s.label} className={`border rounded-xl p-4 ${s.bg}`}>
            <p className="text-xs text-slate-400 mb-1">{s.label}</p>
            <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Search + Filter */}
      <div className="flex flex-col md:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            placeholder="Search by name, phone or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-sm focus:outline-none focus:border-violet-500/50"
          />
        </div>
        <div className="flex gap-2">
          {["all", "active", "vip", "inactive"].map((s) => (
            <button
              key={s}
              onClick={() => setFilterStatus(s)}
              className={`px-3 py-2 rounded-xl text-xs capitalize transition-colors ${
                filterStatus === s
                  ? "bg-violet-600 text-white"
                  : "bg-slate-800 text-slate-400 hover:bg-slate-700"
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Customer Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-800/50">
            <tr>
              <th className="p-3 text-left text-xs text-slate-400 font-medium">
                Customer
              </th>
              <th className="p-3 text-xs text-slate-400 font-medium">
                Contact
              </th>
              <th className="p-3 text-xs text-slate-400 font-medium">Visits</th>
              <th className="p-3 text-xs text-slate-400 font-medium">
                Total Spent
              </th>
              <th className="p-3 text-xs text-slate-400 font-medium">Points</th>
              <th className="p-3 text-xs text-slate-400 font-medium">Status</th>
              <th className="p-3 text-xs text-slate-400 font-medium">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800">
            {filtered.map((c) => (
              <tr
                key={c._id}
                className="hover:bg-slate-800/30 transition-colors group"
              >
                <td className="p-3">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center font-bold text-sm">
                      {c.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="font-medium text-white">{c.name}</p>
                      <p className="text-xs text-slate-500">
                        Since {new Date(c.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </td>
                <td className="p-3">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-1 text-xs text-slate-400">
                      <Phone className="w-3 h-3" />
                      {c.phone}
                    </div>
                    {c.email && (
                      <div className="flex items-center gap-1 text-xs text-slate-400">
                        <Mail className="w-3 h-3" />
                        {c.email}
                      </div>
                    )}
                  </div>
                </td>
                <td className="p-3 text-center text-slate-300">
                  {c.visits?.length || 0}
                </td>
                <td className="p-3 text-center font-semibold text-green-400">
                  ${(c.totalSpent || 0).toFixed(2)}
                </td>
                <td className="p-3 text-center">
                  <div className="flex items-center justify-center gap-1">
                    <Gift className="w-3 h-3 text-violet-400" />
                    <span className="font-medium text-violet-400">
                      {c.loyaltyPoints || 0}
                    </span>
                  </div>
                </td>
                <td className="p-3 text-center">
                  <span
                    className={`px-2.5 py-1 rounded-full text-xs font-medium border capitalize ${
                      STATUS_CONFIG[c.status]?.badge
                    }`}
                  >
                    {c.status === "vip" ? "⭐ VIP" : c.status}
                  </span>
                </td>
                <td className="p-3">
                  <div className="flex items-center justify-center gap-2">
                    <button
                      onClick={() => setSelectedCustomer(c)}
                      className="px-2.5 py-1.5 bg-violet-600 hover:bg-violet-500 rounded-lg text-xs transition-colors"
                    >
                      View
                    </button>
                    <button
                      onClick={() => handleDelete(c._id)}
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

        {filtered.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 text-slate-500">
            <UserCircle className="w-12 h-12 mb-3 opacity-30" />
            <p className="text-lg font-medium">No customers found</p>
            <p className="text-sm mt-1">Add your first customer</p>
          </div>
        )}
      </div>

      {/* Customer Detail Modal */}
      {selectedCustomer && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="p-6 space-y-5">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center text-2xl font-bold">
                    {selectedCustomer.name.charAt(0)}
                  </div>
                  <div>
                    <h2 className="text-xl font-bold">
                      {selectedCustomer.name}
                    </h2>
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full border capitalize ${
                        STATUS_CONFIG[selectedCustomer.status]?.badge
                      }`}
                    >
                      {selectedCustomer.status === "vip"
                        ? "⭐ VIP Member"
                        : selectedCustomer.status}
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedCustomer(null)}
                  className="p-2 hover:bg-slate-800 rounded-lg"
                >
                  <X className="w-5 h-5 text-slate-400" />
                </button>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-3">
                {[
                  {
                    label: "Total Visits",
                    value: selectedCustomer.visits?.length || 0,
                  },
                  {
                    label: "Total Spent",
                    value: `$${(selectedCustomer.totalSpent || 0).toFixed(2)}`,
                  },
                  {
                    label: "Points",
                    value: selectedCustomer.loyaltyPoints || 0,
                  },
                ].map((s) => (
                  <div
                    key={s.label}
                    className="bg-slate-800 rounded-xl p-3 text-center"
                  >
                    <p className="text-xs text-slate-400 mb-1">{s.label}</p>
                    <p className="text-lg font-bold text-violet-400">
                      {s.value}
                    </p>
                  </div>
                ))}
              </div>

              {/* Loyalty points control */}
              <div>
                <p className="text-xs text-slate-400 mb-2">
                  Adjust Loyalty Points
                </p>
                <div className="flex gap-2">
                  {[-50, -10, +10, +50, +100].map((delta) => (
                    <button
                      key={delta}
                      onClick={() =>
                        updatePoints(
                          selectedCustomer._id,
                          Math.max(
                            0,
                            (selectedCustomer.loyaltyPoints || 0) + delta,
                          ),
                        )
                      }
                      className={`flex-1 py-1.5 rounded-xl text-xs font-medium transition-colors ${
                        delta < 0
                          ? "bg-red-500/10 text-red-400 hover:bg-red-500/20"
                          : "bg-green-500/10 text-green-400 hover:bg-green-500/20"
                      }`}
                    >
                      {delta > 0 ? `+${delta}` : delta}
                    </button>
                  ))}
                </div>
              </div>

              {/* Visit history */}
              {selectedCustomer.visits?.length > 0 && (
                <div>
                  <p className="text-xs text-slate-400 mb-2">Visit History</p>
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {[...selectedCustomer.visits].reverse().map((visit, i) => (
                      <div
                        key={i}
                        className="flex items-center justify-between bg-slate-800 px-3 py-2 rounded-lg text-sm"
                      >
                        <span className="text-slate-400 text-xs">
                          {new Date(visit.date).toLocaleDateString()}
                        </span>
                        <span className="text-slate-300">
                          Table {visit.tableNumber}
                        </span>
                        <span className="font-medium text-green-400">
                          ${visit.amount?.toFixed(2)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Notes */}
              {selectedCustomer.notes && (
                <div className="p-3 bg-slate-800 rounded-xl">
                  <p className="text-xs text-slate-400 mb-1">Notes</p>
                  <p className="text-sm text-slate-300">
                    {selectedCustomer.notes}
                  </p>
                </div>
              )}

              <button
                onClick={() => handleDelete(selectedCustomer._id)}
                className="w-full py-2.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 rounded-xl transition-colors text-sm flex items-center justify-center gap-2"
              >
                <Trash2 className="w-4 h-4" />
                Remove Customer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Customer Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-md p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold">Add Customer</h2>
              <button
                onClick={() => setShowForm(false)}
                className="p-2 hover:bg-slate-800 rounded-lg"
              >
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>

            <form onSubmit={handleAdd} className="space-y-3">
              <div>
                <label className="block text-xs text-slate-400 mb-1">
                  Full Name *
                </label>
                <input
                  required
                  placeholder="e.g. Jane Doe"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-sm focus:outline-none focus:border-violet-500/50"
                />
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1">
                  Phone *
                </label>
                <input
                  required
                  placeholder="+1 234 567 8900"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-sm focus:outline-none focus:border-violet-500/50"
                />
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  placeholder="jane@email.com"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-sm focus:outline-none focus:border-violet-500/50"
                />
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1">
                  Notes
                </label>
                <textarea
                  rows={2}
                  placeholder="Allergies, preferences..."
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-sm focus:outline-none focus:border-violet-500/50 resize-none"
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="flex-1 py-2.5 bg-slate-700 hover:bg-slate-600 rounded-xl text-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 py-2.5 bg-violet-600 hover:bg-violet-500 disabled:opacity-50 rounded-xl font-medium text-sm"
                >
                  {submitting ? "Adding..." : "Add Customer"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
