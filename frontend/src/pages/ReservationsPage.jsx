import { useEffect, useState } from "react";
import {
  Plus,
  Calendar,
  Users,
  Phone,
  Clock,
  X,
  CheckCircle,
  Search,
} from "lucide-react";
import { toast } from "sonner";
import { API_BASE } from "../config";

const STATUS_CONFIG = {
  pending: {
    badge: "bg-slate-500/20 text-slate-300 border-slate-500/30",
    dot: "bg-slate-400",
  },
  confirmed: {
    badge: "bg-blue-500/20 text-blue-400 border-blue-500/30",
    dot: "bg-blue-400",
  },
  seated: {
    badge: "bg-green-500/20 text-green-400 border-green-500/30",
    dot: "bg-green-400",
  },
  cancelled: {
    badge: "bg-red-500/20 text-red-400 border-red-500/30",
    dot: "bg-red-400",
  },
};

const EMPTY_FORM = {
  customerName: "",
  phone: "",
  date: "",
  time: "",
  guests: 2,
  notes: "",
};

export default function ReservationsPage() {
  const [reservations, setReservations] = useState([]);
  const [tables, setTables] = useState([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [form, setForm] = useState(EMPTY_FORM);

  /* ── Fetch ── */
  const fetchReservations = async () => {
    try {
      const res = await fetch(`${API_BASE}/reservations`);
      const data = await res.json();
      setReservations(Array.isArray(data) ? data : []);
    } catch {
      toast.error("Failed to fetch reservations");
    } finally {
      setLoading(false);
    }
  };

  const fetchTables = async () => {
    try {
      const res = await fetch(`${API_BASE}/tables`);
      const data = await res.json();
      setTables(Array.isArray(data) ? data : []);
    } catch {
      console.error("Failed to fetch tables");
    }
  };

  useEffect(() => {
    fetchReservations();
    fetchTables();
    const interval = setInterval(() => {
      fetchReservations();
      fetchTables();
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  /* ── Auto-cancel no-shows ── */
  useEffect(() => {
    const interval = setInterval(async () => {
      const now = new Date();
      for (const r of reservations) {
        if (
          r.status === "confirmed" &&
          new Date(`${r.date}T${r.time}`) < new Date(now.getTime() - 30 * 60000)
        ) {
          try {
            await fetch(`${API_BASE}/reservations/${r._id}/status`, {
              method: "PUT",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ status: "cancelled" }),
            });
            if (r.tableId) {
              await fetch(`${API_BASE}/tables/${r.tableId._id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ status: "available" }),
              });
            }
            toast.info(
              `${r.customerName}'s reservation auto-cancelled (no-show)`,
            );
          } catch {
            console.error("Auto-cancel failed");
          }
        }
      }
      fetchReservations();
      fetchTables();
    }, 30000);
    return () => clearInterval(interval);
  }, [reservations]);

  /* ── Create reservation ── */
  const submit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch(`${API_BASE}/reservations`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, status: "pending" }),
      });
      if (!res.ok) throw new Error();
      toast.success(`Reservation created for ${form.customerName}`);
      setForm(EMPTY_FORM);
      setOpen(false);
      fetchReservations();
    } catch {
      toast.error("Failed to create reservation");
    } finally {
      setSubmitting(false);
    }
  };

  /* ── Confirm + seat reservation ── */
  const confirmReservation = async (r) => {
    const table = tables.find(
      (t) => t.status === "available" && t.seats >= r.guests,
    );

    if (!table) {
      toast.error(`No available table for ${r.guests} guests`);
      return;
    }

    try {
      // Backend handles table status — single source of truth
      await fetch(`${API_BASE}/reservations/${r._id}/seat`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tableId: table._id }),
      });

      toast.success(`${r.customerName} seated at Table ${table.number}`);
      fetchReservations();
      fetchTables();
    } catch {
      toast.error("Failed to confirm reservation");
    }
  };

  /* ── Cancel reservation ── */
  const cancelReservation = async (r) => {
    try {
      await fetch(`${API_BASE}/reservations/${r._id}/status`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "cancelled" }),
      });
      if (r.tableId) {
        await fetch(`${API_BASE}/tables/${r.tableId._id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: "available" }),
        });
      }
      toast.success("Reservation cancelled");
      fetchReservations();
      fetchTables();
    } catch {
      toast.error("Failed to cancel reservation");
    }
  };

  /* ── Stats ── */
  const stats = {
    total: reservations.length,
    pending: reservations.filter((r) => r.status === "pending").length,
    confirmed: reservations.filter((r) => r.status === "confirmed").length,
    seated: reservations.filter((r) => r.status === "seated").length,
    today: reservations.filter(
      (r) => r.date === new Date().toISOString().split("T")[0],
    ).length,
  };

  /* ── Filter ── */
  const filtered = reservations.filter((r) => {
    const matchesSearch =
      r.customerName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.phone?.includes(searchTerm);
    const matchesStatus = filterStatus === "all" || r.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  if (loading) {
    return (
      <div className="p-8 bg-slate-950 min-h-screen text-white space-y-4">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-14 bg-slate-800 rounded-xl animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="p-8 bg-slate-950 min-h-screen text-white space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Reservations</h1>
          <p className="text-slate-400 text-sm mt-1">
            Manage customer bookings and seating
          </p>
        </div>
        <button
          onClick={() => setOpen(true)}
          className="flex items-center gap-2 bg-violet-600 hover:bg-violet-500 px-4 py-2.5 rounded-xl transition-colors"
        >
          <Plus className="w-4 h-4" />
          New Reservation
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {[
          {
            label: "Total",
            value: stats.total,
            color: "text-white",
            bg: "bg-slate-800/50 border-slate-700",
          },
          {
            label: "Today",
            value: stats.today,
            color: "text-violet-400",
            bg: "bg-violet-500/10 border-violet-500/20",
          },
          {
            label: "Pending",
            value: stats.pending,
            color: "text-slate-300",
            bg: "bg-slate-500/10 border-slate-500/20",
          },
          {
            label: "Confirmed",
            value: stats.confirmed,
            color: "text-blue-400",
            bg: "bg-blue-500/10 border-blue-500/20",
          },
          {
            label: "Seated",
            value: stats.seated,
            color: "text-green-400",
            bg: "bg-green-500/10 border-green-500/20",
          },
        ].map((s) => (
          <div
            key={s.label}
            onClick={() =>
              setFilterStatus(
                s.label.toLowerCase() === "total" ||
                  s.label.toLowerCase() === "today"
                  ? "all"
                  : s.label.toLowerCase(),
              )
            }
            className={`border rounded-xl p-4 cursor-pointer transition-all hover:-translate-y-0.5 ${s.bg} ${
              filterStatus === s.label.toLowerCase()
                ? "ring-2 ring-violet-500/50"
                : ""
            }`}
          >
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
            placeholder="Search by name or phone..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-sm focus:outline-none focus:border-violet-500/50 transition-colors"
          />
        </div>
        <div className="flex gap-2">
          {["all", "pending", "confirmed", "seated", "cancelled"].map((s) => (
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

      {/* Reservations Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-800/50">
            <tr>
              <th className="p-3 text-left text-xs text-slate-400 font-medium">
                Customer
              </th>
              <th className="p-3 text-xs text-slate-400 font-medium">
                Date & Time
              </th>
              <th className="p-3 text-xs text-slate-400 font-medium">Guests</th>
              <th className="p-3 text-xs text-slate-400 font-medium">Status</th>
              <th className="p-3 text-xs text-slate-400 font-medium">Table</th>
              <th className="p-3 text-xs text-slate-400 font-medium">Notes</th>
              <th className="p-3 text-xs text-slate-400 font-medium">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800">
            {filtered.map((r) => {
              const config = STATUS_CONFIG[r.status] || STATUS_CONFIG.pending;
              return (
                <tr
                  key={r._id}
                  className="hover:bg-slate-800/30 transition-colors"
                >
                  {/* Customer */}
                  <td className="p-3">
                    <div>
                      <p className="font-medium text-white">{r.customerName}</p>
                      <div className="flex items-center gap-1 text-xs text-slate-400 mt-0.5">
                        <Phone className="w-3 h-3" />
                        {r.phone}
                      </div>
                    </div>
                  </td>

                  {/* Date & Time */}
                  <td className="p-3">
                    <div className="flex flex-col items-center gap-0.5">
                      <div className="flex items-center gap-1 text-xs text-slate-300">
                        <Calendar className="w-3 h-3 text-slate-400" />
                        {r.date}
                      </div>
                      <div className="flex items-center gap-1 text-xs text-slate-400">
                        <Clock className="w-3 h-3" />
                        {r.time}
                      </div>
                    </div>
                  </td>

                  {/* Guests */}
                  <td className="p-3">
                    <div className="flex items-center justify-center gap-1 text-slate-300">
                      <Users className="w-3.5 h-3.5 text-slate-400" />
                      {r.guests}
                    </div>
                  </td>

                  {/* Status */}
                  <td className="p-3">
                    <div className="flex justify-center">
                      <span
                        className={`px-2.5 py-1 rounded-full text-xs font-medium border capitalize ${config.badge}`}
                      >
                        <span
                          className={`inline-block w-1.5 h-1.5 rounded-full ${config.dot} mr-1.5`}
                        />
                        {r.status}
                      </span>
                    </div>
                  </td>

                  {/* Table */}
                  <td className="p-3 text-center">
                    {r.tableId ? (
                      <span className="text-sm font-medium text-violet-400">
                        Table {r.tableId.number}
                      </span>
                    ) : (
                      <span className="text-slate-500">—</span>
                    )}
                  </td>

                  {/* Notes */}
                  <td className="p-3 text-center">
                    {r.specialRequests ? (
                      <span
                        className="text-xs text-slate-400 max-w-[120px] truncate block"
                        title={r.specialRequests}
                      >
                        {r.specialRequests}
                      </span>
                    ) : (
                      <span className="text-slate-600">—</span>
                    )}
                  </td>

                  {/* Actions */}
                  <td className="p-3">
                    <div className="flex items-center justify-center gap-2">
                      {r.status === "pending" && (
                        <button
                          onClick={() => confirmReservation(r)}
                          className="flex items-center gap-1 px-2.5 py-1.5 bg-green-600 hover:bg-green-500 rounded-lg text-xs transition-colors"
                        >
                          <CheckCircle className="w-3 h-3" />
                          Seat
                        </button>
                      )}
                      {(r.status === "pending" || r.status === "confirmed") && (
                        <button
                          onClick={() => cancelReservation(r)}
                          className="flex items-center gap-1 px-2.5 py-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 rounded-lg text-xs transition-colors"
                        >
                          <X className="w-3 h-3" />
                          Cancel
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {filtered.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 text-slate-500">
            <Calendar className="w-12 h-12 mb-3 opacity-30" />
            <p className="text-lg font-medium">No reservations found</p>
            <p className="text-sm mt-1">
              {searchTerm
                ? "Try a different search"
                : "Create your first reservation"}
            </p>
          </div>
        )}
      </div>

      {/* New Reservation Modal */}
      {open && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-lg p-6 space-y-4">
            {/* Modal header */}
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold">New Reservation</h2>
              <button
                onClick={() => setOpen(false)}
                className="p-2 hover:bg-slate-800 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>

            <div className="space-y-3">
              {/* Name */}
              <div>
                <label className="block text-xs text-slate-400 mb-1">
                  Customer Name *
                </label>
                <input
                  required
                  placeholder="e.g. John Smith"
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-violet-500/50 transition-colors"
                  value={form.customerName}
                  onChange={(e) =>
                    setForm({ ...form, customerName: e.target.value })
                  }
                />
              </div>

              {/* Phone */}
              <div>
                <label className="block text-xs text-slate-400 mb-1">
                  Phone Number *
                </label>
                <input
                  required
                  placeholder="+1 234 567 8900"
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-violet-500/50 transition-colors"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                />
              </div>

              {/* Date + Time */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-slate-400 mb-1">
                    Date *
                  </label>
                  <input
                    type="date"
                    required
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-violet-500/50 transition-colors"
                    value={form.date}
                    onChange={(e) => setForm({ ...form, date: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1">
                    Time *
                  </label>
                  <input
                    type="time"
                    required
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-violet-500/50 transition-colors"
                    value={form.time}
                    onChange={(e) => setForm({ ...form, time: e.target.value })}
                  />
                </div>
              </div>

              {/* Guests */}
              <div>
                <label className="block text-xs text-slate-400 mb-1">
                  Number of Guests *
                </label>
                <input
                  type="number"
                  min="1"
                  max="20"
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-violet-500/50 transition-colors"
                  value={form.guests}
                  onChange={(e) =>
                    setForm({ ...form, guests: Number(e.target.value) })
                  }
                />
              </div>

              {/* Notes */}
              <div>
                <label className="block text-xs text-slate-400 mb-1">
                  Special Requests
                </label>
                <textarea
                  rows={3}
                  placeholder="Allergies, birthday, high chair needed..."
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-violet-500/50 transition-colors resize-none"
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                />
              </div>
            </div>

            {/* Buttons */}
            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="flex-1 py-2.5 bg-slate-700 hover:bg-slate-600 rounded-xl transition-colors text-sm"
              >
                Cancel
              </button>
              <button
                onClick={submit}
                disabled={submitting}
                className="flex-1 py-2.5 bg-violet-600 hover:bg-violet-500 disabled:opacity-50 rounded-xl font-medium transition-colors text-sm"
              >
                {submitting ? "Creating..." : "Create Reservation"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
