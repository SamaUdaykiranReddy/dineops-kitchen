import { useEffect, useState } from "react";
import {
  Settings,
  Bell,
  Shield,
  Database,
  Palette,
  Wifi,
  Printer,
  CreditCard,
  Mail,
  Save,
  RefreshCw,
  Building2,
  CheckCircle,
  AlertCircle,
} from "lucide-react";
import { toast } from "sonner";
import { API_BASE } from "../config";

export default function SettingsPage() {
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [unsaved, setUnsaved] = useState(false);

  /* ── Fetch settings ── */
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await fetch(`${API_BASE}/settings`);
        const data = await res.json();
        setSettings(data);
      } catch {
        toast.error("Failed to load settings");
      } finally {
        setLoading(false);
      }
    };
    fetchSettings();
  }, []);

  /* ── Toggle ── */
  const handleToggle = (category, key) => {
    setSettings((prev) => ({
      ...prev,
      [category]: {
        ...prev[category],
        [key]: !prev[category][key],
      },
    }));
    setUnsaved(true);
  };

  /* ── Business field change ── */
  const handleBusinessChange = (key, value) => {
    setSettings((prev) => ({
      ...prev,
      business: { ...prev.business, [key]: value },
    }));
    setUnsaved(true);
  };

  /* ── Save ── */
  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch(`${API_BASE}/settings`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });
      if (!res.ok) throw new Error();
      toast.success("Settings saved successfully");
      setUnsaved(false);
    } catch {
      toast.error("Failed to save settings");
    } finally {
      setSaving(false);
    }
  };

  /* ── Reset ── */
  const handleReset = async () => {
    setResetting(true);
    try {
      const res = await fetch(`${API_BASE}/settings/reset`, { method: "POST" });
      const data = await res.json();
      setSettings(data);
      setUnsaved(false);
      toast.success("Settings reset to defaults");
    } catch {
      toast.error("Failed to reset settings");
    } finally {
      setResetting(false);
    }
  };

  if (loading || !settings) {
    return (
      <div className="p-8 bg-slate-950 min-h-screen text-white space-y-6">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-48 bg-slate-800 rounded-xl animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="p-8 bg-slate-950 min-h-screen text-white space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Settings</h1>
          <p className="text-slate-400 text-sm mt-1">
            Configure system preferences and business settings
          </p>
        </div>
        <div className="flex items-center gap-3">
          {unsaved && (
            <span className="text-xs px-3 py-1.5 bg-orange-500/10 border border-orange-500/20 text-orange-400 rounded-full">
              Unsaved changes
            </span>
          )}
          <button
            onClick={handleReset}
            disabled={resetting}
            className="flex items-center gap-2 px-4 py-2 border border-slate-700 hover:bg-slate-800 rounded-xl transition-colors text-sm disabled:opacity-50"
          >
            <RefreshCw
              className={`w-4 h-4 ${resetting ? "animate-spin" : ""}`}
            />
            {resetting ? "Resetting..." : "Reset"}
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 px-4 py-2 bg-violet-600 hover:bg-violet-500 disabled:opacity-50 rounded-xl transition-colors text-sm font-medium"
          >
            <Save className="w-4 h-4" />
            {saving ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </div>

      {/* Business Information */}
      <Section title="Business Information" icon={Building2}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <SettingInput
            label="Restaurant Name"
            value={settings.business.restaurantName}
            onChange={(v) => handleBusinessChange("restaurantName", v)}
          />
          <SettingInput
            label="Phone"
            value={settings.business.phone}
            onChange={(v) => handleBusinessChange("phone", v)}
          />
          <SettingInput
            label="Email"
            type="email"
            value={settings.business.email}
            onChange={(v) => handleBusinessChange("email", v)}
          />
          <SettingInput
            label="Tax Rate (%)"
            type="number"
            step="0.1"
            value={settings.business.taxRate}
            onChange={(v) => handleBusinessChange("taxRate", Number(v))}
          />
          <div className="md:col-span-2">
            <SettingInput
              label="Address"
              value={settings.business.address}
              onChange={(v) => handleBusinessChange("address", v)}
            />
          </div>
        </div>
      </Section>

      {/* Toggle sections */}
      {[
        {
          key: "notifications",
          title: "Notifications",
          icon: Bell,
          description: "Control how and when you receive alerts",
        },
        {
          key: "automation",
          title: "Automation",
          icon: RefreshCw,
          description: "Automate routine tasks and workflows",
        },
        {
          key: "display",
          title: "Display & Interface",
          icon: Palette,
          description: "Customize how the app looks and behaves",
        },
      ].map((section) => (
        <Section
          key={section.key}
          title={section.title}
          icon={section.icon}
          description={section.description}
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {Object.entries(settings[section.key]).map(([key, value]) => (
              <div
                key={key}
                onClick={() => handleToggle(section.key, key)}
                className="flex items-center justify-between p-4 bg-slate-800/60 hover:bg-slate-800 border border-slate-700/50 rounded-xl cursor-pointer transition-all group"
              >
                <div>
                  <p className="text-sm font-medium capitalize text-slate-200">
                    {key.replace(/([A-Z])/g, " $1")}
                  </p>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {value ? "Enabled" : "Disabled"}
                  </p>
                </div>
                {/* Custom toggle switch */}
                <div
                  className={`relative w-11 h-6 rounded-full transition-colors duration-200 ${
                    value ? "bg-violet-600" : "bg-slate-700"
                  }`}
                >
                  <div
                    className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform duration-200 ${
                      value ? "translate-x-5" : "translate-x-0"
                    }`}
                  />
                </div>
              </div>
            ))}
          </div>
        </Section>
      ))}

      {/* Integrations */}
      <Section
        title="Integrations"
        icon={Wifi}
        description="Connected services and third-party tools"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {[
            { name: "Stripe Payments", icon: CreditCard, connected: true },
            { name: "Email Service", icon: Mail, connected: true },
            { name: "Receipt Printer", icon: Printer, connected: false },
            { name: "Backup Service", icon: Database, connected: true },
          ].map((item) => {
            const Icon = item.icon;
            return (
              <div
                key={item.name}
                className="flex items-center justify-between p-4 bg-slate-800/60 border border-slate-700/50 rounded-xl"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-slate-700 flex items-center justify-center">
                    <Icon className="w-4 h-4 text-slate-300" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">{item.name}</p>
                    <p className="text-xs text-slate-500">
                      {item.connected ? "Active" : "Not configured"}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {item.connected ? (
                    <CheckCircle className="w-4 h-4 text-green-400" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-orange-400" />
                  )}
                  <span
                    className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                      item.connected
                        ? "bg-green-500/20 text-green-400"
                        : "bg-orange-500/20 text-orange-400"
                    }`}
                  >
                    {item.connected ? "Connected" : "Not Connected"}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </Section>

      {/* Security */}
      <Section
        title="Security & Privacy"
        icon={Shield}
        description="Manage account security and data privacy"
      >
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <button className="flex items-center justify-center gap-2 px-4 py-3 border border-slate-700 hover:bg-slate-800 rounded-xl transition-colors text-sm">
            <Shield className="w-4 h-4 text-slate-400" />
            Change Password
          </button>
          <button className="flex items-center justify-center gap-2 px-4 py-3 border border-slate-700 hover:bg-slate-800 rounded-xl transition-colors text-sm">
            <CheckCircle className="w-4 h-4 text-slate-400" />
            Two-Factor Auth
          </button>
          <button className="flex items-center justify-center gap-2 px-4 py-3 border border-red-500/30 text-red-400 hover:bg-red-500/10 rounded-xl transition-colors text-sm">
            <AlertCircle className="w-4 h-4" />
            Delete All Data
          </button>
        </div>
      </Section>

      {/* Sticky save bar — appears when unsaved changes exist */}
      {unsaved && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-4 px-6 py-3 bg-slate-800 border border-slate-700 rounded-2xl shadow-2xl z-40">
          <span className="text-sm text-slate-300">
            You have unsaved changes
          </span>
          <button
            onClick={handleReset}
            className="text-sm text-slate-400 hover:text-white transition-colors"
          >
            Discard
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 px-4 py-1.5 bg-violet-600 hover:bg-violet-500 rounded-xl text-sm font-medium transition-colors"
          >
            <Save className="w-3.5 h-3.5" />
            {saving ? "Saving..." : "Save Now"}
          </button>
        </div>
      )}
    </div>
  );
}

/* ── Section wrapper ── */
function Section({ title, icon: Icon, description, children }) {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
      <div className="flex items-start gap-3 mb-6">
        <div className="w-9 h-9 rounded-lg bg-violet-500/10 flex items-center justify-center flex-shrink-0">
          <Icon className="w-4 h-4 text-violet-400" />
        </div>
        <div>
          <h2 className="text-lg font-semibold">{title}</h2>
          {description && (
            <p className="text-xs text-slate-500 mt-0.5">{description}</p>
          )}
        </div>
      </div>
      {children}
    </div>
  );
}

/* ── Input component ── */
function SettingInput({ label, value, onChange, type = "text", step }) {
  return (
    <div>
      <label className="block text-xs text-slate-400 mb-1.5">{label}</label>
      <input
        type={type}
        step={step}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-sm focus:outline-none focus:border-violet-500/50 transition-colors"
      />
    </div>
  );
}
