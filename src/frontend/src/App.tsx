import { Skeleton } from "@/components/ui/skeleton";
import { Toaster } from "@/components/ui/sonner";
import { useEffect, useState } from "react";
import { Layout } from "./components/Layout";
import { useActor } from "./hooks/useActor";
import { useInternetIdentity } from "./hooks/useInternetIdentity";
import { useAllVehicles, useCallerProfile } from "./hooks/useQueries";
import { seedData } from "./lib/seed";
import { DashboardPage } from "./pages/DashboardPage";
import { LoginPage } from "./pages/LoginPage";
import { MaintenancePage } from "./pages/MaintenancePage";
import { OnboardingPage } from "./pages/OnboardingPage";
import { VehicleDetailPage } from "./pages/VehicleDetailPage";
import { VehiclesPage } from "./pages/VehiclesPage";

type Page = "dashboard" | "vehicles" | "maintenance" | "vehicle-detail";

interface NavState {
  page: Page;
  params?: Record<string, unknown>;
}

function AppContent() {
  const { identity, isInitializing } = useInternetIdentity();
  const { actor } = useActor();
  const { data: profile, isLoading: profileLoading } = useCallerProfile();
  const { data: vehicles, isLoading: vehiclesLoading } = useAllVehicles();
  const [nav, setNav] = useState<NavState>({ page: "dashboard" });
  const [seeded, setSeeded] = useState(false);

  const navigate = (page: Page, params?: Record<string, unknown>) => {
    setNav({ page, params });
  };

  // Seed data on first load when vehicles list is empty
  useEffect(() => {
    if (!identity || !actor || seeded || vehiclesLoading) return;
    if (vehicles && vehicles.length === 0) {
      setSeeded(true);
      seedData(actor).catch(console.error);
    } else if (vehicles && vehicles.length > 0) {
      setSeeded(true);
    }
  }, [identity, actor, vehicles, vehiclesLoading, seeded]);

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
