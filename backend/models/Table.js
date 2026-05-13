import mongoose from "mongoose";

const TableSchema = new mongoose.Schema({
  number: { type: Number, required: true },
  seats: { type: Number, required: true },
  status: {
    type: String,
    enum: ["available", "occupied", "reserved", "cleaning"],
    default: "available",
  },
  currentOrder: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Order",
    default: null,
  },
  reservedUntil: { type: Number, default: null }, // timestamp
});

export default mongoose.model("Table", TableSchema);
