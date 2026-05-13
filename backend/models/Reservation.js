import mongoose from "mongoose";

const reservationSchema = new mongoose.Schema(
  {
    customerName: { type: String, required: true, trim: true },
    phone: { type: String, required: true, trim: true },
    email: { type: String, trim: true, lowercase: true },
    date: { type: String, required: true },
    time: { type: String, required: true },
    guests: { type: Number, required: true, min: 1, max: 20 },
    status: {
      type: String,
      enum: ["pending", "confirmed", "seated", "cancelled"],
      default: "pending",
    },
    tableId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Table",
      default: null,
    },
    // 'notes' is the frontend field name — stored as specialRequests in DB
    // routes/reservations.js maps notes → specialRequests on the way in
    specialRequests: { type: String, trim: true },
    noShowAt: { type: Date, default: null }, // set when auto-cancelled
  },
  { timestamps: true },
);

// Index for common queries
reservationSchema.index({ date: 1, time: 1 });
reservationSchema.index({ status: 1, createdAt: -1 });

// Virtual: full datetime as a Date object (useful for no-show checks)
reservationSchema.virtual("dateTime").get(function () {
  return new Date(`${this.date}T${this.time}`);
});

export default mongoose.model("Reservation", reservationSchema);
