import { useEffect, useState } from "react";
import {
  Plus,
  Search,
  Package,
  AlertTriangle,
  TrendingDown,
  X,
  Minus,
} from "lucide-react";
import { toast } from "sonner";
import { API_BASE } from "../config";

const STATUS_CONFIG = {
  good: {
    badge: "bg-green-500/20 text-green-400 border-green-500/30",
    dot: "bg-green-400",
    bar: "bg-green-500",
  },
  low: {
    badge: "bg-orange-500/20 text-orange-400 border-orange-500/30",
    dot: "bg-orange-400",
    bar: "bg-orange-500",
  },
  critical: {
    badge: "bg-red-500/20 text-red-400 border-red-500/30",
    dot: "bg-red-400",
    bar: "bg-red-500",
  },
};

const EMPTY_ITEM = {
  name: "",
  stock: "",
  threshold: "",
  unit: "",
  supplier: "",
};

export default function InventoryPage() {
  const [inventoryItems, setInventoryItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [stockChange, setStockChange] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [newItem, setNewItem] = useState(EMPTY_ITEM);

  /* ── Fetch inventory ── */
  const fetchInventory = async () => {
    try {
      const res = await fetch(`${API_BASE}/inventory`);
      const data = await res.json();
      setInventoryItems(Array.isArray(data) ? data : []);
    } catch {
      toast.error("Failed to fetch inventory");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInventory();
  }, []);

  /* ── Add item ── */
  const handleAddItem = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch(`${API_BASE}/inventory`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...newItem,
          stock: Number(newItem.stock),
          threshold: Number(newItem.threshold),
        }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to add item");
      }
      toast.success(`${newItem.name} added to inventory`);
      setShowForm(false);
      setNewItem(EMPTY_ITEM);
      fetchInventory();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  /* ── Update stock ── */
  const handleUpdateStock = async (e) => {
    e.preventDefault();
    if (!stockChange || isNaN(stockChange)) {
      toast.error("Enter a valid number");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch(
        `${API_BASE}/inventory/${editingItem._id}/stock`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ change: Number(stockChange) }),
        },
      );
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to update stock");
      }
      const change = Number(stockChange);
      toast.success(
        `${editingItem.name} stock ${change > 0 ? "increased" : "decreased"} by ${Math.abs(change)}`,
      );
      setEditingItem(null);
      setStockChange("");
      fetchInventory();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  /* ── Remove item ── */
  const handleRemoveItem = async (item) => {
    try {
      const res = await fetch(`${API_BASE}/inventory/${item._id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to remove item");
      toast.success(`${item.name} removed from inventory`);
      fetchInventory();
    } catch (err) {
      toast.error(err.message);
    }
  };

  /* ── Stats ── */
  const stats = {
    total: inventoryItems.length,
    good: inventoryItems.filter((i) => i.status === "good").length,
    low: inventoryItems.filter((i) => i.status === "low").length,
    critical: inventoryItems.filter((i) => i.status === "critical").length,
  };

  /* ── Filter ── */
  const filteredItems = inventoryItems.filter((item) => {
    const matchesSearch =
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.supplier?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter =
      filterStatus === "all" || item.status === filterStatus;
    return matchesSearch && matchesFilter;
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
          <h1 className="text-3xl font-bold">Inventory</h1>
          <p className="text-slate-400 text-sm mt-1">
            Track stock levels and manage supplies
          </p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 bg-violet-600 hover:bg-violet-500 px-4 py-2.5 rounded-xl transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add Item
        </button>
      </div>

      {/* Critical alert banner */}
      {stats.critical > 0 && (
        <div className="flex items-center gap-3 p-4 bg-red-500/10 border border-red-500/20 rounded-xl">
          <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0" />
          <p className="text-sm text-red-300">
            <span className="font-semibold">
              {stats.critical} item{stats.critical > 1 ? "s" : ""} critically
              low —{" "}
            </span>
            {inventoryItems
              .filter((i) => i.status === "critical")
              .map((i) => i.name)
              .join(", ")}
          </p>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          {
            label: "Total Items",
            value: stats.total,
            color: "text-white",
            bg: "bg-slate-800/50 border-slate-700",
            key: "all",
          },
          {
            label: "Good Stock",
            value: stats.good,
            color: "text-green-400",
            bg: "bg-green-500/10 border-green-500/20",
            key: "good",
          },
          {
            label: "Low Stock",
            value: stats.low,
            color: "text-orange-400",
            bg: "bg-orange-500/10 border-orange-500/20",
            key: "low",
          },
          {
            label: "Critical",
            value: stats.critical,
            color: "text-red-400",
            bg: "bg-red-500/10 border-red-500/20",
            key: "critical",
          },
        ].map((s) => (
          <div
            key={s.key}
            onClick={() => setFilterStatus(s.key)}
            className={`border rounded-xl p-4 cursor-pointer transition-all hover:-translate-y-0.5 ${s.bg} ${
              filterStatus === s.key ? "ring-2 ring-violet-500/50" : ""
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
            placeholder="Search by name or supplier..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-sm focus:outline-none focus:border-violet-500/50 transition-colors"
          />
        </div>
        <div className="flex gap-2">
          {["all", "good", "low", "critical"].map((s) => (
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

      {/* Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-800/50">
            <tr>
              <th className="p-3 text-left text-xs text-slate-400 font-medium">
                Item
              </th>
              <th className="p-3 text-xs text-slate-400 font-medium">
                Stock Level
              </th>
              <th className="p-3 text-xs text-slate-400 font-medium">
                Threshold
              </th>
              <th className="p-3 text-xs text-slate-400 font-medium">Unit</th>
              <th className="p-3 text-xs text-slate-400 font-medium">
                Supplier
              </th>
              <th className="p-3 text-xs text-slate-400 font-medium">Status</th>
              <th className="p-3 text-xs text-slate-400 font-medium">
                Last Updated
              </th>
              <th className="p-3 text-xs text-slate-400 font-medium">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800">
            {filteredItems.map((item) => {
              const config = STATUS_CONFIG[item.status] || STATUS_CONFIG.good;
              const stockPercent = Math.min(
                100,
                Math.round((item.stock / (item.threshold * 2)) * 100),
              );
              return (
                <tr
                  key={item._id}
                  className="hover:bg-slate-800/30 transition-colors group"
                >
                  {/* Item name */}
                  <td className="p-3">
                    <div className="flex items-center gap-2">
                      <div
                        className={`w-2 h-2 rounded-full flex-shrink-0 ${config.dot}`}
                      />
                      <span className="font-medium text-white">
                        {item.name}
                      </span>
                    </div>
                  </td>

                  {/* Stock with progress bar */}
                  <td className="p-3">
                    <div className="flex flex-col gap-1 min-w-[100px]">
                      <span className="text-sm font-semibold">
                        {item.stock} {item.unit}
                      </span>
                      <div className="w-full h-1.5 bg-slate-700 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all ${config.bar}`}
                          style={{ width: `${stockPercent}%` }}
                        />
                      </div>
                    </div>
                  </td>

                  {/* Threshold */}
                  <td className="p-3 text-center text-slate-400 text-sm">
                    {item.threshold} {item.unit}
                  </td>

                  {/* Unit */}
                  <td className="p-3 text-center text-slate-400 text-sm">
                    {item.unit}
                  </td>

                  {/* Supplier */}
                  <td className="p-3 text-slate-300 text-sm">
                    {item.supplier}
                  </td>

                  {/* Status badge */}
                  <td className="p-3">
                    <div className="flex justify-center">
                      <span
                        className={`px-2.5 py-1 rounded-full text-xs font-medium border capitalize ${config.badge}`}
                      >
                        {item.status}
                      </span>
                    </div>
                  </td>

                  {/* Last updated */}
                  <td className="p-3 text-center text-xs text-slate-500">
                    {new Date(item.updatedAt).toLocaleDateString()}{" "}
                    {new Date(item.updatedAt).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </td>

                  {/* Actions */}
                  <td className="p-3">
                    <div className="flex items-center justify-center gap-2">
                      <button
                        onClick={() => {
                          setEditingItem(item);
                          setStockChange("");
                        }}
                        className="flex items-center gap-1 px-2.5 py-1.5 bg-blue-600 hover:bg-blue-500 rounded-lg text-xs transition-colors"
                      >
                        <TrendingDown className="w-3 h-3" />
                        Update
                      </button>
                      <button
                        onClick={() => handleRemoveItem(item)}
                        className="p-1.5 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {filteredItems.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 text-slate-500">
            <Package className="w-12 h-12 mb-3 opacity-30" />
            <p className="text-lg font-medium">No items found</p>
            <p className="text-sm mt-1">
              {searchTerm
                ? "Try a different search"
                : "Add your first inventory item"}
            </p>
          </div>
        )}
      </div>

      {/* Add Item Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-lg p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold">Add Inventory Item</h2>
              <button
                onClick={() => setShowForm(false)}
                className="p-2 hover:bg-slate-800 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>

            <form onSubmit={handleAddItem} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <label className="block text-xs text-slate-400 mb-1">
                    Item Name *
                  </label>
                  <input
                    required
                    placeholder="e.g. Olive Oil"
                    value={newItem.name}
                    onChange={(e) =>
                      setNewItem({ ...newItem, name: e.target.value })
                    }
                    className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-sm focus:outline-none focus:border-violet-500/50 transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1">
                    Current Stock *
                  </label>
                  <input
                    required
                    type="number"
                    placeholder="0"
                    value={newItem.stock}
                    onChange={(e) =>
                      setNewItem({ ...newItem, stock: e.target.value })
                    }
                    className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-sm focus:outline-none focus:border-violet-500/50 transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1">
                    Low Stock Threshold *
                  </label>
                  <input
                    required
                    type="number"
                    placeholder="0"
                    value={newItem.threshold}
                    onChange={(e) =>
                      setNewItem({ ...newItem, threshold: e.target.value })
                    }
                    className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-sm focus:outline-none focus:border-violet-500/50 transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1">
                    Unit *
                  </label>
                  <input
                    required
                    placeholder="kg, L, pcs..."
                    value={newItem.unit}
                    onChange={(e) =>
                      setNewItem({ ...newItem, unit: e.target.value })
                    }
                    className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-sm focus:outline-none focus:border-violet-500/50 transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1">
                    Supplier *
                  </label>
                  <input
                    required
                    placeholder="Supplier name"
                    value={newItem.supplier}
                    onChange={(e) =>
                      setNewItem({ ...newItem, supplier: e.target.value })
                    }
                    className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-sm focus:outline-none focus:border-violet-500/50 transition-colors"
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="flex-1 py-2.5 bg-slate-700 hover:bg-slate-600 rounded-xl transition-colors text-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 py-2.5 bg-violet-600 hover:bg-violet-500 disabled:opacity-50 rounded-xl font-medium transition-colors text-sm"
                >
                  {submitting ? "Adding..." : "Add Item"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Update Stock Modal */}
      {editingItem && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-sm p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold">Update Stock</h2>
              <button
                onClick={() => setEditingItem(null)}
                className="p-2 hover:bg-slate-800 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>

            {/* Current stock info */}
            <div className="p-4 bg-slate-800 rounded-xl">
              <p className="font-semibold text-white">{editingItem.name}</p>
              <p className="text-sm text-slate-400 mt-1">
                Current stock:{" "}
                <span className="text-white font-medium">
                  {editingItem.stock} {editingItem.unit}
                </span>
              </p>
              <p className="text-sm text-slate-400">
                Threshold:{" "}
                <span className="text-white font-medium">
                  {editingItem.threshold} {editingItem.unit}
                </span>
              </p>
            </div>

            {/* Quick adjust buttons */}
            <div>
              <label className="block text-xs text-slate-400 mb-2">
                Quick adjust
              </label>
              <div className="flex gap-2">
                {[-10, -5, -1, +1, +5, +10].map((val) => (
                  <button
                    key={val}
                    onClick={() => setStockChange(String(val))}
                    className={`flex-1 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                      stockChange === String(val)
                        ? "bg-violet-600 text-white"
                        : val < 0
                          ? "bg-red-500/10 text-red-400 hover:bg-red-500/20"
                          : "bg-green-500/10 text-green-400 hover:bg-green-500/20"
                    }`}
                  >
                    {val > 0 ? `+${val}` : val}
                  </button>
                ))}
              </div>
            </div>

            <form onSubmit={handleUpdateStock} className="space-y-3">
              <div>
                <label className="block text-xs text-slate-400 mb-1">
                  Custom amount (use − for decrease)
                </label>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      setStockChange((prev) => String(Number(prev || 0) - 1))
                    }
                    className="w-10 h-10 flex items-center justify-center bg-slate-800 hover:bg-slate-700 rounded-xl transition-colors"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <input
                    type="number"
                    placeholder="e.g. +10 or -5"
                    value={stockChange}
                    onChange={(e) => setStockChange(e.target.value)}
                    className="flex-1 px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-sm text-center font-bold focus:outline-none focus:border-violet-500/50 transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() =>
                      setStockChange((prev) => String(Number(prev || 0) + 1))
                    }
                    className="w-10 h-10 flex items-center justify-center bg-slate-800 hover:bg-slate-700 rounded-xl transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
                {stockChange && !isNaN(stockChange) && (
                  <p className="text-xs mt-2 text-center text-slate-400">
                    New stock will be:{" "}
                    <span className="font-bold text-white">
                      {Math.max(0, editingItem.stock + Number(stockChange))}{" "}
                      {editingItem.unit}
                    </span>
                  </p>
                )}
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setEditingItem(null)}
                  className="flex-1 py-2.5 bg-slate-700 hover:bg-slate-600 rounded-xl transition-colors text-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting || !stockChange}
                  className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 rounded-xl font-medium transition-colors text-sm"
                >
                  {submitting ? "Updating..." : "Update Stock"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
