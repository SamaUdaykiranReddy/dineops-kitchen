import { useEffect, useState, useCallback } from "react";
import { Clock, Users, Plus, Settings, X, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { API_BASE } from "../config";

const STATUS_CONFIG = {
  available: {
    color: "bg-green-600 hover:bg-green-500",
    border: "border-green-500",
    badge: "bg-green-500/20 text-green-400",
    dot: "bg-green-400",
  },
  occupied: {
    color: "bg-red-600 hover:bg-red-500",
    border: "border-red-500",
    badge: "bg-red-500/20 text-red-400",
    dot: "bg-red-400",
  },
  reserved: {
    color: "bg-blue-600 hover:bg-blue-500",
    border: "border-blue-500",
    badge: "bg-blue-500/20 text-blue-400",
    dot: "bg-blue-400",
  },
  cleaning: {
    color: "bg-orange-600 hover:bg-orange-500",
    border: "border-orange-500",
    badge: "bg-orange-500/20 text-orange-400",
    dot: "bg-orange-400",
  },
};

export default function TableLayout() {
  const [tables, setTables] = useState([]);
  const [selectedTable, setSelectedTable] = useState(null);
  const [adminMode, setAdminMode] = useState(false);
  const [loading, setLoading] = useState(true);
  const [newSeats, setNewSeats] = useState(4);
  const [editSeats, setEditSeats] = useState(0);
  const [editStatus, setEditStatus] = useState("available");
  const [filterStatus, setFilterStatus] = useState("all");

  /* ── Fetch tables ── */
  const fetchTables = async () => {
    try {
      const res = await fetch(`${API_BASE}/tables`);
      const data = await res.json();
      setTables(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Failed to fetch tables", err);
      toast.error("Failed to load tables");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTables();
    const interval = setInterval(fetchTables, 10000);
    return () => clearInterval(interval);
  }, []);

  /* ── Update table ── */
  const updateTable = useCallback(async (id, payload) => {
    try {
      await fetch(`${API_BASE}/tables/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      await fetchTables();
      setSelectedTable(null);
    } catch (err) {
      console.error("Failed to update table", err);
      toast.error("Failed to update table");
    }
  }, []);

  /* ── Add table ── */
  const addTable = async () => {
    try {
      const res = await fetch(`${API_BASE}/tables`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          number: tables.length + 1,
          seats: newSeats,
        }),
      });
      if (!res.ok) {
        const err = await res.json();
        toast.error(err.error || "Failed to add table");
        return;
      }
      await fetchTables();
      toast.success(`Table ${tables.length + 1} added`);
    } catch {
      toast.error("Failed to add table");
    }
  };

  /* ── Delete table ── */
  const deleteTable = async (id) => {
    try {
      await fetch(`${API_BASE}/tables/${id}`, { method: "DELETE" });
      await fetchTables();
      setSelectedTable(null);
      toast.success("Table deleted");
    } catch {
      toast.error("Failed to delete table");
    }
  };

  /* ── Reserve table ── */
  const reserveTable = (table) => {
    updateTable(table._id, {
      status: "reserved",
      reservedUntil: Date.now() + 30 * 60 * 1000,
    });
    toast.success(`Table ${table.number} reserved for 30 min`);
  };

  /* ── Auto-expire reservations — server-side is better but this works for now ── */
  useEffect(() => {
    const interval = setInterval(() => {
      tables.forEach((table) => {
        if (
          table.status === "reserved" &&
          table.reservedUntil &&
          Date.now() > table.reservedUntil
        ) {
          updateTable(table._id, { status: "available", reservedUntil: null });
        }
      });
    }, 30000); // check every 30s not every 1s
    return () => clearInterval(interval);
  }, [tables, updateTable]);

  /* ── Helpers ── */
  const getRemainingTime = (until) => {
    const diff = until - Date.now();
    if (diff <= 0) return "Expired";
    const min = Math.ceil(diff / 60000);
    return `${min}m left`;
  };

  /* ── Stats ── */
  const stats = {
    total: tables.length,
    available: tables.filter((t) => t.status === "available").length,
    occupied: tables.filter((t) => t.status === "occupied").length,
    reserved: tables.filter((t) => t.status === "reserved").length,
    cleaning: tables.filter((t) => t.status === "cleaning").length,
  };

  const occupancyRate = tables.length
    ? Math.round((stats.occupied / tables.length) * 100)
    : 0;

  /* ── Filtered tables ── */
  const filteredTables =
    filterStatus === "all"
      ? tables
      : tables.filter((t) => t.status === filterStatus);

  if (loading) {
    return (
      <div className="p-8 bg-slate-950 min-h-screen text-white">
        <div className="grid grid-cols-3 md:grid-cols-5 gap-6">
          {[...Array(10)].map((_, i) => (
            <div
              key={i}
              className="aspect-square bg-slate-800 rounded-xl animate-pulse"
            />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 bg-slate-950 min-h-screen text-white space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Table Management</h1>
          <p className="text-slate-400 text-sm mt-1">
            {occupancyRate}% occupancy · {stats.occupied} of {stats.total}{" "}
            tables occupied
          </p>
        </div>
        <button
          onClick={() => setAdminMode(!adminMode)}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-colors ${
            adminMode
              ? "bg-violet-600 text-white"
              : "bg-slate-800 hover:bg-slate-700 text-slate-300"
          }`}
        >
          <Settings className="w-4 h-4" />
          {adminMode ? "Exit Admin" : "Admin Mode"}
        </button>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          {
            label: "Available",
            key: "available",
            color: "text-green-400",
            bg: "bg-green-500/10 border-green-500/20",
          },
          {
            label: "Occupied",
            key: "occupied",
            color: "text-red-400",
            bg: "bg-red-500/10 border-red-500/20",
          },
          {
            label: "Reserved",
            key: "reserved",
            color: "text-blue-400",
            bg: "bg-blue-500/10 border-blue-500/20",
          },
          {
            label: "Cleaning",
            key: "cleaning",
            color: "text-orange-400",
            bg: "bg-orange-500/10 border-orange-500/20",
          },
        ].map((s) => (
          <div
            key={s.key}
            onClick={() =>
              setFilterStatus(filterStatus === s.key ? "all" : s.key)
            }
            className={`border rounded-xl p-4 cursor-pointer transition-all hover:-translate-y-0.5 ${s.bg} ${
              filterStatus === s.key ? "ring-2 ring-violet-500/50" : ""
            }`}
          >
            <p className="text-xs text-slate-400 mb-1">{s.label}</p>
            <p className={`text-2xl font-bold ${s.color}`}>{stats[s.key]}</p>
          </div>
        ))}
      </div>

      {/* Admin Add Table */}
      {adminMode && (
        <div className="flex items-center gap-3 p-4 bg-slate-900 border border-slate-700 rounded-xl">
          <span className="text-sm text-slate-400">Add new table:</span>
          <input
            type="number"
            value={newSeats}
            min={1}
            max={20}
            onChange={(e) => setNewSeats(Number(e.target.value))}
            className="w-24 px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm focus:outline-none focus:border-violet-500/50"
            placeholder="Seats"
          />
          <span className="text-sm text-slate-400">seats</span>
          <button
            onClick={addTable}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-500 rounded-lg transition-colors text-sm"
          >
            <Plus className="w-4 h-4" />
            Add Table
          </button>
        </div>
      )}

      {/* Occupancy bar */}
      <div className="flex items-center gap-3">
        <span className="text-xs text-slate-400 w-20">Occupancy</span>
        <div className="flex-1 h-2 bg-slate-800 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-violet-500 to-purple-600 rounded-full transition-all duration-500"
            style={{ width: `${occupancyRate}%` }}
          />
        </div>
        <span className="text-xs text-slate-400 w-10 text-right">
          {occupancyRate}%
        </span>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-6 flex-wrap">
        {Object.entries(STATUS_CONFIG).map(([status, config]) => (
          <div key={status} className="flex items-center gap-2">
            <div className={`w-3 h-3 rounded-full ${config.dot}`} />
            <span className="text-xs text-slate-400 capitalize">{status}</span>
          </div>
        ))}
      </div>

      {/* Table Grid */}
      <div className="grid grid-cols-3 md:grid-cols-5 lg:grid-cols-6 gap-4">
        {filteredTables.map((table) => {
          const config = STATUS_CONFIG[table.status] || STATUS_CONFIG.available;
          return (
            <button
              key={table._id}
              onClick={() => {
                setSelectedTable(table);
                setEditSeats(table.seats);
                setEditStatus(table.status);
              }}
              className={`relative aspect-square rounded-xl p-3 transition-all duration-200 hover:scale-105 hover:shadow-lg ${config.color}`}
            >
              {/* Seats badge — fixed with relative parent */}
              <div className="absolute top-2 right-2 flex items-center gap-0.5 text-xs bg-black/20 px-1.5 py-0.5 rounded-full">
                <Users className="w-2.5 h-2.5" />
                {table.seats}
              </div>

              <div className="flex flex-col justify-center items-center h-full gap-1">
                <div className="text-3xl font-bold">{table.number}</div>
                <div className="capitalize text-xs opacity-80">
                  {table.status}
                </div>
                {table.status === "reserved" && table.reservedUntil && (
                  <div className="flex items-center gap-1 text-xs bg-black/20 px-2 py-0.5 rounded-full">
                    <Clock className="w-2.5 h-2.5" />
                    {getRemainingTime(table.reservedUntil)}
                  </div>
                )}
              </div>
            </button>
          );
        })}

        {filteredTables.length === 0 && (
          <div className="col-span-full text-center py-12 text-slate-500">
            No tables match this filter
          </div>
        )}
      </div>

      {/* Table Detail Modal */}
      {selectedTable && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-sm p-6 space-y-4">
            {/* Modal header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg font-bold ${
                    STATUS_CONFIG[selectedTable.status]?.color || "bg-slate-600"
                  }`}
                >
                  {selectedTable.number}
                </div>
                <div>
                  <h2 className="font-bold text-lg">
                    Table {selectedTable.number}
                  </h2>
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full capitalize ${
                      STATUS_CONFIG[selectedTable.status]?.badge ||
                      "bg-slate-500/20 text-slate-400"
                    }`}
                  >
                    {selectedTable.status}
                  </span>
                </div>
              </div>
              <button
                onClick={() => setSelectedTable(null)}
                className="p-2 hover:bg-slate-800 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>

            {/* Info */}
            <div className="flex items-center gap-4 p-3 bg-slate-800 rounded-xl">
              <div className="flex items-center gap-2 text-sm text-slate-300">
                <Users className="w-4 h-4 text-slate-400" />
                {selectedTable.seats} seats
              </div>
              {selectedTable.status === "reserved" &&
                selectedTable.reservedUntil && (
                  <div className="flex items-center gap-2 text-sm text-blue-400">
                    <Clock className="w-4 h-4" />
                    {getRemainingTime(selectedTable.reservedUntil)}
                  </div>
                )}
            </div>

            {/* Admin controls */}
            {adminMode && (
              <div className="space-y-3">
                <div>
                  <label className="block text-sm text-slate-400 mb-1">
                    Seats
                  </label>
                  <input
                    type="number"
                    value={editSeats}
                    onChange={(e) => setEditSeats(Number(e.target.value))}
                    className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-xl focus:outline-none focus:border-violet-500/50"
                  />
                </div>
                <div>
                  <label className="block text-sm text-slate-400 mb-1">
                    Status
                  </label>
                  <select
                    value={editStatus}
                    onChange={(e) => setEditStatus(e.target.value)}
                    className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-xl focus:outline-none focus:border-violet-500/50"
                  >
                    <option value="available">Available</option>
                    <option value="occupied">Occupied</option>
                    <option value="reserved">Reserved</option>
                    <option value="cleaning">Cleaning</option>
                  </select>
                </div>
                <button
                  onClick={() =>
                    updateTable(selectedTable._id, {
                      seats: editSeats,
                      status: editStatus,
                    })
                  }
                  className="w-full py-2.5 bg-violet-600 hover:bg-violet-500 rounded-xl transition-colors font-medium"
                >
                  Save Changes
                </button>
                <button
                  onClick={() => deleteTable(selectedTable._id)}
                  className="w-full py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 rounded-xl transition-colors text-sm flex items-center justify-center gap-2"
                >
                  <Trash2 className="w-4 h-4" />
                  Delete Table
                </button>
              </div>
            )}

            {/* Non-admin actions */}
            {!adminMode && (
              <div className="space-y-2">
                {selectedTable.status === "available" && (
                  <button
                    onClick={() => reserveTable(selectedTable)}
                    className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 rounded-xl transition-colors font-medium"
                  >
                    Reserve for 30 min
                  </button>
                )}
                {selectedTable.status === "occupied" && (
                  <button
                    onClick={() =>
                      updateTable(selectedTable._id, { status: "cleaning" })
                    }
                    className="w-full py-2.5 bg-orange-600 hover:bg-orange-500 rounded-xl transition-colors font-medium"
                  >
                    Mark for Cleaning
                  </button>
                )}
                {selectedTable.status === "cleaning" && (
                  <button
                    onClick={() =>
                      updateTable(selectedTable._id, { status: "available" })
                    }
                    className="w-full py-2.5 bg-green-600 hover:bg-green-500 rounded-xl transition-colors font-medium"
                  >
                    Mark Available
                  </button>
                )}
              </div>
            )}

            <button
              onClick={() => setSelectedTable(null)}
              className="w-full py-2 bg-slate-800 hover:bg-slate-700 rounded-xl transition-colors text-sm text-slate-400"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
