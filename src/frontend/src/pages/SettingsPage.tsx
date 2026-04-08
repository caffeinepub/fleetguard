import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  ArrowUpRight,
  Building2,
  Check,
  ClipboardCheck,
  Copy,
  CreditCard,
  Link,
  Loader2,
  Plus,
  Settings,
  Shield,
  Tag,
  Trash2,
  Upload,
  User,
  UserPlus,
  Users,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { ChecklistItemStatus, FleetRole, SubscriptionTier } from "../backend";
import type { CompanySettings, InspectionChecklist } from "../backend";
import { useActor } from "../hooks/useActor";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import {
  useAllVehicles,
  useCallerFleetRole,
  useCompanyUsers,
  useCreateInspectionChecklist,
  useCreateInviteToken,
  useDeleteInspectionChecklist,
  useGetCompanySettings,
  useGetDefaultCurrency,
  useGetSubscriptionStatus,
  useInspectionChecklists,
  useInviteTokens,
  useIsAdmin,
  useSaveCompanySettings,
  useSaveDefaultCurrency,
  useSetUserFleetRole,
} from "../hooks/useQueries";
import { useTaxSettings } from "../hooks/useTaxSettings";
import { nowNs } from "../lib/helpers";

const fleetRoleLabel: Record<string, string> = {
  [FleetRole.Admin]: "Administrator",
  [FleetRole.FleetManager]: "Fleet Manager",
  [FleetRole.Mechanic]: "Mechanic",
};

const fleetRoleBadgeClass: Record<string, string> = {
  [FleetRole.Admin]: "bg-primary/10 text-primary",
  [FleetRole.FleetManager]: "bg-success/10 text-success",
  [FleetRole.Mechanic]: "bg-amber-500/10 text-amber-600",
};

