import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  ChevronRight,
  LayoutDashboard,
  LogOut,
  Shield,
  Truck,
  Wrench,
} from "lucide-react";
import type { ReactNode } from "react";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import { useCallerProfile } from "../hooks/useQueries";

type Page = "dashboard" | "vehicles" | "maintenance" | "vehicle-detail";

interface LayoutProps {
  children: ReactNode;
  currentPage: Page;
  onNavigate: (page: Page, params?: Record<string, unknown>) => void;
}

const navItems = [
  { id: "dashboard" as Page, label: "Dashboard", icon: LayoutDashboard },
  { id: "vehicles" as Page, label: "Fleet", icon: Truck },
  { id: "maintenance" as Page, label: "Maintenance", icon: Wrench },
];

export function Layout({ children, currentPage, onNavigate }: LayoutProps) {
  const { clear, identity } = useInternetIdentity();
  const { data: profile } = useCallerProfile();
  const principal = identity?.getPrincipal().toString();
  const shortPrincipal = principal ? `${principal.slice(0, 8)}...` : "";
  const displayName = profile?.name || shortPrincipal;
  const initials = profile?.name ? profile.name.slice(0, 2).toUpperCase() : "U";

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar */}
      <aside className="sidebar-gradient w-60 flex-shrink-0 flex flex-col text-sidebar-foreground">
        {/* Logo */}
        <div className="px-6 py-5 border-b border-sidebar-border">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <Shield className="w-4 h-4 text-white" />
            </div>
            <span className="font-semibold text-lg tracking-tight text-white">
              FleetGuard
            </span>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-1" data-ocid="nav.section">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active =
              currentPage === item.id ||
              (currentPage === "vehicle-detail" && item.id === "vehicles");
            return (
              <button
                type="button"
                key={item.id}
                data-ocid={`nav.${item.id}.link`}
                onClick={() => onNavigate(item.id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  active
                    ? "bg-sidebar-accent text-white"
                    : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-white"
                }`}
              >
                <Icon className="w-4.5 h-4.5 flex-shrink-0" size={18} />
                {item.label}
                {active && (
                  <ChevronRight className="ml-auto w-3.5 h-3.5 opacity-60" />
                )}
              </button>
            );
          })}
        </nav>

        {/* User */}
        <div className="px-3 py-4 border-t border-sidebar-border">
          <div className="flex items-center gap-3 px-3 py-2 rounded-lg">
            <Avatar className="w-8 h-8 flex-shrink-0">
              <AvatarFallback className="bg-primary text-primary-foreground text-xs font-semibold">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">
                {displayName}
              </p>
              <p className="text-xs text-sidebar-foreground/50 truncate">
                Fleet Manager
              </p>
            </div>
          </div>
          <button
            type="button"
            data-ocid="nav.logout.button"
            onClick={clear}
            className="w-full mt-2 flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-sidebar-foreground/60 hover:text-white hover:bg-sidebar-accent/50 transition-all"
          >
            <LogOut size={16} />
            Sign out
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto bg-background">
        <div className="min-h-full">{children}</div>
      </main>
    </div>
  );
}
