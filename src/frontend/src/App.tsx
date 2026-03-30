import { Skeleton } from "@/components/ui/skeleton";
import { Toaster } from "@/components/ui/sonner";
import type React from "react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Layout } from "./components/Layout";
import { useActor } from "./hooks/useActor";
import { useInternetIdentity } from "./hooks/useInternetIdentity";
import { useCallerProfile, useGetCompanySettings } from "./hooks/useQueries";
import { DashboardPage } from "./pages/DashboardPage";
import { DevPortalPage } from "./pages/DevPortalPage";
import { InviteAcceptPage } from "./pages/InviteAcceptPage";
import { LoginPage } from "./pages/LoginPage";
import { MaintenancePage } from "./pages/MaintenancePage";
import { OnboardingPage } from "./pages/OnboardingPage";
import { PartsPage } from "./pages/PartsPage";
import { PrivacyPolicyPage } from "./pages/PrivacyPolicyPage";
import { ReportsPage } from "./pages/ReportsPage";
import { ServiceSchedulesPage } from "./pages/ServiceSchedulesPage";
import { SettingsPage } from "./pages/SettingsPage";
import { TermsOfServicePage } from "./pages/TermsOfServicePage";
import { VehicleDetailPage } from "./pages/VehicleDetailPage";
import { VehiclesPage } from "./pages/VehiclesPage";
import { VendorsPage } from "./pages/VendorsPage";
import { WarrantiesPage } from "./pages/WarrantiesPage";
import { WorkOrdersPage } from "./pages/WorkOrdersPage";

export type Page =
  | "dashboard"
  | "vehicles"
  | "maintenance"
  | "maintenance-history"
  | "service-schedules"
  | "vehicle-detail"
  | "parts"
  | "work-orders"
  | "vendors"
  | "warranties"
  | "reports"
  | "settings"
  | "invite-accept"
  | "dev-portal"
  | "privacy-policy"
  | "terms";

const DEV_KEY = "FLEETGUARD_DEV_2026";
const SIGNUP_INTENT_KEY = "fleetguard_signup_intent";

function getInviteToken(): string | null {
  const params = new URLSearchParams(window.location.search);
  return params.get("inviteToken");
}

function checkDevAccess(): boolean {
  const params = new URLSearchParams(window.location.search);
  const urlKey = params.get("devKey");
  if (urlKey === DEV_KEY) {
    localStorage.setItem("devKey", urlKey);
    return true;
  }
  return localStorage.getItem("devKey") === DEV_KEY;
}

function isProfileEmpty(profile: unknown): boolean {
  return (
    profile === null ||
    profile === undefined ||
    (Array.isArray(profile) && profile.length === 0)
  );
}

interface NavState {
  page: Page;
  params?: Record<string, unknown>;
}

