import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  CalendarClock,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  ClipboardList,
  Code2,
  FileBarChart,
  FolderOpen,
  History,
  LayoutDashboard,
  LogOut,
  Menu,
  Moon,
  Package,
  Settings,
  ShieldCheck,
  Store,
  Sun,
  Truck,
  Wrench,
} from "lucide-react";
import type { ElementType, ReactNode } from "react";
import { useState } from "react";
import type { Page } from "../App";
import { FleetRole } from "../backend";
import { useDarkMode } from "../hooks/useDarkMode";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import {
  useCallerFleetRole,
  useCallerProfile,
  useGetCompanySettings,
  useIsAdmin,
} from "../hooks/useQueries";

interface LayoutProps {
  children: ReactNode;
  currentPage: Page;
  onNavigate: (page: Page, params?: Record<string, unknown>) => void;
}

const MAINTENANCE_PAGES: Page[] = [
  "maintenance",
  "maintenance-history",
  "work-orders",
  "service-schedules",
];

const topNavItemsBefore = [
  { id: "dashboard" as Page, label: "Dashboard", icon: LayoutDashboard },
];

const topNavItemsAfter = [
  { id: "vehicles" as Page, label: "Fleet", icon: Truck },
  { id: "parts" as Page, label: "Parts", icon: Package },
  { id: "vendors" as Page, label: "Vendors", icon: Store },
  { id: "warranties" as Page, label: "Warranties", icon: ShieldCheck },
  { id: "reports" as Page, label: "Reports", icon: FileBarChart },
  { id: "documents" as Page, label: "Documents", icon: FolderOpen },
];

const maintenanceSubItems = [
  { id: "work-orders" as Page, label: "Work Orders", icon: ClipboardList },
  {
    id: "service-schedules" as Page,
    label: "Service Schedules",
    icon: CalendarClock,
  },
  {
    id: "maintenance-history" as Page,
    label: "Maintenance History",
    icon: History,
  },
];

