import mongoose from "mongoose";

const orderSchema = new mongoose.Schema(
  {
    table: { type: Number, required: true },
    items: [
      {
        name: { type: String, required: true },
        price: { type: Number, required: true },
        quantity: { type: Number, required: true, min: 1 },
      },
    ],
    total: { type: Number, required: true, min: 0 },
    status: {
      type: String,
      enum: ["pending", "preparing", "ready", "completed"],
      default: "pending",
    },
    paymentStatus: {
      type: String,
      enum: ["unpaid", "paid", "refunded"],
      default: "unpaid",
    },
    createdBy: { type: String, default: "staff" },
  },
  { timestamps: true },
);

// Virtual: total items count (useful for kitchen display)
orderSchema.virtual("itemCount").get(function () {
  return this.items.reduce((sum, item) => sum + item.quantity, 0);
});

// Index for common queries
orderSchema.index({ status: 1, createdAt: -1 });
orderSchema.index({ table: 1, status: 1 });

export default mongoose.model("Order", orderSchema);