function AppContent() {
  const { identity, isInitializing, login } = useInternetIdentity();
  const { isFetching: actorFetching } = useActor();
  const { data: profile, isLoading: profileLoading } = useCallerProfile();
  const { data: companySettings, isLoading: companySettingsLoading } =
    useGetCompanySettings();
  const [nav, setNav] = useState<NavState>({ page: "dashboard" });
  const [isDevPortal] = useState(() => checkDevAccess());
  const [inviteToken] = useState(() => getInviteToken());
  const [rejectedError, setRejectedError] = useState<string | null>(null);

  const navigate = (page: Page, params?: Record<string, unknown>) => {
    setNav({ page, params });
  };

  const handleSignUp = () => {
    sessionStorage.setItem(SIGNUP_INTENT_KEY, "1");
    login();
  };

  // Dev portal — Internet Identity ONLY
  if (isDevPortal) {
    // If not authenticated or not using Internet Identity, show error
    if (!isInitializing && !identity) {
      return (
        <div className="min-h-screen bg-background flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-card rounded-xl border border-border p-8 text-center space-y-4">
            <div className="w-12 h-12 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center mx-auto">
              <span className="text-2xl">🔐</span>
            </div>
            <h2 className="text-xl font-semibold text-foreground">
              Developer Dashboard
            </h2>
            <p className="text-muted-foreground text-sm">
              Developer Dashboard requires Internet Identity login. Please sign
              in with Internet Identity to continue.
            </p>
            <button
              type="button"
              data-ocid="dev.login.button"
              onClick={login}
              className="w-full bg-amber-500 hover:bg-amber-600 text-white font-semibold py-2.5 px-4 rounded-lg transition-colors"
            >
              Sign in with Internet Identity
            </button>
          </div>
        </div>
      );
    }
    if (isInitializing) {
      return (
        <div className="min-h-screen bg-background flex items-center justify-center">
          <div className="space-y-3 w-64">
            <Skeleton className="h-8 w-40 mx-auto" />
            <Skeleton className="h-4 w-full" />
          </div>
        </div>
      );
    }
    return <DevPortalPage />;
  }

  if (isInitializing) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="space-y-3 w-64">
          <Skeleton className="h-8 w-40 mx-auto" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4 mx-auto" />
        </div>
      </div>
    );
  }

  if (!identity) {
    return <LoginPage onSignUp={handleSignUp} onNavigate={navigate} />;
  }

  // Wait for actor AND dependent queries before making routing decisions.
  if (actorFetching || profileLoading || companySettingsLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="space-y-3 w-64">
          <Skeleton className="h-8 w-40 mx-auto" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4 mx-auto" />
        </div>
      </div>
    );
  }

  // Show rejected error if applicable
  if (rejectedError) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-card rounded-xl border border-destructive/30 p-8 text-center space-y-4">
          <div className="w-12 h-12 rounded-full bg-destructive/10 flex items-center justify-center mx-auto">
            <span className="text-2xl">⛔</span>
          </div>
          <h2 className="text-xl font-semibold text-foreground">
            Account Rejected
          </h2>
          <p className="text-muted-foreground text-sm">{rejectedError}</p>
        </div>
      </div>
    );
  }

  // Sign-up intent: force onboarding if no company settings yet
  if (
    sessionStorage.getItem(SIGNUP_INTENT_KEY) === "1" &&
    (isProfileEmpty(profile) || companySettings === null)
  ) {
    sessionStorage.removeItem(SIGNUP_INTENT_KEY);
    return <OnboardingPage />;
  }

  // Invited user — has token but no profile yet
  if (inviteToken && isProfileEmpty(profile)) {
    return <InviteAcceptPage token={inviteToken} />;
  }

  // New user — no profile, no invite token -> admin onboarding
  if (isProfileEmpty(profile)) {
    return <OnboardingPage />;
  }

  const renderPage = () => {
    switch (nav.page) {
      case "dashboard":
        return <DashboardPage onNavigate={navigate} />;
      case "vehicles":
        return <VehiclesPage onNavigate={navigate} />;
      case "maintenance":
      case "maintenance-history":
        return <MaintenancePage />;
      case "service-schedules":
        return <ServiceSchedulesPage />;
      case "parts":
        return <PartsPage />;
      case "work-orders":
        return <WorkOrdersPage />;
      case "vendors":
        return <VendorsPage />;
      case "warranties":
        return <WarrantiesPage />;
      case "reports":
        return <ReportsPage />;
      case "settings":
        return <SettingsPage onNavigate={navigate} />;
      case "privacy-policy":
        return <PrivacyPolicyPage onNavigate={navigate} />;
      case "terms":
        return <TermsOfServicePage onNavigate={navigate} />;
      case "vehicle-detail": {
        const vehicleId = nav.params?.vehicleId as bigint | undefined;
        if (!vehicleId) return <DashboardPage onNavigate={navigate} />;
        return (
          <VehicleDetailPage vehicleId={vehicleId} onNavigate={navigate} />
        );
      }
      default:
        return <DashboardPage onNavigate={navigate} />;
    }
  };

  return (
    <RejectionGuard
      companyName={companySettings?.companyName}
      onRejected={(msg) => {
        setRejectedError(msg);
        toast.error(msg);
      }}
    >
      <Layout currentPage={nav.page} onNavigate={navigate}>
        {renderPage()}
      </Layout>
    </RejectionGuard>
  );
}

// Component that periodically checks approval status and forces logout on rejection
function RejectionGuard({
  children,
  companyName,
  onRejected,
}: {
  children: React.ReactNode;
  companyName?: string;
  onRejected: (msg: string) => void;
}) {
  const { actor } = useActor();
  const { clear } = useInternetIdentity();

  useEffect(() => {
    if (!actor || !companyName) return;

    let cancelled = false;

    const check = async () => {
      try {
        const status = await actor.getCompanyApprovalStatus(companyName);
        if (!cancelled && status === "rejected") {
          clear();
          onRejected(
            "Your company account has been rejected. Please contact support.",
          );
        }
      } catch {
        // Ignore errors - don't block the app
      }
    };

    check();
    const interval = setInterval(check, 30000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [actor, companyName, clear, onRejected]);

  return <>{children}</>;
}

export default function App() {
  return (
    <>
      <AppContent />
      <Toaster position="top-right" richColors />
    </>
  );
}
