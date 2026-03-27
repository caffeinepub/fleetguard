import { Button } from "@/components/ui/button";
import { BarChart3, Shield, Truck, Wrench } from "lucide-react";
import { Loader2 } from "lucide-react";
import { useInternetIdentity } from "../hooks/useInternetIdentity";

export function LoginPage() {
  const { login, isLoggingIn } = useInternetIdentity();

  return (
    <div
      className="min-h-screen flex"
      style={{
        background:
          "linear-gradient(135deg, oklch(0.24 0.09 255) 0%, oklch(0.33 0.11 255) 50%, oklch(0.45 0.14 255) 100%)",
      }}
    >
      {/* Left panel */}
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

      {/* Right panel */}
      <div className="flex-1 flex items-center justify-center p-8">
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
                "Sign in with Internet Identity"
              )}
            </Button>

            <p className="text-center text-xs text-muted-foreground mt-6">
              Secured by the Internet Computer blockchain
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
