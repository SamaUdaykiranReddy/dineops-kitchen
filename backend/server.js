import "dotenv/config";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import mongoose from "mongoose";
import MenuItem from "./models/MenuItem.js";
import tableRoutes from "./routes/tables.js";
import reservationRoutes from "./routes/reservations.js";
import inventoryRoutes from "./routes/inventory.js";
import settingsRoutes from "./routes/settings.js";
import ordersRouter from "./routes/orders.js";
import staffRoutes from "./routes/staff.js";
import customerRoutes from "./routes/customers.js";

/* ── Environment ── */
const MONGO_URI = process.env.MONGO_URI;
const PORT = process.env.PORT || 5004;
const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN || "http://localhost:3000";

if (!MONGO_URI) {
  console.error("❌  MONGO_URI is not set. Create a .env file.");
  process.exit(1);
}

/* ── Database ── */
mongoose
  .connect(MONGO_URI)
  .then(() => console.log("✅  MongoDB Atlas connected"))
  .catch((err) => {
    console.error("MongoDB connection error:", err);
    process.exit(1);
  });

/* ── App ── */
const app = express();

app.use(helmet());
app.use(cors({ origin: CLIENT_ORIGIN, credentials: true }));
app.use(express.json());

/* ── Routes ── */
app.use("/tables", tableRoutes);
app.use("/reservations", reservationRoutes);
app.use("/inventory", inventoryRoutes);
app.use("/settings", settingsRoutes);
app.use("/orders", ordersRouter);
app.use("/staff", staffRoutes);
app.use("/customers", customerRoutes);

/* ── Menu ── */
app.get("/menu", async (req, res) => {
  try {
    const items = await MenuItem.find().sort({ createdAt: 1 });
    res.json(items);
  } catch {
    res.status(500).json({ error: "Failed to fetch menu items" });
  }
});

app.post("/menu", async (req, res) => {
  const { isAdmin, menuItem } = req.body;
  if (!isAdmin)
    return res.status(403).json({ error: "Only admin can add menu items" });
  if (!menuItem)
    return res.status(400).json({ error: "menuItem body is required" });
  try {
    const newItem = await MenuItem.create(menuItem);
    res.status(201).json(newItem);
  } catch (err) {
    res.status(500).json({ error: err.message || "Failed to add menu item" });
  }
});

/* ── AI Assistant proxy (Groq) ── */
app.post("/ai/chat", async (req, res) => {
  try {
    const { messages } = req.body;

    const response = await fetch(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
        },
        body: JSON.stringify({
          model: "llama-3.1-8b-instant",
          max_tokens: 1000,
          messages: [
            {
              role: "system",
              content: `You are DineOps AI, an intelligent assistant built into a restaurant management system.
Be concise, professional, and helpful. Only use data provided in the context.
Format numbers clearly. Never make up data.`,
            },
            ...messages,
          ],
        }),
      },
    );

    const data = await response.json();
    const reply =
      data.choices?.[0]?.message?.content || "Sorry, I couldn't process that.";
    res.json({ content: [{ text: reply }] });
  } catch (err) {
    console.error("AI proxy error:", err);
    res.status(500).json({ error: "AI service unavailable" });
  }
});

/* ── 404 ── */
app.use((req, res) => {
  res.status(404).json({ error: "API endpoint not found" });
});

/* ── Global error handler ── */
app.use((err, req, res, next) => {
  console.error("Unhandled error:", err);
  res.status(500).json({ error: "Internal server error" });
});

/* ── Start ── */
app.listen(PORT, () =>
  console.log(`🚀  Server running at http://localhost:${PORT}`),
);
