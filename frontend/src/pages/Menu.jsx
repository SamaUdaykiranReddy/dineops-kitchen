import { useState, useEffect } from "react";
import {
  Plus,
  ShoppingCart,
  Trash2,
  Search,
  ChefHat,
  X,
  Minus,
} from "lucide-react";
import { toast } from "sonner";
import { API_BASE } from "../config";

function Menu() {
  const [menuItems, setMenuItems] = useState([]);
  const [cart, setCart] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [showAddForm, setShowAddForm] = useState(false);
  const [showTableModal, setShowTableModal] = useState(false);
  const [tableNumber, setTableNumber] = useState("");
  const [placingOrder, setPlacingOrder] = useState(false);

  const [newItem, setNewItem] = useState({
    name: "",
    category: "",
    price: "",
    description: "",
    available: true,
  });

  const isAdmin = true;

  /* ── Fetch menu ── */
  const fetchMenu = async () => {
    try {
      const res = await fetch(`${API_BASE}/menu`);
      const data = await res.json();
      setMenuItems(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Failed to fetch menu:", err);
      toast.error("Failed to load menu");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMenu();
  }, []);

  /* ── Cart helpers ── */
  const addToCart = (item) => {
    if (!item.available) return;
    setCart((prev) => {
      const existing = prev.find((i) => i._id === item._id);
      if (existing)
        return prev.map((i) =>
          i._id === item._id ? { ...i, quantity: i.quantity + 1 } : i,
        );
      return [...prev, { ...item, quantity: 1 }];
    });
    toast.success(`${item.name} added to order`);
  };

  const updateQuantity = (id, delta) => {
    setCart((prev) =>
      prev
        .map((i) => (i._id === id ? { ...i, quantity: i.quantity + delta } : i))
        .filter((i) => i.quantity > 0),
    );
  };

  const removeFromCart = (id) => {
    setCart((prev) => prev.filter((i) => i._id !== id));
  };

  const cartTotal = cart.reduce((acc, i) => acc + i.price * i.quantity, 0);
  const cartCount = cart.reduce((acc, i) => acc + i.quantity, 0);

  /* ── Place order ── */
  const handlePlaceOrder = async () => {
    if (!tableNumber.trim()) {
      toast.error("Please enter a table number");
      return;
    }

    setPlacingOrder(true);
    try {
      const res = await fetch(`${API_BASE}/orders`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          table: Number(tableNumber),
          items: cart.map((i) => ({
            name: i.name,
            price: i.price,
            quantity: i.quantity,
          })),
          total: cartTotal,
          status: "preparing",
        }),
      });

      if (!res.ok) throw new Error("Failed to create order");

      toast.success(`Order placed for Table ${tableNumber}!`);
      setCart([]);
      setTableNumber("");
      setShowTableModal(false);
    } catch (err) {
      console.error(err);
      toast.error("Failed to place order");
    } finally {
      setPlacingOrder(false);
    }
  };

  /* ── Add menu item (admin) ── */
  const handleAddNewItem = async () => {
    if (!newItem.name || !newItem.price || !newItem.category) {
      toast.error("Name, category and price are required");
      return;
    }

    try {
      const res = await fetch(`${API_BASE}/menu`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          isAdmin: true,
          menuItem: {
            ...newItem,
            price: parseFloat(newItem.price),
          },
        }),
      });

      if (!res.ok) throw new Error();
      const added = await res.json();
      setMenuItems((prev) => [...prev, added]);
      setNewItem({
        name: "",
        category: "",
        price: "",
        description: "",
        available: true,
      });
      setShowAddForm(false);
      toast.success(`${added.name} added to menu`);
    } catch {
      toast.error("Failed to add menu item");
    }
  };
  const CATEGORIES = [
    "All",
    ...new Set(menuItems.map((i) => i.category).filter(Boolean)),
  ];
  /* ── Filter ── */
  const filteredItems = menuItems.filter((item) => {
    const matchesSearch =
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory =
      selectedCategory === "All" || item.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const availableCount = menuItems.filter((i) => i.available).length;

  if (loading) {
    return (
      <div className="p-8 bg-slate-950 min-h-screen text-white">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              className="h-48 bg-slate-800 rounded-xl animate-pulse"
            />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 bg-slate-950 min-h-screen text-white">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">Menu</h1>
          <p className="text-slate-400 text-sm mt-1">
            {availableCount} items available · {menuItems.length} total
          </p>
        </div>
        <div className="flex items-center gap-3">
          {/* Cart button */}
          {cart.length > 0 && (
            <button
              onClick={() => setShowTableModal(true)}
              className="relative flex items-center gap-2 px-4 py-2 bg-violet-600 hover:bg-violet-500 rounded-xl transition-colors"
            >
              <ShoppingCart className="w-4 h-4" />
              <span className="text-sm font-medium">
                Order · ${cartTotal.toFixed(2)}
              </span>
              <span className="absolute -top-2 -right-2 w-5 h-5 bg-orange-500 rounded-full text-xs flex items-center justify-center font-bold">
                {cartCount}
              </span>
            </button>
          )}

          {isAdmin && (
            <button
              onClick={() => setShowAddForm(true)}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-500 rounded-xl transition-colors"
            >
              <Plus className="w-4 h-4" />
              Add Item
            </button>
          )}
        </div>
      </div>

      {/* Search + Category Filter */}
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            placeholder="Search menu items..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-sm focus:outline-none focus:border-violet-500/50 transition-colors"
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-4 py-2 rounded-xl text-sm transition-colors ${
                selectedCategory === cat
                  ? "bg-violet-600 text-white"
                  : "bg-slate-800 text-slate-400 hover:bg-slate-700"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Menu Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filteredItems.map((item) => {
          const inCart = cart.find((i) => i._id === item._id);
          return (
            <div
              key={item._id}
              className={`bg-slate-900 border rounded-xl p-5 flex flex-col justify-between transition-all duration-200 hover:-translate-y-0.5 ${
                item.available
                  ? "border-slate-800 hover:border-violet-500/30"
                  : "border-slate-800 opacity-50"
              }`}
            >
              {/* Category badge */}
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs px-2 py-1 bg-slate-800 text-slate-400 rounded-full">
                  {item.category}
                </span>
                {!item.available && (
                  <span className="text-xs px-2 py-1 bg-red-500/20 text-red-400 rounded-full">
                    Unavailable
                  </span>
                )}
              </div>

              {/* Item info */}
              <div className="flex-1 mb-4">
                <h3 className="text-lg font-semibold mb-1">{item.name}</h3>
                {item.description && (
                  <p className="text-sm text-slate-400 line-clamp-2">
                    {item.description}
                  </p>
                )}
                <p className="text-xl font-bold text-violet-400 mt-2">
                  ${item.price.toFixed(2)}
                </p>
              </div>

              {/* Add to cart / quantity controls */}
              {inCart ? (
                <div className="flex items-center justify-between bg-slate-800 rounded-lg p-1">
                  <button
                    onClick={() => updateQuantity(item._id, -1)}
                    className="w-8 h-8 flex items-center justify-center hover:bg-slate-700 rounded-lg transition-colors"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <span className="font-bold text-violet-400">
                    {inCart.quantity}
                  </span>
                  <button
                    onClick={() => updateQuantity(item._id, 1)}
                    className="w-8 h-8 flex items-center justify-center hover:bg-slate-700 rounded-lg transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => addToCart(item)}
                  disabled={!item.available}
                  className={`w-full py-2 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2 ${
                    item.available
                      ? "bg-violet-600 hover:bg-violet-500 text-white"
                      : "bg-slate-700 text-slate-500 cursor-not-allowed"
                  }`}
                >
                  <Plus className="w-4 h-4" />
                  Add to Order
                </button>
              )}
            </div>
          );
        })}

        {filteredItems.length === 0 && (
          <div className="col-span-full flex flex-col items-center justify-center py-16 text-slate-500">
            <ChefHat className="w-12 h-12 mb-3 opacity-30" />
            <p className="text-lg font-medium">No items found</p>
            <p className="text-sm mt-1">Try a different search or category</p>
          </div>
        )}
      </div>

      {/* Cart Sidebar / Order Summary Modal */}
      {showTableModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-md p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold">Place Order</h2>
              <button
                onClick={() => setShowTableModal(false)}
                className="p-2 hover:bg-slate-800 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Order items */}
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {cart.map((item) => (
                <div
                  key={item._id}
                  className="flex items-center justify-between bg-slate-800 rounded-lg px-3 py-2"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-bold text-violet-400 bg-violet-500/10 px-2 py-0.5 rounded">
                      ×{item.quantity}
                    </span>
                    <span className="text-sm">{item.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold">
                      ${(item.price * item.quantity).toFixed(2)}
                    </span>
                    <button
                      onClick={() => removeFromCart(item._id)}
                      className="p-1 hover:text-red-400 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Total */}
            <div className="flex items-center justify-between py-3 border-t border-slate-700">
              <span className="font-semibold">Total</span>
              <span className="text-xl font-bold text-violet-400">
                ${cartTotal.toFixed(2)}
              </span>
            </div>

            {/* Table number input */}
            <div>
              <label className="block text-sm text-slate-400 mb-2">
                Table Number
              </label>
              <input
                type="number"
                placeholder="Enter table number"
                value={tableNumber}
                onChange={(e) => setTableNumber(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-xl focus:outline-none focus:border-violet-500/50 transition-colors"
                autoFocus
              />
            </div>

            {/* Action buttons */}
            <div className="flex gap-3">
              <button
                onClick={() => setShowTableModal(false)}
                className="flex-1 py-2.5 bg-slate-700 hover:bg-slate-600 rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handlePlaceOrder}
                disabled={placingOrder || !tableNumber}
                className="flex-1 py-2.5 bg-violet-600 hover:bg-violet-500 disabled:opacity-50 rounded-xl font-medium transition-colors"
              >
                {placingOrder ? "Placing..." : "Place Order"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Menu Item Modal */}
      {showAddForm && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-lg p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold">Add Menu Item</h2>
              <button
                onClick={() => setShowAddForm(false)}
                className="p-2 hover:bg-slate-800 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="block text-sm text-slate-400 mb-1">
                  Name *
                </label>
                <input
                  placeholder="e.g. Grilled Salmon"
                  value={newItem.name}
                  onChange={(e) =>
                    setNewItem({ ...newItem, name: e.target.value })
                  }
                  className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-xl focus:outline-none focus:border-violet-500/50 transition-colors"
                />
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-1">
                  Category *
                </label>
                <select
                  value={newItem.category}
                  onChange={(e) =>
                    setNewItem({ ...newItem, category: e.target.value })
                  }
                  className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-xl focus:outline-none focus:border-violet-500/50 transition-colors"
                >
                  <option value="">Select...</option>
                  {CATEGORIES.filter((c) => c !== "All").map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-1">
                  Price *
                </label>
                <input
                  type="number"
                  placeholder="0.00"
                  value={newItem.price}
                  onChange={(e) =>
                    setNewItem({ ...newItem, price: e.target.value })
                  }
                  className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-xl focus:outline-none focus:border-violet-500/50 transition-colors"
                />
              </div>
              <div className="col-span-2">
                <label className="block text-sm text-slate-400 mb-1">
                  Description
                </label>
                <textarea
                  rows={3}
                  placeholder="Brief description..."
                  value={newItem.description}
                  onChange={(e) =>
                    setNewItem({ ...newItem, description: e.target.value })
                  }
                  className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-xl focus:outline-none focus:border-violet-500/50 transition-colors resize-none"
                />
              </div>
              <div className="col-span-2 flex items-center gap-3">
                <input
                  type="checkbox"
                  id="available"
                  checked={newItem.available}
                  onChange={(e) =>
                    setNewItem({ ...newItem, available: e.target.checked })
                  }
                  className="w-4 h-4 accent-violet-500"
                />
                <label htmlFor="available" className="text-sm text-slate-300">
                  Available immediately
                </label>
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setShowAddForm(false)}
                className="flex-1 py-2.5 bg-slate-700 hover:bg-slate-600 rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleAddNewItem}
                className="flex-1 py-2.5 bg-green-600 hover:bg-green-500 rounded-xl font-medium transition-colors"
              >
                Add to Menu
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
export default Menu;
