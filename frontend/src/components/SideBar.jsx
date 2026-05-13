import { Link, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  MenuSquare,
  BarChart3,
  CreditCard,
  Users,
  Sparkles,
  ChefHat,
  Armchair,
  Calendar,
  UserCircle,
  FileText,
  Settings,
} from "lucide-react";

const menuItems = [
  {
    icon: LayoutDashboard,
    label: "Dashboard",
    path: "/dashboard",
    group: "main",
  },
  { icon: ChefHat, label: "Kitchen", path: "/kitchen", group: "main" },
  { icon: Armchair, label: "Tables", path: "/tables", group: "main" },
  {
    icon: Calendar,
    label: "Reservations",
    path: "/reservations",
    group: "main",
  },
  { icon: ShoppingCart, label: "Orders", path: "/orders", group: "main" },
  { icon: MenuSquare, label: "Menu", path: "/menu", group: "main" },
  { icon: Package, label: "Inventory", path: "/inventory", group: "main" },
  { icon: CreditCard, label: "Payments", path: "/payments", group: "business" },
  { icon: Users, label: "Staff", path: "/staff", group: "business" },
  {
    icon: UserCircle,
    label: "Customers",
    path: "/customers",
    group: "business",
  },
  {
    icon: BarChart3,
    label: "Analytics",
    path: "/analytics",
    group: "insights",
  },
  { icon: FileText, label: "Reports", path: "/reports", group: "insights" },
  { icon: Settings, label: "Settings", path: "/settings", group: "insights" },
];

const groups = [
  { key: "main", label: "Operations" },
  { key: "business", label: "Business" },
  { key: "insights", label: "Insights" },
];

export default function Sidebar() {
  const location = useLocation();

  return (
    <div className="w-64 bg-slate-900 border-r border-slate-800 flex flex-col h-screen sticky top-0">
      {/* Logo */}
      <div className="p-5 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-lg shadow-violet-500/30">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-white leading-tight">
              DineOps AI
            </h1>
            <p className="text-xs text-slate-500">Smart Restaurant POS</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-6">
        {groups.map((group) => {
          const items = menuItems.filter((i) => i.group === group.key);
          return (
            <div key={group.key}>
              {/* Group label */}
              <p className="text-xs font-semibold text-slate-600 uppercase tracking-widest px-3 mb-2">
                {group.label}
              </p>
              <div className="space-y-0.5">
                {items.map((item) => {
                  const Icon = item.icon;
                  const isActive =
                    location.pathname === item.path ||
                    (item.path !== "/dashboard" &&
                      location.pathname.startsWith(item.path));

                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-150 group relative ${
                        isActive
                          ? "bg-violet-600 text-white shadow-lg shadow-violet-500/20"
                          : "text-slate-400 hover:bg-slate-800 hover:text-slate-200"
                      }`}
                    >
                      {/* Active indicator bar */}
                      {isActive && (
                        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-white/40 rounded-r-full" />
                      )}
                      <Icon
                        className={`w-4 h-4 flex-shrink-0 transition-transform duration-150 ${
                          isActive ? "" : "group-hover:scale-110"
                        }`}
                      />
                      <span className="text-sm font-medium truncate">
                        {item.label}
                      </span>
                    </Link>
                  );
                })}
              </div>
            </div>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="p-3 border-t border-slate-800 space-y-2">
        {/* AI status */}
        <div className="px-3 py-3 bg-gradient-to-r from-violet-500/10 to-purple-500/10 rounded-xl border border-violet-500/20">
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
              <p className="text-xs font-medium text-slate-300">AI Active</p>
            </div>
            <Sparkles className="w-3 h-3 text-violet-400" />
          </div>
          <p className="text-xs text-slate-500">Real-time monitoring on</p>
        </div>
      </div>
    </div>
  );
}
