import mongoose from "mongoose";

const inventorySchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    stock: { type: Number, required: true },
    threshold: { type: Number, required: true },
    unit: { type: String, required: true },
    supplier: { type: String, required: true },
    status: {
      type: String,
      enum: ["good", "low", "critical"],
      default: "good",
    },
  },
  { timestamps: true }
);

// Pre-save hook: auto calculate status
inventorySchema.pre("save", async function () {
  if (this.stock <= 0) this.status = "critical";
  else if (this.stock <= this.threshold) this.status = "low";
  else this.status = "good";
});

export default mongoose.model("Inventory", inventorySchema);
