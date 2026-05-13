import { useState, useRef, useEffect } from "react";
import { X, Send, Loader2, Sparkles, Minimize2 } from "lucide-react";
import { API_BASE } from "../config";


const SUGGESTIONS = [
  "How many active orders right now?",
  "What inventory items are critically low?",
  "Show me today's revenue",
  "Which tables are available?",
  "Any pending reservations?",
];

export default function AIAssistant() {
  const [open, setOpen] = useState(false);
  const [minimized, setMinimized] = useState(false);
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      content:
        "👋 Hi! I'm DineOps AI. I can answer questions about your orders, inventory, tables, and reservations in real time. What would you like to know?",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (open && !minimized) inputRef.current?.focus();
  }, [open, minimized]);

  /* ── Fetch live restaurant data to inject as context ── */
  const fetchContext = async () => {
    try {
      const [ordersRes, inventoryRes, tablesRes, reservationsRes] =
        await Promise.all([
          fetch(`${API_BASE}/orders/recent`),
          fetch(`${API_BASE}/inventory`),
          fetch(`${API_BASE}/tables`),
          fetch(`${API_BASE}/reservations`),
        ]);

      const [orders, inventory, tables, reservations] = await Promise.all([
        ordersRes.json(),
        inventoryRes.json(),
        tablesRes.json(),
        reservationsRes.json(),
      ]);

      const activeOrders = orders.filter(
        (o) => o.status === "preparing" || o.status === "pending",
      );
      const lowStock = inventory.filter(
        (i) => i.status === "low" || i.status === "critical",
      );
      const availableTables = tables.filter((t) => t.status === "available");
      const pendingReservations = reservations.filter(
        (r) => r.status === "pending",
      );
      const todayRevenue = orders
        .filter((o) => {
          const today = new Date().toDateString();
          return (
            new Date(o.createdAt).toDateString() === today &&
            o.status === "completed"
          );
        })
        .reduce((sum, o) => sum + (o.total || 0), 0);

      return `
LIVE RESTAURANT DATA (as of ${new Date().toLocaleTimeString()}):

ORDERS:
- Total recent orders: ${orders.length}
- Active (preparing/pending): ${activeOrders.length}
- Today's completed revenue: $${todayRevenue.toFixed(2)}
- Active orders: ${JSON.stringify(
        activeOrders.map((o) => ({
          id: o._id.slice(-6),
          table: o.table,
          status: o.status,
          total: o.total,
          items: o.items?.map((i) => `${i.quantity}x ${i.name}`).join(", "),
        })),
      )}

INVENTORY:
- Total items: ${inventory.length}
- Low/critical items: ${lowStock.length}
- Critical items: ${JSON.stringify(
        lowStock.map((i) => ({
          name: i.name,
          stock: i.stock,
          unit: i.unit,
          status: i.status,
        })),
      )}

TABLES:
- Total tables: ${tables.length}
- Available: ${availableTables.length}
- Occupied: ${tables.filter((t) => t.status === "occupied").length}
- Reserved: ${tables.filter((t) => t.status === "reserved").length}
- Cleaning: ${tables.filter((t) => t.status === "cleaning").length}

RESERVATIONS:
- Total: ${reservations.length}
- Pending confirmation: ${pendingReservations.length}
- Today's reservations: ${reservations.filter((r) => r.date === new Date().toISOString().split("T")[0]).length}
      `.trim();
    } catch (err) {
      console.error("Failed to fetch AI context:", err);
      return "Live data temporarily unavailable.";
    }
  };

  /* ── Send message ── */
  const sendMessage = async (text) => {
    const userMessage = text || input.trim();
    if (!userMessage || loading) return;

    setInput("");
    setMessages((prev) => [...prev, { role: "user", content: userMessage }]);
    setLoading(true);

    try {
      const context = await fetchContext();

      // Inject context into the latest user message
      const messagesWithContext = [
        ...messages.map((m) => ({ role: m.role, content: m.content })),
        {
          role: "user",
          content: `${userMessage}\n\nCONTEXT:\n${context}`,
        },
      ];

      const res = await fetch(`${API_BASE}/ai/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: messagesWithContext }),
      });

      const data = await res.json();
      const reply =
        data.content?.[0]?.text || "Sorry, I couldn't process that.";

      setMessages((prev) => [...prev, { role: "assistant", content: reply }]);
    } catch (err) {
      console.error("AI error:", err);
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content:
            "Sorry, I'm having trouble connecting right now. Please try again.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  /* ── UI ── */
  return (
    <>
      {/* Floating button */}
      {!open && (
        <button
          onClick={() => setOpen(true)}
          className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-lg shadow-violet-500/40 hover:scale-110 transition-transform"
        >
          <Sparkles className="w-6 h-6 text-white" />
        </button>
      )}

      {/* Chat panel */}
      {open && (
        <div
          className={`fixed bottom-6 right-6 z-50 w-96 bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl shadow-black/50 flex flex-col transition-all duration-300 ${
            minimized ? "h-14" : "h-[560px]"
          }`}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-700 bg-gradient-to-r from-violet-500/10 to-purple-500/10 rounded-t-2xl">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-white" />
              </div>
              <div>
                <p className="text-sm font-semibold text-white">DineOps AI</p>
                <div className="flex items-center gap-1">
                  <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                  <p className="text-xs text-slate-400">Live data connected</p>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setMinimized(!minimized)}
                className="p-1.5 hover:bg-slate-700 rounded-lg transition-colors"
              >
                <Minimize2 className="w-4 h-4 text-slate-400" />
              </button>
              <button
                onClick={() => setOpen(false)}
                className="p-1.5 hover:bg-slate-700 rounded-lg transition-colors"
              >
                <X className="w-4 h-4 text-slate-400" />
              </button>
            </div>
          </div>

          {!minimized && (
            <>
              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin scrollbar-track-slate-900 scrollbar-thumb-slate-700">
                {messages.map((msg, i) => (
                  <div
                    key={i}
                    className={`flex ${
                      msg.role === "user" ? "justify-end" : "justify-start"
                    }`}
                  >
                    <div
                      className={`max-w-[80%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
                        msg.role === "user"
                          ? "bg-violet-600 text-white rounded-br-sm"
                          : "bg-slate-800 text-slate-200 rounded-bl-sm"
                      }`}
                    >
                      {msg.content}
                    </div>
                  </div>
                ))}

                {loading && (
                  <div className="flex justify-start">
                    <div className="bg-slate-800 px-4 py-3 rounded-2xl rounded-bl-sm flex items-center gap-2">
                      <Loader2 className="w-4 h-4 text-violet-400 animate-spin" />
                      <span className="text-xs text-slate-400">
                        Analyzing live data...
                      </span>
                    </div>
                  </div>
                )}
                <div ref={bottomRef} />
              </div>

              {/* Suggestions */}
              {messages.length === 1 && (
                <div className="px-4 pb-2 flex flex-wrap gap-2">
                  {SUGGESTIONS.map((s) => (
                    <button
                      key={s}
                      onClick={() => sendMessage(s)}
                      className="text-xs px-3 py-1.5 bg-slate-800 hover:bg-violet-500/20 hover:text-violet-300 border border-slate-700 hover:border-violet-500/40 rounded-full transition-colors"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              )}

              {/* Input */}
              <div className="p-4 pt-2 border-t border-slate-700">
                <div className="flex items-center gap-2 bg-slate-800 rounded-xl px-3 py-2 border border-slate-700 focus-within:border-violet-500/50 transition-colors">
                  <input
                    ref={inputRef}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Ask anything about your restaurant..."
                    className="flex-1 bg-transparent text-sm text-white placeholder-slate-500 outline-none"
                  />
                  <button
                    onClick={() => sendMessage()}
                    disabled={!input.trim() || loading}
                    className="w-8 h-8 rounded-lg bg-violet-600 hover:bg-violet-500 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center transition-colors"
                  >
                    <Send className="w-4 h-4 text-white" />
                  </button>
                </div>
                <p className="text-xs text-slate-600 mt-2 text-center">
                  Powered by Claude AI · Live restaurant data
                </p>
              </div>
            </>
          )}
        </div>
      )}
    </>
  );
}
