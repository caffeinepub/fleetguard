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
  FileBarChart,
  History,
  LayoutDashboard,
  LogOut,
  MessageSquare,
  Package,
  Settings,
  Shield,
  ShieldCheck,
  Store,
  Truck,
  Wrench,
} from "lucide-react";
import type { ElementType, ReactNode } from "react";
import { useState } from "react";
import type { Page } from "../App";
import { FleetRole } from "../backend";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import {
  useCallerFleetRole,
  useCallerProfile,
  useChatMessages,
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
  { id: "group-chat" as Page, label: "Team Chat", icon: MessageSquare },
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

function getLastReadNs(): bigint {
  try {
    const v = localStorage.getItem("fleetguard_chat_last_read");
    return v ? BigInt(v) : 0n;
  } catch {
    return 0n;
  }
}

export function Layout({ children, currentPage, onNavigate }: LayoutProps) {
  const { clear, identity } = useInternetIdentity();
  const { data: profile } = useCallerProfile();
  const { data: companySettings } = useGetCompanySettings();
  const { data: fleetRole } = useCallerFleetRole();
  const { data: isAdmin } = useIsAdmin();
  const { data: chatMessages } = useChatMessages();
  const principal = identity?.getPrincipal().toString();
  const shortPrincipal = principal ? `${principal.slice(0, 8)}...` : "";
  const displayName = profile?.name || shortPrincipal;
  const initials = profile?.name ? profile.name.slice(0, 2).toUpperCase() : "U";

  const isMaintenanceActive = MAINTENANCE_PAGES.includes(currentPage);
  const [maintenanceOpen, setMaintenanceOpen] = useState(isMaintenanceActive);

  const [sidebarCollapsed, setSidebarCollapsed] = useState(
    () => localStorage.getItem("fleetguard_sidebar_collapsed") === "true",
  );

  const toggleSidebar = () => {
    setSidebarCollapsed((prev) => {
      const next = !prev;
      localStorage.setItem("fleetguard_sidebar_collapsed", String(next));
      return next;
    });
  };

  // Unread message count
  const unreadCount =
    currentPage !== "group-chat" && chatMessages
      ? chatMessages.filter((msg) => {
          const lastRead = getLastReadNs();
          return Number(msg.createdAt) > Number(lastRead);
        }).length
      : 0;

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

  const renderNavItem = (item: {
    id: Page;
    label: string;
    icon: ElementType;
  }) => {
    const Icon = item.icon;
    const active =
      currentPage === item.id ||
      (currentPage === "vehicle-detail" && item.id === "vehicles");
    const isChat = item.id === "group-chat";
    const showBadge = isChat && unreadCount > 0;

    if (sidebarCollapsed) {
      return (
        <Tooltip key={item.id}>
          <TooltipTrigger asChild>
            <button
              type="button"
              data-ocid={`nav.${item.id}.link`}
              onClick={() => onNavigate(item.id)}
              className={`w-full flex items-center justify-center py-2.5 rounded-lg transition-all relative ${
                active
                  ? "bg-sidebar-accent text-white"
                  : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-white"
              }`}
            >
              <span className="relative">
                <Icon size={18} />
                {showBadge && (
                  <span className="absolute -top-1.5 -right-1.5 min-w-[16px] h-4 px-0.5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center leading-none">
                    {unreadCount > 99 ? "99+" : unreadCount}
                  </span>
                )}
              </span>
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
        onClick={() => onNavigate(item.id)}
        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
          active
            ? "bg-sidebar-accent text-white"
            : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-white"
        }`}
      >
        <span className="relative flex-shrink-0">
          <Icon className="w-4.5 h-4.5" size={18} />
          {showBadge && (
            <span className="absolute -top-1.5 -right-1.5 min-w-[16px] h-4 px-0.5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center leading-none">
              {unreadCount > 99 ? "99+" : unreadCount}
            </span>
          )}
        </span>
        {item.label}
        {active && <ChevronRight className="ml-auto w-3.5 h-3.5 opacity-60" />}
      </button>
    );
  };

  return (
    <TooltipProvider delayDuration={200}>
      <div className="flex h-screen overflow-hidden">
        {/* Sidebar */}
        <aside
          className="sidebar-gradient flex-shrink-0 flex flex-col text-sidebar-foreground transition-all duration-300 ease-in-out"
          style={{ width: sidebarCollapsed ? "56px" : "240px" }}
        >
          {/* Logo + collapse toggle */}
          <div
            className={`border-b border-sidebar-border flex items-center ${
              sidebarCollapsed ? "justify-center py-4 px-1" : "px-4 py-5"
            }`}
          >
            {sidebarCollapsed ? (
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    data-ocid="nav.sidebar.toggle"
                    onClick={toggleSidebar}
                    className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center hover:bg-primary/80 transition-colors"
                  >
                    <Shield className="w-4 h-4 text-white" />
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
                    className="w-8 h-8 rounded-lg object-cover flex-shrink-0"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center flex-shrink-0">
                    <Shield className="w-4 h-4 text-white" />
                  </div>
                )}
                <span className="font-semibold text-base tracking-tight text-white truncate flex-1">
                  {companySettings?.companyName || "FleetGuard"}
                </span>
                <button
                  type="button"
                  data-ocid="nav.sidebar.toggle"
                  onClick={toggleSidebar}
                  className="flex-shrink-0 w-6 h-6 rounded flex items-center justify-center text-sidebar-foreground/50 hover:text-white hover:bg-sidebar-accent/50 transition-colors"
                  title="Collapse sidebar"
                >
                  <ChevronLeft size={14} />
                </button>
              </div>
            )}
          </div>

          {/* Nav */}
          <nav
            className={`flex-1 py-4 space-y-1 overflow-y-auto overflow-x-hidden ${
              sidebarCollapsed ? "px-1" : "px-3"
            }`}
            data-ocid="nav.section"
          >
            {topNavItemsBefore.map(renderNavItem)}

            {/* Maintenance expandable group */}
            <div>
              {sidebarCollapsed ? (
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
                      className={`w-full flex items-center justify-center py-2.5 rounded-lg transition-all ${
                        isMaintenanceActive
                          ? "bg-sidebar-accent text-white"
                          : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-white"
                      }`}
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
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                      isMaintenanceActive
                        ? "bg-sidebar-accent text-white"
                        : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-white"
                    }`}
                  >
                    <Wrench size={18} className="flex-shrink-0" />
                    Maintenance
                    <span className="ml-auto">
                      {maintenanceOpen ? (
                        <ChevronUp size={14} className="opacity-60" />
                      ) : (
                        <ChevronDown size={14} className="opacity-60" />
                      )}
                    </span>
                  </button>

                  {maintenanceOpen && (
                    <div className="mt-1 space-y-0.5">
                      {maintenanceSubItems.map((sub) => {
                        const SubIcon = sub.icon;
                        const active = currentPage === sub.id;
                        return (
                          <button
                            type="button"
                            key={sub.id}
                            data-ocid={`nav.${sub.id}.link`}
                            onClick={() => onNavigate(sub.id)}
                            className={`w-full flex items-center gap-3 pl-8 pr-3 py-2 rounded-lg text-sm font-medium transition-all ${
                              active
                                ? "bg-sidebar-accent/80 text-white"
                                : "text-sidebar-foreground/60 hover:bg-sidebar-accent/40 hover:text-white"
                            }`}
                          >
                            <SubIcon size={15} className="flex-shrink-0" />
                            {sub.label}
                            {active && (
                              <ChevronRight className="ml-auto w-3 h-3 opacity-60" />
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

            <div className="pt-2 mt-2 border-t border-sidebar-border/40">
              {sidebarCollapsed ? (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      type="button"
                      data-ocid="nav.settings.link"
                      onClick={() => onNavigate("settings")}
                      className={`w-full flex items-center justify-center py-2.5 rounded-lg transition-all ${
                        currentPage === "settings"
                          ? "bg-sidebar-accent text-white"
                          : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-white"
                      }`}
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
                  onClick={() => onNavigate("settings")}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                    currentPage === "settings"
                      ? "bg-sidebar-accent text-white"
                      : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-white"
                  }`}
                >
                  <Settings size={18} className="flex-shrink-0" />
                  Settings
                  {currentPage === "settings" && (
                    <ChevronRight className="ml-auto w-3.5 h-3.5 opacity-60" />
                  )}
                </button>
              )}
            </div>
          </nav>

          {/* User */}
          <div
            className={`py-4 border-t border-sidebar-border ${
              sidebarCollapsed ? "px-1" : "px-3"
            }`}
          >
            {sidebarCollapsed ? (
              <div className="flex flex-col items-center gap-2">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Avatar className="w-8 h-8 cursor-pointer">
                      <AvatarFallback className="bg-primary text-primary-foreground text-xs font-semibold">
                        {initials}
                      </AvatarFallback>
                    </Avatar>
                  </TooltipTrigger>
                  <TooltipContent side="right">
                    {displayName} · {roleName}
                  </TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      type="button"
                      data-ocid="nav.logout.button"
                      onClick={clear}
                      className="w-8 h-8 flex items-center justify-center rounded-lg text-sidebar-foreground/60 hover:text-white hover:bg-sidebar-accent/50 transition-all"
                    >
                      <LogOut size={15} />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="right">Sign out</TooltipContent>
                </Tooltip>
                {/* Expand button at bottom */}
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      type="button"
                      data-ocid="nav.sidebar.expand"
                      onClick={toggleSidebar}
                      className="w-8 h-8 flex items-center justify-center rounded-lg text-sidebar-foreground/40 hover:text-white hover:bg-sidebar-accent/50 transition-all mt-1"
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
                    <AvatarFallback className="bg-primary text-primary-foreground text-xs font-semibold">
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
                  data-ocid="nav.logout.button"
                  onClick={clear}
                  className="w-full mt-2 flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-sidebar-foreground/60 hover:text-white hover:bg-sidebar-accent/50 transition-all"
                >
                  <LogOut size={16} />
                  Sign out
                </button>
              </>
            )}
          </div>
        </aside>

        {/* Main content */}
        <main className="flex-1 overflow-y-auto bg-background">
          <div className="min-h-full">{children}</div>
        </main>
      </div>
    </TooltipProvider>
  );
}
