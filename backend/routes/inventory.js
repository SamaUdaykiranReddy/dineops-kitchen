import express from "express";
import InventoryItem from "../models/InventoryItem.js";
import { getSettings } from "../utils/getSettings.js";

const router = express.Router();

/* ── Shared low-stock alert helper ── */
async function checkLowStock(item) {
  try {
    const settings = await getSettings();
    if (
      settings.notifications?.lowStockAlerts &&
      item.stock <= item.threshold
    ) {
      console.warn(
        `⚠️  LOW STOCK: ${item.name} — ${item.stock} ${item.unit} remaining`,
      );
      // TODO: plug in email/SMS service here when ready
    }
  } catch (err) {
    // Alert failure should never break the main request
    console.error("Low stock alert error:", err);
  }
}

/* ── GET all inventory ── */
router.get("/", async (req, res) => {
  try {
    const items = await InventoryItem.find().sort({ createdAt: 1 });
    res.json(items);
  } catch (err) {
    console.error("GET /inventory error:", err);
    res.status(500).json({ error: "Failed to fetch inventory" });
  }
});

/* ── ADD item ── */
router.post("/", async (req, res) => {
  try {
    const { name, stock, threshold, unit, supplier } = req.body;

    if (!name || stock == null || threshold == null || !unit || !supplier)
      return res.status(400).json({ error: "All fields are required" });

    // Status is handled by the pre-save hook in the model — don't set it here
    const item = await InventoryItem.create({
      name,
      stock: Number(stock),
      threshold: Number(threshold),
      unit,
      supplier,
    });

    await checkLowStock(item);
    res.status(201).json(item);
  } catch (err) {
    console.error("POST /inventory error:", err);
    res.status(500).json({ error: err.message });
  }
});

/* ── UPDATE stock (+ / -) ── */
router.put("/:id/stock", async (req, res) => {
  try {
    const { change } = req.body;

    if (change == null || isNaN(change))
      return res.status(400).json({ error: "Stock change must be a number" });

    const item = await InventoryItem.findById(req.params.id);
    if (!item) return res.status(404).json({ error: "Item not found" });

    item.stock = Math.max(0, item.stock + Number(change));
    // Status recalculated automatically by pre-save hook — removed manual logic
    await item.save();

    await checkLowStock(item);
    res.json(item);
  } catch (err) {
    console.error("PUT /inventory/:id/stock error:", err);
    res.status(500).json({ error: "Failed to update stock" });
  }
});

/* ── DELETE item ── */
router.delete("/:id", async (req, res) => {
  try {
    const item = await InventoryItem.findByIdAndDelete(req.params.id);
    if (!item) return res.status(404).json({ error: "Item not found" });
    res.json({ message: "Item deleted successfully" });
  } catch (err) {
    console.error("DELETE /inventory error:", err);
    res.status(500).json({ error: "Failed to delete item" });
  }
});

export default router;
