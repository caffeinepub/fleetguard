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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Check,
  Copy,
  CreditCard,
  Link,
  Loader2,
  Settings,
  Shield,
  Upload,
  User,
  UserPlus,
} from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { FleetRole } from "../backend";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import {
  useCallerFleetRole,
  useCreateInviteToken,
  useGetCompanySettings,
  useGetDefaultCurrency,
  useGetSubscriptionStatus,
  useInviteTokens,
  useIsAdmin,
  useSaveCompanySettings,
  useSaveDefaultCurrency,
} from "../hooks/useQueries";

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

export function SettingsPage() {
  const { data: companySettings } = useGetCompanySettings();
  const { data: isAdmin } = useIsAdmin();
  const { data: fleetRole } = useCallerFleetRole();
  const { data: inviteTokens } = useInviteTokens();
  const { data: subscription } = useGetSubscriptionStatus(
    companySettings?.companyName,
  );
  const { data: savedCurrency } = useGetDefaultCurrency();
  const { identity } = useInternetIdentity();
  const saveSettings = useSaveCompanySettings();
  const saveCurrency = useSaveDefaultCurrency();
  const createInvite = useCreateInviteToken();

  const [companyName, setCompanyName] = useState("");
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

  const currentName = companyName || companySettings?.companyName || "";
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

  const buildSavePayload = (overrides: Record<string, unknown> = {}) => ({
    companyName: currentName,
    industry: companySettings?.industry ?? "",
    fleetSize: companySettings?.fleetSize ?? "",
    contactPhone: companySettings?.contactPhone ?? "",
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
    } catch {
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
      } catch {
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

  const handleSaveName = async () => {
    if (!companyName.trim()) {
      toast.error("Company name cannot be empty");
      return;
    }
    try {
      await saveSettings.mutateAsync(
        buildSavePayload({ companyName: companyName.trim() }),
      );
      toast.success("Company name saved");
    } catch {
      toast.error("Failed to save company name");
    }
  };

  const handleSaveCurrency = async (val: string) => {
    try {
      await saveCurrency.mutateAsync(val);
      toast.success(`Currency set to ${val}`);
    } catch {
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
    } catch {
      toast.error("Failed to copy link");
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

      {/* Company Branding — admin only */}
      {isAdmin && (
        <Card className="shadow-card border-0">
          <CardHeader>
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Upload size={16} /> Company Branding
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
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

            <div className="space-y-3">
              <Label htmlFor="company-name">Company Name</Label>
              <div className="flex items-center gap-3 max-w-sm">
                <Input
                  id="company-name"
                  data-ocid="settings.input"
                  placeholder={companySettings?.companyName || "FleetGuard"}
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                />
                <Button
                  onClick={handleSaveName}
                  disabled={saveSettings.isPending || !companyName.trim()}
                  data-ocid="settings.save_button"
                  size="sm"
                >
                  {saveSettings.isPending ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    "Save"
                  )}
                </Button>
              </div>
            </div>

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
            <div className="flex items-start justify-between gap-4 p-4 rounded-xl bg-muted/30 border border-border">
              <div className="space-y-1">
                <p className="font-semibold text-sm">FleetGuard Pro</p>
                <p className="text-2xl font-bold">
                  $499
                  <span className="text-sm font-normal text-muted-foreground">
                    /month
                  </span>
                </p>
                <p className="text-xs text-muted-foreground">
                  Unlimited vehicles · Full maintenance tracking · Work orders ·
                  Parts inventory · Team management
                </p>
              </div>
              <Badge
                variant="outline"
                className={`shrink-0 text-xs font-semibold px-3 py-1 capitalize ${getSubBadge(
                  subscriptionStatus,
                )}`}
                data-ocid="settings.panel"
              >
                {getSubLabel(subscriptionStatus)}
              </Badge>
            </div>

            {subscriptionStatus === "active" &&
              subscriptionStartDate &&
              subscriptionStartDate.length > 0 && (
                <p className="text-xs text-muted-foreground">
                  Active since{" "}
                  <strong>
                    {formatSubDate(subscriptionStartDate[0] as bigint)}
                  </strong>
                </p>
              )}

            <div className="flex items-center gap-2 p-3 rounded-lg bg-primary/5 border border-primary/20">
              <CreditCard className="w-4 h-4 text-primary shrink-0" />
              <p className="text-xs text-muted-foreground">
                To activate or manage your subscription, please contact{" "}
                <a
                  href="mailto:support@fleetguard.app"
                  className="text-primary underline hover:no-underline"
                >
                  support@fleetguard.app
                </a>
                . Our team will assist you with billing.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

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
                                invite.role === FleetRole.FleetManager
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
                <strong>Fleet Manager</strong> — Log and manage maintenance
                records, view all fleet data.
              </p>
              <p>
                <strong>Mechanic</strong> — Log maintenance, manage parts
                inventory, upload photos.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Footer */}
      <div className="text-center text-xs text-muted-foreground pb-4">
        © {new Date().getFullYear()}. Built with ❤️ using{" "}
        <a
          href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname)}`}
          target="_blank"
          rel="noopener noreferrer"
          className="underline hover:text-foreground transition-colors"
        >
          caffeine.ai
        </a>
      </div>
    </div>
  );
}
