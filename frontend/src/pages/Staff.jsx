import { useEffect, useState } from "react";
import {
  Plus,
  Search,
  X,
  Star,
  Calendar,
  Phone,
  Mail,
  Trash2,
  Users,
} from "lucide-react";
import { toast } from "sonner";
import { API_BASE } from "../config";

const ROLES = ["manager", "waiter", "chef", "bartender", "host", "cashier"];
const DAYS = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];

const ROLE_CONFIG = {
  manager: { color: "bg-violet-500/20 text-violet-400 border-violet-500/30" },
  waiter: { color: "bg-blue-500/20 text-blue-400 border-blue-500/30" },
  chef: { color: "bg-orange-500/20 text-orange-400 border-orange-500/30" },
  bartender: { color: "bg-green-500/20 text-green-400 border-green-500/30" },
  host: { color: "bg-pink-500/20 text-pink-400 border-pink-500/30" },
  cashier: { color: "bg-cyan-500/20 text-cyan-400 border-cyan-500/30" },
};

const STATUS_CONFIG = {
  active: { color: "bg-green-500/20 text-green-400", dot: "bg-green-400" },
  inactive: { color: "bg-slate-500/20 text-slate-400", dot: "bg-slate-400" },
  "on-leave": {
    color: "bg-orange-500/20 text-orange-400",
    dot: "bg-orange-400",
  },
};

const EMPTY_FORM = {
  name: "",
  email: "",
  phone: "",
  role: "waiter",
  salary: "",
  shifts: [],
};

