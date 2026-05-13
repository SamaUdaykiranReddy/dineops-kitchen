import express from "express";
import Customer from "../models/Customer.js";

const router = express.Router();

/* ── GET all customers ── */
router.get("/", async (req, res) => {
  try {
    const customers = await Customer.find().sort({ createdAt: -1 });
    res.json(customers);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch customers" });
  }
});

/* ── GET single customer ── */
router.get("/:id", async (req, res) => {
  try {
    const customer = await Customer.findById(req.params.id);
    if (!customer) return res.status(404).json({ error: "Customer not found" });
    res.json(customer);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch customer" });
  }
});

/* ── CREATE customer ── */
router.post("/", async (req, res) => {
  try {
    const { name, phone, email, notes } = req.body;
    if (!name || !phone)
      return res.status(400).json({ error: "Name and phone are required" });

    const existing = await Customer.findOne({ phone });
    if (existing)
      return res
        .status(409)
        .json({ error: "Customer with this phone already exists" });

    const customer = await Customer.create({ name, phone, email, notes });
    res.status(201).json(customer);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* ── UPDATE customer ── */
router.put("/:id", async (req, res) => {
  try {
    const allowed = [
      "name",
      "email",
      "phone",
      "notes",
      "status",
      "loyaltyPoints",
    ];
    const update = Object.fromEntries(
      Object.entries(req.body).filter(([key]) => allowed.includes(key)),
    );

    const customer = await Customer.findByIdAndUpdate(req.params.id, update, {
      new: true,
      runValidators: true,
    });
    if (!customer) return res.status(404).json({ error: "Customer not found" });
    res.json(customer);
  } catch (err) {
    res.status(500).json({ error: "Failed to update customer" });
  }
});

/* ── DELETE customer ── */
router.delete("/:id", async (req, res) => {
  try {
    const customer = await Customer.findByIdAndDelete(req.params.id);
    if (!customer) return res.status(404).json({ error: "Customer not found" });
    res.json({ message: "Customer deleted" });
  } catch (err) {
    res.status(500).json({ error: "Failed to delete customer" });
  }
});

/* ── ADD visit ── */
router.post("/:id/visit", async (req, res) => {
  try {
    const { orderId, amount, tableNumber } = req.body;
    const pointsEarned = Math.floor(amount);

    const customer = await Customer.findByIdAndUpdate(
      req.params.id,
      {
        $push: { visits: { orderId, amount, tableNumber } },
        $inc: { totalSpent: amount, loyaltyPoints: pointsEarned },
      },
      { new: true },
    );

    if (!customer) return res.status(404).json({ error: "Customer not found" });

    // Auto upgrade to VIP at 500 points
    if (customer.loyaltyPoints >= 500 && customer.status !== "vip") {
      customer.status = "vip";
      await customer.save();
    }

    res.json(customer);
  } catch (err) {
    res.status(500).json({ error: "Failed to add visit" });
  }
});

export default router;
