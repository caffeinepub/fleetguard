import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Building2,
  ChevronDown,
  Code2,
  DollarSign,
  LogOut,
  RefreshCw,
  TrendingUp,
  Users,
} from "lucide-react";
import { toast } from "sonner";
import {
  useAllCompanyRegistrations,
  useGetAllSubscriptions,
  useUpdateSubscriptionStatus,
} from "../hooks/useQueries";

const MONTHLY_PRICE = 499;

function formatDate(ns: bigint): string {
  const ms = Number(ns / 1_000_000n);
  return new Date(ms).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function truncatePrincipal(p: string) {
  if (p.length <= 16) return p;
  return `${p.slice(0, 8)}...${p.slice(-6)}`;
}

function SubBadge({ status }: { status: string }) {
  const cfg: Record<string, { label: string; cls: string }> = {
    active: {
      label: "Active",
      cls: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
    },
    cancelled: {
      label: "Cancelled",
      cls: "bg-red-500/15 text-red-400 border-red-500/30",
    },
  };
  const c = cfg[status] ?? {
    label: "Inactive",
    cls: "bg-white/10 text-white/50 border-white/15",
  };
  return (
    <Badge
      variant="outline"
      className={`text-xs font-semibold px-2.5 py-0.5 capitalize ${c.cls}`}
    >
      {c.label}
    </Badge>
  );
}

export function DevPortalPage() {
  const {
    data: companies,
    isLoading: companiesLoading,
    refetch: refetchCompanies,
  } = useAllCompanyRegistrations();
  const {
    data: subscriptions = [],
    isLoading: subsLoading,
    refetch: refetchSubs,
  } = useGetAllSubscriptions();
  const updateSub = useUpdateSubscriptionStatus();

  const isLoading = companiesLoading || subsLoading;

  const refetch = () => {
    refetchCompanies();
    refetchSubs();
  };

  const handleExit = () => {
    localStorage.removeItem("devKey");
    window.location.replace(window.location.origin);
  };

  const getSubStatus = (name: string) =>
    subscriptions.find((s) => s.companyName === name)?.status ?? "inactive";

  const handleSubAction = async (
    companyName: string,
    action: "activate" | "deactivate" | "cancel",
  ) => {
    const statusMap = {
      activate: "active",
      deactivate: "inactive",
      cancel: "cancelled",
    };
    const status = statusMap[action];
    try {
      await updateSub.mutateAsync({
        companyName,
        status,
        startDate:
          action === "activate" ? BigInt(Date.now()) * 1_000_000n : undefined,
      });
      await refetch();
      toast.success(
        action === "activate"
          ? `Subscription activated for ${companyName}`
          : action === "cancel"
            ? `Subscription cancelled for ${companyName}`
            : `Subscription deactivated for ${companyName}`,
      );
    } catch {
      toast.error("Failed to update subscription");
    }
  };

  const activeCount = subscriptions.filter((s) => s.status === "active").length;
  const inactiveCount = (companies?.length ?? 0) - activeCount;
  const mrr = activeCount * MONTHLY_PRICE;

  const summaryCards = [
    {
      label: "Total Companies",
      value: isLoading ? "—" : String(companies?.length ?? 0),
      icon: Building2,
      accent: "text-sky-400",
      bg: "bg-sky-400/10",
    },
    {
      label: "Active Subscriptions",
      value: isLoading ? "—" : String(activeCount),
      icon: Users,
      accent: "text-emerald-400",
      bg: "bg-emerald-400/10",
    },
    {
      label: "Monthly Revenue",
      value: isLoading ? "—" : `$${mrr.toLocaleString()}`,
      icon: DollarSign,
      accent: "text-amber-400",
      bg: "bg-amber-400/10",
    },
    {
      label: "Inactive / Trial",
      value: isLoading ? "—" : String(inactiveCount),
      icon: TrendingUp,
      accent: "text-violet-400",
      bg: "bg-violet-400/10",
    },
  ];

  return (
    <div
      className="min-h-screen"
      style={{ background: "oklch(0.13 0.02 240)" }}
      data-ocid="devportal.page"
    >
      {/* Top bar */}
      <header
        className="border-b px-6 py-4 flex items-center justify-between sticky top-0 z-10"
        style={{
          background: "oklch(0.11 0.02 240)",
          borderColor: "rgba(255,255,255,0.08)",
        }}
      >
        <div className="flex items-center gap-3">
          <div
            className="w-9 h-9 rounded-lg flex items-center justify-center"
            style={{ background: "oklch(0.7 0.18 50 / 0.2)" }}
          >
            <Code2 className="w-5 h-5 text-amber-400" />
          </div>
          <div>
            <h1 className="text-sm font-bold tracking-tight text-white">
              FleetGuard Developer Dashboard
            </h1>
            <p className="text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>
              {new Date().toLocaleDateString("en-GB", {
                weekday: "long",
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            className="text-white/60 hover:text-white hover:bg-white/10 gap-2"
            onClick={refetch}
            data-ocid="devportal.secondary_button"
          >
            <RefreshCw className="w-4 h-4" /> Refresh
          </Button>
          <Button
            size="sm"
            className="gap-2 bg-red-500/20 text-red-400 border border-red-500/30 hover:bg-red-500/30"
            onClick={handleExit}
            data-ocid="devportal.secondary_button"
          >
            <LogOut className="w-4 h-4" /> Exit Portal
          </Button>
        </div>
      </header>

      <main className="p-6 space-y-6">
        {/* Summary cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {summaryCards.map((card) => (
            <Card
              key={card.label}
              className="border-0"
              style={{ background: "oklch(0.17 0.02 240)" }}
            >
              <CardContent className="p-5">
                <div className="flex items-center gap-3 mb-3">
                  <div
                    className={`w-8 h-8 rounded-lg flex items-center justify-center ${card.bg}`}
                  >
                    <card.icon className={`w-4 h-4 ${card.accent}`} />
                  </div>
                  <p
                    className="text-xs uppercase tracking-widest font-medium"
                    style={{ color: "rgba(255,255,255,0.45)" }}
                  >
                    {card.label}
                  </p>
                </div>
                <p className={`text-3xl font-bold ${card.accent}`}>
                  {card.value}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* MRR detail */}
        {!isLoading && activeCount > 0 && (
          <div
            className="flex items-center gap-3 px-5 py-3 rounded-xl text-sm"
            style={{
              background: "oklch(0.7 0.18 150 / 0.1)",
              border: "1px solid oklch(0.7 0.18 150 / 0.2)",
            }}
          >
            <TrendingUp className="w-4 h-4 text-emerald-400 shrink-0" />
            <span style={{ color: "rgba(255,255,255,0.7)" }}>
              {activeCount} active subscription{activeCount !== 1 ? "s" : ""} ×
              $499/mo ={" "}
              <strong className="text-emerald-400">
                ${mrr.toLocaleString()}/month
              </strong>{" "}
              recurring revenue
            </span>
          </div>
        )}

        {/* Companies table */}
        <div
          className="rounded-xl overflow-hidden"
          style={{
            background: "oklch(0.17 0.02 240)",
            border: "1px solid rgba(255,255,255,0.07)",
          }}
        >
          <div
            className="px-6 py-4 flex items-center justify-between"
            style={{ borderBottom: "1px solid rgba(255,255,255,0.07)" }}
          >
            <h2 className="text-sm font-semibold text-white">
              Company Registrations
            </h2>
            <Badge
              variant="outline"
              className="border-amber-400/40 text-amber-400 bg-amber-400/10 text-xs"
            >
              Dev Access
            </Badge>
          </div>

          {isLoading ? (
            <div className="p-6 space-y-3" data-ocid="devportal.loading_state">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-12 w-full bg-white/5" />
              ))}
            </div>
          ) : !companies || companies.length === 0 ? (
            <div className="p-14 text-center" data-ocid="devportal.empty_state">
              <Code2
                className="w-10 h-10 mx-auto mb-3"
                style={{ color: "rgba(255,255,255,0.15)" }}
              />
              <p
                className="text-sm"
                style={{ color: "rgba(255,255,255,0.35)" }}
              >
                No companies registered yet
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow
                  className="hover:bg-transparent"
                  style={{ borderColor: "rgba(255,255,255,0.06)" }}
                >
                  {[
                    "Company Name",
                    "Industry",
                    "Fleet Size",
                    "Contact Phone",
                    "Admin Principal",
                    "Signed Up",
                    "Subscription",
                    "Actions",
                  ].map((h) => (
                    <TableHead
                      key={h}
                      className="text-xs font-semibold uppercase tracking-wider"
                      style={{ color: "rgba(255,255,255,0.4)" }}
                    >
                      {h}
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody data-ocid="devportal.table">
                {companies.map((company, idx) => {
                  const sub = getSubStatus(company.companyName);
                  return (
                    <TableRow
                      key={company.adminPrincipal}
                      className="hover:bg-white/[0.03]"
                      style={{ borderColor: "rgba(255,255,255,0.05)" }}
                      data-ocid={`devportal.item.${idx + 1}`}
                    >
                      <TableCell className="font-semibold text-white">
                        {company.companyName}
                      </TableCell>
                      <TableCell style={{ color: "rgba(255,255,255,0.55)" }}>
                        {company.industry || "—"}
                      </TableCell>
                      <TableCell style={{ color: "rgba(255,255,255,0.55)" }}>
                        {company.fleetSize || "—"}
                      </TableCell>
                      <TableCell style={{ color: "rgba(255,255,255,0.55)" }}>
                        {company.contactPhone || "—"}
                      </TableCell>
                      <TableCell
                        className="font-mono text-xs"
                        style={{ color: "rgba(255,255,255,0.4)" }}
                      >
                        {truncatePrincipal(company.adminPrincipal)}
                      </TableCell>
                      <TableCell style={{ color: "rgba(255,255,255,0.55)" }}>
                        {company.createdAt
                          ? formatDate(company.createdAt)
                          : "—"}
                      </TableCell>
                      <TableCell>
                        <SubBadge status={sub} />
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 gap-1.5 text-xs text-white/60 hover:text-white hover:bg-white/10"
                              data-ocid="devportal.button"
                            >
                              Manage <ChevronDown className="w-3 h-3" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-48">
                            <DropdownMenuItem
                              className="text-emerald-600 focus:text-emerald-600 cursor-pointer"
                              onClick={() =>
                                handleSubAction(company.companyName, "activate")
                              }
                              data-ocid="devportal.button"
                            >
                              ✓ Activate Subscription
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="cursor-pointer"
                              onClick={() =>
                                handleSubAction(
                                  company.companyName,
                                  "deactivate",
                                )
                              }
                              data-ocid="devportal.button"
                            >
                              ○ Deactivate Subscription
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="text-destructive focus:text-destructive cursor-pointer"
                              onClick={() =>
                                handleSubAction(company.companyName, "cancel")
                              }
                              data-ocid="devportal.button"
                            >
                              ✕ Cancel Subscription
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </div>

        {/* Footer */}
        <p
          className="text-center text-xs pb-4"
          style={{ color: "rgba(255,255,255,0.25)" }}
        >
          © {new Date().getFullYear()} FleetGuard · Developer Portal · Built
          with ❤️ using{" "}
          <a
            href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="underline hover:opacity-80"
          >
            caffeine.ai
          </a>
        </p>
      </main>
    </div>
  );
}