export default function StaffPage() {
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterRole, setFilterRole] = useState("all");
  const [showForm, setShowForm] = useState(false);
  const [selectedMember, setSelectedMember] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [newShift, setNewShift] = useState({
    day: "Monday",
    startTime: "09:00",
    endTime: "17:00",
  });

  /* ── Fetch staff ── */
  const fetchStaff = async () => {
    try {
      const res = await fetch(`${API_BASE}/staff`);
      const data = await res.json();
      setStaff(Array.isArray(data) ? data : []);
    } catch {
      toast.error("Failed to fetch staff");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStaff();
  }, []);

  /* ── Add staff ── */
  const handleAdd = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch(`${API_BASE}/staff`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, salary: Number(form.salary) }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error);
      }
      toast.success(`${form.name} added to staff`);
      setShowForm(false);
      setForm(EMPTY_FORM);
      fetchStaff();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  /* ── Update status ── */
  const updateStatus = async (id, status) => {
    try {
      await fetch(`${API_BASE}/staff/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      fetchStaff();
      if (selectedMember?._id === id) {
        setSelectedMember((prev) => ({ ...prev, status }));
      }
      toast.success("Status updated");
    } catch {
      toast.error("Failed to update status");
    }
  };

  /* ── Update performance ── */
  const updatePerformance = async (id, performance) => {
    try {
      await fetch(`${API_BASE}/staff/${id}/performance`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(performance),
      });
      fetchStaff();
      toast.success("Performance updated");
    } catch {
      toast.error("Failed to update performance");
    }
  };

  /* ── Delete staff ── */
  const handleDelete = async (id) => {
    try {
      await fetch(`${API_BASE}/staff/${id}`, { method: "DELETE" });
      toast.success("Staff member removed");
      setSelectedMember(null);
      fetchStaff();
    } catch {
      toast.error("Failed to delete staff member");
    }
  };

  /* ── Add shift to form ── */
  const addShift = () => {
    if (form.shifts.find((s) => s.day === newShift.day)) {
      toast.error("Shift for this day already added");
      return;
    }
    setForm((prev) => ({ ...prev, shifts: [...prev.shifts, { ...newShift }] }));
  };

  const removeShift = (day) => {
    setForm((prev) => ({
      ...prev,
      shifts: prev.shifts.filter((s) => s.day !== day),
    }));
  };

  /* ── Stats ── */
  const stats = {
    total: staff.length,
    active: staff.filter((s) => s.status === "active").length,
    onLeave: staff.filter((s) => s.status === "on-leave").length,
    avgRating: staff.length
      ? (
          staff.reduce((sum, s) => sum + (s.performance?.rating || 0), 0) /
          staff.length
        ).toFixed(1)
      : "0.0",
  };

  /* ── Filter ── */
  const filtered = staff.filter((s) => {
    const matchesSearch =
      s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = filterRole === "all" || s.role === filterRole;
    return matchesSearch && matchesRole;
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
          <h1 className="text-3xl font-bold">Staff</h1>
          <p className="text-slate-400 text-sm mt-1">
            Manage your restaurant team
          </p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-violet-600 hover:bg-violet-500 rounded-xl transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add Staff
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          {
            label: "Total Staff",
            value: stats.total,
            color: "text-white",
            bg: "bg-slate-800/50 border-slate-700",
          },
          {
            label: "Active",
            value: stats.active,
            color: "text-green-400",
            bg: "bg-green-500/10 border-green-500/20",
          },
          {
            label: "On Leave",
            value: stats.onLeave,
            color: "text-orange-400",
            bg: "bg-orange-500/10 border-orange-500/20",
          },
          {
            label: "Avg Rating",
            value: `${stats.avgRating}★`,
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

      {/* Search + Filter */}
      <div className="flex flex-col md:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            placeholder="Search by name or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-sm focus:outline-none focus:border-violet-500/50 transition-colors"
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => setFilterRole("all")}
            className={`px-3 py-2 rounded-xl text-xs transition-colors ${
              filterRole === "all"
                ? "bg-violet-600 text-white"
                : "bg-slate-800 text-slate-400 hover:bg-slate-700"
            }`}
          >
            All
          </button>
          {ROLES.map((r) => (
            <button
              key={r}
              onClick={() => setFilterRole(r)}
              className={`px-3 py-2 rounded-xl text-xs capitalize transition-colors ${
                filterRole === r
                  ? "bg-violet-600 text-white"
                  : "bg-slate-800 text-slate-400 hover:bg-slate-700"
              }`}
            >
              {r}
            </button>
          ))}
        </div>
      </div>

      {/* Staff Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((member) => (
          <div
            key={member._id}
            onClick={() => setSelectedMember(member)}
            className="bg-slate-900 border border-slate-800 rounded-xl p-5 cursor-pointer hover:border-violet-500/30 transition-all hover:-translate-y-0.5 group"
          >
            {/* Header */}
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center text-lg font-bold">
                  {member.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h3 className="font-semibold text-white">{member.name}</h3>
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full border capitalize ${
                      ROLE_CONFIG[member.role]?.color ||
                      "bg-slate-500/20 text-slate-400"
                    }`}
                  >
                    {member.role}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-1.5">
                <div
                  className={`w-2 h-2 rounded-full ${STATUS_CONFIG[member.status]?.dot}`}
                />
                <span className="text-xs text-slate-400 capitalize">
                  {member.status}
                </span>
              </div>
            </div>

            {/* Info */}
            <div className="space-y-1.5 mb-4">
              <div className="flex items-center gap-2 text-xs text-slate-400">
                <Mail className="w-3 h-3" />
                {member.email}
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-400">
                <Phone className="w-3 h-3" />
                {member.phone}
              </div>
              {member.salary > 0 && (
                <div className="text-xs text-slate-400">
                  💰 ${member.salary.toLocaleString()}/month
                </div>
              )}
            </div>

            {/* Performance */}
            <div className="flex items-center justify-between pt-3 border-t border-slate-800">
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    className={`w-3 h-3 ${
                      star <= (member.performance?.rating || 0)
                        ? "text-yellow-400 fill-yellow-400"
                        : "text-slate-600"
                    }`}
                  />
                ))}
                <span className="text-xs text-slate-400 ml-1">
                  ({member.performance?.rating || 0})
                </span>
              </div>
              <span className="text-xs text-slate-500">
                {member.shifts?.length || 0} shifts/week
              </span>
            </div>
          </div>
        ))}

        {filtered.length === 0 && (
          <div className="col-span-full flex flex-col items-center justify-center py-16 text-slate-500">
            <Users className="w-12 h-12 mb-3 opacity-30" />
            <p className="text-lg font-medium">No staff found</p>
            <p className="text-sm mt-1">Add your first team member</p>
          </div>
        )}
      </div>

      {/* Staff Detail Modal */}
      {selectedMember && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="p-6 space-y-5">
              {/* Modal header */}
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center text-2xl font-bold">
                    {selectedMember.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h2 className="text-xl font-bold">{selectedMember.name}</h2>
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full border capitalize ${
                        ROLE_CONFIG[selectedMember.role]?.color
                      }`}
                    >
                      {selectedMember.role}
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedMember(null)}
                  className="p-2 hover:bg-slate-800 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-slate-400" />
                </button>
              </div>

              {/* Contact info */}
              <div className="grid grid-cols-2 gap-3 p-4 bg-slate-800 rounded-xl">
                <div>
                  <p className="text-xs text-slate-500 mb-1">Email</p>
                  <p className="text-sm text-slate-200">
                    {selectedMember.email}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 mb-1">Phone</p>
                  <p className="text-sm text-slate-200">
                    {selectedMember.phone}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 mb-1">Salary</p>
                  <p className="text-sm text-slate-200">
                    ${selectedMember.salary?.toLocaleString()}/mo
                  </p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 mb-1">Joined</p>
                  <p className="text-sm text-slate-200">
                    {new Date(selectedMember.joinDate).toLocaleDateString()}
                  </p>
                </div>
              </div>

              {/* Status control */}
              <div>
                <p className="text-xs text-slate-400 mb-2">Status</p>
                <div className="flex gap-2">
                  {["active", "on-leave", "inactive"].map((s) => (
                    <button
                      key={s}
                      onClick={() => updateStatus(selectedMember._id, s)}
                      className={`flex-1 py-2 rounded-xl text-xs capitalize transition-colors ${
                        selectedMember.status === s
                          ? "bg-violet-600 text-white"
                          : "bg-slate-800 text-slate-400 hover:bg-slate-700"
                      }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>

              {/* Performance */}
              <div>
                <p className="text-xs text-slate-400 mb-2">
                  Performance Rating
                </p>
                <div className="flex items-center gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      onClick={() =>
                        updatePerformance(selectedMember._id, {
                          ...selectedMember.performance,
                          rating: star,
                        })
                      }
                      className="transition-transform hover:scale-125"
                    >
                      <Star
                        className={`w-6 h-6 ${
                          star <= (selectedMember.performance?.rating || 0)
                            ? "text-yellow-400 fill-yellow-400"
                            : "text-slate-600"
                        }`}
                      />
                    </button>
                  ))}
                  <span className="text-sm text-slate-400 ml-2">
                    {selectedMember.performance?.rating || 0}/5
                  </span>
                </div>
              </div>

              {/* Feedback */}
              <div>
                <p className="text-xs text-slate-400 mb-2">Performance Notes</p>
                <textarea
                  rows={2}
                  defaultValue={selectedMember.performance?.feedback || ""}
                  onBlur={(e) =>
                    updatePerformance(selectedMember._id, {
                      ...selectedMember.performance,
                      feedback: e.target.value,
                    })
                  }
                  placeholder="Add performance notes..."
                  className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-sm focus:outline-none focus:border-violet-500/50 transition-colors resize-none"
                />
              </div>

              {/* Shifts */}
              {selectedMember.shifts?.length > 0 && (
                <div>
                  <p className="text-xs text-slate-400 mb-2 flex items-center gap-1">
                    <Calendar className="w-3 h-3" /> Schedule
                  </p>
                  <div className="space-y-2">
                    {selectedMember.shifts.map((shift, i) => (
                      <div
                        key={i}
                        className="flex items-center justify-between bg-slate-800 px-3 py-2 rounded-lg text-sm"
                      >
                        <span className="text-slate-300 font-medium w-24">
                          {shift.day}
                        </span>
                        <span className="text-slate-400">
                          {shift.startTime} — {shift.endTime}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Delete */}
              <button
                onClick={() => handleDelete(selectedMember._id)}
                className="w-full py-2.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 rounded-xl transition-colors text-sm flex items-center justify-center gap-2"
              >
                <Trash2 className="w-4 h-4" />
                Remove Staff Member
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Staff Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold">Add Staff Member</h2>
                <button
                  onClick={() => setShowForm(false)}
                  className="p-2 hover:bg-slate-800 rounded-lg"
                >
                  <X className="w-5 h-5 text-slate-400" />
                </button>
              </div>

              <form onSubmit={handleAdd} className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div className="col-span-2">
                    <label className="block text-xs text-slate-400 mb-1">
                      Full Name *
                    </label>
                    <input
                      required
                      placeholder="e.g. John Smith"
                      value={form.name}
                      onChange={(e) =>
                        setForm({ ...form, name: e.target.value })
                      }
                      className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-sm focus:outline-none focus:border-violet-500/50"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">
                      Email *
                    </label>
                    <input
                      required
                      type="email"
                      placeholder="john@restaurant.com"
                      value={form.email}
                      onChange={(e) =>
                        setForm({ ...form, email: e.target.value })
                      }
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
                      onChange={(e) =>
                        setForm({ ...form, phone: e.target.value })
                      }
                      className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-sm focus:outline-none focus:border-violet-500/50"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">
                      Role *
                    </label>
                    <select
                      value={form.role}
                      onChange={(e) =>
                        setForm({ ...form, role: e.target.value })
                      }
                      className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-sm focus:outline-none focus:border-violet-500/50"
                    >
                      {ROLES.map((r) => (
                        <option key={r} value={r} className="capitalize">
                          {r}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">
                      Monthly Salary ($)
                    </label>
                    <input
                      type="number"
                      placeholder="0"
                      value={form.salary}
                      onChange={(e) =>
                        setForm({ ...form, salary: e.target.value })
                      }
                      className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-sm focus:outline-none focus:border-violet-500/50"
                    />
                  </div>
                </div>

                {/* Shifts */}
                <div>
                  <label className="block text-xs text-slate-400 mb-2">
                    Add Shifts
                  </label>
                  <div className="flex gap-2 mb-2">
                    <select
                      value={newShift.day}
                      onChange={(e) =>
                        setNewShift({ ...newShift, day: e.target.value })
                      }
                      className="flex-1 px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs focus:outline-none"
                    >
                      {DAYS.map((d) => (
                        <option key={d}>{d}</option>
                      ))}
                    </select>
                    <input
                      type="time"
                      value={newShift.startTime}
                      onChange={(e) =>
                        setNewShift({ ...newShift, startTime: e.target.value })
                      }
                      className="px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs focus:outline-none"
                    />
                    <input
                      type="time"
                      value={newShift.endTime}
                      onChange={(e) =>
                        setNewShift({ ...newShift, endTime: e.target.value })
                      }
                      className="px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={addShift}
                      className="px-3 py-2 bg-violet-600 hover:bg-violet-500 rounded-xl text-xs"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                  {form.shifts.map((s) => (
                    <div
                      key={s.day}
                      className="flex items-center justify-between bg-slate-800 px-3 py-2 rounded-lg text-xs mb-1"
                    >
                      <span>
                        {s.day}: {s.startTime} — {s.endTime}
                      </span>
                      <button
                        onClick={() => removeShift(s.day)}
                        className="text-red-400 hover:text-red-300"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
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
                    {submitting ? "Adding..." : "Add Staff"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
