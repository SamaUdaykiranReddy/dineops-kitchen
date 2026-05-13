import Settings from "../models/Settings.js";
import { DEFAULT_SETTINGS } from "../models/Settings.js";

export async function getSettings() {
  try {
    let settings = await Settings.findOne();

    if (!settings) {
      settings = await Settings.create(DEFAULT_SETTINGS);
      console.log("⚙️  Default settings created");
    }

    return settings;
  } catch (err) {
    console.error("getSettings error:", err);
    // Return in-memory defaults so callers never get null
    return DEFAULT_SETTINGS;
  }
}
