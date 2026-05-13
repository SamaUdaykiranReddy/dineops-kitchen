import express from "express";
import Order from "../models/Order.js";
import Table from "../models/Table.js";

const router = express.Router();

/* ── GET recent orders ── */
router.get("/recent", async (req, res) => {
  try {
    const orders = await Order.find().sort({ createdAt: -1 }).limit(50);
    res.json(orders);
  } catch (err) {
    console.error("GET /orders/recent error:", err);
    res.status(500).json({ error: "Failed to fetch orders" });
  }
});

/* ── GET single order ── */
router.get("/:id", async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ error: "Order not found" });
    res.json(order);
  } catch (err) {
    console.error("GET /orders/:id error:", err);
    res.status(500).json({ error: "Failed to fetch order" });
  }
});

/* ── CREATE order ── */
router.post("/", async (req, res) => {
  try {
    const { table, items, createdBy } = req.body;

    if (!table || !items?.length)
      return res.status(400).json({ error: "table and items are required" });

    const total = items.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0,
    );

    const newOrder = await Order.create({
      table,
      items,
      total,
      createdBy,
      status: "preparing",
    });

    // Mark table occupied
    await Table.findOneAndUpdate(
      { number: table },
      { status: "occupied", currentOrder: newOrder._id },
    );

    res.status(201).json(newOrder);
  } catch (err) {
    console.error("POST /orders error:", err);
    res.status(500).json({ error: "Failed to create order" });
  }
});

/* ── UPDATE order status + payment ── */
router.put("/:id", async (req, res) => {
  try {
    const { status, paymentStatus } = req.body;

    const updateFields = {};
    if (status) updateFields.status = status;
    if (paymentStatus) updateFields.paymentStatus = paymentStatus;

    if (!Object.keys(updateFields).length)
      return res.status(400).json({ error: "Nothing to update" });

    const updatedOrder = await Order.findByIdAndUpdate(
      req.params.id,
      updateFields,
      { new: true },
    );

    if (!updatedOrder)
      return res.status(404).json({ error: "Order not found" });

    // Free the table when order is completed
    if (status === "completed") {
      await Table.findOneAndUpdate(
        { number: updatedOrder.table },
        { status: "available", currentOrder: null },
      );
    }

    res.json(updatedOrder);
  } catch (err) {
    console.error("PUT /orders/:id error:", err);
    res.status(500).json({ error: "Failed to update order" });
  }
});

/* ── DELETE order ── */
router.delete("/:id", async (req, res) => {
  try {
    const order = await Order.findByIdAndDelete(req.params.id);
    if (!order) return res.status(404).json({ error: "Order not found" });
    res.json({ message: "Order deleted successfully" });
  } catch (err) {
    console.error("DELETE /orders/:id error:", err);
    res.status(500).json({ error: "Failed to delete order" });
  }
});

export default router;