function formatTokenDate(ns: bigint): string {
  const ms = Number(ns / 1_000_000n);
  return new Date(ms).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function formatSubDate(ns: bigint): string {
  const ms = Number(ns / 1_000_000n);
  return new Date(ms).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

interface SettingsPageProps {
  onNavigate?: (page: import("../App").Page) => void;
}

export function SettingsPage({ onNavigate }: SettingsPageProps = {}) {
  const { data: companySettings } = useGetCompanySettings();
  const { data: isAdmin } = useIsAdmin();
  const { data: fleetRole } = useCallerFleetRole();
  const { data: inviteTokens } = useInviteTokens();
  const { data: subscription } = useGetSubscriptionStatus(
    companySettings?.companyName,
  );
  const { data: vehicles } = useAllVehicles();
  const vehicleCount = vehicles?.length ?? 0;
  const { data: savedCurrency } = useGetDefaultCurrency();
  const { taxSettings, saveTaxSettings } = useTaxSettings();
  const [taxLabel, setTaxLabel] = useState(taxSettings.taxLabel);
  const [taxRate, setTaxRate] = useState(String(taxSettings.taxRate));
  const [taxEnabled, setTaxEnabled] = useState(taxSettings.enabled);

  // Inspection checklist state
  const { data: inspectionChecklists, isLoading: checklistsLoading } =
    useInspectionChecklists();
  const createChecklist = useCreateInspectionChecklist();
  const deleteChecklist = useDeleteInspectionChecklist();
  const [newChecklistItemLabel, setNewChecklistItemLabel] = useState("");
  const [addingChecklistItem, setAddingChecklistItem] = useState(false);

  // Promo code
  const { actor } = useActor();
  const [promoCode, setPromoCode] = useState("");
  const [promoApplying, setPromoApplying] = useState(false);
  const [appliedPromo, setAppliedPromo] = useState<{
    code: string;
    discountType: string;
    value: bigint;
  } | null>(null);

  const handleApplyPromoCode = async () => {
    if (!actor || !promoCode.trim()) return;
    setPromoApplying(true);
    try {
      const result = await actor.validateDiscountCode(
        promoCode.trim().toUpperCase(),
      );
      if (result && Array.isArray(result) && result.length > 0 && result[0]) {
        const dc = result[0];
        await actor.applyDiscountCode(promoCode.trim().toUpperCase());
        setAppliedPromo({
          code: dc.code,
          discountType: dc.discountType,
          value: dc.value,
        });
        setPromoCode("");
        toast.success(
          `Promo code applied! ${dc.discountType === "percent" ? `${dc.value}% off` : `${dc.value} months free`}`,
        );
      } else {
        toast.error("Invalid or expired promo code");
      }
    } catch {
      toast.error("Failed to apply code — please try again");
    } finally {
      setPromoApplying(false);
    }
  };
  const { identity } = useInternetIdentity();
  const saveSettings = useSaveCompanySettings();
  const saveCurrency = useSaveDefaultCurrency();
  const createInvite = useCreateInviteToken();

  // Manage Team hooks
  const { data: companyUsers, isLoading: usersLoading } = useCompanyUsers();
  const setUserFleetRole = useSetUserFleetRole();

  // Company info state
  const [companyName, setCompanyName] = useState("");
  const [industry, setIndustry] = useState("");
  const [fleetSize, setFleetSize] = useState("");
  const [contactPhone, setContactPhone] = useState("");

  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Invite form
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<FleetRole>(
    FleetRole.FleetManager,
  );
  const [generatedLink, setGeneratedLink] = useState<string | null>(null);
  const [linkCopied, setLinkCopied] = useState(false);

  const [copied, setCopied] = useState(false);

  // Pre-populate fields when settings load (run only once on first load)
  const initializedRef = useRef(false);
  useEffect(() => {
    if (companySettings && !initializedRef.current) {
      initializedRef.current = true;
      setCompanyName(companySettings.companyName ?? "");
      setIndustry(companySettings.industry ?? "");
      setFleetSize(companySettings.fleetSize ?? "");
      setContactPhone(companySettings.contactPhone ?? "");
    }
  }, [companySettings]);

  const currentLogo = logoPreview ?? companySettings?.logoUrl ?? null;
  const principalId = identity?.getPrincipal().toString() ?? "";
  const currentCurrency = savedCurrency ?? "CAD";

  const subscriptionStatus = subscription?.status ?? "inactive";
  const subscriptionStartDate = subscription?.startDate;

  const displayRole = fleetRole
    ? (fleetRoleLabel[fleetRole] ?? "Fleet Member")
    : isAdmin
      ? "Administrator"
      : "Fleet Member";
  const roleBadge = fleetRole
    ? (fleetRoleBadgeClass[fleetRole] ?? "bg-muted text-muted-foreground")
    : isAdmin
      ? "bg-primary/10 text-primary"
      : "bg-muted text-muted-foreground";

  const getSubBadge = (status: string) => {
    switch (status) {
      case "active":
        return "bg-success/10 text-success border-success/30";
      case "cancelled":
        return "bg-destructive/10 text-destructive border-destructive/30";
      default:
        return "bg-muted text-muted-foreground border-border";
    }
  };

  const getSubLabel = (status: string) => {
    switch (status) {
      case "active":
        return "Active";
      case "cancelled":
        return "Cancelled";
      default:
        return "Inactive";
    }
  };

  const buildSavePayload = (
    overrides: Partial<CompanySettings> = {},
  ): CompanySettings => ({
    companyName: companyName.trim() || companySettings?.companyName || "",
    industry: industry || companySettings?.industry || "",
    fleetSize: fleetSize || companySettings?.fleetSize || "",
    contactPhone: contactPhone || companySettings?.contactPhone || "",
    logoUrl: companySettings?.logoUrl ?? "",
    adminPrincipal: companySettings?.adminPrincipal ?? principalId,
    createdAt: companySettings?.createdAt ?? BigInt(Date.now()) * 1_000_000n,
    ...overrides,
  });

  const handleCopyPrincipal = async () => {
    if (!principalId) return;
    try {
      await navigator.clipboard.writeText(principalId);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast.success("Principal ID copied to clipboard");
    } catch (err) {
      console.error(err);
      toast.error("Failed to copy");
    }
  };

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file");
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      toast.error("Image must be smaller than 2MB");
      return;
    }
    setIsUploadingLogo(true);
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = async () => {
      const base64 = reader.result as string;
      setLogoPreview(base64);
      try {
        await saveSettings.mutateAsync(buildSavePayload({ logoUrl: base64 }));
        toast.success("Logo uploaded successfully");
      } catch (err) {
        console.error(err);
        toast.error("Failed to save logo");
        setLogoPreview(null);
      } finally {
        setIsUploadingLogo(false);
      }
    };
    reader.onerror = () => {
      toast.error("Failed to read file");
      setIsUploadingLogo(false);
    };
  };

  const handleSaveCompanyInfo = async () => {
    if (!companyName.trim()) {
      toast.error("Company name cannot be empty");
      return;
    }
    try {
      await saveSettings.mutateAsync(
        buildSavePayload({
          companyName: companyName.trim(),
          industry,
          fleetSize,
          contactPhone,
        }),
      );
      toast.success("Company information saved");
    } catch (err) {
      console.error(err);
      toast.error("Failed to save company information");
    }
  };

  const handleSaveCurrency = async (val: string) => {
    try {
      await saveCurrency.mutateAsync(val);
      toast.success(`Currency set to ${val}`);
    } catch (err) {
      console.error(err);
      toast.error("Failed to save currency");
    }
  };

  const handleGenerateInvite = async () => {
    if (!inviteEmail.trim()) {
      toast.error("Please enter an email address");
      return;
    }
    try {
      const token = await createInvite.mutateAsync({
        email: inviteEmail.trim(),
        role: inviteRole,
      });
      const link = `${window.location.origin}?inviteToken=${token}`;
      setGeneratedLink(link);
      toast.success("Invite link generated!");
    } catch (err: any) {
      toast.error(err?.message ?? "Failed to generate invite");
    }
  };

  const handleCopyLink = async () => {
    if (!generatedLink) return;
    try {
      await navigator.clipboard.writeText(generatedLink);
      setLinkCopied(true);
      setTimeout(() => setLinkCopied(false), 2000);
      toast.success("Link copied to clipboard");
    } catch (err) {
      console.error(err);
      toast.error("Failed to copy link");
    }
  };

  const handleRoleChange = (userPrincipal: any, newRole: FleetRole) => {
    setUserFleetRole.mutate(
      { user: userPrincipal, role: newRole },
      {
        onSuccess: () =>
          toast.success(
            `Role updated to ${fleetRoleLabel[newRole] ?? newRole}`,
          ),
        onError: () => toast.error("Failed to update role"),
      },
    );
  };

  const handleAddChecklistItem = async () => {
    if (!newChecklistItemLabel.trim()) return;
    setAddingChecklistItem(true);
    try {
      const checklist: InspectionChecklist = {
        id: 0n,
        vehicleId: 0n,
        inspectorName: "System",
        createdAt: nowNs(),
        notes: newChecklistItemLabel.trim(),
        overallStatus: "template",
        mileage: 0n,
        items: [
          {
            id: 0n,
            itemLabel: newChecklistItemLabel.trim(),
            category: "Custom",
            status: ChecklistItemStatus.NA,
            notes: "",
          },
        ],
      };
      await createChecklist.mutateAsync(checklist);
      setNewChecklistItemLabel("");
      toast.success("Custom item added");
    } catch {
      toast.error("Failed to add item");
    } finally {
      setAddingChecklistItem(false);
    }
  };

  const handleDeleteChecklistItem = async (id: bigint) => {
    try {
      await deleteChecklist.mutateAsync(id);
      toast.success("Item removed");
    } catch {
      toast.error("Failed to remove item");
    }
  };

  return (
    <div className="p-6 space-y-6 animate-fade-in" data-ocid="settings.page">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Settings size={22} /> Settings
        </h1>
        <p className="text-muted-foreground text-sm mt-0.5">
          Manage your company branding, account, and team settings.
        </p>
      </div>

      {/* Company Information — admin only */}
      {isAdmin && (
        <Card className="shadow-card border-0">
          <CardHeader>
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Building2 size={16} /> Company Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            {/* Logo Upload */}
            <div className="space-y-3">
              <Label>Company Logo</Label>
              <div className="flex items-center gap-4">
                {currentLogo ? (
                  <img
                    src={currentLogo}
                    alt="Company Logo"
                    className="w-16 h-16 rounded-xl object-cover border border-border"
                  />
                ) : (
                  <div className="w-16 h-16 rounded-xl bg-muted flex items-center justify-center border border-border">
                    <Shield className="w-7 h-7 text-muted-foreground/40" />
                  </div>
                )}
                <div className="space-y-1.5">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleLogoChange}
                    data-ocid="settings.upload_button"
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-2"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploadingLogo}
                    data-ocid="settings.primary_button"
                  >
                    {isUploadingLogo ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Upload size={14} />
                    )}
                    {isUploadingLogo ? "Uploading..." : "Upload Logo"}
                  </Button>
                  <p className="text-xs text-muted-foreground">
                    PNG, JPG, or SVG · max 2MB
                  </p>
                </div>
              </div>
            </div>

            <Separator />

            {/* Company Name */}
            <div className="space-y-1.5">
              <Label htmlFor="company-name">Company Name *</Label>
              <Input
                id="company-name"
                data-ocid="settings.input"
                placeholder="Your company name"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                className="h-11"
              />
            </div>

            {/* Industry */}
            <div className="space-y-1.5">
              <Label htmlFor="industry">Industry</Label>
              <Select value={industry} onValueChange={setIndustry}>
                <SelectTrigger
                  id="industry"
                  className="h-11"
                  data-ocid="settings.select"
                >
                  <SelectValue placeholder="Select industry" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Transportation">Transportation</SelectItem>
                  <SelectItem value="Logistics">Logistics</SelectItem>
                  <SelectItem value="Construction">Construction</SelectItem>
                  <SelectItem value="Mining">Mining</SelectItem>
                  <SelectItem value="Municipal">Municipal</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Fleet Size */}
            <div className="space-y-1.5">
              <Label htmlFor="fleet-size">Fleet Size</Label>
              <Select value={fleetSize} onValueChange={setFleetSize}>
                <SelectTrigger
                  id="fleet-size"
                  className="h-11"
                  data-ocid="settings.select"
                >
                  <SelectValue placeholder="Select fleet size" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1-10">1–10 vehicles</SelectItem>
                  <SelectItem value="11-25">11–25 vehicles</SelectItem>
                  <SelectItem value="26-50">26–50 vehicles</SelectItem>
                  <SelectItem value="51-100">51–100 vehicles</SelectItem>
                  <SelectItem value="101-250">101–250 vehicles</SelectItem>
                  <SelectItem value="250+">250+ vehicles</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Contact Phone */}
            <div className="space-y-1.5">
              <Label htmlFor="contact-phone">Contact Phone</Label>
              <Input
                id="contact-phone"
                data-ocid="settings.input"
                type="tel"
                placeholder="+1 (555) 000-0000"
                value={contactPhone}
                onChange={(e) => setContactPhone(e.target.value)}
                className="h-11"
              />
            </div>

            <Button
              className="w-full h-11 gap-2"
              onClick={handleSaveCompanyInfo}
              disabled={saveSettings.isPending || !companyName.trim()}
              data-ocid="settings.save_button"
            >
              {saveSettings.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> Saving...
                </>
              ) : (
                "Save Company Info"
              )}
            </Button>

            <Separator />

            {/* Currency */}
            <div className="space-y-3">
              <Label>Default Currency</Label>
              <p className="text-xs text-muted-foreground">
                Used for displaying parts inventory value and repair costs.
              </p>
              <Select
                value={currentCurrency}
                onValueChange={handleSaveCurrency}
              >
                <SelectTrigger
                  className="h-10 w-36"
                  data-ocid="settings.select"
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="CAD">🇨🇦 CAD</SelectItem>
                  <SelectItem value="USD">🇺🇸 USD</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Separator />

            {/* Tax Settings */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-sm font-medium">Tax Settings</Label>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Apply tax to maintenance costs and transactions.
                  </p>
                </div>
                <Switch
                  checked={taxEnabled}
                  onCheckedChange={setTaxEnabled}
                  data-ocid="settings.tax.switch"
                />
              </div>
              {taxEnabled && (
                <div className="grid grid-cols-2 gap-3 pt-1">
                  <div className="space-y-1.5">
                    <Label htmlFor="tax-label" className="text-xs">
                      Tax Label
                    </Label>
                    <Input
                      id="tax-label"
                      value={taxLabel}
                      onChange={(e) => setTaxLabel(e.target.value)}
                      placeholder="GST, HST, VAT..."
                      className="h-9"
                      data-ocid="settings.tax.input"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="tax-rate" className="text-xs">
                      Rate (%)
                    </Label>
                    <Input
                      id="tax-rate"
                      type="number"
                      min={0}
                      max={100}
                      step={0.01}
                      value={taxRate}
                      onChange={(e) => setTaxRate(e.target.value)}
                      placeholder="13"
                      className="h-9"
                      data-ocid="settings.taxrate.input"
                    />
                  </div>
                </div>
              )}
              <Button
                size="sm"
                onClick={() => {
                  saveTaxSettings({
                    taxLabel: taxLabel || "Tax",
                    taxRate: Number.parseFloat(taxRate) || 0,
                    enabled: taxEnabled,
                  });
                  toast.success("Tax settings saved");
                }}
                data-ocid="settings.tax.save_button"
              >
                Save Tax Settings
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Subscription — admin only */}
      {isAdmin && (
        <Card className="shadow-card border-0">
          <CardHeader>
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <CreditCard size={16} /> Subscription
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {(() => {
              const tier = subscription?.tier ?? SubscriptionTier.starter;
              const vehicleLimit = subscription?.vehicleLimit
                ? Number(subscription.vehicleLimit)
                : tier === SubscriptionTier.enterprise
                  ? Number.POSITIVE_INFINITY
                  : tier === SubscriptionTier.growth
                    ? 25
                    : 10;
              const tierLabels: Record<
                string,
                { name: string; price: string }
              > = {
                [SubscriptionTier.starter]: { name: "Starter", price: "$99" },
                [SubscriptionTier.growth]: { name: "Growth", price: "$225" },
                [SubscriptionTier.enterprise]: {
                  name: "Enterprise",
                  price: "$499",
                },
              };
              const tierInfo = tierLabels[tier] ?? {
                name: "Starter",
                price: "$99",
              };
              const isUnlimited =
                vehicleLimit === Number.POSITIVE_INFINITY ||
                vehicleLimit >= 9999;
              const usagePct = isUnlimited
                ? 0
                : Math.min(
                    100,
                    Math.round((vehicleCount / vehicleLimit) * 100),
                  );
              const atLimit = !isUnlimited && vehicleCount >= vehicleLimit;

              return (
                <>
                  <div className="flex items-start justify-between gap-4 p-4 rounded-xl bg-muted/30 border border-border">
                    <div className="space-y-1">
                      <p className="font-semibold text-sm">
                        FleetGuard {tierInfo.name} Plan
                      </p>
                      <p className="text-2xl font-bold">
                        {tierInfo.price}
                        <span className="text-sm font-normal text-muted-foreground">
                          /month + tax
                        </span>
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {isUnlimited
                          ? "Unlimited vehicles"
                          : `Up to ${vehicleLimit} vehicles`}{" "}
                        · Full maintenance tracking · Work orders · Parts
                        inventory · Team management
                      </p>
                    </div>
                    <Badge
                      variant="outline"
                      className={`shrink-0 text-xs font-semibold px-3 py-1 capitalize ${getSubBadge(subscriptionStatus)}`}
                      data-ocid="settings.panel"
                    >
                      {getSubLabel(subscriptionStatus)}
                    </Badge>
                  </div>

                  {/* Vehicle usage progress */}
                  <div className="space-y-2 p-4 rounded-xl bg-muted/20 border border-border">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium">Vehicle Usage</span>
                      <span
                        className={`font-semibold ${atLimit ? "text-destructive" : "text-foreground"}`}
                      >
                        {vehicleCount} / {isUnlimited ? "∞" : vehicleLimit}
                      </span>
                    </div>
                    {!isUnlimited && (
                      <div className="w-full h-2 rounded-full bg-muted overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-300 ${
                            usagePct >= 100
                              ? "bg-destructive"
                              : usagePct >= 80
                                ? "bg-amber-500"
                                : "bg-primary"
                          }`}
                          style={{ width: `${usagePct}%` }}
                        />
                      </div>
                    )}
                    {atLimit && (
                      <p className="text-xs text-destructive font-medium">
                        Vehicle limit reached. Contact your administrator to
                        upgrade your plan.
                      </p>
                    )}
                  </div>

                  {subscriptionStatus === "active" && subscriptionStartDate && (
                    <p className="text-xs text-muted-foreground">
                      Active since{" "}
                      <strong>
                        {formatSubDate(subscriptionStartDate as bigint)}
                      </strong>
                    </p>
                  )}

                  {/* Tier pricing table */}
                  <div className="rounded-xl border border-border overflow-hidden">
                    <div className="px-4 py-2.5 bg-muted/30 border-b border-border">
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                        Available Plans
                      </p>
                    </div>
                    <div className="divide-y divide-border/50">
                      {[
                        {
                          key: SubscriptionTier.starter,
                          name: "Starter",
                          price: "$99",
                          limit: "Up to 10 vehicles",
                        },
                        {
                          key: SubscriptionTier.growth,
                          name: "Growth",
                          price: "$225",
                          limit: "Up to 25 vehicles",
                        },
                        {
                          key: SubscriptionTier.enterprise,
                          name: "Enterprise",
                          price: "$499",
                          limit: "Unlimited vehicles",
                        },
                      ].map((plan) => (
                        <div
                          key={plan.key}
                          className={`flex items-center justify-between px-4 py-3 ${tier === plan.key ? "bg-primary/5" : ""}`}
                        >
                          <div>
                            <span className="text-sm font-medium">
                              {plan.name}
                            </span>
                            <span className="ml-2 text-xs text-muted-foreground">
                              {plan.limit}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-semibold">
                              {plan.price}
                              <span className="text-xs font-normal text-muted-foreground">
                                /mo
                              </span>
                            </span>
                            {tier === plan.key && (
                              <Badge className="bg-primary/10 text-primary border-primary/20 text-xs">
                                Current
                              </Badge>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 p-3 rounded-lg bg-primary/5 border border-primary/20">
                    <ArrowUpRight className="w-4 h-4 text-primary shrink-0" />
                    <p className="text-xs text-muted-foreground">
                      To upgrade your plan or manage billing, contact{" "}
                      <a
                        href="mailto:support@fleetguard.app"
                        className="text-primary underline hover:no-underline"
                      >
                        support@fleetguard.app
                      </a>
                      . Our team will assist you.
                    </p>
                  </div>
                </>
              );
            })()}
          </CardContent>
        </Card>
      )}

      {/* Promotions */}
      <Card className="shadow-card border-0">
        <CardHeader>
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <Tag size={16} /> Promotions &amp; Discounts
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Have a promotional code? Enter it below to apply a discount to your
            subscription.
          </p>
          {appliedPromo && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
              <Check className="w-4 h-4 text-emerald-500 shrink-0" />
              <p className="text-sm text-emerald-600 dark:text-emerald-400 font-medium">
                Code <strong>{appliedPromo.code}</strong> applied —{" "}
                {appliedPromo.discountType === "percent"
                  ? `${appliedPromo.value}% off`
                  : `${appliedPromo.value} month${appliedPromo.value !== 1n ? "s" : ""} free`}
              </p>
            </div>
          )}
          <div className="flex gap-2">
            <Input
              value={promoCode}
              onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
              placeholder="Enter promo code (e.g. FLEET20)"
              className="font-mono uppercase"
              onKeyDown={(e) => e.key === "Enter" && handleApplyPromoCode()}
              data-ocid="settings.promo.input"
            />
            <Button
              onClick={handleApplyPromoCode}
              disabled={promoApplying || !promoCode.trim()}
              className="shrink-0 gap-2"
              data-ocid="settings.promo.apply_button"
            >
              {promoApplying ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Tag className="w-4 h-4" />
              )}
              Apply
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Your Account */}
      <Card className="shadow-card border-0">
        <CardHeader>
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <User size={16} /> Your Account
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-3 p-4 rounded-xl bg-muted/40">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              <User className="w-5 h-5 text-primary" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold">Your Role</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Determines your access level within FleetGuard.
              </p>
            </div>
            <span
              className={`px-3 py-1.5 rounded-full text-xs font-semibold ${roleBadge}`}
              data-ocid="settings.panel"
            >
              {displayRole}
            </span>
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-medium">Your Principal ID</Label>
            <div className="flex items-center gap-2">
              <div className="flex-1 bg-muted/40 rounded-lg px-3 py-2 text-xs font-mono text-muted-foreground truncate border border-border">
                {principalId || "Loading..."}
              </div>
              <Button
                variant="outline"
                size="sm"
                className="shrink-0 gap-1.5"
                onClick={handleCopyPrincipal}
                disabled={!principalId}
                data-ocid="settings.secondary_button"
              >
                {copied ? (
                  <Check className="w-3.5 h-3.5 text-success" />
                ) : (
                  <Copy className="w-3.5 h-3.5" />
                )}
                {copied ? "Copied" : "Copy"}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Manage Team — admin only */}
      {isAdmin && (
        <Card className="shadow-card border-0">
          <CardHeader>
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Users size={16} /> Manage Team
            </CardTitle>
            <p className="text-xs text-muted-foreground mt-0.5">
              View and manage your team members and their access roles.
            </p>
          </CardHeader>
          <CardContent>
            {usersLoading ? (
              <div
                className="space-y-3"
                data-ocid="settings.team.loading_state"
              >
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex items-center gap-3">
                    <Skeleton className="h-8 w-8 rounded-full" />
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-6 w-20 ml-auto" />
                  </div>
                ))}
              </div>
            ) : !companyUsers || companyUsers.length === 0 ? (
              <div
                className="text-center py-8 text-muted-foreground text-sm"
                data-ocid="settings.team.empty_state"
              >
                <Users className="w-8 h-8 mx-auto mb-2 opacity-30" />
                No team members yet. Invite users using the form below.
              </div>
            ) : (
              <div className="rounded-xl border border-border overflow-hidden">
                <Table data-ocid="settings.team.table">
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-xs">Name</TableHead>
                      <TableHead className="text-xs">Role</TableHead>
                      <TableHead className="text-xs hidden sm:table-cell">
                        Principal ID
                      </TableHead>
                      <TableHead className="text-xs text-right">
                        Actions
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {companyUsers.map((user, idx) => {
                      const principalStr = user.principal.toString();
                      const truncatedPrincipal = `${principalStr.slice(0, 8)}...${principalStr.slice(-4)}`;
                      const currentRole = user.role;
                      return (
                        <TableRow
                          key={principalStr}
                          data-ocid={`settings.team.item.${idx + 1}`}
                        >
                          <TableCell className="text-sm font-medium">
                            {user.profile?.name ?? "Unnamed User"}
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant="outline"
                              className={`text-xs ${
                                currentRole === FleetRole.Admin
                                  ? "border-primary/40 text-primary bg-primary/5"
                                  : currentRole === FleetRole.FleetManager
                                    ? "border-success/40 text-success bg-success/5"
                                    : "border-amber-500/40 text-amber-600 bg-amber-500/5"
                              }`}
                            >
                              {fleetRoleLabel[currentRole] ?? currentRole}
                            </Badge>
                          </TableCell>
                          <TableCell className="hidden sm:table-cell">
                            <span className="text-xs font-mono text-muted-foreground">
                              {truncatedPrincipal}
                            </span>
                          </TableCell>
                          <TableCell className="text-right">
                            <Select
                              value={currentRole}
                              onValueChange={(v) =>
                                handleRoleChange(user.principal, v as FleetRole)
                              }
                              disabled={setUserFleetRole.isPending}
                            >
                              <SelectTrigger
                                className="h-8 w-36 text-xs"
                                data-ocid={`settings.team.select.${idx + 1}`}
                              >
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value={FleetRole.Admin}>
                                  Administrator
                                </SelectItem>
                                <SelectItem value={FleetRole.FleetManager}>
                                  Fleet Manager
                                </SelectItem>
                                <SelectItem value={FleetRole.Mechanic}>
                                  Mechanic
                                </SelectItem>
                              </SelectContent>
                            </Select>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Invite Team Members — admin only */}
      {isAdmin && (
        <Card className="shadow-card border-0">
          <CardHeader>
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <UserPlus size={16} /> Invite Team Members
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <p className="text-sm text-muted-foreground">
              Generate a unique invite link for each team member. They click the
              link to set up their account with the assigned role.
            </p>

            <div className="space-y-3">
              <div className="space-y-1.5">
                <Label htmlFor="invite-email">Email Address</Label>
                <Input
                  id="invite-email"
                  data-ocid="settings.input"
                  type="email"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder="team@yourcompany.com"
                  className="h-11"
                />
              </div>

              <div className="space-y-1.5">
                <Label>Role</Label>
                <Select
                  value={inviteRole}
                  onValueChange={(v) => setInviteRole(v as FleetRole)}
                >
                  <SelectTrigger className="h-11" data-ocid="settings.select">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={FleetRole.Admin}>Admin</SelectItem>
                    <SelectItem value={FleetRole.FleetManager}>
                      Fleet Manager
                    </SelectItem>
                    <SelectItem value={FleetRole.Mechanic}>Mechanic</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Button
                className="w-full h-11 gap-2"
                onClick={handleGenerateInvite}
                disabled={createInvite.isPending || !inviteEmail.trim()}
                data-ocid="settings.submit_button"
              >
                {createInvite.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" /> Generating...
                  </>
                ) : (
                  <>
                    <Link className="w-4 h-4" /> Generate Invite Link
                  </>
                )}
              </Button>
            </div>

            {generatedLink && (
              <div className="space-y-2 p-4 bg-success/5 border border-success/20 rounded-xl">
                <p className="text-xs font-semibold text-success">
                  ✓ Invite link ready — share this with your team member:
                </p>
                <div className="flex items-center gap-2">
                  <div className="flex-1 bg-background border border-border rounded-lg px-3 py-2 text-xs font-mono text-muted-foreground truncate">
                    {generatedLink}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="shrink-0 gap-1.5"
                    onClick={handleCopyLink}
                    data-ocid="settings.secondary_button"
                  >
                    {linkCopied ? (
                      <Check className="w-3.5 h-3.5 text-success" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                    {linkCopied ? "Copied" : "Copy"}
                  </Button>
                </div>
              </div>
            )}

            {/* Existing invites */}
            <div className="space-y-2">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Sent Invites
              </p>
              {!inviteTokens || inviteTokens.length === 0 ? (
                <div
                  className="text-center py-6 text-muted-foreground text-sm"
                  data-ocid="settings.empty_state"
                >
                  No invites yet. Generate your first invite link above.
                </div>
              ) : (
                <div className="rounded-xl border border-border overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-xs">Email</TableHead>
                        <TableHead className="text-xs">Role</TableHead>
                        <TableHead className="text-xs">Status</TableHead>
                        <TableHead className="text-xs">Created</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody data-ocid="settings.table">
                      {inviteTokens.map((invite, idx) => (
                        <TableRow
                          key={invite.token}
                          data-ocid={`settings.item.${idx + 1}`}
                        >
                          <TableCell className="text-sm">
                            {invite.email}
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant="outline"
                              className={`text-xs ${
                                invite.role === FleetRole.Admin
                                  ? "border-primary/40 text-primary bg-primary/5"
                                  : invite.role === FleetRole.FleetManager
                                    ? "border-success/40 text-success bg-success/5"
                                    : "border-amber-500/40 text-amber-600 bg-amber-500/5"
                              }`}
                            >
                              {fleetRoleLabel[invite.role] ?? invite.role}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {invite.usedBy ? (
                              <Badge className="bg-success/10 text-success hover:bg-success/10 text-xs">
                                Used
                              </Badge>
                            ) : (
                              <Badge
                                variant="outline"
                                className="text-xs text-muted-foreground"
                              >
                                Pending
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground">
                            {invite.createdAt
                              ? formatTokenDate(invite.createdAt)
                              : "—"}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Inspection Checklist — admin only */}
      {isAdmin && (
        <Card className="shadow-card border-0">
          <CardHeader>
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <ClipboardCheck size={16} /> Inspection Checklist
            </CardTitle>
            <p className="text-xs text-muted-foreground mt-0.5">
              Manage custom inspection items for your company. Default items
              (Tires, Brakes, etc.) are always included and cannot be removed.
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Default items note */}
            <div className="p-3 rounded-lg bg-muted/30 border border-border text-xs text-muted-foreground">
              <strong>Default items always included:</strong> Tires &amp;
              Wheels, Brakes, Headlights &amp; Taillights, Turn Signals,
              Windshield &amp; Wipers, Engine Oil, Coolant Level, Brake Fluid,
              Battery, Belts &amp; Hoses, Suspension, Exhaust System, Horn,
              Mirrors, Seatbelts.
            </div>

            {/* Custom items list */}
            {checklistsLoading ? (
              <div
                className="space-y-2"
                data-ocid="settings.checklist.loading_state"
              >
                {[1, 2].map((i) => (
                  <Skeleton key={i} className="h-10 w-full" />
                ))}
              </div>
            ) : !inspectionChecklists || inspectionChecklists.length === 0 ? (
              <div
                className="text-center py-6 text-muted-foreground text-sm"
                data-ocid="settings.checklist.empty_state"
              >
                <ClipboardCheck className="w-8 h-8 mx-auto mb-2 opacity-30" />
                No custom items yet. Add items below.
              </div>
            ) : (
              <div className="space-y-2" data-ocid="settings.checklist.list">
                {inspectionChecklists.map((item, idx) => (
                  <div
                    key={item.id.toString()}
                    className="flex items-center justify-between px-3 py-2.5 rounded-lg border border-border bg-muted/20"
                    data-ocid={`settings.checklist.item.${idx + 1}`}
                  >
                    <span className="text-sm font-medium">
                      {item.items[0]?.itemLabel ?? item.notes}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleDeleteChecklistItem(item.id)}
                      className="text-muted-foreground hover:text-destructive transition-colors"
                      aria-label="Remove item"
                      data-ocid={`settings.checklist.delete.${idx + 1}`}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Add new item */}
            <div className="flex gap-2">
              <Input
                placeholder="New checklist item (e.g. Fluid Leaks)"
                value={newChecklistItemLabel}
                onChange={(e) => setNewChecklistItemLabel(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleAddChecklistItem()}
                className="h-10"
                data-ocid="settings.checklist.input"
              />
              <Button
                size="sm"
                onClick={handleAddChecklistItem}
                disabled={addingChecklistItem || !newChecklistItemLabel.trim()}
                className="h-10 gap-1.5 shrink-0"
                data-ocid="settings.checklist.add_button"
              >
                {addingChecklistItem ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : (
                  <Plus size={14} />
                )}
                Add Item
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Role Permissions */}
      <Card className="shadow-card border-0">
        <CardHeader>
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <Shield size={16} /> Role Permissions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="p-4 rounded-xl border border-border bg-muted/20 space-y-2">
            <div className="text-xs text-muted-foreground space-y-1">
              <p>
                <strong>Administrator</strong> — Full access: manage vehicles,
                parts, maintenance, users, and settings.
              </p>
              <p>
                <strong>Fleet Manager</strong> — Full access to fleet
                operations: manage vehicles, parts, maintenance, work orders,
                vendors, and service schedules. Cannot create/remove users or
                delete any data.
              </p>
              <p>
                <strong>Mechanic</strong> — Log maintenance, manage parts
                inventory, upload photos.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Privacy & Terms links */}
      <div className="flex items-center justify-center gap-4 text-xs text-muted-foreground">
        <button
          type="button"
          onClick={() => onNavigate?.("privacy-policy")}
          className="underline hover:text-foreground transition-colors"
          data-ocid="settings.link"
        >
          Privacy Policy
        </button>
        <span>·</span>
        <button
          type="button"
          onClick={() => onNavigate?.("terms")}
          className="underline hover:text-foreground transition-colors"
          data-ocid="settings.link"
        >
          Terms of Service
        </button>
      </div>
      {/* Footer */}
      <p className="text-center text-xs text-muted-foreground pb-4">
        © {new Date().getFullYear()} FleetGuard. All rights reserved.
      </p>
    </div>
  );
}
