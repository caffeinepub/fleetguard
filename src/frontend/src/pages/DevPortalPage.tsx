import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Toaster } from "@/components/ui/sonner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import {
  Activity,
  AlertTriangle,
  Building2,
  Check,
  ChevronRight,
  Copy,
  CreditCard,
  DollarSign,
  Edit,
  ExternalLink,
  Eye,
  EyeOff,
  Key,
  LayoutDashboard,
  Loader2,
  LogOut,
  Mail,
  Menu,
  Moon,
  Plus,
  RefreshCw,
  Send,
  Shield,
  Sun,
  Tag,
  Trash2,
  TrendingUp,
  Users,
  X,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { toast } from "sonner";
import type { CompanySettings } from "../backend.d";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import {
  type DiscountCodeRecord,
  useAllCompanyApprovalsWithKey,
  useAllCompanyRegistrationsWithKey,
  useAllDiscountCodesWithKey,
  useAllSubscriptionsWithKey,
  useApproveCompanyWithKey,
  useCreateDiscountCodeWithKey,
  useDeleteDiscountCodeWithKey,
  useRejectCompanyWithKey,
  useStartTrialWithKey,
  useUpdateSubscriptionStatusWithKey,
} from "../hooks/useQueries";

type NavSection =
  | "overview"
  | "companies"
  | "subscriptions"
  | "promo-codes"
  | "stripe"
  | "email";

const NAV_ITEMS: Array<{
  id: NavSection;
  label: string;
  icon: React.ElementType;
}> = [
  { id: "overview", label: "Overview", icon: LayoutDashboard },
  { id: "companies", label: "Companies", icon: Building2 },
  { id: "subscriptions", label: "Subscriptions", icon: CreditCard },
  { id: "promo-codes", label: "Promo Codes", icon: Tag },
  { id: "stripe", label: "Stripe Settings", icon: Key },
  { id: "email", label: "Email Tool", icon: Mail },
];

const PIE_COLORS = ["#22c55e", "#f59e0b", "#ef4444", "#3b82f6"];
const BAR_COLORS = {
  active: "#22c55e",
  trial: "#3b82f6",
  cancelled: "#ef4444",
  inactive: "#6b7280",
};

function formatDate(ns: bigint | undefined): string {
  if (!ns) return "—";
  return new Date(Number(ns) / 1_000_000).toLocaleDateString();
}

