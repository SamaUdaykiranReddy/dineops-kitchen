import express from "express";
import Staff from "../models/Staff.js";

const router = express.Router();

/* ── GET all staff ── */
router.get("/", async (req, res) => {
  try {
    const staff = await Staff.find().sort({ createdAt: -1 });
    res.json(staff);
  } catch (err) {
    console.error("GET /staff error:", err);
    res.status(500).json({ error: "Failed to fetch staff" });
  }
});

/* ── GET single staff ── */
router.get("/:id", async (req, res) => {
  try {
    const member = await Staff.findById(req.params.id);
    if (!member)
      return res.status(404).json({ error: "Staff member not found" });
    res.json(member);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch staff member" });
  }
});

/* ── CREATE staff ── */
router.post("/", async (req, res) => {
  try {
    const { name, email, phone, role, salary, shifts } = req.body;
    if (!name || !email || !phone || !role)
      return res
        .status(400)
        .json({ error: "Name, email, phone and role are required" });

    const existing = await Staff.findOne({ email });
    if (existing)
      return res
        .status(409)
        .json({ error: "Staff member with this email already exists" });

    const member = await Staff.create({
      name,
      email,
      phone,
      role,
      salary,
      shifts,
    });
    res.status(201).json(member);
  } catch (err) {
    console.error("POST /staff error:", err);
    res.status(500).json({ error: err.message });
  }
});

/* ── UPDATE staff ── */
router.put("/:id", async (req, res) => {
  try {
    const allowed = [
      "name",
      "email",
      "phone",
      "role",
      "status",
      "salary",
      "shifts",
      "performance",
      "avatar",
    ];
    const update = Object.fromEntries(
      Object.entries(req.body).filter(([key]) => allowed.includes(key)),
    );

    const member = await Staff.findByIdAndUpdate(req.params.id, update, {
      new: true,
      runValidators: true,
    });
    if (!member)
      return res.status(404).json({ error: "Staff member not found" });
    res.json(member);
  } catch (err) {
    res.status(500).json({ error: "Failed to update staff member" });
  }
});

/* ── DELETE staff ── */
router.delete("/:id", async (req, res) => {
  try {
    const member = await Staff.findByIdAndDelete(req.params.id);
    if (!member)
      return res.status(404).json({ error: "Staff member not found" });
    res.json({ message: "Staff member deleted" });
  } catch (err) {
    res.status(500).json({ error: "Failed to delete staff member" });
  }
});

/* ── UPDATE performance ── */
router.put("/:id/performance", async (req, res) => {
  try {
    const { rating, ordersHandled, feedback } = req.body;
    const member = await Staff.findByIdAndUpdate(
      req.params.id,
      { performance: { rating, ordersHandled, feedback } },
      { new: true },
    );
    if (!member)
      return res.status(404).json({ error: "Staff member not found" });
    res.json(member);
  } catch (err) {
    res.status(500).json({ error: "Failed to update performance" });
  }
});

export default router;
