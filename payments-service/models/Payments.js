import mongoose, { Schema } from "mongoose";

const paymentSchema = new mongoose.Schema(
  {
    orderId: {type: mongoose.Schema.Types.ObjectId, required: true, unique: true},
    amount: { type: Number, required: true },
    method: { type: String, enum: ["cash", "card", "wallet","ebt"], required: true },
    status: {
      type: String,
      enum: ["pending", "completed", "failed"],
      default: "pending",
    },
    transactionId: { type: String },
  },

  { timestamps: true },
);

export default mongoose.model("Payment", paymentSchema);
