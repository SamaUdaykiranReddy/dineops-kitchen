import "dotenv/config";
import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import paymentsRoutes from "./routes/payments.js";

const app = express();
const PORT = process.env.PORT || 5007;

app.use(cors({ origin: "http://localhost:3000", credentials: true }));
app.use(express.json());

app.use("/payments", paymentsRoutes);

app.use((req, res) => {
  res.status(404).json({ error: "Endpoint not found" });
});

app.use((err, req, res, next) => {
  console.error("Unhandled error:", err);
  res.status(500).json({ error: "Internal server error" });
});

const startServer = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅  Payments service connected to MongoDB");
    app.listen(PORT, () => {
      console.log(`🚀  Payments service running on http://localhost:${PORT}`);
    });
  } catch (err) {
    console.error("❌  MongoDB connection error:", err);
    process.exit(1);
  }
};

startServer();