function trialDaysLeft(ns: bigint | undefined): number | null {
  if (!ns) return null;
  const ms = Number(ns) / 1_000_000;
  const diff = ms - Date.now();
  if (diff <= 0) return 0;
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

function StatusBadge({ status }: { status: string }) {
  const s = status.toLowerCase();
  const variants: Record<string, string> = {
    pending: "bg-yellow-500/15 text-yellow-400 border-yellow-500/30",
    approved: "bg-green-500/15 text-green-400 border-green-500/30",
    rejected: "bg-red-500/15 text-red-400 border-red-500/30",
    active: "bg-blue-500/15 text-blue-400 border-blue-500/30",
    trial: "bg-purple-500/15 text-purple-400 border-purple-500/30",
    cancelled: "bg-red-500/15 text-red-400 border-red-500/30",
    inactive: "bg-gray-500/15 text-gray-400 border-gray-500/30",
  };
  const cls = variants[s] || variants.inactive;
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${cls}`}
    >
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
}

export default function DevPortalPage() {
  const [activeSection, setActiveSection] = useState<NavSection>("overview");
  const [darkMode, setDarkMode] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const devKey = localStorage.getItem("devKey") || "";

  const { identity, login, loginStatus } = useInternetIdentity();
  const isLoggedIn = !!identity;

  // Queries
  const companiesQuery = useAllCompanyRegistrationsWithKey(devKey);
  const approvalsQuery = useAllCompanyApprovalsWithKey(devKey);
  const subscriptionsQuery = useAllSubscriptionsWithKey(devKey);
  const discountCodesQuery = useAllDiscountCodesWithKey(devKey);

  // Mutations
  const approveCompany = useApproveCompanyWithKey();
  const rejectCompany = useRejectCompanyWithKey();
  const createCode = useCreateDiscountCodeWithKey();
  const deleteCode = useDeleteDiscountCodeWithKey();
  const updateSubscription = useUpdateSubscriptionStatusWithKey();
  const startTrial = useStartTrialWithKey();

  const companies: CompanySettings[] = companiesQuery.data || [];
  const approvals: Array<[string, string]> = approvalsQuery.data || [];
  const subscriptions = subscriptionsQuery.data || [];
  const discountCodes: DiscountCodeRecord[] = discountCodesQuery.data || [];

  const pendingCount = approvals.filter(([, s]) => s === "pending").length;

  function getCompanyStatus(name: string): string {
    const entry = approvals.find(([n]) => n === name);
    return entry ? entry[1] : "pending";
  }

  const refetchAll = () => {
    companiesQuery.refetch();
    approvalsQuery.refetch();
    subscriptionsQuery.refetch();
    discountCodesQuery.refetch();
  };

  // Theme
  useEffect(() => {
    document.documentElement.classList.toggle("dark", darkMode);
  }, [darkMode]);

  // If not logged in, show II login screen
  if (!isLoggedIn) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{
          background: darkMode
            ? "oklch(0.13 0.04 255)"
            : "oklch(0.97 0.005 255)",
        }}
      >
        <Toaster />
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md p-10 rounded-2xl border text-center"
          style={{
            background: darkMode ? "oklch(0.18 0.05 255)" : "white",
            borderColor: darkMode
              ? "oklch(0.28 0.05 255)"
              : "oklch(0.90 0.01 255)",
          }}
        >
          <div
            className="w-14 h-14 rounded-2xl mx-auto mb-5 flex items-center justify-center"
            style={{ background: "oklch(0.18 0.08 255)" }}
          >
            <Shield
              className="w-7 h-7"
              style={{ color: "oklch(0.65 0.2 150)" }}
            />
          </div>
          <h1
            className="text-2xl font-bold mb-2"
            style={{ color: darkMode ? "white" : "oklch(0.18 0.08 255)" }}
          >
            FleetGuard Dev Portal
          </h1>
          <p
            className="text-sm mb-8"
            style={{
              color: darkMode ? "oklch(0.65 0.02 255)" : "oklch(0.45 0.02 255)",
            }}
          >
            Access restricted to developers only. Sign in with Internet Identity
            to continue.
          </p>
          <Button
            data-ocid="dev_portal.submit_button"
            onClick={() => login()}
            disabled={loginStatus === "logging-in"}
            className="w-full h-11 font-semibold"
            style={{
              background: "oklch(0.65 0.2 150)",
              color: "white",
            }}
          >
            {loginStatus === "logging-in" ? (
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
            ) : null}
            Sign in with Internet Identity
          </Button>
          <p
            className="text-xs mt-4"
            style={{
              color: darkMode ? "oklch(0.5 0.02 255)" : "oklch(0.6 0.02 255)",
            }}
          >
            Secured by Advanced Cryptography · 100% onchain
          </p>
        </motion.div>
      </div>
    );
  }

  return (
    <div
      className={`min-h-screen flex ${darkMode ? "dark" : ""}`}
      style={{
        background: darkMode ? "oklch(0.13 0.04 255)" : "oklch(0.97 0.005 255)",
        color: darkMode ? "oklch(0.93 0.01 255)" : "oklch(0.18 0.04 255)",
        fontFamily: "'Inter', system-ui, sans-serif",
      }}
    >
      <Toaster />

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-20 bg-black/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
          onKeyDown={() => setSidebarOpen(false)}
          role="button"
          tabIndex={0}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed lg:sticky top-0 left-0 h-screen z-30 flex flex-col transition-transform duration-300 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        }`}
        style={{
          width: 240,
          background: "oklch(0.16 0.07 255)",
          borderRight: "1px solid oklch(0.24 0.07 255)",
          flexShrink: 0,
        }}
      >
        {/* Logo */}
        <div
          className="px-5 py-5 flex items-center gap-3"
          style={{ borderBottom: "1px solid oklch(0.24 0.07 255)" }}
        >
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{ background: "oklch(0.65 0.2 150)" }}
          >
            <Shield className="w-4 h-4 text-white" />
          </div>
          <div>
            <div className="font-bold text-sm text-white">FleetGuard</div>
            <div className="text-xs" style={{ color: "oklch(0.65 0.2 150)" }}>
              Dev Portal
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = activeSection === item.id;
            return (
              <button
                type="button"
                key={item.id}
                data-ocid={`dev_portal.${item.id}.link`}
                onClick={() => {
                  setActiveSection(item.id);
                  setSidebarOpen(false);
                }}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150"
                style={{
                  background: isActive
                    ? "oklch(0.65 0.2 150 / 0.15)"
                    : "transparent",
                  color: isActive
                    ? "oklch(0.65 0.2 150)"
                    : "oklch(0.72 0.03 255)",
                  borderLeft: isActive
                    ? "2px solid oklch(0.65 0.2 150)"
                    : "2px solid transparent",
                }}
              >
                <Icon
                  className="w-4 h-4 shrink-0"
                  style={{
                    color: isActive
                      ? "oklch(0.65 0.2 150)"
                      : "oklch(0.55 0.04 255)",
                  }}
                />
                <span className="flex-1 text-left">{item.label}</span>
                {item.id === "companies" && pendingCount > 0 && (
                  <span
                    className="text-xs px-1.5 py-0.5 rounded-full font-semibold"
                    style={{
                      background: "oklch(0.78 0.17 85)",
                      color: "white",
                    }}
                  >
                    {pendingCount}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Bottom */}
        <div
          className="p-4 space-y-3"
          style={{ borderTop: "1px solid oklch(0.24 0.07 255)" }}
        >
          <button
            type="button"
            data-ocid="dev_portal.exit_app.button"
            onClick={() => {
              localStorage.removeItem("devKey");
              window.location.replace(window.location.origin);
            }}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm transition-all"
            style={{
              background: "oklch(0.22 0.06 255)",
              color: "oklch(0.65 0.2 150)",
              border: "1px solid oklch(0.65 0.2 150 / 0.3)",
            }}
          >
            <LogOut className="w-4 h-4 shrink-0" />
            Exit to App
          </button>
          <button
            type="button"
            data-ocid="dev_portal.dark_mode.toggle"
            onClick={() => setDarkMode(!darkMode)}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm transition-all"
            style={{
              background: "oklch(0.22 0.06 255)",
              color: "oklch(0.72 0.03 255)",
            }}
          >
            {darkMode ? (
              <Sun className="w-4 h-4" />
            ) : (
              <Moon className="w-4 h-4" />
            )}
            {darkMode ? "Light Mode" : "Dark Mode"}
          </button>
          <div
            className="px-3 py-2 rounded-xl text-xs"
            style={{
              background: "oklch(0.22 0.06 255)",
              color: "oklch(0.55 0.03 255)",
            }}
          >
            <div
              className="font-medium text-xs"
              style={{ color: "oklch(0.72 0.03 255)" }}
            >
              Developer
            </div>
            <div className="truncate">
              {identity?.getPrincipal().toString().slice(0, 20)}...
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header
          className="sticky top-0 z-10 flex items-center gap-4 px-6 h-16"
          style={{
            background: darkMode
              ? "oklch(0.16 0.06 255 / 0.9)"
              : "oklch(0.99 0.003 255 / 0.9)",
            backdropFilter: "blur(8px)",
            borderBottom: `1px solid ${darkMode ? "oklch(0.24 0.07 255)" : "oklch(0.90 0.01 255)"}`,
          }}
        >
          <button
            type="button"
            className="lg:hidden"
            onClick={() => setSidebarOpen(true)}
            data-ocid="dev_portal.sidebar.toggle"
          >
            <Menu className="w-5 h-5" />
          </button>
          <div className="flex-1">
            <h1
              className="font-semibold text-base"
              style={{ color: darkMode ? "white" : "oklch(0.18 0.08 255)" }}
            >
              {NAV_ITEMS.find((n) => n.id === activeSection)?.label}
            </h1>
          </div>
          <button
            type="button"
            data-ocid="dev_portal.refresh.button"
            onClick={refetchAll}
            className="p-2 rounded-lg transition-colors"
            style={{
              color: "oklch(0.55 0.04 255)",
            }}
            title="Refresh data"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <button
            type="button"
            data-ocid="dev_portal.exit_app.header.button"
            onClick={() => {
              localStorage.removeItem("devKey");
              window.location.replace(window.location.origin);
            }}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-all"
            style={{
              background: "oklch(0.65 0.2 150 / 0.15)",
              color: "oklch(0.65 0.2 150)",
              border: "1px solid oklch(0.65 0.2 150 / 0.3)",
            }}
            title="Exit to main app"
          >
            <LogOut className="w-4 h-4" />
            <span className="hidden sm:inline">Exit</span>
          </button>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-6 overflow-auto">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeSection}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.18 }}
            >
              {activeSection === "overview" && (
                <OverviewSection
                  companies={companies}
                  approvals={approvals}
                  subscriptions={subscriptions}
                  isLoading={
                    companiesQuery.isLoading || subscriptionsQuery.isLoading
                  }
                  darkMode={darkMode}
                />
              )}
              {activeSection === "companies" && (
                <CompaniesSection
                  companies={companies}
                  getStatus={getCompanyStatus}
                  isLoading={
                    companiesQuery.isLoading || approvalsQuery.isLoading
                  }
                  darkMode={darkMode}
                  onApprove={(name) =>
                    approveCompany.mutate(
                      { devKey, companyName: name },
                      {
                        onSuccess: () => toast.success(`${name} approved`),
                        onError: () => toast.error("Failed to approve company"),
                      },
                    )
                  }
                  onReject={(name) =>
                    rejectCompany.mutate(
                      { devKey, companyName: name },
                      {
                        onSuccess: () =>
                          toast.success(`${name} rejected and blocked`),
                        onError: () => toast.error("Failed to reject company"),
                      },
                    )
                  }
                  isApproving={approveCompany.isPending}
                  isRejecting={rejectCompany.isPending}
                />
              )}
              {activeSection === "subscriptions" && (
                <SubscriptionsSection
                  subscriptions={subscriptions}
                  isLoading={subscriptionsQuery.isLoading}
                  darkMode={darkMode}
                  onCancel={(name) =>
                    updateSubscription.mutate(
                      { devKey, companyName: name, status: "cancelled" },
                      {
                        onSuccess: () =>
                          toast.success(`Subscription cancelled for ${name}`),
                        onError: () =>
                          toast.error("Failed to cancel subscription"),
                      },
                    )
                  }
                  onStartTrial={(name) =>
                    startTrial.mutate(
                      { devKey, companyName: name },
                      {
                        onSuccess: () =>
                          toast.success(`Trial started for ${name}`),
                        onError: () => toast.error("Failed to start trial"),
                      },
                    )
                  }
                />
              )}
              {activeSection === "promo-codes" && (
                <PromoCodesSection
                  codes={discountCodes}
                  isLoading={discountCodesQuery.isLoading}
                  darkMode={darkMode}
                  onCreate={(discount) =>
                    createCode.mutate(
                      { devKey, discount },
                      {
                        onSuccess: () => toast.success("Promo code created"),
                        onError: () =>
                          toast.error("Failed to create promo code"),
                      },
                    )
                  }
                  onDelete={(id) =>
                    deleteCode.mutate(
                      { devKey, id },
                      {
                        onSuccess: () => toast.success("Promo code deleted"),
                        onError: () =>
                          toast.error("Failed to delete promo code"),
                      },
                    )
                  }
                  isCreating={createCode.isPending}
                />
              )}
              {activeSection === "stripe" && (
                <StripeSettingsSection darkMode={darkMode} />
              )}
              {activeSection === "email" && (
                <EmailToolSection companies={companies} darkMode={darkMode} />
              )}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}

// ─── Overview Section ───────────────────────────────────────────────────────
function OverviewSection({
  companies,
  approvals,
  subscriptions,
  isLoading,
  darkMode,
}: {
  companies: CompanySettings[];
  approvals: Array<[string, string]>;
  subscriptions: any[];
  isLoading: boolean;
  darkMode: boolean;
}) {
  const total = companies.length;
  const active = subscriptions.filter(
    (s) => s.status === "active" || s.status === "trial",
  ).length;
  const trials = subscriptions.filter((s) => s.status === "trial").length;
  const mrr = subscriptions.filter((s) => s.status === "active").length * 499;

  const statusMap: Record<string, number> = {};
  for (const [, status] of approvals) {
    statusMap[status] = (statusMap[status] || 0) + 1;
  }
  const pieData = Object.entries(statusMap).map(([name, value]) => ({
    name: name.charAt(0).toUpperCase() + name.slice(1),
    value,
  }));

  const subStatusMap: Record<string, number> = {};
  for (const s of subscriptions) {
    subStatusMap[s.status] = (subStatusMap[s.status] || 0) + 1;
  }
  const barData = Object.entries(subStatusMap).map(([name, count]) => ({
    name: name.charAt(0).toUpperCase() + name.slice(1),
    count,
  }));

  const recentCompanies = [...companies]
    .sort((a, b) => Number(b.createdAt || 0n) - Number(a.createdAt || 0n))
    .slice(0, 5);

  const cardStyle = {
    background: darkMode ? "oklch(0.18 0.05 255)" : "white",
    border: `1px solid ${darkMode ? "oklch(0.26 0.06 255)" : "oklch(0.90 0.01 255)"}`,
  };

  const stats = [
    {
      label: "Total Companies",
      value: total,
      icon: Building2,
      color: "oklch(0.5 0.22 264)",
    },
    {
      label: "Active / Trial",
      value: active,
      icon: Activity,
      color: "oklch(0.65 0.2 150)",
    },
    {
      label: "Trial Users",
      value: trials,
      icon: Users,
      color: "oklch(0.6 0.18 280)",
    },
    {
      label: "Est. MRR",
      value: `$${mrr.toLocaleString()}`,
      icon: DollarSign,
      color: "oklch(0.72 0.17 85)",
    },
  ];

  return (
    <div className="space-y-6" data-ocid="overview.section">
      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, i) => {
          const Icon = stat.icon;
          return (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.07 }}
              className="rounded-2xl p-5"
              style={cardStyle}
              data-ocid={`overview.stat.${i + 1}`}
            >
              {isLoading ? (
                <>
                  <Skeleton className="w-8 h-8 rounded-lg mb-3" />
                  <Skeleton className="w-16 h-7 mb-1" />
                  <Skeleton className="w-24 h-4" />
                </>
              ) : (
                <>
                  <div
                    className="w-9 h-9 rounded-xl flex items-center justify-center mb-4"
                    style={{ background: `${stat.color}20` }}
                  >
                    <Icon className="w-5 h-5" style={{ color: stat.color }} />
                  </div>
                  <div
                    className="text-2xl font-bold"
                    style={{
                      color: darkMode ? "white" : "oklch(0.18 0.08 255)",
                    }}
                  >
                    {stat.value}
                  </div>
                  <div
                    className="text-sm mt-1"
                    style={{
                      color: darkMode
                        ? "oklch(0.6 0.03 255)"
                        : "oklch(0.5 0.03 255)",
                    }}
                  >
                    {stat.label}
                  </div>
                </>
              )}
            </motion.div>
          );
        })}
      </div>

      {/* Charts */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Donut: Company Status */}
        <div className="rounded-2xl p-6" style={cardStyle}>
          <h3
            className="font-semibold mb-4"
            style={{
              color: darkMode ? "white" : "oklch(0.18 0.08 255)",
            }}
          >
            Company Status Breakdown
          </h3>
          {isLoading ? (
            <Skeleton className="w-full h-48" />
          ) : pieData.length === 0 ? (
            <div
              className="h-48 flex items-center justify-center text-sm"
              style={{
                color: darkMode ? "oklch(0.5 0.03 255)" : "oklch(0.6 0.03 255)",
              }}
            >
              No data yet
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={80}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {pieData.map((_, idx) => (
                    <Cell
                      // biome-ignore lint/suspicious/noArrayIndexKey: recharts
                      key={idx}
                      fill={PIE_COLORS[idx % PIE_COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    background: darkMode ? "oklch(0.22 0.06 255)" : "white",
                    border: `1px solid ${darkMode ? "oklch(0.3 0.06 255)" : "oklch(0.88 0.01 255)"}`,
                    borderRadius: 8,
                    color: darkMode ? "white" : "oklch(0.18 0.08 255)",
                  }}
                />
                <Legend
                  wrapperStyle={{
                    fontSize: 12,
                    color: darkMode
                      ? "oklch(0.65 0.03 255)"
                      : "oklch(0.45 0.03 255)",
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Bar: Subscriptions by Status */}
        <div className="rounded-2xl p-6" style={cardStyle}>
          <h3
            className="font-semibold mb-4"
            style={{
              color: darkMode ? "white" : "oklch(0.18 0.08 255)",
            }}
          >
            Subscriptions by Status
          </h3>
          {isLoading ? (
            <Skeleton className="w-full h-48" />
          ) : barData.length === 0 ? (
            <div
              className="h-48 flex items-center justify-center text-sm"
              style={{
                color: darkMode ? "oklch(0.5 0.03 255)" : "oklch(0.6 0.03 255)",
              }}
            >
              No subscriptions yet
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart
                data={barData}
                margin={{ top: 5, right: 10, left: -20, bottom: 5 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke={
                    darkMode ? "oklch(0.25 0.04 255)" : "oklch(0.88 0.01 255)"
                  }
                />
                <XAxis
                  dataKey="name"
                  tick={{
                    fill: darkMode
                      ? "oklch(0.6 0.03 255)"
                      : "oklch(0.5 0.03 255)",
                    fontSize: 11,
                  }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{
                    fill: darkMode
                      ? "oklch(0.6 0.03 255)"
                      : "oklch(0.5 0.03 255)",
                    fontSize: 11,
                  }}
                  axisLine={false}
                  tickLine={false}
                  allowDecimals={false}
                />
                <Tooltip
                  contentStyle={{
                    background: darkMode ? "oklch(0.22 0.06 255)" : "white",
                    border: `1px solid ${darkMode ? "oklch(0.3 0.06 255)" : "oklch(0.88 0.01 255)"}`,
                    borderRadius: 8,
                    color: darkMode ? "white" : "oklch(0.18 0.08 255)",
                  }}
                />
                <Bar dataKey="count" radius={[6, 6, 0, 0]} maxBarSize={48}>
                  {barData.map((entry, idx) => (
                    <Cell
                      // biome-ignore lint/suspicious/noArrayIndexKey: recharts
                      key={idx}
                      fill={
                        BAR_COLORS[
                          entry.name.toLowerCase() as keyof typeof BAR_COLORS
                        ] || "oklch(0.5 0.22 264)"
                      }
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Recent Companies */}
      <div className="rounded-2xl p-6" style={cardStyle}>
        <h3
          className="font-semibold mb-4"
          style={{ color: darkMode ? "white" : "oklch(0.18 0.08 255)" }}
        >
          Recent Signups
        </h3>
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="w-full h-12" />
            ))}
          </div>
        ) : recentCompanies.length === 0 ? (
          <div
            className="text-sm py-6 text-center"
            style={{
              color: darkMode ? "oklch(0.5 0.03 255)" : "oklch(0.6 0.03 255)",
            }}
            data-ocid="overview.companies.empty_state"
          >
            No companies have signed up yet
          </div>
        ) : (
          <div className="space-y-2">
            {recentCompanies.map((c, i) => (
              <div
                key={c.companyName}
                className="flex items-center gap-4 py-3 px-4 rounded-xl"
                style={{
                  background: darkMode
                    ? "oklch(0.22 0.06 255)"
                    : "oklch(0.97 0.005 255)",
                }}
                data-ocid={`overview.companies.item.${i + 1}`}
              >
                <div
                  className="w-9 h-9 rounded-xl flex items-center justify-center font-bold text-sm shrink-0"
                  style={{
                    background: "oklch(0.65 0.2 150 / 0.15)",
                    color: "oklch(0.65 0.2 150)",
                  }}
                >
                  {c.companyName?.[0]?.toUpperCase() || "?"}
                </div>
                <div className="flex-1 min-w-0">
                  <div
                    className="font-medium text-sm truncate"
                    style={{
                      color: darkMode ? "white" : "oklch(0.18 0.08 255)",
                    }}
                  >
                    {c.companyName}
                  </div>
                  <div
                    className="text-xs"
                    style={{
                      color: darkMode
                        ? "oklch(0.55 0.03 255)"
                        : "oklch(0.55 0.03 255)",
                    }}
                  >
                    {c.industry} · {c.fleetSize} vehicles
                  </div>
                </div>
                <div
                  className="text-xs"
                  style={{ color: "oklch(0.55 0.03 255)" }}
                >
                  {formatDate(c.createdAt)}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Companies Section ───────────────────────────────────────────────────────
function CompaniesSection({
  companies,
  getStatus,
  isLoading,
  darkMode,
  onApprove,
  onReject,
  isApproving,
  isRejecting,
}: {
  companies: CompanySettings[];
  getStatus: (name: string) => string;
  isLoading: boolean;
  darkMode: boolean;
  onApprove: (name: string) => void;
  onReject: (name: string) => void;
  isApproving: boolean;
  isRejecting: boolean;
}) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [confirmReject, setConfirmReject] = useState<string | null>(null);

  const cardStyle = {
    background: darkMode ? "oklch(0.18 0.05 255)" : "white",
    border: `1px solid ${darkMode ? "oklch(0.26 0.06 255)" : "oklch(0.90 0.01 255)"}`,
  };

  const filtered = companies.filter((c) => {
    const status = getStatus(c.companyName);
    const matchSearch =
      !search ||
      c.companyName.toLowerCase().includes(search.toLowerCase()) ||
      (c.industry || "").toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === "all" || status === statusFilter;
    return matchSearch && matchStatus;
  });

  return (
    <div className="space-y-5" data-ocid="companies.section">
      {/* Confirm Reject Dialog */}
      <Dialog
        open={!!confirmReject}
        onOpenChange={(o) => !o && setConfirmReject(null)}
      >
        <DialogContent data-ocid="companies.reject.dialog">
          <DialogHeader>
            <DialogTitle>Reject Company</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Are you sure you want to reject <strong>{confirmReject}</strong>?
            They will lose all access immediately and be logged out.
          </p>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setConfirmReject(null)}
              data-ocid="companies.reject.cancel_button"
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              disabled={isRejecting}
              data-ocid="companies.reject.confirm_button"
              onClick={() => {
                if (confirmReject) {
                  onReject(confirmReject);
                  setConfirmReject(null);
                }
              }}
            >
              {isRejecting && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
              Reject & Block
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-48">
          <Input
            placeholder="Search companies..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-4"
            data-ocid="companies.search_input"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-40" data-ocid="companies.status.select">
            <SelectValue placeholder="Filter status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="approved">Approved</SelectItem>
            <SelectItem value="rejected">Rejected</SelectItem>
            <SelectItem value="active">Active</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <div className="rounded-2xl overflow-hidden" style={cardStyle}>
        {isLoading ? (
          <div className="p-6 space-y-3">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="w-full h-12" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div
            className="p-12 text-center text-sm"
            style={{
              color: darkMode ? "oklch(0.5 0.03 255)" : "oklch(0.6 0.03 255)",
            }}
            data-ocid="companies.table.empty_state"
          >
            No companies found
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow
                style={{
                  borderColor: darkMode
                    ? "oklch(0.26 0.06 255)"
                    : "oklch(0.90 0.01 255)",
                }}
              >
                <TableHead>Company</TableHead>
                <TableHead>Industry</TableHead>
                <TableHead>Fleet Size</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Joined</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((c, i) => {
                const status = getStatus(c.companyName);
                return (
                  <TableRow
                    key={c.companyName}
                    style={{
                      borderColor: darkMode
                        ? "oklch(0.24 0.06 255)"
                        : "oklch(0.93 0.01 255)",
                    }}
                    data-ocid={`companies.table.row.${i + 1}`}
                  >
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div
                          className="w-8 h-8 rounded-xl flex items-center justify-center font-bold text-xs shrink-0"
                          style={{
                            background: "oklch(0.65 0.2 150 / 0.15)",
                            color: "oklch(0.65 0.2 150)",
                          }}
                        >
                          {c.companyName?.[0]?.toUpperCase()}
                        </div>
                        <span className="font-medium text-sm">
                          {c.companyName}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm">{c.industry}</TableCell>
                    <TableCell className="text-sm">{c.fleetSize}</TableCell>
                    <TableCell>
                      <StatusBadge status={status} />
                    </TableCell>
                    <TableCell className="text-sm">
                      {formatDate(c.createdAt)}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center gap-2 justify-end">
                        {status !== "approved" && status !== "active" && (
                          <Button
                            size="sm"
                            disabled={isApproving}
                            data-ocid={`companies.approve_button.${i + 1}`}
                            onClick={() => onApprove(c.companyName)}
                            className="h-7 px-3 text-xs font-medium"
                            style={{
                              background: "oklch(0.65 0.2 150)",
                              color: "white",
                            }}
                          >
                            {isApproving ? (
                              <Loader2 className="w-3 h-3 animate-spin" />
                            ) : (
                              <Check className="w-3 h-3 mr-1" />
                            )}
                            Approve
                          </Button>
                        )}
                        {status !== "rejected" && (
                          <Button
                            size="sm"
                            variant="destructive"
                            data-ocid={`companies.reject_button.${i + 1}`}
                            onClick={() => setConfirmReject(c.companyName)}
                            className="h-7 px-3 text-xs font-medium"
                          >
                            <X className="w-3 h-3 mr-1" />
                            Reject
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </div>
    </div>
  );
}

// ─── Subscriptions Section ───────────────────────────────────────────────────
function SubscriptionsSection({
  subscriptions,
  isLoading,
  darkMode,
  onCancel,
  onStartTrial,
}: {
  subscriptions: any[];
  isLoading: boolean;
  darkMode: boolean;
  onCancel: (name: string) => void;
  onStartTrial: (name: string) => void;
}) {
  const cardStyle = {
    background: darkMode ? "oklch(0.18 0.05 255)" : "white",
    border: `1px solid ${darkMode ? "oklch(0.26 0.06 255)" : "oklch(0.90 0.01 255)"}`,
  };

  const mrr = subscriptions.filter((s) => s.status === "active").length * 499;

  return (
    <div className="space-y-5" data-ocid="subscriptions.section">
      {/* MRR Card */}
      <div
        className="rounded-2xl p-5 flex items-center gap-4"
        style={cardStyle}
      >
        <div
          className="w-12 h-12 rounded-2xl flex items-center justify-center"
          style={{ background: "oklch(0.72 0.17 85 / 0.15)" }}
        >
          <TrendingUp
            className="w-6 h-6"
            style={{ color: "oklch(0.72 0.17 85)" }}
          />
        </div>
        <div>
          <div
            className="text-2xl font-bold"
            style={{ color: darkMode ? "white" : "oklch(0.18 0.08 255)" }}
          >
            ${mrr.toLocaleString()}
          </div>
          <div
            className="text-sm"
            style={{
              color: darkMode ? "oklch(0.6 0.03 255)" : "oklch(0.5 0.03 255)",
            }}
          >
            Estimated Monthly Recurring Revenue
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-2xl overflow-hidden" style={cardStyle}>
        {isLoading ? (
          <div className="p-6 space-y-3">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="w-full h-12" />
            ))}
          </div>
        ) : subscriptions.length === 0 ? (
          <div
            className="p-12 text-center text-sm"
            style={{
              color: darkMode ? "oklch(0.5 0.03 255)" : "oklch(0.6 0.03 255)",
            }}
            data-ocid="subscriptions.table.empty_state"
          >
            No subscriptions yet
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Company</TableHead>
                <TableHead>Plan</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Trial Ends</TableHead>
                <TableHead>Started</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {subscriptions.map((s, i) => {
                const days = trialDaysLeft(s.trialEndsAt);
                return (
                  <TableRow
                    key={s.companyName}
                    data-ocid={`subscriptions.table.row.${i + 1}`}
                  >
                    <TableCell className="font-medium text-sm">
                      {s.companyName}
                    </TableCell>
                    <TableCell className="text-sm capitalize">
                      {s.plan}
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={s.status} />
                    </TableCell>
                    <TableCell className="text-sm">
                      {s.trialEndsAt ? (
                        <span>
                          {formatDate(s.trialEndsAt)}
                          {days !== null && days > 0 && (
                            <span
                              className="ml-2 text-xs px-1.5 py-0.5 rounded-full"
                              style={{
                                background: "oklch(0.5 0.22 264 / 0.15)",
                                color: "oklch(0.5 0.22 264)",
                              }}
                            >
                              {days}d left
                            </span>
                          )}
                          {days === 0 && (
                            <span
                              className="ml-2 text-xs px-1.5 py-0.5 rounded-full"
                              style={{
                                background: "oklch(0.58 0.18 22 / 0.15)",
                                color: "oklch(0.58 0.18 22)",
                              }}
                            >
                              Expired
                            </span>
                          )}
                        </span>
                      ) : (
                        "—"
                      )}
                    </TableCell>
                    <TableCell className="text-sm">
                      {formatDate(s.startDate)}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center gap-2 justify-end">
                        {s.status !== "trial" && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-7 px-3 text-xs"
                            data-ocid={`subscriptions.start_trial.button.${i + 1}`}
                            onClick={() => onStartTrial(s.companyName)}
                          >
                            Start Trial
                          </Button>
                        )}
                        {s.status !== "cancelled" && (
                          <Button
                            size="sm"
                            variant="destructive"
                            className="h-7 px-3 text-xs"
                            data-ocid={`subscriptions.cancel.button.${i + 1}`}
                            onClick={() => onCancel(s.companyName)}
                          >
                            Cancel
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </div>
    </div>
  );
}

// ─── Promo Codes Section ─────────────────────────────────────────────────────
function PromoCodesSection({
  codes,
  isLoading,
  darkMode,
  onCreate,
  onDelete,
  isCreating,
}: {
  codes: DiscountCodeRecord[];
  isLoading: boolean;
  darkMode: boolean;
  onCreate: (
    d: Omit<DiscountCodeRecord, "id" | "createdAt" | "usedCount">,
  ) => void;
  onDelete: (id: bigint) => void;
  isCreating: boolean;
}) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<bigint | null>(null);
  const [form, setForm] = useState({
    code: "",
    discountType: "percent",
    value: "",
    description: "",
  });

  const cardStyle = {
    background: darkMode ? "oklch(0.18 0.05 255)" : "white",
    border: `1px solid ${darkMode ? "oklch(0.26 0.06 255)" : "oklch(0.90 0.01 255)"}`,
  };

  const handleCreate = () => {
    if (!form.code || !form.value) return;
    onCreate({
      code: form.code.toUpperCase(),
      discountType: form.discountType,
      value: BigInt(Math.round(Number.parseFloat(form.value))),
      description: form.description,
    });
    setForm({ code: "", discountType: "percent", value: "", description: "" });
    setDialogOpen(false);
  };

  return (
    <div className="space-y-5" data-ocid="promo_codes.section">
      <div className="flex items-center justify-between">
        <p
          className="text-sm"
          style={{
            color: darkMode ? "oklch(0.6 0.03 255)" : "oklch(0.5 0.03 255)",
          }}
        >
          {codes.length} active code{codes.length !== 1 ? "s" : ""}
        </p>
        <Button
          data-ocid="promo_codes.open_modal_button"
          onClick={() => setDialogOpen(true)}
          style={{ background: "oklch(0.65 0.2 150)", color: "white" }}
        >
          <Plus className="w-4 h-4 mr-2" />
          New Code
        </Button>
      </div>

      {/* Create Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent data-ocid="promo_codes.dialog">
          <DialogHeader>
            <DialogTitle>Create Promo Code</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <Label>Code</Label>
              <Input
                value={form.code}
                onChange={(e) =>
                  setForm((p) => ({ ...p, code: e.target.value }))
                }
                placeholder="LAUNCH20"
                className="mt-1.5 uppercase"
                data-ocid="promo_codes.code.input"
              />
            </div>
            <div>
              <Label>Discount Type</Label>
              <Select
                value={form.discountType}
                onValueChange={(v) =>
                  setForm((p) => ({ ...p, discountType: v }))
                }
              >
                <SelectTrigger
                  className="mt-1.5"
                  data-ocid="promo_codes.type.select"
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="percent">Percentage Off (%)</SelectItem>
                  <SelectItem value="fixed">Fixed Amount ($)</SelectItem>
                  <SelectItem value="months_free">Months Free</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>
                {form.discountType === "percent"
                  ? "Discount %"
                  : form.discountType === "fixed"
                    ? "Discount Amount ($)"
                    : "Number of Free Months"}
              </Label>
              <Input
                type="number"
                value={form.value}
                onChange={(e) =>
                  setForm((p) => ({ ...p, value: e.target.value }))
                }
                placeholder="20"
                className="mt-1.5"
                data-ocid="promo_codes.value.input"
              />
            </div>
            <div>
              <Label>Description (optional)</Label>
              <Input
                value={form.description}
                onChange={(e) =>
                  setForm((p) => ({ ...p, description: e.target.value }))
                }
                placeholder="Launch promo for new customers"
                className="mt-1.5"
                data-ocid="promo_codes.description.input"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDialogOpen(false)}
              data-ocid="promo_codes.cancel_button"
            >
              Cancel
            </Button>
            <Button
              disabled={isCreating || !form.code || !form.value}
              onClick={handleCreate}
              data-ocid="promo_codes.submit_button"
              style={{ background: "oklch(0.65 0.2 150)", color: "white" }}
            >
              {isCreating && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
              Create Code
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirm Dialog */}
      <Dialog
        open={confirmDelete !== null}
        onOpenChange={(o) => !o && setConfirmDelete(null)}
      >
        <DialogContent data-ocid="promo_codes.delete.dialog">
          <DialogHeader>
            <DialogTitle>Delete Promo Code</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Are you sure you want to delete this promo code? This cannot be
            undone.
          </p>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setConfirmDelete(null)}
              data-ocid="promo_codes.delete.cancel_button"
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              data-ocid="promo_codes.delete.confirm_button"
              onClick={() => {
                if (confirmDelete !== null) {
                  onDelete(confirmDelete);
                  setConfirmDelete(null);
                }
              }}
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Table */}
      <div className="rounded-2xl overflow-hidden" style={cardStyle}>
        {isLoading ? (
          <div className="p-6 space-y-3">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="w-full h-12" />
            ))}
          </div>
        ) : codes.length === 0 ? (
          <div
            className="p-12 text-center text-sm"
            style={{
              color: darkMode ? "oklch(0.5 0.03 255)" : "oklch(0.6 0.03 255)",
            }}
            data-ocid="promo_codes.table.empty_state"
          >
            No promo codes yet. Create one to get started.
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Code</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Value</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Used</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {codes.map((c, i) => (
                <TableRow
                  key={String(c.id)}
                  data-ocid={`promo_codes.table.row.${i + 1}`}
                >
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <code
                        className="text-xs font-mono px-2 py-1 rounded-lg"
                        style={{
                          background: darkMode
                            ? "oklch(0.22 0.06 255)"
                            : "oklch(0.94 0.01 255)",
                          color: "oklch(0.65 0.2 150)",
                        }}
                      >
                        {c.code}
                      </code>
                      <button
                        type="button"
                        onClick={() => {
                          navigator.clipboard.writeText(c.code);
                          toast.success("Copied!");
                        }}
                        className="opacity-50 hover:opacity-100"
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </TableCell>
                  <TableCell className="text-sm capitalize">
                    {c.discountType === "months_free"
                      ? "Months Free"
                      : c.discountType === "percent"
                        ? "Percent Off"
                        : "Fixed Amount"}
                  </TableCell>
                  <TableCell className="text-sm">
                    {c.discountType === "percent"
                      ? `${c.value}%`
                      : c.discountType === "fixed"
                        ? `$${c.value}`
                        : `${c.value} months`}
                  </TableCell>
                  <TableCell
                    className="text-sm"
                    style={{
                      color: darkMode
                        ? "oklch(0.6 0.03 255)"
                        : "oklch(0.5 0.03 255)",
                    }}
                  >
                    {c.description || "—"}
                  </TableCell>
                  <TableCell className="text-sm">
                    {String(c.usedCount)}
                  </TableCell>
                  <TableCell className="text-sm">
                    {formatDate(c.createdAt)}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-7 w-7 p-0 text-destructive"
                      data-ocid={`promo_codes.delete_button.${i + 1}`}
                      onClick={() => setConfirmDelete(c.id)}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>
    </div>
  );
}

// ─── Stripe Settings Section ─────────────────────────────────────────────────
function StripeSettingsSection({ darkMode }: { darkMode: boolean }) {
  const [pubKey, setPubKey] = useState(
    () => localStorage.getItem("stripePublishableKey") || "",
  );
  const [secKey, setSecKey] = useState(
    () => localStorage.getItem("stripeSecretKey") || "",
  );
  const [showPub, setShowPub] = useState(false);
  const [showSec, setShowSec] = useState(false);
  const [saved, setSaved] = useState(false);

  const isConnected = !!pubKey && !!secKey;

  const handleSave = () => {
    localStorage.setItem("stripePublishableKey", pubKey);
    localStorage.setItem("stripeSecretKey", secKey);
    setSaved(true);
    toast.success("Stripe keys saved");
    setTimeout(() => setSaved(false), 3000);
  };

  const cardStyle = {
    background: darkMode ? "oklch(0.18 0.05 255)" : "white",
    border: `1px solid ${darkMode ? "oklch(0.26 0.06 255)" : "oklch(0.90 0.01 255)"}`,
  };

  return (
    <div className="space-y-5 max-w-xl" data-ocid="stripe.section">
      {/* Status */}
      <div
        className="rounded-2xl p-5 flex items-center gap-4"
        style={cardStyle}
      >
        <div
          className="w-3 h-3 rounded-full"
          style={{
            background: isConnected
              ? "oklch(0.65 0.2 150)"
              : "oklch(0.58 0.18 22)",
            boxShadow: isConnected
              ? "0 0 8px oklch(0.65 0.2 150 / 0.5)"
              : "0 0 8px oklch(0.58 0.18 22 / 0.5)",
          }}
        />
        <div>
          <div
            className="font-semibold text-sm"
            style={{ color: darkMode ? "white" : "oklch(0.18 0.08 255)" }}
          >
            {isConnected ? "Stripe Connected" : "Stripe Not Configured"}
          </div>
          <div
            className="text-xs mt-0.5"
            style={{
              color: darkMode ? "oklch(0.6 0.03 255)" : "oklch(0.5 0.03 255)",
            }}
          >
            {isConnected
              ? "Payment processing is active"
              : "Enter your Stripe keys to enable payments"}
          </div>
        </div>
        <div className="ml-auto">
          <a
            href="https://dashboard.stripe.com"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-xs"
            style={{ color: "oklch(0.5 0.22 264)" }}
            data-ocid="stripe.dashboard.link"
          >
            Stripe Dashboard
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      </div>

      {/* Keys Form */}
      <div className="rounded-2xl p-6 space-y-5" style={cardStyle}>
        <h3
          className="font-semibold"
          style={{ color: darkMode ? "white" : "oklch(0.18 0.08 255)" }}
        >
          API Keys
        </h3>
        <div>
          <Label className="text-sm">Publishable Key</Label>
          <div className="relative mt-1.5">
            <Input
              type={showPub ? "text" : "password"}
              value={pubKey}
              onChange={(e) => setPubKey(e.target.value)}
              placeholder="pk_live_..."
              className="pr-10"
              data-ocid="stripe.publishable_key.input"
            />
            <button
              type="button"
              onClick={() => setShowPub(!showPub)}
              className="absolute right-3 top-1/2 -translate-y-1/2 opacity-50 hover:opacity-100"
              data-ocid="stripe.pub_key_visibility.toggle"
            >
              {showPub ? (
                <EyeOff className="w-4 h-4" />
              ) : (
                <Eye className="w-4 h-4" />
              )}
            </button>
          </div>
        </div>
        <div>
          <Label className="text-sm">Secret Key</Label>
          <div className="relative mt-1.5">
            <Input
              type={showSec ? "text" : "password"}
              value={secKey}
              onChange={(e) => setSecKey(e.target.value)}
              placeholder="sk_live_..."
              className="pr-10"
              data-ocid="stripe.secret_key.input"
            />
            <button
              type="button"
              onClick={() => setShowSec(!showSec)}
              className="absolute right-3 top-1/2 -translate-y-1/2 opacity-50 hover:opacity-100"
              data-ocid="stripe.sec_key_visibility.toggle"
            >
              {showSec ? (
                <EyeOff className="w-4 h-4" />
              ) : (
                <Eye className="w-4 h-4" />
              )}
            </button>
          </div>
        </div>
        <Button
          onClick={handleSave}
          data-ocid="stripe.save.button"
          style={{ background: "oklch(0.65 0.2 150)", color: "white" }}
        >
          {saved ? (
            <>
              <Check className="w-4 h-4 mr-2" />
              Saved!
            </>
          ) : (
            "Save Keys"
          )}
        </Button>
      </div>

      {/* Info Card */}
      <div
        className="rounded-2xl p-5"
        style={{
          background: "oklch(0.5 0.22 264 / 0.08)",
          border: "1px solid oklch(0.5 0.22 264 / 0.2)",
        }}
      >
        <h4
          className="text-sm font-semibold mb-2"
          style={{ color: "oklch(0.5 0.22 264)" }}
        >
          Billing Flow
        </h4>
        <ul
          className="text-xs space-y-1.5"
          style={{
            color: darkMode ? "oklch(0.65 0.03 255)" : "oklch(0.45 0.03 255)",
          }}
        >
          <li>① New company signs up → card collected via Stripe</li>
          <li>② 7-day free trial starts automatically</li>
          <li>③ Trial expires → $499/month charged automatically</li>
          <li>④ Failed payment → subscription set to inactive</li>
          <li>⑤ Developer can cancel or start trial manually above</li>
        </ul>
      </div>
    </div>
  );
}

// ─── Email Tool Section ───────────────────────────────────────────────────────
function EmailToolSection({
  companies,
  darkMode,
}: {
  companies: CompanySettings[];
  darkMode: boolean;
}) {
  const [recipientMode, setRecipientMode] = useState<"all" | "select">("all");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");

  const cardStyle = {
    background: darkMode ? "oklch(0.18 0.05 255)" : "white",
    border: `1px solid ${darkMode ? "oklch(0.26 0.06 255)" : "oklch(0.90 0.01 255)"}`,
  };

  const toggleCompany = (name: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });
  };

  const recipientCount =
    recipientMode === "all" ? companies.length : selected.size;

  const handleSend = () => {
    toast.error(
      "Email feature requires platform email subscription. Configure SMTP or email service to enable.",
      { duration: 6000 },
    );
  };

  return (
    <div className="space-y-5 max-w-2xl" data-ocid="email.section">
      <div className="rounded-2xl p-6 space-y-5" style={cardStyle}>
        <h3
          className="font-semibold"
          style={{ color: darkMode ? "white" : "oklch(0.18 0.08 255)" }}
        >
          Compose Email
        </h3>

        {/* Recipients */}
        <div>
          <Label className="text-sm">Recipients</Label>
          <div className="mt-2 flex gap-3">
            <button
              type="button"
              onClick={() => setRecipientMode("all")}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all"
              style={{
                background:
                  recipientMode === "all"
                    ? "oklch(0.65 0.2 150 / 0.15)"
                    : darkMode
                      ? "oklch(0.22 0.06 255)"
                      : "oklch(0.95 0.005 255)",
                color:
                  recipientMode === "all"
                    ? "oklch(0.65 0.2 150)"
                    : darkMode
                      ? "oklch(0.7 0.03 255)"
                      : "oklch(0.45 0.03 255)",
                border:
                  recipientMode === "all"
                    ? "1px solid oklch(0.65 0.2 150 / 0.4)"
                    : `1px solid ${darkMode ? "oklch(0.28 0.05 255)" : "oklch(0.88 0.01 255)"}`,
              }}
              data-ocid="email.all_recipients.toggle"
            >
              All Companies ({companies.length})
            </button>
            <button
              type="button"
              onClick={() => setRecipientMode("select")}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all"
              style={{
                background:
                  recipientMode === "select"
                    ? "oklch(0.65 0.2 150 / 0.15)"
                    : darkMode
                      ? "oklch(0.22 0.06 255)"
                      : "oklch(0.95 0.005 255)",
                color:
                  recipientMode === "select"
                    ? "oklch(0.65 0.2 150)"
                    : darkMode
                      ? "oklch(0.7 0.03 255)"
                      : "oklch(0.45 0.03 255)",
                border:
                  recipientMode === "select"
                    ? "1px solid oklch(0.65 0.2 150 / 0.4)"
                    : `1px solid ${darkMode ? "oklch(0.28 0.05 255)" : "oklch(0.88 0.01 255)"}`,
              }}
              data-ocid="email.select_recipients.toggle"
            >
              Select Specific
            </button>
          </div>

          {recipientMode === "select" && (
            <div
              className="mt-3 p-3 rounded-xl space-y-2 max-h-40 overflow-y-auto"
              style={{
                background: darkMode
                  ? "oklch(0.14 0.04 255)"
                  : "oklch(0.97 0.005 255)",
                border: `1px solid ${darkMode ? "oklch(0.26 0.06 255)" : "oklch(0.90 0.01 255)"}`,
              }}
            >
              {companies.length === 0 ? (
                <div
                  className="text-xs py-2 text-center"
                  style={{
                    color: darkMode
                      ? "oklch(0.5 0.03 255)"
                      : "oklch(0.6 0.03 255)",
                  }}
                >
                  No companies available
                </div>
              ) : (
                companies.map((c, i) => (
                  <label
                    key={c.companyName}
                    className="flex items-center gap-2.5 cursor-pointer text-sm py-1"
                    style={{
                      color: darkMode
                        ? "oklch(0.8 0.02 255)"
                        : "oklch(0.3 0.04 255)",
                    }}
                    data-ocid={`email.company.checkbox.${i + 1}`}
                  >
                    <input
                      type="checkbox"
                      checked={selected.has(c.companyName)}
                      onChange={() => toggleCompany(c.companyName)}
                      className="accent-green-500"
                    />
                    {c.companyName}
                  </label>
                ))
              )}
            </div>
          )}
        </div>

        {/* Subject */}
        <div>
          <Label className="text-sm">Subject</Label>
          <Input
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="Exclusive offer for FleetGuard customers"
            className="mt-1.5"
            data-ocid="email.subject.input"
          />
        </div>

        {/* Body */}
        <div>
          <Label className="text-sm">Message</Label>
          <Textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Write your message here..."
            rows={8}
            className="mt-1.5 resize-none"
            data-ocid="email.body.textarea"
          />
        </div>

        <div className="flex items-center justify-between">
          <p
            className="text-xs"
            style={{
              color: darkMode ? "oklch(0.55 0.03 255)" : "oklch(0.55 0.03 255)",
            }}
          >
            {recipientCount} recipient{recipientCount !== 1 ? "s" : ""} selected
          </p>
          <Button
            onClick={handleSend}
            disabled={!subject || !body || recipientCount === 0}
            data-ocid="email.send.button"
            style={{ background: "oklch(0.65 0.2 150)", color: "white" }}
          >
            <Send className="w-4 h-4 mr-2" />
            Send Email
          </Button>
        </div>
      </div>

      {/* Preview */}
      {(subject || body) && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl p-6"
          style={{
            ...cardStyle,
            borderLeft: "3px solid oklch(0.65 0.2 150)",
          }}
          data-ocid="email.preview.panel"
        >
          <div
            className="text-xs font-semibold uppercase tracking-wider mb-3"
            style={{ color: "oklch(0.65 0.2 150)" }}
          >
            Preview
          </div>
          <div
            className="text-base font-semibold mb-2"
            style={{ color: darkMode ? "white" : "oklch(0.18 0.08 255)" }}
          >
            {subject || "(No subject)"}
          </div>
          <div
            className="text-sm whitespace-pre-wrap leading-relaxed"
            style={{
              color: darkMode ? "oklch(0.7 0.02 255)" : "oklch(0.4 0.02 255)",
            }}
          >
            {body || "(No body)"}
          </div>
        </motion.div>
      )}
    </div>
  );
}
