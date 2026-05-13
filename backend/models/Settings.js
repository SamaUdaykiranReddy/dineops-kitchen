import mongoose from "mongoose";

/* ---------------- DEFAULT SETTINGS ---------------- */
export const DEFAULT_SETTINGS = {
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

/* ---------------- SCHEMA ---------------- */
const settingsSchema = new mongoose.Schema(
  {
    notifications: {
      orderAlerts: { type: Boolean, default: true },
      lowStockAlerts: { type: Boolean, default: true },
      reservationReminders: { type: Boolean, default: true },
      dailyReports: { type: Boolean, default: false },
      emailNotifications: { type: Boolean, default: true },
      smsNotifications: { type: Boolean, default: false },
    },
    automation: {
      autoReorderInventory: { type: Boolean, default: true },
      autoAssignTables: { type: Boolean, default: false },
      autoSendReceipts: { type: Boolean, default: true },
      autoBackup: { type: Boolean, default: true },
    },
    display: {
      showKitchenDisplay: { type: Boolean, default: true },
      soundAlerts: { type: Boolean, default: true },
      darkMode: { type: Boolean, default: true },
      compactView: { type: Boolean, default: false },
    },
    business: {
      restaurantName: {
        type: String,
        default: DEFAULT_SETTINGS.business.restaurantName,
      },
      address: { type: String, default: DEFAULT_SETTINGS.business.address },
      phone: { type: String, default: DEFAULT_SETTINGS.business.phone },
      email: { type: String, default: DEFAULT_SETTINGS.business.email },
      taxRate: { type: Number, default: DEFAULT_SETTINGS.business.taxRate },
    },
  },
  { timestamps: true }
);

export default mongoose.model("Settings", settingsSchema);
