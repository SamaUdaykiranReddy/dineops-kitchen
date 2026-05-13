import mongoose from "mongoose";

const visitSchema = new mongoose.Schema({
  date: { type: Date, default: Date.now },
  orderId: { type: mongoose.Schema.Types.ObjectId, ref: "Order" },
  amount: { type: Number, default: 0 },
  tableNumber: { type: Number },
});

const customerSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, trim: true, lowercase: true },
    phone: { type: String, required: true, trim: true },
    visits: [visitSchema],
    loyaltyPoints: { type: Number, default: 0 },
    totalSpent: { type: Number, default: 0 },
    notes: { type: String, default: "" },
    status: {
      type: String,
      enum: ["active", "vip", "inactive"],
      default: "active",
    },
  },
  { timestamps: true },
);

customerSchema.index({ phone: 1 });
customerSchema.index({ loyaltyPoints: -1 });

export default mongoose.model("Customer", customerSchema);
