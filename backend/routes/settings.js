import express from "express";
import Settings from "../models/Settings.js";

const router = express.Router();

/* ---------------- DEFAULT SETTINGS ---------------- */
const DEFAULT_SETTINGS = {
  notifications: {
    orderAlerts: true,
    lowStockAlerts: true,
    reservationReminders: true,
    dailyReports: false,
    emailNotifications: true,
    smsNotifications: false,
  },
  automation: {
    autoReorderInventory: true,
    autoAssignTables: false,
    autoSendReceipts: true,
    autoBackup: true,
  },
  display: {
    showKitchenDisplay: true,
    soundAlerts: true,
    darkMode: true,
    compactView: false,
  },
  business: {
    restaurantName: "DineOps Restaurant",
    address: "123 Main Street",
    phone: "+1 234 567 8900",
    email: "contact@dineops.com",
    taxRate: 8.5,
  },
};

/* ---------------- GET SETTINGS ---------------- */
router.get("/", async (req, res) => {
  try {
    let settings = await Settings.findOne();

    if (!settings) {
      settings = await Settings.create(DEFAULT_SETTINGS);
    }

    res.json(settings);
  } catch (err) {
    console.error("GET /settings error:", err);
    res.status(500).json({ error: "Failed to load settings" });
  }
});

/* ---------------- UPDATE SETTINGS ---------------- */
router.put("/", async (req, res) => {
  try {
    const { notifications, automation, display, business } = req.body;

    const updated = await Settings.findOneAndUpdate(
      {},
      { $set: { notifications, automation, display, business } },
      { new: true, upsert: true, runValidators: true }
    );

    res.json(updated);
  } catch (err) {
    console.error("PUT /settings error:", err);
    res.status(500).json({ error: "Failed to update settings" });
  }
});

/* ---------------- RESET SETTINGS ---------------- */
router.post("/reset", async (req, res) => {
  try {
    // Delete current settings
    await Settings.deleteMany({});
    // Recreate defaults
    const newSettings = await Settings.create(DEFAULT_SETTINGS);
    res.json(newSettings);
  } catch (err) {
    console.error("POST /settings/reset error:", err);
    res.status(500).json({ error: "Failed to reset settings" });
  }
});

export default router;
