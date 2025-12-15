import mongoose from "mongoose";

const orderSchema = new mongoose.Schema(
  {
    table: { type: Number, required: true },
    items: [
      {
        name: String,
        price: Number,
        quantity: Number,
      },
    ],
    total: Number,
    status: {
      type: String,
      enum: ["pending", "preparing", "ready", "completed"],
      default: "pending",
    },
  },
  { timestamps: true }
);

export default mongoose.model("Order", orderSchema);