export function Layout({ children, currentPage, onNavigate }: LayoutProps) {
  const { clear, identity } = useInternetIdentity();
  const { data: profile } = useCallerProfile();
  const { data: companySettings } = useGetCompanySettings();
  const { data: fleetRole } = useCallerFleetRole();
  const { data: isAdmin } = useIsAdmin();
  const { isDark, toggle: toggleDark } = useDarkMode();
  const principal = identity?.getPrincipal().toString();
  const shortPrincipal = principal ? `${principal.slice(0, 8)}...` : "";
  const displayName = profile?.name || shortPrincipal;
  const initials = profile?.name ? profile.name.slice(0, 2).toUpperCase() : "U";

  const isMaintenanceActive = MAINTENANCE_PAGES.includes(currentPage);
  const [maintenanceOpen, setMaintenanceOpen] = useState(isMaintenanceActive);
  const isDevMode = localStorage.getItem("devKey") === "FLEETGUARD_DEV_2026";

  const [sidebarCollapsed, setSidebarCollapsed] = useState(
    () => localStorage.getItem("fleetguard_sidebar_collapsed") === "true",
  );
  const [mobileOpen, setMobileOpen] = useState(false);

  const toggleSidebar = () => {
    setSidebarCollapsed((prev) => {
      const next = !prev;
      localStorage.setItem("fleetguard_sidebar_collapsed", String(next));
      return next;
    });
  };

  let roleName = "Fleet Member";
  let roleColorClass = "text-sidebar-foreground/50";
  if (fleetRole === FleetRole.Admin || isAdmin) {
    roleName = "Administrator";
    roleColorClass = "text-primary";
  } else if (fleetRole === FleetRole.FleetManager) {
    roleName = "Fleet Manager";
    roleColorClass = "text-success";
  } else if (fleetRole === FleetRole.Mechanic) {
    roleName = "Mechanic";
    roleColorClass = "text-amber-400";
  }

  const handleNavClick = (page: Page) => {
    onNavigate(page);
    setMobileOpen(false);
  };

  const navItemClass = (active: boolean) =>
    `w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 relative overflow-hidden ${
      active
        ? "nav-item-active"
        : "text-sidebar-foreground/70 hover:bg-white/8 hover:text-white"
    }`;

  const navIconClass = (active: boolean) =>
    `w-full flex items-center justify-center py-2.5 rounded-lg transition-all duration-150 relative overflow-hidden ${
      active
        ? "nav-item-active"
        : "text-sidebar-foreground/70 hover:bg-white/8 hover:text-white"
    }`;

  const renderNavItem = (item: {
    id: Page;
    label: string;
    icon: ElementType;
  }) => {
    const Icon = item.icon;
    const active =
      currentPage === item.id ||
      (currentPage === "vehicle-detail" && item.id === "vehicles");

    if (sidebarCollapsed) {
      return (
        <Tooltip key={item.id}>
          <TooltipTrigger asChild>
            <button
              type="button"
              data-ocid={`nav.${item.id}.link`}
              onClick={() => handleNavClick(item.id)}
              className={navIconClass(active)}
            >
              <Icon size={18} />
            </button>
          </TooltipTrigger>
          <TooltipContent side="right">{item.label}</TooltipContent>
        </Tooltip>
      );
    }

    return (
      <button
        type="button"
        key={item.id}
        data-ocid={`nav.${item.id}.link`}
        onClick={() => handleNavClick(item.id)}
        className={navItemClass(active)}
      >
        <Icon className="flex-shrink-0" size={18} />
        {item.label}
        {active && <ChevronRight className="ml-auto w-3.5 h-3.5 opacity-40" />}
      </button>
    );
  };

  const SidebarInner = ({ collapsed }: { collapsed: boolean }) => (
    <>
      {/* Logo / brand */}
      <div
        className={`border-b border-sidebar-border/50 flex items-center ${collapsed ? "justify-center py-4 px-1" : "px-4 py-5"}`}
      >
        {collapsed ? (
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                type="button"
                data-ocid="nav.sidebar.toggle"
                onClick={toggleSidebar}
                className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center hover:bg-primary/30 transition-colors"
              >
                <img
                  src="/assets/generated/fleetguard-logo-transparent.dim_64x64.png"
                  alt="FleetGuard"
                  className="w-7 h-7 object-contain"
                />
              </button>
            </TooltipTrigger>
            <TooltipContent side="right">Expand Sidebar</TooltipContent>
          </Tooltip>
        ) : (
          <div className="flex items-center gap-2.5 w-full">
            {companySettings?.logoUrl ? (
              <img
                src={companySettings.logoUrl}
                alt="Company Logo"
                className="w-10 h-10 rounded-lg object-cover flex-shrink-0"
              />
            ) : (
              <img
                src="/assets/generated/fleetguard-logo-transparent.dim_64x64.png"
                alt="FleetGuard"
                className="w-10 h-10 object-contain flex-shrink-0"
              />
            )}
            <span className="font-semibold text-base tracking-tight text-white truncate flex-1">
              {companySettings?.companyName || "FleetGuard"}
            </span>
            <button
              type="button"
              data-ocid="nav.sidebar.toggle"
              onClick={toggleSidebar}
              className="flex-shrink-0 w-6 h-6 rounded flex items-center justify-center text-sidebar-foreground/40 hover:text-white hover:bg-white/8 transition-colors"
              title="Collapse sidebar"
            >
              <ChevronLeft size={14} />
            </button>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav
        className={`flex-1 py-4 space-y-0.5 overflow-y-auto overflow-x-hidden ${collapsed ? "px-1" : "px-3"}`}
        data-ocid="nav.section"
      >
        {topNavItemsBefore.map(renderNavItem)}

        {/* Maintenance group */}
        <div>
          {collapsed ? (
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  data-ocid="nav.maintenance.link"
                  onClick={() => {
                    setSidebarCollapsed(false);
                    localStorage.setItem(
                      "fleetguard_sidebar_collapsed",
                      "false",
                    );
                    setMaintenanceOpen(true);
                  }}
                  className={navIconClass(isMaintenanceActive)}
                >
                  <Wrench size={18} />
                </button>
              </TooltipTrigger>
              <TooltipContent side="right">Maintenance</TooltipContent>
            </Tooltip>
          ) : (
            <>
              <button
                type="button"
                data-ocid="nav.maintenance.link"
                onClick={() => setMaintenanceOpen((prev) => !prev)}
                className={navItemClass(isMaintenanceActive)}
              >
                <Wrench size={18} className="flex-shrink-0" />
                Maintenance
                <span className="ml-auto">
                  {maintenanceOpen ? (
                    <ChevronUp size={14} className="opacity-50" />
                  ) : (
                    <ChevronDown size={14} className="opacity-50" />
                  )}
                </span>
              </button>
              {maintenanceOpen && (
                <div className="mt-0.5 space-y-0.5">
                  {maintenanceSubItems.map((sub) => {
                    const SubIcon = sub.icon;
                    const active = currentPage === sub.id;
                    return (
                      <button
                        type="button"
                        key={sub.id}
                        data-ocid={`nav.${sub.id}.link`}
                        onClick={() => handleNavClick(sub.id)}
                        className={`w-full flex items-center gap-3 pl-8 pr-3 py-2 rounded-lg text-sm font-medium transition-all duration-150 relative overflow-hidden ${
                          active
                            ? "nav-item-active"
                            : "text-sidebar-foreground/55 hover:bg-white/8 hover:text-white"
                        }`}
                      >
                        <SubIcon size={15} className="flex-shrink-0" />
                        {sub.label}
                        {active && (
                          <ChevronRight className="ml-auto w-3 h-3 opacity-40" />
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </>
          )}
        </div>

        {topNavItemsAfter.map(renderNavItem)}

        <div className="pt-2 mt-2 border-t border-sidebar-border/30">
          {collapsed ? (
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  data-ocid="nav.settings.link"
                  onClick={() => handleNavClick("settings")}
                  className={navIconClass(currentPage === "settings")}
                >
                  <Settings size={18} />
                </button>
              </TooltipTrigger>
              <TooltipContent side="right">Settings</TooltipContent>
            </Tooltip>
          ) : (
            <button
              type="button"
              data-ocid="nav.settings.link"
              onClick={() => handleNavClick("settings")}
              className={navItemClass(currentPage === "settings")}
            >
              <Settings size={18} className="flex-shrink-0" />
              Settings
              {currentPage === "settings" && (
                <ChevronRight className="ml-auto w-3.5 h-3.5 opacity-40" />
              )}
            </button>
          )}
        </div>

        {isDevMode && (
          <div className="px-0">
            {collapsed ? (
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    data-ocid="nav.devportal.link"
                    onClick={() => {
                      window.location.href = `${window.location.origin}?devKey=FLEETGUARD_DEV_2026`;
                    }}
                    className="w-full flex items-center justify-center py-2.5 rounded-lg transition-all text-amber-400 hover:bg-amber-400/10"
                  >
                    <Code2 size={18} />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="right">Dev Portal</TooltipContent>
              </Tooltip>
            ) : (
              <button
                type="button"
                data-ocid="nav.devportal.link"
                onClick={() => {
                  window.location.href = `${window.location.origin}?devKey=FLEETGUARD_DEV_2026`;
                }}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all text-amber-400 hover:bg-amber-400/10"
              >
                <Code2 size={18} className="flex-shrink-0" />
                Dev Portal
              </button>
            )}
          </div>
        )}
      </nav>

      {/* User */}
      <div
        className={`py-4 border-t border-sidebar-border/50 ${collapsed ? "px-1" : "px-3"}`}
      >
        {collapsed ? (
          <div className="flex flex-col items-center gap-2">
            <Tooltip>
              <TooltipTrigger asChild>
                <Avatar className="w-8 h-8 cursor-pointer">
                  <AvatarFallback className="bg-primary/30 text-white text-xs font-semibold">
                    {initials}
                  </AvatarFallback>
                </Avatar>
              </TooltipTrigger>
              <TooltipContent side="right">
                {displayName} &middot; {roleName}
              </TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  data-ocid="nav.darkmode.toggle"
                  onClick={toggleDark}
                  className="w-8 h-8 flex items-center justify-center rounded-lg text-sidebar-foreground/60 hover:text-white hover:bg-white/8 transition-all"
                >
                  {isDark ? <Sun size={15} /> : <Moon size={15} />}
                </button>
              </TooltipTrigger>
              <TooltipContent side="right">
                {isDark ? "Light mode" : "Dark mode"}
              </TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  data-ocid="nav.logout.button"
                  onClick={clear}
                  className="w-8 h-8 flex items-center justify-center rounded-lg text-sidebar-foreground/60 hover:text-white hover:bg-white/8 transition-all"
                >
                  <LogOut size={15} />
                </button>
              </TooltipTrigger>
              <TooltipContent side="right">Sign out</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  data-ocid="nav.sidebar.expand"
                  onClick={toggleSidebar}
                  className="w-8 h-8 flex items-center justify-center rounded-lg text-sidebar-foreground/40 hover:text-white hover:bg-white/8 transition-all mt-1"
                >
                  <ChevronRight size={14} />
                </button>
              </TooltipTrigger>
              <TooltipContent side="right">Expand Sidebar</TooltipContent>
            </Tooltip>
          </div>
        ) : (
          <>
            <div className="flex items-center gap-3 px-3 py-2 rounded-lg">
              <Avatar className="w-8 h-8 flex-shrink-0">
                <AvatarFallback className="bg-primary/30 text-white text-xs font-semibold">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">
                  {displayName}
                </p>
                <p className={`text-xs truncate ${roleColorClass}`}>
                  {roleName}
                </p>
              </div>
            </div>
            <button
              type="button"
              data-ocid="nav.darkmode.toggle"
              onClick={toggleDark}
              className="w-full mt-1 flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-sidebar-foreground/60 hover:text-white hover:bg-white/8 transition-all"
            >
              {isDark ? <Sun size={16} /> : <Moon size={16} />}
              {isDark ? "Light Mode" : "Dark Mode"}
            </button>
            <button
              type="button"
              data-ocid="nav.logout.button"
              onClick={clear}
              className="w-full mt-1 flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-sidebar-foreground/60 hover:text-white hover:bg-white/8 transition-all"
            >
              <LogOut size={16} />
              Sign out
            </button>
          </>
        )}
      </div>
    </>
  );

  return (
    <TooltipProvider delayDuration={200}>
      <div className="flex h-screen overflow-hidden">
        {/* Desktop sidebar */}
        <aside
          className="sidebar-gradient flex-shrink-0 flex-col text-sidebar-foreground transition-all duration-300 ease-in-out hidden sm:flex"
          style={{ width: sidebarCollapsed ? "56px" : "240px" }}
        >
          <SidebarInner collapsed={sidebarCollapsed} />
        </aside>

        {/* Mobile sidebar overlay */}
        {mobileOpen && (
          <>
            <div
              role="button"
              tabIndex={0}
              className="fixed inset-0 bg-black/50 z-40 sm:hidden cursor-default"
              onClick={() => setMobileOpen(false)}
              onKeyDown={(e) => {
                if (e.key === "Escape") setMobileOpen(false);
              }}
            />
            <aside className="sidebar-gradient fixed inset-y-0 left-0 z-50 flex flex-col text-sidebar-foreground w-[240px] sm:hidden">
              <SidebarInner collapsed={false} />
            </aside>
          </>
        )}

        {/* Main */}
        <div className="flex-1 flex flex-col overflow-hidden min-w-0">
          <header className="bg-card border-b border-border px-4 sm:px-6 py-3 flex items-center justify-between flex-shrink-0">
            {/* Hamburger (mobile only) */}
            <button
              type="button"
              data-ocid="header.menu.button"
              className="sm:hidden flex items-center justify-center w-9 h-9 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-all"
              onClick={() => setMobileOpen(true)}
            >
              <Menu size={20} />
            </button>

            {/* Mobile logo */}
            <div className="sm:hidden flex items-center gap-2">
              <img
                src="/assets/generated/fleetguard-logo-transparent.dim_64x64.png"
                alt="FleetGuard"
                className="w-8 h-8 object-contain"
              />
              <span className="text-sm font-semibold text-foreground">
                {companySettings?.companyName || "FleetGuard"}
              </span>
            </div>

            {/* Desktop header logo + company name */}
            <div className="hidden sm:flex items-center gap-2.5">
              <img
                src="/assets/generated/fleetguard-logo-transparent.dim_64x64.png"
                alt="FleetGuard"
                className="w-9 h-9 object-contain"
              />
              <span className="text-sm font-semibold text-foreground">
                {companySettings?.companyName || "FleetGuard"}
              </span>
            </div>

            {/* Right side */}
            <div className="flex items-center gap-2 ml-auto">
              <button
                type="button"
                data-ocid="header.darkmode.toggle"
                onClick={toggleDark}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-all"
              >
                {isDark ? <Sun size={16} /> : <Moon size={16} />}
                <span className="text-xs font-medium hidden sm:inline">
                  {isDark ? "Light" : "Dark"}
                </span>
              </button>
            </div>
          </header>

          <main className="flex-1 overflow-y-auto bg-background">
            <div className="min-h-full">{children}</div>
          </main>
        </div>
      </div>
    </TooltipProvider>
  );
}
