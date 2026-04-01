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
  Building2,
  ChevronLeft,
  Shield,
  Truck,
  Wrench,
} from "lucide-react";
import { Loader2 } from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";
import { toast } from "sonner";
import { useInternetIdentity } from "../hooks/useInternetIdentity";

const INDUSTRIES = [
  "Trucking",
  "Bus Fleet",
  "Delivery & Logistics",
  "Construction",
  "Other",
];
const FLEET_SIZES = ["1\u201310", "11\u201350", "51\u2013200", "200+"];

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

interface LoginPageProps {
  onSignUp?: () => void;
  onNavigate?: (page: import("../App").Page) => void;
}

export function LoginPage({ onSignUp: _onSignUp, onNavigate }: LoginPageProps) {
  const { login, isLoggingIn } = useInternetIdentity();
  const [showSignUpForm, setShowSignUpForm] = useState(false);
  const [signUpCompany, setSignUpCompany] = useState("");
  const [signUpIndustry, setSignUpIndustry] = useState("");
  const [signUpFleetSize, setSignUpFleetSize] = useState("");
  const [signUpPhone, setSignUpPhone] = useState("");
  const [signUpEmail, setSignUpEmail] = useState("");

  const handleBackToSignIn = () => {
    setShowSignUpForm(false);
    setSignUpCompany("");
    setSignUpIndustry("");
    setSignUpFleetSize("");
    setSignUpPhone("");
    setSignUpEmail("");
  };

  const canContinue =
    signUpCompany.trim() !== "" &&
    signUpIndustry !== "" &&
    signUpFleetSize !== "";

  const handleContinueWithII = () => {
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
    sessionStorage.setItem(
      "fleetguard_presignup_company",
      signUpCompany.trim(),
    );
    sessionStorage.setItem("fleetguard_presignup_industry", signUpIndustry);
    sessionStorage.setItem("fleetguard_presignup_fleetsize", signUpFleetSize);
    sessionStorage.setItem("fleetguard_presignup_phone", signUpPhone.trim());
    sessionStorage.setItem("fleetguard_presignup_email", signUpEmail.trim());
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
        {/* Radial glow overlay */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              "radial-gradient(ellipse 70% 60% at 20% 30%, oklch(0.45 0.18 264 / 0.18) 0%, transparent 60%), " +
              "radial-gradient(ellipse 50% 40% at 80% 70%, oklch(0.55 0.2 210 / 0.12) 0%, transparent 50%)",
          }}
        />
        {/* Subtle grid */}
        <div
          className="absolute inset-0 pointer-events-none opacity-[0.04]"
          style={{
            backgroundImage:
              "linear-gradient(oklch(1 0 0) 1px, transparent 1px), linear-gradient(90deg, oklch(1 0 0) 1px, transparent 1px)",
            backgroundSize: "48px 48px",
          }}
        />

        {/* Logo */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="flex items-center gap-3 relative z-10"
        >
          <div className="w-10 h-10 rounded-xl bg-white/10 backdrop-blur flex items-center justify-center border border-white/20">
            <img
              src="/assets/generated/fleetguard-logo-transparent.dim_64x64.png"
              alt="FleetGuard"
              className="w-6 h-6 object-contain"
            />
          </div>
          <span className="text-xl font-bold tracking-tight text-white">
            FleetGuard
          </span>
        </motion.div>

        {/* Hero text + stats */}
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

          {/* Stats mockup card */}
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
              <div className="flex items-center gap-2.5 mb-6 lg:hidden">
                <Shield className="w-6 h-6 text-primary" />
                <span className="text-xl font-bold">FleetGuard</span>
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
                onClick={() => setShowSignUpForm(true)}
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
            <div className="bg-white rounded-2xl p-8 shadow-elevated-lg">
              <div className="flex items-center gap-2.5 mb-1 lg:hidden">
                <Shield className="w-6 h-6 text-primary" />
                <span className="text-xl font-bold">FleetGuard</span>
              </div>
              <button
                type="button"
                data-ocid="login.link"
                onClick={handleBackToSignIn}
                className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors mb-5"
              >
                <ChevronLeft className="w-4 h-4" /> Back to Sign in
              </button>
              <div className="flex items-center gap-2.5 mb-1">
                <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Building2 className="w-5 h-5 text-primary" />
                </div>
                <h2 className="text-2xl font-bold text-foreground">
                  Create your account
                </h2>
              </div>
              <p className="text-muted-foreground text-sm mb-7">
                Tell us about your company to get started.
              </p>

              <div className="space-y-5">
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
                    <SelectTrigger className="h-11" data-ocid="login.select">
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

                <div className="space-y-1.5">
                  <Label htmlFor="signup-email">
                    Email Address{" "}
                    <span className="text-xs text-muted-foreground font-normal">
                      (optional)
                    </span>
                  </Label>
                  <Input
                    id="signup-email"
                    data-ocid="login.input"
                    value={signUpEmail}
                    onChange={(e) => setSignUpEmail(e.target.value)}
                    placeholder="e.g. admin@company.com"
                    className="h-11"
                    type="email"
                  />
                </div>

                <Button
                  data-ocid="login.primary_button"
                  className="w-full h-12 text-base font-semibold gap-2 mt-1 btn-scale"
                  onClick={handleContinueWithII}
                  disabled={isLoggingIn || !canContinue}
                >
                  {isLoggingIn ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" /> Connecting...
                    </>
                  ) : (
                    <>
                      <Shield className="h-4 w-4" /> Continue with Internet
                      Identity
                    </>
                  )}
                </Button>
                <p className="text-center text-xs text-muted-foreground">
                  Secured by Advanced Cryptography · 100% onchain
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
