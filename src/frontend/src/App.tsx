import { Skeleton } from "@/components/ui/skeleton";
import { Toaster } from "@/components/ui/sonner";
import { useEffect, useState } from "react";
import { Layout } from "./components/Layout";
import { useActor } from "./hooks/useActor";
import { useInternetIdentity } from "./hooks/useInternetIdentity";
import {
  useAllParts,
  useAllVehicles,
  useCallerProfile,
  useGetCompanySettings,
} from "./hooks/useQueries";
import { seedData, seedParts } from "./lib/seed";
import { DashboardPage } from "./pages/DashboardPage";
import { DevPortalPage } from "./pages/DevPortalPage";
import { GroupChatPage } from "./pages/GroupChatPage";
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
  | "group-chat"
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
  const { actor, isFetching: actorFetching } = useActor();
  const { data: profile, isLoading: profileLoading } = useCallerProfile();
  const { data: companySettings, isLoading: companySettingsLoading } =
    useGetCompanySettings();
  const { data: vehicles, isLoading: vehiclesLoading } = useAllVehicles();
  const { data: parts, isLoading: partsLoading } = useAllParts();
  const [nav, setNav] = useState<NavState>({ page: "dashboard" });
  const [seeded, setSeeded] = useState(false);
  const [partsSeeded, setPartsSeeded] = useState(false);
  const [isDevPortal] = useState(() => checkDevAccess());
  const [inviteToken] = useState(() => getInviteToken());

  const navigate = (page: Page, params?: Record<string, unknown>) => {
    setNav({ page, params });
  };

  const handleSignUp = () => {
    sessionStorage.setItem(SIGNUP_INTENT_KEY, "1");
    login();
  };

  // Seed vehicles + maintenance data on first load
  useEffect(() => {
    if (!identity || !actor || seeded || vehiclesLoading) return;
    if (vehicles && vehicles.length === 0) {
      setSeeded(true);
      seedData(actor).catch(console.error);
    } else if (vehicles && vehicles.length > 0) {
      setSeeded(true);
    }
  }, [identity, actor, vehicles, vehiclesLoading, seeded]);

  // Seed parts data separately
  useEffect(() => {
    if (!identity || !actor || partsSeeded || partsLoading) return;
    if (parts && parts.length === 0) {
      setPartsSeeded(true);
      seedParts(actor).catch(console.error);
    } else if (parts && parts.length > 0) {
      setPartsSeeded(true);
    }
  }, [identity, actor, parts, partsLoading, partsSeeded]);

  // Dev portal — no auth needed
  if (isDevPortal) {
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
  // Without actorFetching guard, profile is undefined (query disabled while actor
  // loads) and returning users get incorrectly routed to onboarding.
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
      case "group-chat":
        return <GroupChatPage />;
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
    <Layout currentPage={nav.page} onNavigate={navigate}>
      {renderPage()}
    </Layout>
  );
}

export default function App() {
  return (
    <>
      <AppContent />
      <Toaster position="top-right" richColors />
    </>
  );
}
