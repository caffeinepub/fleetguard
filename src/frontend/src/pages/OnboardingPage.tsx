import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useQueryClient } from "@tanstack/react-query";
import {
  Building2,
  CheckCircle2,
  ChevronRight,
  CreditCard,
  Loader2,
  Lock,
  Mail,
  Phone,
  Shield,
  Tag,
  Truck,
  Users,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { useActor } from "../hooks/useActor";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import { useSaveCompanySettings, useSaveProfile } from "../hooks/useQueries";

// ─── Minimal Stripe type stubs (loaded dynamically from CDN at runtime) ───────
type StripeInstance = {
  createToken: (
    el: any,
  ) => Promise<{ token?: { id: string }; error?: { message?: string } }>;
};
type StripeElements = { getElement: (el: any) => any };
type StripeCardElementType = any;

declare global {
  interface Window {
    Stripe?: (pk: string) => StripeInstance;
  }
}

// ─── StripeCardForm ────────────────────────────────────────────────────────────
function StripeCardForm({
  publishableKey,
  onReady,
  stripeRef,
  elementsRef,
}: {
  publishableKey: string;
  onReady: (ready: boolean) => void;
  stripeRef: React.MutableRefObject<StripeInstance | null>;
  elementsRef: React.MutableRefObject<StripeElements | null>;
}) {
  const mountRef = useRef<HTMLDivElement | null>(null);

  // biome-ignore lint/correctness/useExhaustiveDependencies: intentionally only runs once per publishableKey
  useEffect(() => {
    let card: StripeCardElementType = null;
    let cleanup = false;

    const init = async () => {
      if (!window.Stripe) {
        await new Promise<void>((resolve) => {
          const s = document.createElement("script");
          s.src = "https://js.stripe.com/v3/";
          s.onload = () => resolve();
          document.head.appendChild(s);
        });
      }
      if (cleanup || !window.Stripe || !mountRef.current) return;
      const stripe = window.Stripe(publishableKey);
      stripeRef.current = stripe;
      const elements = (stripe as any).elements() as StripeElements;
      elementsRef.current = elements;
      card = (elements as any).create("card", {
        style: {
          base: {
            fontSize: "14px",
            color: "#f1f5f9",
            "::placeholder": { color: "#94a3b8" },
          },
          invalid: { color: "#ef4444" },
        },
      });
      card.mount(mountRef.current);
      card.on("change", (e: any) => onReady(e.complete));
    };

    init();
    return () => {
      cleanup = true;
      card?.unmount?.();
    };
  }, [publishableKey]);

  return (
    <div className="space-y-1.5">
      <Label>Card Details</Label>
      <div
        ref={mountRef}
        className="border border-border rounded-md px-3 py-3 bg-background focus-within:ring-2 focus-within:ring-ring min-h-[42px]"
        data-ocid="onboarding.input"
      />
    </div>
  );
}

const TOTAL_STEPS = 3;

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

  // Pre-populate from sessionStorage (set before II login on the sign-up form)
  const [companyName] = useState(
    () => sessionStorage.getItem("fleetguard_presignup_company") || "",
  );
  const [industry] = useState(
    () => sessionStorage.getItem("fleetguard_presignup_industry") || "",
  );
  const [fleetSize] = useState(
    () => sessionStorage.getItem("fleetguard_presignup_fleetsize") || "",
  );
  const [phone] = useState(
    () => sessionStorage.getItem("fleetguard_presignup_phone") || "",
  );
  const [email] = useState(
    () => sessionStorage.getItem("fleetguard_presignup_email") || "",
  );

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
  const [stripeCardReady, setStripeCardReady] = useState(false);
  const stripeRef = useRef<StripeInstance | null>(null);
  const stripeElementsRef = useRef<StripeElements | null>(null);

  const STRIPE_PK = localStorage.getItem("fleetguard_stripe_pk");

  const { identity } = useInternetIdentity();
  const { actor } = useActor();
  const saveCompany = useSaveCompanySettings();
  const saveProfile = useSaveProfile();
  const qc = useQueryClient();

  // Clear presignup sessionStorage keys once mounted
  useEffect(() => {
    sessionStorage.removeItem("fleetguard_presignup_company");
    sessionStorage.removeItem("fleetguard_presignup_industry");
    sessionStorage.removeItem("fleetguard_presignup_fleetsize");
    sessionStorage.removeItem("fleetguard_presignup_phone");
    sessionStorage.removeItem("fleetguard_presignup_email");
  }, []);

  // Step 1 → 2: save company settings and advance
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
        fleetSize: fleetSize || "1\u201310",
        contactPhone: phone.trim(),
        logoUrl: "",
        adminPrincipal: identity?.getPrincipal().toString() ?? "",
        createdAt: BigInt(Date.now()) * 1_000_000n,
      });
      setStep(2);
    } catch {
      toast.error("Failed to save company settings");
    } finally {
      setSaving(false);
    }
  };

  // Step 2 → 3 (or 4 if billing already completed pre-login)
  const handleProfileComplete = async () => {
    if (!name.trim()) {
      toast.error("Please enter your name");
      return;
    }
    setSaving(true);
    try {
      await saveProfile.mutateAsync({ name: name.trim() });
      await qc.invalidateQueries({ queryKey: ["callerProfile"] });

      const billingDone =
        sessionStorage.getItem("fleetguard_billing_done") === "1";
      if (billingDone) {
        // Billing was completed before II login — skip the payment step
        const stripeToken =
          sessionStorage.getItem("fleetguard_stripe_token") ??
          companyName.trim();
        const savedDiscount = sessionStorage.getItem(
          "fleetguard_presignup_discount",
        );
        sessionStorage.removeItem("fleetguard_billing_done");
        sessionStorage.removeItem("fleetguard_stripe_token");
        sessionStorage.removeItem("fleetguard_presignup_discount");
        try {
          if (savedDiscount) {
            await (actor as any).applyDiscountCode(savedDiscount);
          }
          await (actor as any).startTrial(stripeToken);
        } catch {
          // non-fatal: still advance to dashboard
        }
        setStep(4);
      } else {
        setStep(3);
      }
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

  // Step 3 → 4: activate trial
  const handleActivateTrial = async () => {
    if (STRIPE_PK && stripeRef.current && stripeElementsRef.current) {
      if (!stripeCardReady) {
        toast.error("Please enter your complete card details");
        return;
      }
      setActivatingTrial(true);
      try {
        const cardElement = stripeElementsRef.current.getElement("card");
        const { token, error } =
          await stripeRef.current.createToken(cardElement);
        if (error) {
          toast.error(error.message ?? "Card declined \u2014 please try again");
          return;
        }
        if (discountApplied) {
          await (actor as any).applyDiscountCode(discountApplied.code);
        }
        await (actor as any).startTrial(token?.id ?? companyName.trim());
        setStep(4);
      } catch {
        setStep(4);
      } finally {
        setActivatingTrial(false);
      }
      return;
    }
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
      setStep(4);
    } catch {
      setStep(4);
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
        <div className="flex items-center justify-center gap-2 mb-8">
          <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center shadow-lg">
            <Shield className="w-5 h-5 text-primary-foreground" />
          </div>
          <span className="text-xl font-bold tracking-tight">FleetGuard</span>
        </div>

        {step <= 3 && <StepDots current={step} />}

        <div className="bg-card rounded-2xl shadow-xl border border-border/50 overflow-hidden">
          {/* ── Step 1: Welcome & Confirm Company ─────────────────── */}
          {step === 1 && (
            <div className="p-8" data-ocid="onboarding.panel">
              {/* Hero */}
              <div className="text-center mb-7">
                <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                  <Truck className="w-8 h-8 text-primary" />
                </div>
                <h1 className="text-2xl font-bold mb-1">
                  {companyName
                    ? `Welcome to FleetGuard, ${companyName}!`
                    : "Welcome to FleetGuard!"}
                </h1>
                <p className="text-muted-foreground text-sm">
                  Let's confirm your details and get your account set up.
                </p>
              </div>

              {/* Confirmation summary card */}
              <div className="bg-muted/40 border border-border/60 rounded-xl divide-y divide-border/50 mb-5">
                {companyName && (
                  <div className="flex items-center gap-3 px-4 py-3">
                    <Building2 className="w-4 h-4 text-muted-foreground shrink-0" />
                    <span className="text-sm text-muted-foreground w-28 shrink-0">
                      Company
                    </span>
                    <span className="text-sm font-semibold truncate">
                      {companyName}
                    </span>
                  </div>
                )}
                {industry && (
                  <div className="flex items-center gap-3 px-4 py-3">
                    <Truck className="w-4 h-4 text-muted-foreground shrink-0" />
                    <span className="text-sm text-muted-foreground w-28 shrink-0">
                      Industry
                    </span>
                    <span className="text-sm font-semibold">{industry}</span>
                  </div>
                )}
                {fleetSize && (
                  <div className="flex items-center gap-3 px-4 py-3">
                    <Users className="w-4 h-4 text-muted-foreground shrink-0" />
                    <span className="text-sm text-muted-foreground w-28 shrink-0">
                      Fleet size
                    </span>
                    <span className="text-sm font-semibold">
                      {fleetSize} vehicles
                    </span>
                  </div>
                )}
                {email && (
                  <div className="flex items-center gap-3 px-4 py-3">
                    <Mail className="w-4 h-4 text-muted-foreground shrink-0" />
                    <span className="text-sm text-muted-foreground w-28 shrink-0">
                      Email
                    </span>
                    <span className="text-sm font-semibold truncate">
                      {email}
                    </span>
                  </div>
                )}
                {phone && (
                  <div className="flex items-center gap-3 px-4 py-3">
                    <Phone className="w-4 h-4 text-muted-foreground shrink-0" />
                    <span className="text-sm text-muted-foreground w-28 shrink-0">
                      Phone
                    </span>
                    <span className="text-sm font-semibold">{phone}</span>
                  </div>
                )}

                {/* Fallback if no data from sessionStorage */}
                {!companyName && !industry && !fleetSize && (
                  <div className="px-4 py-6 text-center">
                    <p className="text-sm text-muted-foreground">
                      No company information found. You can continue and fill in
                      your details in Settings.
                    </p>
                  </div>
                )}
              </div>

              {/* 7-day trial badge */}
              <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl px-4 py-3 flex items-start gap-3 mb-4">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                <div className="text-xs">
                  <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                    7-Day Free Trial
                  </span>
                  <span className="text-muted-foreground">
                    {" "}
                    &mdash; start free for 7 days, then{" "}
                    <strong>$499/month</strong>. Cancel anytime.
                  </span>
                </div>
              </div>

              {/* Admin info box */}
              <div className="bg-primary/5 border border-primary/20 rounded-xl px-4 py-3 flex items-start gap-3 mb-7">
                <Shield className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                <div className="text-xs">
                  <span className="font-semibold text-primary">
                    You are the Administrator
                  </span>
                  <span className="text-muted-foreground">
                    {" "}
                    &mdash; you have full control over your company's fleet,
                    users, and settings.
                  </span>
                </div>
              </div>

              <Button
                data-ocid="onboarding.primary_button"
                className="w-full h-12 text-base font-semibold gap-2"
                onClick={handleCompanyNext}
                disabled={saving}
              >
                {saving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" /> Setting up...
                  </>
                ) : (
                  <>
                    Get Started <ChevronRight className="w-4 h-4" />
                  </>
                )}
              </Button>
            </div>
          )}

          {/* ── Step 2: Your Profile ───────────────────────────────── */}
          {step === 2 && (
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

          {/* ── Step 3: Activate Free Trial (payment) ─────────────── */}
          {step === 3 && (
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
                {STRIPE_PK ? (
                  <StripeCardForm
                    publishableKey={STRIPE_PK}
                    onReady={setStripeCardReady}
                    stripeRef={stripeRef}
                    elementsRef={stripeElementsRef}
                  />
                ) : (
                  <>
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
                          onChange={(e) =>
                            setExpiry(formatExpiry(e.target.value))
                          }
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
                            setCvv(
                              e.target.value.replace(/\D/g, "").slice(0, 4),
                            )
                          }
                          placeholder="123"
                          className="h-11"
                          inputMode="numeric"
                          type="password"
                        />
                      </div>
                    </div>
                  </>
                )}

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
                  disabled={
                    activatingTrial ||
                    (STRIPE_PK ? !stripeCardReady : !isCardValid())
                  }
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

          {/* ── Step 4: All Set ────────────────────────────────────── */}
          {step === 4 && (
            <div className="p-8 text-center" data-ocid="onboarding.panel">
              <div className="w-20 h-20 rounded-full bg-emerald-500/10 flex items-center justify-center mx-auto mb-5">
                <CheckCircle2 className="w-11 h-11 text-emerald-500" />
              </div>
              <h2 className="text-2xl font-bold mb-2">
                You're all set{name ? `, ${name}` : ""}!
              </h2>
              <p className="text-muted-foreground text-sm mb-2">
                Your 7-day free trial has started. Enjoy full access to
                FleetGuard.
              </p>
              <Badge className="mb-6 bg-emerald-500/15 text-emerald-500 border-emerald-500/30 text-xs">
                Trial active \u2014 7 days remaining
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
