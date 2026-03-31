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

  const leftPanel = (
    <div className="hidden lg:flex flex-col justify-center px-16 w-1/2 text-white">
      <div className="flex items-center gap-3 mb-10">
        <div className="w-12 h-12 rounded-xl bg-white/10 backdrop-blur flex items-center justify-center">
          <Shield className="w-6 h-6 text-white" />
        </div>
        <span className="text-2xl font-bold tracking-tight">FleetGuard</span>
      </div>
      <h1 className="text-4xl font-bold leading-tight mb-4">
        Fleet Maintenance,
        <br />
        <span className="text-white/70">Simplified.</span>
      </h1>
      <p className="text-white/60 text-lg mb-10 max-w-sm">
        Manage your entire fleet's maintenance history in one secure,
        decentralized platform.
      </p>
      <div className="space-y-4">
        {[
          {
            icon: Truck,
            label: "Track all vehicle types",
            sub: "Trucks, buses, vans, trailers",
          },
          {
            icon: Wrench,
            label: "Full maintenance history",
            sub: "Detailed service records",
          },
          {
            icon: BarChart3,
            label: "Smart dashboard analytics",
            sub: "Upcoming & overdue alerts",
          },
        ].map(({ icon: Icon, label, sub }) => (
          <div key={label} className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center flex-shrink-0">
              <Icon className="w-5 h-5" />
            </div>
            <div>
              <p className="font-medium">{label}</p>
              <p className="text-sm text-white/50">{sub}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div
      className="min-h-screen flex"
      style={{
        background:
          "linear-gradient(135deg, oklch(0.24 0.09 255) 0%, oklch(0.33 0.11 255) 50%, oklch(0.45 0.14 255) 100%)",
      }}
    >
      {leftPanel}

      {/* Right panel */}
      <div className="flex-1 flex items-center justify-center p-8">
        {!showSignUpForm ? (
          /* ── Sign-in card ─────────────────────────────────────────── */
          <div className="w-full max-w-sm">
            <div className="bg-white rounded-2xl p-8 shadow-elevated">
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
                className="w-full h-11 text-base font-medium"
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
                className="w-full h-11 text-base font-medium"
                onClick={() => setShowSignUpForm(true)}
                disabled={isLoggingIn}
              >
                Sign Up — New Company
              </Button>
              <p className="text-center text-xs text-muted-foreground mt-3">
                New to FleetGuard? Sign up to register your company.
              </p>

              <p className="text-center text-xs text-muted-foreground mt-6">
                Secured by Advanced Cryptography - 100% onchain
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
          </div>
        ) : (
          /* ── Sign-up form card ────────────────────────────────────── */
          <div className="w-full max-w-md">
            <div className="bg-white rounded-2xl p-8 shadow-elevated">
              {/* Header */}
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
                <ChevronLeft className="w-4 h-4" />
                Back to Sign in
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
                {/* Company Name */}
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

                {/* Industry */}
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

                {/* Fleet Size */}
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

                {/* Phone */}
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

                {/* Email */}
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

                {/* CTA */}
                <Button
                  data-ocid="login.primary_button"
                  className="w-full h-12 text-base font-semibold gap-2 mt-1"
                  onClick={handleContinueWithII}
                  disabled={isLoggingIn || !canContinue}
                >
                  {isLoggingIn ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Connecting...
                    </>
                  ) : (
                    <>
                      <Shield className="h-4 w-4" />
                      Continue with Internet Identity
                    </>
                  )}
                </Button>

                <p className="text-center text-xs text-muted-foreground">
                  Secured by Advanced Cryptography — 100% onchain
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
