import express from "express";
import Table from "../models/Table.js";

const router = express.Router();

/* ── Allowed fields for update (prevent client overwriting currentOrder etc.) ── */
const UPDATABLE_FIELDS = ["number", "seats", "status", "reservedUntil"];

/* ── GET all tables ── */
router.get("/", async (req, res) => {
  try {
    const tables = await Table.find()
      .sort({ number: 1 })
      .populate("currentOrder");
    res.json(tables);
  } catch (err) {
    console.error("GET /tables error:", err);
    res.status(500).json({ error: "Failed to fetch tables" });
  }
});

/* ── GET single table ── */
router.get("/:id", async (req, res) => {
  try {
    const table = await Table.findById(req.params.id).populate("currentOrder");
    if (!table) return res.status(404).json({ error: "Table not found" });
    res.json(table);
  } catch (err) {
    console.error("GET /tables/:id error:", err);
    res.status(500).json({ error: "Failed to fetch table" });
  }
});

/* ── CREATE single table ── */
router.post("/", async (req, res) => {
  try {
    const { number, seats } = req.body;

    if (!number || !seats)
      return res.status(400).json({ error: "number and seats are required" });

    // Prevent duplicate table numbers
    const existing = await Table.findOne({ number });
    if (existing)
      return res.status(409).json({ error: `Table ${number} already exists` });

    const newTable = await Table.create({ number, seats });
    res.status(201).json(newTable);
  } catch (err) {
    console.error("POST /tables error:", err);
    res.status(500).json({ error: "Failed to create table" });
  }
});

/* ── BULK CREATE tables ── */
router.post("/bulk", async (req, res) => {
  try {
    const { numberOfTables, seatsPerTable } = req.body;

    if (!numberOfTables || !seatsPerTable)
      return res
        .status(400)
        .json({ error: "numberOfTables and seatsPerTable are required" });

    // Find highest existing table number to avoid duplicates on repeat calls
    const lastTable = await Table.findOne().sort({ number: -1 });
    const startFrom = lastTable ? lastTable.number + 1 : 1;

    const tablesToCreate = Array.from({ length: numberOfTables }, (_, i) => ({
      number: startFrom + i,
      seats: seatsPerTable,
    }));

    const createdTables = await Table.insertMany(tablesToCreate);
    res.status(201).json(createdTables);
  } catch (err) {
    console.error("POST /tables/bulk error:", err);
    res.status(500).json({ error: "Failed to create tables" });
  }
});

/* ── UPDATE table ── */
router.put("/:id", async (req, res) => {
  try {
    // Whitelist fields — prevent client from overwriting currentOrder or _id
    const update = Object.fromEntries(
      Object.entries(req.body).filter(([key]) =>
        UPDATABLE_FIELDS.includes(key),
      ),
    );

    if (!Object.keys(update).length)
      return res.status(400).json({ error: "No valid fields to update" });

    const updatedTable = await Table.findByIdAndUpdate(req.params.id, update, {
      new: true,
      runValidators: true,
    }).populate("currentOrder");

    if (!updatedTable)
      return res.status(404).json({ error: "Table not found" });

    res.json(updatedTable);
  } catch (err) {
    console.error("PUT /tables/:id error:", err);
    res.status(500).json({ error: "Failed to update table" });
  }
});

/* ── DELETE table ── */
router.delete("/:id", async (req, res) => {
  try {
    const table = await Table.findByIdAndDelete(req.params.id);
    if (!table) return res.status(404).json({ error: "Table not found" });
    res.json({ message: "Table deleted successfully" });
  } catch (err) {
    console.error("DELETE /tables/:id error:", err);
    res.status(500).json({ error: "Failed to delete table" });
  }
});

export default router;
