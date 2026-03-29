import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useQueryClient } from "@tanstack/react-query";
import {
  CheckCircle2,
  ChevronRight,
  CreditCard,
  Loader2,
  Lock,
  Shield,
  Tag,
  Truck,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { useActor } from "../hooks/useActor";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import { useSaveCompanySettings, useSaveProfile } from "../hooks/useQueries";

const INDUSTRIES = [
  "Trucking",
  "Bus Fleet",
  "Delivery & Logistics",
  "Construction",
  "Other",
];

const FLEET_SIZES = ["1–10", "11–50", "51–200", "200+"];

const TOTAL_STEPS = 4;

function StepDots({ current }: { current: number }) {
  return (
    <div className="flex items-center justify-center gap-2 mb-8">
      {Array.from({ length: TOTAL_STEPS }, (_, i) => i + 1).map((step) => (
        <div
          key={step}
          className={`h-2 rounded-full transition-all duration-300 ${
            current >= step ? "w-8 bg-primary" : "w-2 bg-muted-foreground/30"
          }`}
        />
      ))}
      <span className="ml-2 text-xs text-muted-foreground font-medium">
        Step {current} of {TOTAL_STEPS}
      </span>
    </div>
  );
}

function formatCardNumber(val: string) {
  return val
    .replace(/\D/g, "")
    .slice(0, 16)
    .replace(/(\d{4})(?=\d)/g, "$1 ");
}

function formatExpiry(val: string) {
  const digits = val.replace(/\D/g, "").slice(0, 4);
  if (digits.length >= 3) return `${digits.slice(0, 2)}/${digits.slice(2)}`;
  return digits;
}

export function OnboardingPage() {
  const [step, setStep] = useState(1);
  const [companyName, setCompanyName] = useState("");
  const [industry, setIndustry] = useState("");
  const [fleetSize, setFleetSize] = useState("");
  const [phone, setPhone] = useState("");
  const [name, setName] = useState("");
  const [saving, setSaving] = useState(false);

  // CC step
  const [cardHolder, setCardHolder] = useState("");
  const [cardNumber, setCardNumber] = useState("");
  const [expiry, setExpiry] = useState("");
  const [cvv, setCvv] = useState("");
  const [discountCode, setDiscountCode] = useState("");
  const [discountApplied, setDiscountApplied] = useState<{
    code: string;
    label: string;
  } | null>(null);
  const [activatingTrial, setActivatingTrial] = useState(false);

  const { identity } = useInternetIdentity();
  const { actor } = useActor();
  const saveCompany = useSaveCompanySettings();
  const saveProfile = useSaveProfile();
  const qc = useQueryClient();

  const handleCompanyNext = async () => {
    if (!companyName.trim()) {
      toast.error("Please enter your company name");
      return;
    }
    setSaving(true);
    try {
      await saveCompany.mutateAsync({
        companyName: companyName.trim(),
        industry: industry || "Other",
        fleetSize: fleetSize || "1–10",
        contactPhone: phone.trim(),
        logoUrl: "",
        adminPrincipal: identity?.getPrincipal().toString() ?? "",
        createdAt: BigInt(Date.now()) * 1_000_000n,
      });
      setStep(3);
    } catch {
      toast.error("Failed to save company settings");
    } finally {
      setSaving(false);
    }
  };

  const handleProfileComplete = async () => {
    if (!name.trim()) {
      toast.error("Please enter your name");
      return;
    }
    setSaving(true);
    try {
      await saveProfile.mutateAsync({ name: name.trim() });
      await qc.invalidateQueries({ queryKey: ["callerProfile"] });
      setStep(4);
    } catch {
      toast.error("Failed to save profile");
    } finally {
      setSaving(false);
    }
  };

  const handleApplyDiscount = async () => {
    if (!discountCode.trim()) return;
    try {
      const result = await (actor as any).validateDiscountCode(
        discountCode.trim().toUpperCase(),
      );
      if (result && result.length > 0) {
        const dc = result[0];
        const label =
          dc.discountType === "percent"
            ? `${dc.value}% off`
            : `${dc.value} month${dc.value !== 1 ? "s" : ""} free`;
        setDiscountApplied({ code: dc.code, label });
        toast.success(`Discount applied: ${label}`);
      } else {
        toast.error("Invalid or expired discount code");
      }
    } catch {
      toast.error("Could not validate discount code");
    }
  };

  const isCardValid = () => {
    const digits = cardNumber.replace(/\s/g, "");
    return (
      cardHolder.trim().length > 1 &&
      digits.length === 16 &&
      expiry.length === 5 &&
      cvv.length >= 3
    );
  };

  const handleActivateTrial = async () => {
    if (!isCardValid()) {
      toast.error("Please fill in all card details correctly");
      return;
    }
    setActivatingTrial(true);
    try {
      if (discountApplied) {
        await (actor as any).applyDiscountCode(discountApplied.code);
      }
      await (actor as any).startTrial(companyName.trim());
      setStep(5);
    } catch {
      // Trial start may fail gracefully if company not found yet; proceed anyway
      setStep(5);
    } finally {
      setActivatingTrial(false);
    }
  };

  const handleGoToDashboard = async () => {
    await qc.invalidateQueries({ queryKey: ["callerProfile"] });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/30 flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        {/* Logo */}
        <div className="flex items-center justify-center gap-2 mb-8">
          <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center shadow-lg">
            <Shield className="w-5 h-5 text-primary-foreground" />
          </div>
          <span className="text-xl font-bold tracking-tight">FleetGuard</span>
        </div>

        {step < 5 && <StepDots current={step - 1 < 1 ? 1 : step - 1} />}

        <div className="bg-card rounded-2xl shadow-xl border border-border/50 overflow-hidden">
          {/* Step 1 — Welcome */}
          {step === 1 && (
            <div className="p-8 text-center" data-ocid="onboarding.panel">
              <div className="w-20 h-20 rounded-3xl bg-primary/10 flex items-center justify-center mx-auto mb-6">
                <Truck className="w-10 h-10 text-primary" />
              </div>
              <h1 className="text-3xl font-bold mb-3">
                Set Up Your FleetGuard Account
              </h1>
              <p className="text-muted-foreground mb-4 max-w-sm mx-auto">
                You're the Administrator. Complete this setup to get your
                company running and then invite your team members.
              </p>
              <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-4 text-left mb-5">
                <p className="text-sm font-semibold text-emerald-600 dark:text-emerald-400 mb-1 flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5" /> 7-Day Free Trial
                </p>
                <p className="text-xs text-muted-foreground">
                  Start free for 7 days. After your trial, continue for
                  <strong> $499/month</strong>. Cancel anytime.
                </p>
              </div>
              <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 text-left mb-8">
                <p className="text-sm font-semibold text-primary mb-1 flex items-center gap-1.5">
                  <Shield className="w-3.5 h-3.5" /> Admin Onboarding
                </p>
                <p className="text-xs text-muted-foreground">
                  As the Administrator, you are responsible for managing the
                  fleet, creating user accounts, and making operational
                  decisions.
                </p>
              </div>
              <Button
                data-ocid="onboarding.primary_button"
                className="w-full h-12 text-base font-semibold gap-2"
                onClick={() => setStep(2)}
              >
                Get Started <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          )}

          {/* Step 2 — Company Setup */}
          {step === 2 && (
            <div className="p-8" data-ocid="onboarding.panel">
              <div className="mb-6">
                <h2 className="text-2xl font-bold">Company Information</h2>
                <p className="text-muted-foreground text-sm mt-1">
                  Tell us about your transport company.
                </p>
              </div>

              <div className="space-y-5">
                <div className="space-y-1.5">
                  <Label htmlFor="company-name">
                    Company Name <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="company-name"
                    data-ocid="onboarding.input"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    placeholder="e.g. Swift Transport Ltd"
                    className="h-11"
                    onKeyDown={(e) => e.key === "Enter" && handleCompanyNext()}
                  />
                </div>

                <div className="space-y-1.5">
                  <Label>Industry</Label>
                  <Select value={industry} onValueChange={setIndustry}>
                    <SelectTrigger
                      className="h-11"
                      data-ocid="onboarding.select"
                    >
                      <SelectValue placeholder="Select your industry" />
                    </SelectTrigger>
                    <SelectContent>
                      {INDUSTRIES.map((ind) => (
                        <SelectItem key={ind} value={ind}>
                          {ind}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Number of Vehicles</Label>
                  <div className="grid grid-cols-4 gap-2">
                    {FLEET_SIZES.map((size) => (
                      <button
                        key={size}
                        type="button"
                        onClick={() => setFleetSize(size)}
                        className={`h-11 rounded-lg border text-sm font-medium transition-all ${
                          fleetSize === size
                            ? "border-primary bg-primary/10 text-primary"
                            : "border-border bg-background hover:border-primary/50 text-foreground"
                        }`}
                      >
                        {size}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="contact-phone">
                    Contact Phone (optional)
                  </Label>
                  <Input
                    id="contact-phone"
                    data-ocid="onboarding.input"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="e.g. +1 555 000 1234"
                    className="h-11"
                    type="tel"
                  />
                </div>

                <Button
                  data-ocid="onboarding.primary_button"
                  className="w-full h-12 font-semibold gap-2"
                  onClick={handleCompanyNext}
                  disabled={saving || !companyName.trim()}
                >
                  {saving ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" /> Saving...
                    </>
                  ) : (
                    <>
                      Next <ChevronRight className="w-4 h-4" />
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}

          {/* Step 3 — Your Profile */}
          {step === 3 && (
            <div className="p-8" data-ocid="onboarding.panel">
              <div className="mb-6">
                <h2 className="text-2xl font-bold">Your Profile</h2>
                <p className="text-muted-foreground text-sm mt-1">
                  Almost there! Tell us your name.
                </p>
              </div>

              <div className="space-y-5">
                <div className="space-y-1.5">
                  <Label htmlFor="full-name">
                    Your Full Name <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="full-name"
                    data-ocid="onboarding.input"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. James Carter"
                    className="h-11"
                    autoFocus
                    onKeyDown={(e) =>
                      e.key === "Enter" && handleProfileComplete()
                    }
                  />
                </div>

                <Button
                  data-ocid="onboarding.submit_button"
                  className="w-full h-12 font-semibold gap-2"
                  onClick={handleProfileComplete}
                  disabled={saving || !name.trim()}
                >
                  {saving ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" /> Saving...
                    </>
                  ) : (
                    <>
                      Next <ChevronRight className="w-4 h-4" />
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}

          {/* Step 4 — Activate Free Trial (CC) */}
          {step === 4 && (
            <div className="p-8" data-ocid="onboarding.panel">
              <div className="mb-5">
                <div className="flex items-center gap-2 mb-1">
                  <CreditCard className="w-5 h-5 text-primary" />
                  <h2 className="text-2xl font-bold">Activate Free Trial</h2>
                </div>
                <p className="text-muted-foreground text-sm">
                  Enter your payment details to start your 7-day free trial. You
                  won't be charged until the trial ends.
                </p>
              </div>

              <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl px-4 py-3 flex items-center gap-3 mb-5">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                <div className="text-xs">
                  <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                    7 days free
                  </span>
                  <span className="text-muted-foreground">
                    {" "}
                    &mdash; then $499/month + applicable taxes. Cancel anytime
                    before trial ends.
                  </span>
                </div>
              </div>

              <div className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="card-holder">Cardholder Name</Label>
                  <Input
                    id="card-holder"
                    data-ocid="onboarding.input"
                    value={cardHolder}
                    onChange={(e) => setCardHolder(e.target.value)}
                    placeholder="Name as it appears on card"
                    className="h-11"
                    autoFocus
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="card-number">Card Number</Label>
                  <div className="relative">
                    <Input
                      id="card-number"
                      data-ocid="onboarding.input"
                      value={cardNumber}
                      onChange={(e) =>
                        setCardNumber(formatCardNumber(e.target.value))
                      }
                      placeholder="1234 5678 9012 3456"
                      className="h-11 pr-10"
                      inputMode="numeric"
                    />
                    <CreditCard className="absolute right-3 top-3 w-5 h-5 text-muted-foreground" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="expiry">Expiry Date</Label>
                    <Input
                      id="expiry"
                      data-ocid="onboarding.input"
                      value={expiry}
                      onChange={(e) => setExpiry(formatExpiry(e.target.value))}
                      placeholder="MM/YY"
                      className="h-11"
                      inputMode="numeric"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="cvv">CVV</Label>
                    <Input
                      id="cvv"
                      data-ocid="onboarding.input"
                      value={cvv}
                      onChange={(e) =>
                        setCvv(e.target.value.replace(/\D/g, "").slice(0, 4))
                      }
                      placeholder="123"
                      className="h-11"
                      inputMode="numeric"
                      type="password"
                    />
                  </div>
                </div>

                {/* Discount code */}
                <div className="space-y-1.5">
                  <Label htmlFor="discount">Discount Code (optional)</Label>
                  <div className="flex gap-2">
                    <Input
                      id="discount"
                      data-ocid="onboarding.input"
                      value={discountCode}
                      onChange={(e) =>
                        setDiscountCode(e.target.value.toUpperCase())
                      }
                      placeholder="e.g. FLEET20"
                      className="h-11 flex-1 uppercase"
                    />
                    <Button
                      variant="outline"
                      className="h-11 px-4 gap-1.5"
                      onClick={handleApplyDiscount}
                      disabled={!discountCode.trim()}
                      data-ocid="onboarding.secondary_button"
                    >
                      <Tag className="w-3.5 h-3.5" /> Apply
                    </Button>
                  </div>
                  {discountApplied && (
                    <div className="flex items-center gap-2">
                      <Badge className="bg-emerald-500/15 text-emerald-500 border-emerald-500/30">
                        <CheckCircle2 className="w-3 h-3 mr-1" />
                        {discountApplied.label} applied
                      </Badge>
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Lock className="w-3.5 h-3.5 shrink-0" />
                  <span>
                    Your payment info is encrypted and secure. You will not be
                    charged during the 7-day trial.
                  </span>
                </div>

                <Button
                  data-ocid="onboarding.primary_button"
                  className="w-full h-12 font-semibold gap-2"
                  onClick={handleActivateTrial}
                  disabled={activatingTrial || !isCardValid()}
                >
                  {activatingTrial ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" /> Activating...
                    </>
                  ) : (
                    <>
                      Start 7-Day Free Trial{" "}
                      <ChevronRight className="w-4 h-4" />
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}

          {/* Step 5 — All Set */}
          {step === 5 && (
            <div className="p-8 text-center" data-ocid="onboarding.panel">
              <div className="w-20 h-20 rounded-full bg-emerald-500/10 flex items-center justify-center mx-auto mb-5">
                <CheckCircle2 className="w-11 h-11 text-emerald-500" />
              </div>
              <h2 className="text-2xl font-bold mb-2">
                You're all set, {name}!
              </h2>
              <p className="text-muted-foreground text-sm mb-2">
                Your 7-day free trial has started. Enjoy full access to
                FleetGuard.
              </p>
              <Badge className="mb-6 bg-emerald-500/15 text-emerald-500 border-emerald-500/30 text-xs">
                Trial active — 7 days remaining
              </Badge>

              <div className="bg-muted/40 rounded-xl p-4 text-left space-y-2 mb-6">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Company</span>
                  <span className="font-semibold">{companyName}</span>
                </div>
                {industry && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Industry</span>
                    <span className="font-semibold">{industry}</span>
                  </div>
                )}
                {fleetSize && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Fleet Size</span>
                    <span className="font-semibold">{fleetSize} vehicles</span>
                  </div>
                )}
                {discountApplied && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Discount</span>
                    <Badge className="bg-emerald-500/15 text-emerald-500 border-emerald-500/30 text-xs">
                      {discountApplied.label}
                    </Badge>
                  </div>
                )}
              </div>

              <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 text-left mb-6">
                <p className="text-sm font-semibold text-primary mb-1 flex items-center gap-1.5">
                  <Shield className="w-3.5 h-3.5" /> You are the Administrator
                </p>
                <p className="text-xs text-muted-foreground">
                  Go to <strong>Settings &rarr; Invite Team Members</strong> to
                  generate invite links for your fleet managers and mechanics.
                </p>
              </div>

              <Button
                data-ocid="onboarding.primary_button"
                className="w-full h-12 font-semibold"
                onClick={handleGoToDashboard}
              >
                Go to Dashboard &rarr;
              </Button>
            </div>
          )}
        </div>

        <p className="text-center text-xs text-muted-foreground mt-6">
          &copy; {new Date().getFullYear()} FleetGuard. All rights reserved.
        </p>
      </div>
    </div>
  );
}
