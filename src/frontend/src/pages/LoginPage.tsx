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
import { Separator } from "@/components/ui/separator";
import {
  BarChart3,
  CheckCircle2,
  ChevronLeft,
  CreditCard,
  Lock,
  Shield,
  Tag,
  Truck,
  Wrench,
} from "lucide-react";
import { Loader2 } from "lucide-react";
import { motion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { useInternetIdentity } from "../hooks/useInternetIdentity";

const INDUSTRIES = [
  "Trucking",
  "Bus Fleet",
  "Delivery & Logistics",
  "Construction",
  "Other",
];
const FLEET_SIZES = ["1\u201310", "11\u201325", "26+"];

type TierKey = "starter" | "growth" | "enterprise";

interface TierInfo {
  key: TierKey;
  name: string;
  price: string;
  priceNum: number;
  limit: string;
  color: string;
  borderColor: string;
  bgColor: string;
  badgeColor: string;
}

const TIER_MAP: Record<string, TierInfo> = {
  "1\u201310": {
    key: "starter",
    name: "Starter Plan",
    price: "$99",
    priceNum: 99,
    limit: "Up to 10 vehicles",
    color: "text-blue-600 dark:text-blue-400",
    borderColor: "border-blue-300 dark:border-blue-600",
    bgColor: "bg-blue-50 dark:bg-blue-950/30",
    badgeColor:
      "bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/40 dark:text-blue-300 dark:border-blue-700",
  },
  "11\u201325": {
    key: "growth",
    name: "Growth Plan",
    price: "$225",
    priceNum: 225,
    limit: "Up to 25 vehicles",
    color: "text-emerald-600 dark:text-emerald-400",
    borderColor: "border-emerald-300 dark:border-emerald-600",
    bgColor: "bg-emerald-50 dark:bg-emerald-950/30",
    badgeColor:
      "bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/40 dark:text-emerald-300 dark:border-emerald-700",
  },
  "26+": {
    key: "enterprise",
    name: "Enterprise Plan",
    price: "$499",
    priceNum: 499,
    limit: "Unlimited vehicles",
    color: "text-purple-600 dark:text-purple-400",
    borderColor: "border-purple-300 dark:border-purple-600",
    bgColor: "bg-purple-50 dark:bg-purple-950/30",
    badgeColor:
      "bg-purple-100 text-purple-700 border-purple-200 dark:bg-purple-900/40 dark:text-purple-300 dark:border-purple-700",
  },
};

function PlanSummaryCard({ fleetSize }: { fleetSize: string }) {
  const tier = TIER_MAP[fleetSize];
  if (!tier) return null;
  return (
    <div
      className={`rounded-xl border-2 ${tier.borderColor} ${tier.bgColor} p-4 mb-4`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <span
            className={`inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${tier.badgeColor} mb-2`}
          >
            {tier.name}
          </span>
          <div
            className={`text-3xl font-extrabold ${tier.color} leading-none mb-0.5`}
          >
            {tier.price}
            <span className="text-sm font-normal text-muted-foreground ml-1">
              /mo + tax
            </span>
          </div>
          <p className="text-sm text-muted-foreground font-medium mt-1">
            {tier.limit}
          </p>
        </div>
        <div
          className={`rounded-lg p-2 ${tier.bgColor} border ${tier.borderColor}`}
        >
          <CheckCircle2 className={`w-5 h-5 ${tier.color}`} />
        </div>
      </div>
      <div className="mt-3 pt-3 border-t border-current/10 flex items-center gap-1.5">
        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
        <span className="text-xs text-emerald-700 dark:text-emerald-400 font-medium">
          7-day free trial — no charge until trial ends
        </span>
      </div>
    </div>
  );
}

const HERO_STATS = [
  {
    label: "Active Vehicles",
    value: "42",
    sub: "across 3 depots",
    color: "text-blue-300",
  },
  {
    label: "Overdue Services",
    value: "3",
    sub: "require attention",
    color: "text-amber-300",
  },
  {
    label: "Cost Saved",
    value: "$12.4k",
    sub: "this quarter",
    color: "text-emerald-300",
  },
  {
    label: "Fleet Uptime",
    value: "98.2%",
    sub: "availability rate",
    color: "text-sky-300",
  },
];

// ─── Minimal Stripe type stubs ─────────────────────────────────────────────────────
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

function StripeCardWidget({
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
            color: "#0f172a",
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
        className="border border-border rounded-md px-3 py-3 bg-background min-h-[42px] focus-within:ring-2 focus-within:ring-ring"
        data-ocid="login.input"
      />
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
  const d = val.replace(/\D/g, "").slice(0, 4);
  if (d.length >= 3) return `${d.slice(0, 2)}/${d.slice(2)}`;
  return d;
}

interface LoginPageProps {
  onSignUp?: () => void;
  onNavigate?: (page: import("../App").Page) => void;
}

export function LoginPage({ onSignUp: _onSignUp, onNavigate }: LoginPageProps) {
  const { login, isLoggingIn } = useInternetIdentity();
  const [showSignUpForm, setShowSignUpForm] = useState(false);
  // signup wizard step: 1=company info, 2=contact, 3=billing
  const [signupStep, setSignupStep] = useState(1);

  // Step 1
  const [signUpCompany, setSignUpCompany] = useState("");
  const [signUpIndustry, setSignUpIndustry] = useState("");
  const [signUpFleetSize, setSignUpFleetSize] = useState("");
  // Step 2
  const [signUpPhone, setSignUpPhone] = useState("");
  const [signUpEmail, setSignUpEmail] = useState("");
  // Step 3 - billing
  const [cardHolder, setCardHolder] = useState("");
  const [cardNumber, setCardNumber] = useState("");
  const [expiry, setExpiry] = useState("");
  const [cvv, setCvv] = useState("");
  const [discountCode, setDiscountCode] = useState("");
  const [discountApplied, setDiscountApplied] = useState<string | null>(null);
  const [stripeCardReady, setStripeCardReady] = useState(false);
  const [processingPayment, setProcessingPayment] = useState(false);
  const stripeRef = useRef<StripeInstance | null>(null);
  const stripeElementsRef = useRef<StripeElements | null>(null);

  const STRIPE_PK = localStorage.getItem("fleetguard_stripe_pk");

  const handleBackToSignIn = () => {
    setShowSignUpForm(false);
    setSignupStep(1);
    setSignUpCompany("");
    setSignUpIndustry("");
    setSignUpFleetSize("");
    setSignUpPhone("");
    setSignUpEmail("");
    setCardHolder("");
    setCardNumber("");
    setExpiry("");
    setCvv("");
    setDiscountCode("");
    setDiscountApplied(null);
  };

  const canStep1Continue =
    signUpCompany.trim() !== "" &&
    signUpIndustry !== "" &&
    signUpFleetSize !== "";

  const isCardValid = () => {
    const digits = cardNumber.replace(/\s/g, "");
    return (
      cardHolder.trim().length > 1 &&
      digits.length === 16 &&
      expiry.length === 5 &&
      cvv.length >= 3
    );
  };

  const handleStep1Next = () => {
    if (!signUpCompany.trim()) {
      toast.error("Please enter your company name");
      return;
    }
    if (!signUpIndustry) {
      toast.error("Please select an industry");
      return;
    }
    if (!signUpFleetSize) {
      toast.error("Please select your fleet size");
      return;
    }
    setSignupStep(2);
  };

  const FREE_EMAIL_DOMAINS = new Set([
    "gmail.com",
    "yahoo.com",
    "hotmail.com",
    "outlook.com",
    "live.com",
    "icloud.com",
    "me.com",
    "mac.com",
    "aol.com",
    "protonmail.com",
    "proton.me",
    "yandex.com",
    "mail.com",
    "gmx.com",
    "zoho.com",
    "inbox.com",
    "fastmail.com",
    "tutanota.com",
    "hey.com",
    "msn.com",
    "windowslive.com",
  ]);

  const handleStep2Next = () => {
    // Corporate email is required
    if (!signUpEmail.trim()) {
      toast.error("Please enter your corporate email address");
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(signUpEmail.trim())) {
      toast.error("Please enter a valid email address");
      return;
    }
    const domain = signUpEmail.trim().toLowerCase().split("@")[1] ?? "";
    if (FREE_EMAIL_DOMAINS.has(domain)) {
      toast.error(
        "Please use your corporate email address. Free email providers (Gmail, Yahoo, Outlook, etc.) are not accepted.",
      );
      return;
    }
    setSignupStep(3);
  };

  const handleBillingAndLogin = async () => {
    // Validate billing info
    if (STRIPE_PK && stripeRef.current && stripeElementsRef.current) {
      if (!stripeCardReady) {
        toast.error("Please enter your complete card details");
        return;
      }
      setProcessingPayment(true);
      try {
        const cardElement = stripeElementsRef.current.getElement("card");
        const { token, error } =
          await stripeRef.current.createToken(cardElement);
        if (error) {
          toast.error(error.message ?? "Card declined — please try again");
          return;
        }
        // Store token + billing completion flag for onboarding to pick up
        sessionStorage.setItem("fleetguard_billing_done", "1");
        sessionStorage.setItem("fleetguard_stripe_token", token?.id ?? "");
      } catch {
        toast.error("Payment processing failed. Please try again.");
        return;
      } finally {
        setProcessingPayment(false);
      }
    } else {
      // Test mode: validate simulated card form
      if (!isCardValid()) {
        toast.error("Please fill in all card details correctly");
        return;
      }
      // Mark billing as completed (test mode — no actual charge)
      sessionStorage.setItem("fleetguard_billing_done", "1");
      sessionStorage.setItem(
        "fleetguard_stripe_token",
        `test_token_${Date.now()}`,
      );
    }

    // Store all signup data and trigger II login
    sessionStorage.setItem(
      "fleetguard_presignup_company",
      signUpCompany.trim(),
    );
    sessionStorage.setItem("fleetguard_presignup_industry", signUpIndustry);
    sessionStorage.setItem("fleetguard_presignup_fleetsize", signUpFleetSize);
    sessionStorage.setItem("fleetguard_presignup_phone", signUpPhone.trim());
    sessionStorage.setItem("fleetguard_presignup_email", signUpEmail.trim());
    // Store the mapped tier key so OnboardingPage can pre-select it
    const mappedTier = TIER_MAP[signUpFleetSize]?.key ?? "starter";
    sessionStorage.setItem("fleetguard_presignup_tier", mappedTier);
    if (discountApplied) {
      sessionStorage.setItem("fleetguard_presignup_discount", discountApplied);
    }
    sessionStorage.setItem("fleetguard_signup_intent", "1");
    login();
  };

  return (
    <div
      className="min-h-screen flex"
      style={{
        background:
          "linear-gradient(145deg, oklch(0.18 0.08 258) 0%, oklch(0.22 0.10 260) 40%, oklch(0.28 0.12 255) 100%)",
      }}
    >
      {/* Left hero panel */}
      <div className="hidden lg:flex flex-col justify-between px-14 py-12 w-[52%] relative overflow-hidden">
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              "radial-gradient(ellipse 70% 60% at 20% 30%, oklch(0.45 0.18 264 / 0.18) 0%, transparent 60%), " +
              "radial-gradient(ellipse 50% 40% at 80% 70%, oklch(0.55 0.2 210 / 0.12) 0%, transparent 50%)",
          }}
        />
        <div
          className="absolute inset-0 pointer-events-none opacity-[0.04]"
          style={{
            backgroundImage:
              "linear-gradient(oklch(1 0 0) 1px, transparent 1px), linear-gradient(90deg, oklch(1 0 0) 1px, transparent 1px)",
            backgroundSize: "48px 48px",
          }}
        />

        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="flex items-center gap-3 relative z-10"
        >
          <img
            src="/assets/generated/fleetguard-logo-new-transparent.dim_200x60.png"
            alt="FleetGuard"
            className="h-8 w-auto object-contain"
          />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="flex-1 flex flex-col justify-center py-10 relative z-10"
        >
          <p className="text-white/50 text-xs font-semibold tracking-widest uppercase mb-4">
            Fleet Management Platform
          </p>
          <h1 className="text-5xl font-bold leading-[1.1] mb-5 text-white">
            Manage your fleet
            <br />
            <span className="text-white/40">with confidence.</span>
          </h1>
          <p className="text-white/50 text-base mb-10 max-w-xs leading-relaxed">
            Real-time maintenance tracking, cost analytics, and compliance,
            built for global operators.
          </p>

          <div className="space-y-3 mb-10">
            {[
              {
                icon: Truck,
                label: "All vehicle types",
                sub: "Trucks, buses, vans, trailers",
              },
              {
                icon: Wrench,
                label: "Complete maintenance history",
                sub: "Work orders, schedules, parts",
              },
              {
                icon: BarChart3,
                label: "Analytics & cost insights",
                sub: "Live dashboard, CSV exports",
              },
            ].map(({ icon: Icon, label, sub }) => (
              <div key={label} className="flex items-center gap-3.5">
                <div className="w-8 h-8 rounded-lg bg-white/8 border border-white/10 flex items-center justify-center flex-shrink-0">
                  <Icon className="w-4 h-4 text-white/60" />
                </div>
                <div>
                  <p className="text-sm font-medium text-white/80">{label}</p>
                  <p className="text-xs text-white/40">{sub}</p>
                </div>
              </div>
            ))}
          </div>

          <motion.div
            initial={{ opacity: 0, y: 16, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.35 }}
            className="rounded-2xl p-5 border border-white/10"
            style={{
              background: "oklch(1 0 0 / 0.05)",
              backdropFilter: "blur(12px)",
            }}
          >
            <div className="flex items-center justify-between mb-4">
              <span className="text-white/50 text-xs font-semibold tracking-widest uppercase">
                Live Overview
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-white/40 text-xs">Active</span>
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2.5">
              {HERO_STATS.map((s) => (
                <div
                  key={s.label}
                  className="rounded-xl p-3"
                  style={{ background: "oklch(1 0 0 / 0.06)" }}
                >
                  <p className={`text-xl font-bold font-tnum ${s.color}`}>
                    {s.value}
                  </p>
                  <p className="text-white/70 text-xs font-medium mt-0.5">
                    {s.label}
                  </p>
                  <p className="text-white/35 text-xs">{s.sub}</p>
                </div>
              ))}
            </div>
          </motion.div>
        </motion.div>

        <p className="text-white/25 text-xs relative z-10">
          Trusted by transport operators worldwide
        </p>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-8">
        {!showSignUpForm ? (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4 }}
            className="w-full max-w-sm"
          >
            <div className="bg-white rounded-2xl p-8 shadow-elevated-lg">
              <div className="flex items-center mb-6 lg:hidden">
                <img
                  src="/assets/generated/fleetguard-logo-new-transparent.dim_200x60.png"
                  alt="FleetGuard"
                  className="h-8 w-auto object-contain"
                />
              </div>
              <h2 className="text-2xl font-bold text-foreground mb-1">
                Welcome back
              </h2>
              <p className="text-muted-foreground text-sm mb-8">
                Sign in to manage your fleet
              </p>

              <Button
                data-ocid="login.primary_button"
                className="w-full h-11 text-base font-medium btn-scale"
                onClick={() => login()}
                disabled={isLoggingIn}
              >
                {isLoggingIn ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />{" "}
                    Connecting...
                  </>
                ) : (
                  "Sign in"
                )}
              </Button>

              <div className="flex items-center gap-3 my-5">
                <Separator className="flex-1" />
                <span className="text-xs text-muted-foreground">or</span>
                <Separator className="flex-1" />
              </div>

              <Button
                data-ocid="login.secondary_button"
                variant="outline"
                className="w-full h-11 text-base font-medium btn-scale"
                onClick={() => {
                  setShowSignUpForm(true);
                  setSignupStep(1);
                }}
                disabled={isLoggingIn}
              >
                Sign Up for New Company
              </Button>
              <p className="text-center text-xs text-muted-foreground mt-3">
                New to FleetGuard? Sign up to register your company.
              </p>
              <p className="text-center text-xs text-muted-foreground mt-6">
                Secured by Advanced Cryptography · 100% onchain
              </p>
              <div className="flex items-center justify-center gap-3 mt-4">
                <button
                  type="button"
                  onClick={() => onNavigate?.("privacy-policy")}
                  className="text-xs text-muted-foreground hover:text-foreground underline-offset-2 hover:underline transition-colors"
                >
                  Privacy Policy
                </button>
                <span className="text-muted-foreground text-xs">&bull;</span>
                <button
                  type="button"
                  onClick={() => onNavigate?.("terms")}
                  className="text-xs text-muted-foreground hover:text-foreground underline-offset-2 hover:underline transition-colors"
                >
                  Terms of Service
                </button>
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.35 }}
            className="w-full max-w-md"
          >
            <div className="bg-white rounded-2xl shadow-elevated-lg overflow-hidden">
              {/* Signup wizard header */}
              <div className="px-8 pt-7 pb-4">
                <div className="flex items-center mb-1 lg:hidden">
                  <img
                    src="/assets/generated/fleetguard-logo-new-transparent.dim_200x60.png"
                    alt="FleetGuard"
                    className="h-8 w-auto object-contain"
                  />
                </div>
                <button
                  type="button"
                  data-ocid="login.link"
                  onClick={
                    signupStep === 1
                      ? handleBackToSignIn
                      : () => setSignupStep(signupStep - 1)
                  }
                  className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors mb-4"
                >
                  <ChevronLeft className="w-4 h-4" />{" "}
                  {signupStep === 1 ? "Back to Sign in" : "Back"}
                </button>

                {/* Step indicators */}
                <div className="flex items-center gap-1.5 mb-5">
                  {[1, 2, 3].map((s) => (
                    <div key={s} className="flex items-center gap-1.5">
                      <div
                        className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                          signupStep > s
                            ? "bg-emerald-500 text-white"
                            : signupStep === s
                              ? "bg-primary text-white"
                              : "bg-muted text-muted-foreground"
                        }`}
                      >
                        {signupStep > s ? (
                          <CheckCircle2 className="w-3.5 h-3.5" />
                        ) : (
                          s
                        )}
                      </div>
                      <span
                        className={`text-xs hidden sm:block ${
                          signupStep >= s
                            ? "text-foreground font-medium"
                            : "text-muted-foreground"
                        }`}
                      >
                        {s === 1 ? "Company" : s === 2 ? "Contact" : "Billing"}
                      </span>
                      {s < 3 && (
                        <div
                          className={`h-px w-6 ${signupStep > s ? "bg-emerald-500" : "bg-border"}`}
                        />
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div className="px-8 pb-8">
                {/* ── Step 1: Company Info ─────────────────────────── */}
                {signupStep === 1 && (
                  <div className="space-y-5">
                    <div>
                      <h2 className="text-xl font-bold text-foreground">
                        Create your account
                      </h2>
                      <p className="text-muted-foreground text-sm mt-1">
                        Tell us about your company.
                      </p>
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="signup-company">
                        Company Name <span className="text-destructive">*</span>
                      </Label>
                      <Input
                        id="signup-company"
                        data-ocid="login.input"
                        value={signUpCompany}
                        onChange={(e) => setSignUpCompany(e.target.value)}
                        placeholder="e.g. Swift Transport Ltd"
                        className="h-11"
                        autoFocus
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label>
                        Industry <span className="text-destructive">*</span>
                      </Label>
                      <Select
                        value={signUpIndustry}
                        onValueChange={setSignUpIndustry}
                      >
                        <SelectTrigger
                          className="h-11"
                          data-ocid="login.select"
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
                      <Label>
                        Number of Vehicles{" "}
                        <span className="text-destructive">*</span>
                      </Label>
                      <div className="grid grid-cols-4 gap-2">
                        {FLEET_SIZES.map((size) => (
                          <button
                            key={size}
                            type="button"
                            data-ocid="login.toggle"
                            onClick={() => setSignUpFleetSize(size)}
                            className={`h-11 rounded-lg border text-sm font-medium transition-all ${
                              signUpFleetSize === size
                                ? "border-primary bg-primary/10 text-primary"
                                : "border-border bg-background hover:border-primary/50 text-foreground"
                            }`}
                          >
                            {size}
                          </button>
                        ))}
                      </div>
                    </div>

                    <Button
                      data-ocid="login.primary_button"
                      className="w-full h-11 font-semibold"
                      onClick={handleStep1Next}
                      disabled={!canStep1Continue}
                    >
                      Next: Contact Info
                    </Button>
                  </div>
                )}

                {/* ── Step 2: Contact Info ─────────────────────────── */}
                {signupStep === 2 && (
                  <div className="space-y-5">
                    <div>
                      <h2 className="text-xl font-bold text-foreground">
                        Contact Details
                      </h2>
                      <p className="text-muted-foreground text-sm mt-1">
                        A corporate email address is required — free providers
                        (Gmail, Yahoo, Outlook) are not accepted.
                      </p>
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="signup-email">
                        Corporate Email Address{" "}
                        <span className="text-destructive">*</span>
                      </Label>
                      <Input
                        id="signup-email"
                        data-ocid="login.input"
                        value={signUpEmail}
                        onChange={(e) => setSignUpEmail(e.target.value)}
                        placeholder="admin@yourcompany.com"
                        className="h-11"
                        type="email"
                        autoFocus
                      />
                      <p className="text-xs text-muted-foreground">
                        Used for billing notifications and account recovery.
                        Must be a company domain.
                      </p>
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="signup-phone">
                        Phone Number{" "}
                        <span className="text-xs text-muted-foreground font-normal">
                          (optional)
                        </span>
                      </Label>
                      <Input
                        id="signup-phone"
                        data-ocid="login.input"
                        value={signUpPhone}
                        onChange={(e) => setSignUpPhone(e.target.value)}
                        placeholder="e.g. +1 555 000 1234"
                        className="h-11"
                        type="tel"
                      />
                    </div>

                    <Button
                      data-ocid="login.primary_button"
                      className="w-full h-11 font-semibold"
                      onClick={handleStep2Next}
                      disabled={!signUpEmail.trim()}
                    >
                      Next: Billing
                    </Button>
                  </div>
                )}

                {/* ── Step 3: Billing ──────────────────────────────────── */}
                {signupStep === 3 && (
                  <div className="space-y-4">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <CreditCard className="w-5 h-5 text-primary" />
                        <h2 className="text-xl font-bold text-foreground">
                          Billing Information
                        </h2>
                      </div>
                      <p className="text-muted-foreground text-sm">
                        Enter your card details to start your 7-day free trial.
                      </p>
                    </div>

                    {/* Plan summary card — derived from fleet size selected in step 1 */}
                    <PlanSummaryCard fleetSize={signUpFleetSize} />

                    {/* Test mode banner (when no Stripe key configured) */}
                    {!STRIPE_PK && (
                      <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 flex items-start gap-2.5">
                        <span className="text-amber-500 text-base leading-none mt-0.5">
                          🧪
                        </span>
                        <div className="text-xs">
                          <span className="font-semibold text-amber-700">
                            Test Mode
                          </span>
                          <span className="text-amber-600">
                            {" "}
                            — Enter any card details to proceed. No real payment
                            will be processed.
                          </span>
                        </div>
                      </div>
                    )}

                    {STRIPE_PK ? (
                      <StripeCardWidget
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
                            data-ocid="login.input"
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
                              data-ocid="login.input"
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
                              data-ocid="login.input"
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
                              data-ocid="login.input"
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
                      <Label htmlFor="discount">
                        Discount Code{" "}
                        <span className="text-xs text-muted-foreground font-normal">
                          (optional)
                        </span>
                      </Label>
                      <div className="flex gap-2">
                        <Input
                          id="discount"
                          data-ocid="login.input"
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
                          onClick={() => {
                            if (discountCode.trim()) {
                              // Save code for onboarding to validate against backend
                              setDiscountApplied(
                                discountCode.trim().toUpperCase(),
                              );
                              toast.success(
                                `Code "${discountCode.trim().toUpperCase()}" will be applied after account creation`,
                              );
                            }
                          }}
                          disabled={!discountCode.trim()}
                          data-ocid="login.secondary_button"
                        >
                          <Tag className="w-3.5 h-3.5" /> Apply
                        </Button>
                      </div>
                      {discountApplied && (
                        <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200 text-xs">
                          <CheckCircle2 className="w-3 h-3 mr-1" />
                          Code "{discountApplied}" will be applied
                        </Badge>
                      )}
                    </div>

                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Lock className="w-3.5 h-3.5 shrink-0" />
                      <span>
                        {STRIPE_PK
                          ? "Your payment info is encrypted and secure. You won't be charged during the 7-day trial."
                          : "Test mode active — no real charge will occur. Enter any card details to continue."}
                      </span>
                    </div>

                    <Button
                      data-ocid="login.primary_button"
                      className="w-full h-12 text-base font-semibold gap-2"
                      onClick={handleBillingAndLogin}
                      disabled={
                        processingPayment ||
                        isLoggingIn ||
                        (STRIPE_PK ? !stripeCardReady : !isCardValid())
                      }
                    >
                      {processingPayment || isLoggingIn ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />{" "}
                          {processingPayment
                            ? "Processing..."
                            : "Connecting..."}
                        </>
                      ) : (
                        <>
                          <Shield className="h-4 w-4" /> Activate Trial & Create
                          Account
                        </>
                      )}
                    </Button>
                    <p className="text-center text-xs text-muted-foreground">
                      Secured by Advanced Cryptography · 100% onchain
                    </p>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
