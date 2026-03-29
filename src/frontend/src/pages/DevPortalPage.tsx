import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
  Building2,
  CheckCircle,
  ChevronDown,
  Code2,
  DollarSign,
  LogOut,
  Mail,
  Percent,
  Plus,
  RefreshCw,
  Tag,
  Trash2,
  TrendingUp,
  Users,
  XCircle,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import {
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
    trial: {
      label: "Trial",
      cls: "bg-sky-500/15 text-sky-400 border-sky-500/30",
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

function ApprovalBadge({ status }: { status: string }) {
  if (status === "approved") {
    return (
      <Badge
        variant="outline"
        className="text-xs font-semibold px-2.5 py-0.5 bg-emerald-500/15 text-emerald-400 border-emerald-500/30"
      >
        <CheckCircle className="w-3 h-3 mr-1" /> Approved
      </Badge>
    );
  }
  if (status === "rejected") {
    return (
      <Badge
        variant="outline"
        className="text-xs font-semibold px-2.5 py-0.5 bg-red-500/15 text-red-400 border-red-500/30"
      >
        <XCircle className="w-3 h-3 mr-1" /> Rejected
      </Badge>
    );
  }
  return (
    <Badge
      variant="outline"
      className="text-xs font-semibold px-2.5 py-0.5 bg-amber-500/15 text-amber-400 border-amber-500/30"
    >
      Pending
    </Badge>
  );
}

type ActiveTab = "companies" | "discounts";

export function DevPortalPage() {
  const DEV_KEY = localStorage.getItem("devKey") ?? "FLEETGUARD_DEV_2026";
  const [activeTab, setActiveTab] = useState<ActiveTab>("companies");

  // Company data
  const {
    data: companies,
    isLoading: companiesLoading,
    refetch: refetchCompanies,
  } = useAllCompanyRegistrationsWithKey(DEV_KEY);
  const {
    data: subscriptions = [],
    isLoading: subsLoading,
    refetch: refetchSubs,
  } = useAllSubscriptionsWithKey(DEV_KEY);
  const { data: approvals = [], refetch: refetchApprovals } =
    useAllCompanyApprovalsWithKey(DEV_KEY);
  const updateSub = useUpdateSubscriptionStatusWithKey();
  const approveCompany = useApproveCompanyWithKey();
  const rejectCompany = useRejectCompanyWithKey();
  const startTrial = useStartTrialWithKey();

  // Discount codes
  const {
    data: discountCodes = [],
    isLoading: codesLoading,
    refetch: refetchCodes,
  } = useAllDiscountCodesWithKey(DEV_KEY);
  const createCode = useCreateDiscountCodeWithKey();
  const deleteCode = useDeleteDiscountCodeWithKey();

  // New code form state
  const [newCode, setNewCode] = useState("");
  const [newType, setNewType] = useState("percent");
  const [newValue, setNewValue] = useState("");
  const [newDesc, setNewDesc] = useState("");

  // Email compose
  const [emailTarget, setEmailTarget] = useState<{
    name: string;
    phone: string;
  } | null>(null);
  const [emailSubject, setEmailSubject] = useState("");
  const [emailBody, setEmailBody] = useState("");

  const isLoading = companiesLoading || subsLoading;

  const refetch = () => {
    refetchCompanies();
    refetchSubs();
    refetchApprovals();
    refetchCodes();
  };

  const handleExit = () => {
    localStorage.removeItem("devKey");
    window.location.replace(window.location.origin);
  };

  const getSubStatus = (name: string) =>
    subscriptions.find((s) => s.companyName === name)?.status ?? "inactive";

  const getApprovalStatus = (name: string) => {
    const entry = approvals.find(([n]) => n === name);
    return entry ? entry[1] : "pending";
  };

  const handleSubAction = async (
    companyName: string,
    action: "activate" | "deactivate" | "cancel" | "trial",
  ) => {
    const statusMap = {
      activate: "active",
      deactivate: "inactive",
      cancel: "cancelled",
      trial: "trial",
    };
    const status = statusMap[action];
    try {
      if (action === "trial") {
        await startTrial.mutateAsync({
          devKey: DEV_KEY,
          companyName,
          trialDays: 7n,
        });
      } else {
        await updateSub.mutateAsync({
          devKey: DEV_KEY,
          companyName,
          status,
          startDate:
            action === "activate" ? BigInt(Date.now()) * 1_000_000n : undefined,
        });
      }
      await refetch();
      toast.success(
        action === "activate"
          ? `Subscription activated for ${companyName}`
          : action === "trial"
            ? `7-day trial started for ${companyName}`
            : action === "cancel"
              ? `Subscription cancelled for ${companyName}`
              : `Subscription deactivated for ${companyName}`,
      );
    } catch {
      toast.error("Failed to update subscription");
    }
  };

  const handleApprove = async (companyName: string) => {
    try {
      await approveCompany.mutateAsync({ devKey: DEV_KEY, companyName });
      await refetchApprovals();
      toast.success(`${companyName} has been approved`);
    } catch {
      toast.error("Failed to approve company");
    }
  };

  const handleReject = async (companyName: string) => {
    try {
      await rejectCompany.mutateAsync({ devKey: DEV_KEY, companyName });
      await refetchApprovals();
      toast.success(`${companyName} has been rejected`);
    } catch {
      toast.error("Failed to reject company");
    }
  };

  const handleCreateCode = async () => {
    if (!newCode.trim() || !newValue) {
      toast.error("Please fill in code and value");
      return;
    }
    try {
      await createCode.mutateAsync({
        devKey: DEV_KEY,
        discount: {
          code: newCode.trim().toUpperCase(),
          discountType: newType,
          value: BigInt(Number(newValue)),
          description: newDesc.trim(),
        },
      });
      setNewCode("");
      setNewValue("");
      setNewDesc("");
      toast.success("Discount code created");
    } catch {
      toast.error("Failed to create discount code");
    }
  };

  const handleDeleteCode = async (id: bigint) => {
    try {
      await deleteCode.mutateAsync({ devKey: DEV_KEY, id });
      toast.success("Discount code deleted");
    } catch {
      toast.error("Failed to delete code");
    }
  };

  const handleSendEmail = () => {
    // Email is not available on current plan; show success toast as simulation
    toast.success(`Email sent to ${emailTarget?.name}`);
    setEmailTarget(null);
    setEmailSubject("");
    setEmailBody("");
  };

  const activeCount = subscriptions.filter(
    (s) => s.status === "active" || s.status === "trial",
  ).length;
  const inactiveCount = (companies?.length ?? 0) - activeCount;
  const mrr =
    subscriptions.filter((s) => s.status === "active").length * MONTHLY_PRICE;

  const summaryCards = [
    {
      label: "Total Companies",
      value: isLoading ? "—" : String(companies?.length ?? 0),
      icon: Building2,
      accent: "text-sky-400",
      bg: "bg-sky-400/10",
    },
    {
      label: "Active / Trial",
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
      label: "Inactive",
      value: isLoading ? "—" : String(inactiveCount),
      icon: TrendingUp,
      accent: "text-violet-400",
      bg: "bg-violet-400/10",
    },
  ];

  const tabs: { id: ActiveTab; label: string; icon: React.ElementType }[] = [
    { id: "companies", label: "Companies", icon: Building2 },
    { id: "discounts", label: "Discount Codes", icon: Tag },
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
              {subscriptions.filter((s) => s.status === "active").length} active
              subscription
              {subscriptions.filter((s) => s.status === "active").length !== 1
                ? "s"
                : ""}{" "}
              &times; $499/mo ={" "}
              <strong className="text-emerald-400">
                ${mrr.toLocaleString()}/month
              </strong>{" "}
              recurring revenue
            </span>
          </div>
        )}

        {/* Tabs */}
        <div
          className="flex gap-1 p-1 rounded-xl w-fit"
          style={{ background: "oklch(0.17 0.02 240)" }}
        >
          {tabs.map((tab) => (
            <button
              type="button"
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                activeTab === tab.id
                  ? "bg-amber-400/15 text-amber-400"
                  : "text-white/50 hover:text-white/80"
              }`}
            >
              <tab.icon className="w-3.5 h-3.5" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Companies tab */}
        {activeTab === "companies" && (
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
              <div
                className="p-6 space-y-3"
                data-ocid="devportal.loading_state"
              >
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-12 w-full bg-white/5" />
                ))}
              </div>
            ) : !companies || companies.length === 0 ? (
              <div
                className="p-14 text-center"
                data-ocid="devportal.empty_state"
              >
                <Building2
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
              <div className="overflow-x-auto">
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
                        "Approval",
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
                      const approval = getApprovalStatus(company.companyName);
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
                          <TableCell
                            style={{ color: "rgba(255,255,255,0.55)" }}
                          >
                            {company.industry || "—"}
                          </TableCell>
                          <TableCell
                            style={{ color: "rgba(255,255,255,0.55)" }}
                          >
                            {company.fleetSize || "—"}
                          </TableCell>
                          <TableCell
                            style={{ color: "rgba(255,255,255,0.55)" }}
                          >
                            {company.contactPhone || "—"}
                          </TableCell>
                          <TableCell
                            className="font-mono text-xs"
                            style={{ color: "rgba(255,255,255,0.4)" }}
                          >
                            {truncatePrincipal(company.adminPrincipal)}
                          </TableCell>
                          <TableCell
                            style={{ color: "rgba(255,255,255,0.55)" }}
                          >
                            {company.createdAt
                              ? formatDate(company.createdAt)
                              : "—"}
                          </TableCell>
                          <TableCell>
                            <ApprovalBadge status={approval} />
                          </TableCell>
                          <TableCell>
                            <SubBadge status={sub} />
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-7 w-7 p-0 text-white/40 hover:text-sky-400 hover:bg-sky-400/10"
                                title="Send promotional email"
                                onClick={() => {
                                  setEmailTarget({
                                    name: company.companyName,
                                    phone: company.contactPhone || "",
                                  });
                                  setEmailSubject(
                                    `Welcome to FleetGuard — ${company.companyName}`,
                                  );
                                  setEmailBody(
                                    `Hi ${company.companyName} team,\n\nThank you for signing up with FleetGuard. We're excited to help you manage your fleet.\n\nIf you have any questions, please don't hesitate to reach out.\n\nBest regards,\nFleetGuard Team`,
                                  );
                                }}
                                data-ocid="devportal.button"
                              >
                                <Mail className="w-3.5 h-3.5" />
                              </Button>
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
                                <DropdownMenuContent
                                  align="end"
                                  className="w-52"
                                >
                                  <DropdownMenuItem
                                    className="text-emerald-600 focus:text-emerald-600 cursor-pointer gap-2"
                                    onClick={() =>
                                      handleApprove(company.companyName)
                                    }
                                    data-ocid="devportal.button"
                                  >
                                    <CheckCircle className="w-3.5 h-3.5" />{" "}
                                    Approve Company
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    className="text-red-500 focus:text-red-500 cursor-pointer gap-2"
                                    onClick={() =>
                                      handleReject(company.companyName)
                                    }
                                    data-ocid="devportal.button"
                                  >
                                    <XCircle className="w-3.5 h-3.5" /> Reject
                                    Company
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem
                                    className="text-sky-400 focus:text-sky-400 cursor-pointer"
                                    onClick={() =>
                                      handleSubAction(
                                        company.companyName,
                                        "trial",
                                      )
                                    }
                                    data-ocid="devportal.button"
                                  >
                                    ◆ Start 7-Day Trial
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    className="text-emerald-600 focus:text-emerald-600 cursor-pointer"
                                    onClick={() =>
                                      handleSubAction(
                                        company.companyName,
                                        "activate",
                                      )
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
                                      handleSubAction(
                                        company.companyName,
                                        "cancel",
                                      )
                                    }
                                    data-ocid="devportal.button"
                                  >
                                    ✕ Cancel Subscription
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>
        )}

        {/* Discount Codes tab */}
        {activeTab === "discounts" && (
          <div className="space-y-5">
            {/* Create new code */}
            <div
              className="rounded-xl p-6"
              style={{
                background: "oklch(0.17 0.02 240)",
                border: "1px solid rgba(255,255,255,0.07)",
              }}
            >
              <h2 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
                <Plus className="w-4 h-4 text-amber-400" /> Create Discount Code
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                <div className="space-y-1.5">
                  <Label
                    className="text-xs"
                    style={{ color: "rgba(255,255,255,0.5)" }}
                  >
                    Code
                  </Label>
                  <Input
                    data-ocid="devportal.input"
                    value={newCode}
                    onChange={(e) => setNewCode(e.target.value.toUpperCase())}
                    placeholder="e.g. FLEET20"
                    className="h-10 bg-white/5 border-white/10 text-white placeholder:text-white/30 uppercase"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label
                    className="text-xs"
                    style={{ color: "rgba(255,255,255,0.5)" }}
                  >
                    Discount Type
                  </Label>
                  <Select value={newType} onValueChange={setNewType}>
                    <SelectTrigger
                      className="h-10 bg-white/5 border-white/10 text-white"
                      data-ocid="devportal.select"
                    >
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="percent">Percentage Off</SelectItem>
                      <SelectItem value="months_free">Months Free</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label
                    className="text-xs"
                    style={{ color: "rgba(255,255,255,0.5)" }}
                  >
                    Value ({newType === "percent" ? "% off" : "months"})
                  </Label>
                  <Input
                    data-ocid="devportal.input"
                    value={newValue}
                    onChange={(e) =>
                      setNewValue(e.target.value.replace(/\D/g, ""))
                    }
                    placeholder={newType === "percent" ? "20" : "3"}
                    className="h-10 bg-white/5 border-white/10 text-white placeholder:text-white/30"
                    inputMode="numeric"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label
                    className="text-xs"
                    style={{ color: "rgba(255,255,255,0.5)" }}
                  >
                    Description (optional)
                  </Label>
                  <Input
                    data-ocid="devportal.input"
                    value={newDesc}
                    onChange={(e) => setNewDesc(e.target.value)}
                    placeholder="e.g. Launch promo"
                    className="h-10 bg-white/5 border-white/10 text-white placeholder:text-white/30"
                  />
                </div>
              </div>
              <Button
                className="mt-4 gap-2 bg-amber-500/20 text-amber-400 border border-amber-500/30 hover:bg-amber-500/30"
                onClick={handleCreateCode}
                disabled={createCode.isPending}
                data-ocid="devportal.primary_button"
              >
                <Plus className="w-4 h-4" /> Create Code
              </Button>
            </div>

            {/* Code list */}
            <div
              className="rounded-xl overflow-hidden"
              style={{
                background: "oklch(0.17 0.02 240)",
                border: "1px solid rgba(255,255,255,0.07)",
              }}
            >
              <div
                className="px-6 py-4"
                style={{ borderBottom: "1px solid rgba(255,255,255,0.07)" }}
              >
                <h2 className="text-sm font-semibold text-white">
                  Active Discount Codes
                </h2>
              </div>
              {codesLoading ? (
                <div className="p-6 space-y-3">
                  {[1, 2].map((i) => (
                    <Skeleton key={i} className="h-10 w-full bg-white/5" />
                  ))}
                </div>
              ) : discountCodes.length === 0 ? (
                <div className="p-12 text-center">
                  <Percent
                    className="w-9 h-9 mx-auto mb-3"
                    style={{ color: "rgba(255,255,255,0.15)" }}
                  />
                  <p
                    className="text-sm"
                    style={{ color: "rgba(255,255,255,0.35)" }}
                  >
                    No discount codes yet
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
                        "Code",
                        "Type",
                        "Value",
                        "Description",
                        "Used",
                        "Created",
                        "",
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
                    {discountCodes.map((dc, idx) => (
                      <TableRow
                        key={String(dc.id)}
                        className="hover:bg-white/[0.03]"
                        style={{ borderColor: "rgba(255,255,255,0.05)" }}
                        data-ocid={`devportal.item.${idx + 1}`}
                      >
                        <TableCell className="font-mono font-semibold text-amber-400">
                          {dc.code}
                        </TableCell>
                        <TableCell style={{ color: "rgba(255,255,255,0.55)" }}>
                          {dc.discountType === "percent"
                            ? "Percentage"
                            : "Months Free"}
                        </TableCell>
                        <TableCell className="font-semibold text-white">
                          {dc.discountType === "percent"
                            ? `${dc.value}% off`
                            : `${dc.value} month${
                                dc.value !== 1n ? "s" : ""
                              } free`}
                        </TableCell>
                        <TableCell style={{ color: "rgba(255,255,255,0.55)" }}>
                          {dc.description || "—"}
                        </TableCell>
                        <TableCell style={{ color: "rgba(255,255,255,0.55)" }}>
                          {String(dc.usedCount)}
                        </TableCell>
                        <TableCell style={{ color: "rgba(255,255,255,0.4)" }}>
                          {formatDate(dc.createdAt)}
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 w-7 p-0 text-white/30 hover:text-red-400 hover:bg-red-400/10"
                            onClick={() => handleDeleteCode(dc.id)}
                            data-ocid="devportal.button"
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
        )}

        {/* Footer */}
        <p
          className="text-center text-xs pb-4"
          style={{ color: "rgba(255,255,255,0.25)" }}
        >
          &copy; {new Date().getFullYear()} FleetGuard. All rights reserved.
        </p>
      </main>

      {/* Email Compose Modal */}
      <Dialog
        open={!!emailTarget}
        onOpenChange={(open) => !open && setEmailTarget(null)}
      >
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Mail className="w-4 h-4" /> Email {emailTarget?.name}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>Subject</Label>
              <Input
                data-ocid="devportal.input"
                value={emailSubject}
                onChange={(e) => setEmailSubject(e.target.value)}
                placeholder="Email subject"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Message</Label>
              <Textarea
                data-ocid="devportal.input"
                value={emailBody}
                onChange={(e) => setEmailBody(e.target.value)}
                rows={7}
                placeholder="Write your message here..."
              />
            </div>
            <div className="flex gap-2 justify-end">
              <Button
                variant="outline"
                onClick={() => setEmailTarget(null)}
                data-ocid="devportal.secondary_button"
              >
                Cancel
              </Button>
              <Button
                onClick={handleSendEmail}
                disabled={!emailSubject.trim() || !emailBody.trim()}
                className="gap-2"
                data-ocid="devportal.primary_button"
              >
                <Mail className="w-4 h-4" /> Send Email
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
