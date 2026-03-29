import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Mail, Shield } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import { useRedeemInviteToken, useSaveProfile } from "../hooks/useQueries";

interface InviteAcceptPageProps {
  token: string;
}

export function InviteAcceptPage({ token }: InviteAcceptPageProps) {
  const [name, setName] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const { identity } = useInternetIdentity();
  const redeemToken = useRedeemInviteToken();
  const saveProfile = useSaveProfile();

  const handleAccept = async () => {
    if (!name.trim()) {
      toast.error("Please enter your full name");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await redeemToken.mutateAsync(token);
      await saveProfile.mutateAsync({ name: name.trim() });
      setDone(true);
      // Short delay then reload to pick up profile
      setTimeout(() => window.location.replace(window.location.origin), 1200);
    } catch (err: any) {
      const msg = err?.message ?? "Invalid or expired invite link.";
      setError(msg);
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  const principalId = identity?.getPrincipal().toString() ?? "";

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/30 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="flex items-center justify-center gap-2 mb-8">
          <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center shadow-lg">
            <Shield className="w-5 h-5 text-primary-foreground" />
          </div>
          <span className="text-xl font-bold tracking-tight">FleetGuard</span>
        </div>

        <div className="bg-card rounded-2xl shadow-xl border border-border/50 overflow-hidden">
          {done ? (
            <div className="p-8 text-center" data-ocid="invite.success_state">
              <div className="w-16 h-16 rounded-full bg-success/10 flex items-center justify-center mx-auto mb-4">
                <Mail className="w-8 h-8 text-success" />
              </div>
              <h2 className="text-xl font-bold mb-2">Account Ready!</h2>
              <p className="text-muted-foreground text-sm">
                Redirecting you to the dashboard...
              </p>
              <Loader2 className="w-5 h-5 animate-spin mx-auto mt-4 text-primary" />
            </div>
          ) : error ? (
            <div className="p-8 text-center" data-ocid="invite.error_state">
              <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center mx-auto mb-4">
                <Mail className="w-8 h-8 text-destructive" />
              </div>
              <h2 className="text-xl font-bold mb-2">Invalid Invite</h2>
              <p className="text-muted-foreground text-sm mb-4">
                This invite link is invalid or has already been used. Please
                contact your administrator for a new link.
              </p>
              <p className="text-xs text-muted-foreground font-mono bg-muted/40 rounded-lg px-3 py-2">
                {principalId}
              </p>
            </div>
          ) : (
            <div className="p-8" data-ocid="invite.panel">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <Mail className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h2 className="text-xl font-bold">You've been invited!</h2>
                  <p className="text-muted-foreground text-sm">
                    Complete your account setup to join the fleet.
                  </p>
                </div>
              </div>

              <div className="space-y-5">
                <div className="space-y-1.5">
                  <Label htmlFor="invite-name">
                    Your Full Name <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="invite-name"
                    data-ocid="invite.input"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Sarah Johnson"
                    className="h-11"
                    autoFocus
                    onKeyDown={(e) => e.key === "Enter" && handleAccept()}
                  />
                </div>

                <Button
                  data-ocid="invite.submit_button"
                  className="w-full h-12 font-semibold"
                  onClick={handleAccept}
                  disabled={saving || !name.trim()}
                >
                  {saving ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" /> Setting up
                      account...
                    </>
                  ) : (
                    "Accept Invitation & Continue"
                  )}
                </Button>
              </div>
            </div>
          )}
        </div>

        <p className="text-center text-xs text-muted-foreground mt-6">
          © {new Date().getFullYear()} FleetGuard. All rights reserved.
        </p>
      </div>
    </div>
  );
}
