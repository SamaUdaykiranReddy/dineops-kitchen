import mongoose from "mongoose";

const shiftSchema = new mongoose.Schema({
  day: {
    type: String,
    enum: [
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday",
      "Saturday",
      "Sunday",
    ],
    required: true,
  },
  startTime: { type: String, required: true },
  endTime: { type: String, required: true },
});

const staffSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, trim: true, lowercase: true },
    phone: { type: String, required: true, trim: true },
    role: {
      type: String,
      enum: ["manager", "waiter", "chef", "bartender", "host", "cashier"],
      required: true,
    },
    status: {
      type: String,
      enum: ["active", "inactive", "on-leave"],
      default: "active",
    },
    shifts: [shiftSchema],
    salary: { type: Number, default: 0 },
    joinDate: { type: Date, default: Date.now },
    performance: {
      rating: { type: Number, default: 0, min: 0, max: 5 },
      ordersHandled: { type: Number, default: 0 },
      feedback: { type: String, default: "" },
    },
    avatar: { type: String, default: "" },
  },
  { timestamps: true },
);

staffSchema.index({ role: 1, status: 1 });

export default mongoose.model("Staff", staffSchema);
