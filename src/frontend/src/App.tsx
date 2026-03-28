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
} from "./hooks/useQueries";
import { seedData, seedParts } from "./lib/seed";
import { DashboardPage } from "./pages/DashboardPage";
import { DevPortalPage } from "./pages/DevPortalPage";
import { InviteAcceptPage } from "./pages/InviteAcceptPage";
import { LoginPage } from "./pages/LoginPage";
import { MaintenancePage } from "./pages/MaintenancePage";
import { OnboardingPage } from "./pages/OnboardingPage";
import { PartsPage } from "./pages/PartsPage";
import { SettingsPage } from "./pages/SettingsPage";
import { VehicleDetailPage } from "./pages/VehicleDetailPage";
import { VehiclesPage } from "./pages/VehiclesPage";

export type Page =
  | "dashboard"
  | "vehicles"
  | "maintenance"
  | "vehicle-detail"
  | "parts"
  | "settings"
  | "invite-accept"
  | "dev-portal";

const DEV_KEY = "FLEETGUARD_DEV_2026";

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

interface NavState {
  page: Page;
  params?: Record<string, unknown>;
}

function AppContent() {
  const { identity, isInitializing } = useInternetIdentity();
  const { actor } = useActor();
  const { data: profile, isLoading: profileLoading } = useCallerProfile();
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
    return <LoginPage />;
  }

  if (profileLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Skeleton className="h-8 w-48" />
      </div>
    );
  }

  // Invited user — has token but no profile yet
  if (inviteToken && (profile === null || profile === undefined)) {
    return <InviteAcceptPage token={inviteToken} />;
  }

  // New user — no profile, no invite token → admin onboarding
  if (profile === null || profile === undefined) {
    return <OnboardingPage />;
  }

  const renderPage = () => {
    switch (nav.page) {
      case "dashboard":
        return <DashboardPage onNavigate={navigate} />;
      case "vehicles":
        return <VehiclesPage onNavigate={navigate} />;
      case "maintenance":
        return <MaintenancePage />;
      case "parts":
        return <PartsPage />;
      case "settings":
        return <SettingsPage />;
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
