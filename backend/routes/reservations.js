import express from "express";
import Reservation from "../models/Reservation.js";
import Table from "../models/Table.js";

const router = express.Router();

/* ── GET all reservations ── */
router.get("/", async (req, res) => {
  try {
    const reservations = await Reservation.find()
      .populate("tableId")
      .sort({ createdAt: -1 });
    res.json(reservations);
  } catch (err) {
    console.error("GET /reservations error:", err);
    res.status(500).json({ error: "Failed to fetch reservations" });
  }
});

/* ── CREATE reservation ── */
router.post("/", async (req, res) => {
  try {
    const { customerName, phone, date, time, guests } = req.body;

    if (!customerName || !phone || !date || !time || !guests)
      return res.status(400).json({ error: "Missing required fields" });

    // Map frontend 'notes' field to schema 'specialRequests'
    const { notes, ...rest } = req.body;
    const reservation = await Reservation.create({
      ...rest,
      ...(notes && { specialRequests: notes }),
    });

    res.status(201).json(reservation);
  } catch (err) {
    console.error("POST /reservations error:", err);
    res.status(500).json({ error: "Failed to create reservation" });
  }
});

/* ── UPDATE STATUS ── */
router.put("/:id/status", async (req, res) => {
  try {
    const { status } = req.body;

    const validStatuses = ["pending", "confirmed", "seated", "cancelled"];
    if (!validStatuses.includes(status))
      return res.status(400).json({ error: "Invalid status value" });

    const reservation = await Reservation.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true },
    ).populate("tableId");

    if (!reservation)
      return res.status(404).json({ error: "Reservation not found" });

    res.json(reservation);
  } catch (err) {
    console.error("PUT /reservations/:id/status error:", err);
    res.status(500).json({ error: "Failed to update reservation status" });
  }
});

/* ── SEAT RESERVATION + ASSIGN TABLE ── */
router.put("/:id/seat", async (req, res) => {
  try {
    const { tableId } = req.body;

    if (!tableId) return res.status(400).json({ error: "tableId is required" });

    // Verify table exists
    const table = await Table.findById(tableId);
    if (!table) return res.status(404).json({ error: "Table not found" });

    // Assign table + mark seated in one operation
    const reservation = await Reservation.findByIdAndUpdate(
      req.params.id,
      { status: "seated", tableId },
      { new: true },
    ).populate("tableId");

    if (!reservation)
      return res.status(404).json({ error: "Reservation not found" });

    // Mark table occupied (single source of truth — backend only)
    await Table.findByIdAndUpdate(tableId, { status: "occupied" });

    res.json(reservation);
  } catch (err) {
    console.error("PUT /reservations/:id/seat error:", err);
    res.status(500).json({ error: "Failed to seat reservation" });
  }
});

export default router;
