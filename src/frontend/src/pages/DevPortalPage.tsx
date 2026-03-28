import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Code2, LogOut, RefreshCw } from "lucide-react";
import { useAllCompanyRegistrations } from "../hooks/useQueries";

function formatDate(ns: bigint): string {
  const ms = Number(ns / 1_000_000n);
  return new Date(ms).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function truncatePrincipal(p: string) {
  if (p.length <= 16) return p;
  return `${p.slice(0, 8)}...${p.slice(-6)}`;
}

export function DevPortalPage() {
  const { data: companies, isLoading, refetch } = useAllCompanyRegistrations();

  const handleExit = () => {
    localStorage.removeItem("devKey");
    window.location.replace(window.location.origin);
  };

  return (
    <div className="min-h-screen bg-[oklch(0.14_0.02_240)] text-white">
      {/* Top bar */}
      <header className="border-b border-white/10 bg-[oklch(0.12_0.02_240)] px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-amber-500/20 flex items-center justify-center">
            <Code2 className="w-5 h-5 text-amber-400" />
          </div>
          <div>
            <h1 className="text-base font-bold tracking-tight text-white">
              FleetGuard Developer Portal
            </h1>
            <p className="text-xs text-white/40">
              {new Date().toLocaleDateString("en-GB", {
                weekday: "long",
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            className="text-white/60 hover:text-white hover:bg-white/10 gap-2"
            onClick={() => refetch()}
          >
            <RefreshCw className="w-4 h-4" /> Refresh
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="text-white/60 hover:text-white hover:bg-white/10 gap-2"
            onClick={handleExit}
            data-ocid="devportal.secondary_button"
          >
            <LogOut className="w-4 h-4" /> Exit Portal
          </Button>
        </div>
      </header>

      <main className="p-6 space-y-6" data-ocid="devportal.page">
        {/* Stats */}
        <div className="grid grid-cols-3 gap-4">
          {[
            {
              label: "Total Sign-ups",
              value: isLoading ? "—" : String(companies?.length ?? 0),
            },
            { label: "Active Subscriptions", value: "0" },
            {
              label: "Pending Payment",
              value: isLoading ? "—" : String(companies?.length ?? 0),
            },
          ].map((stat) => (
            <div
              key={stat.label}
              className="bg-white/5 border border-white/10 rounded-xl p-5"
            >
              <p className="text-xs text-white/40 uppercase tracking-widest mb-1">
                {stat.label}
              </p>
              <p className="text-3xl font-bold text-white">{stat.value}</p>
            </div>
          ))}
        </div>

        {/* Companies table */}
        <div className="bg-white/5 border border-white/10 rounded-xl overflow-hidden">
          <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-white/80">
              Company Registrations
            </h2>
            <Badge
              variant="outline"
              className="border-amber-400/40 text-amber-400 bg-amber-400/10 text-xs"
            >
              Dev Access
            </Badge>
          </div>

          {isLoading ? (
            <div className="p-6 space-y-3" data-ocid="devportal.loading_state">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-10 w-full bg-white/5" />
              ))}
            </div>
          ) : !companies || companies.length === 0 ? (
            <div className="p-12 text-center" data-ocid="devportal.empty_state">
              <Code2 className="w-10 h-10 text-white/20 mx-auto mb-3" />
              <p className="text-white/40 text-sm">
                No companies registered yet
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="border-white/10 hover:bg-transparent">
                  <TableHead className="text-white/50 font-medium">
                    Company Name
                  </TableHead>
                  <TableHead className="text-white/50 font-medium">
                    Industry
                  </TableHead>
                  <TableHead className="text-white/50 font-medium">
                    Fleet Size
                  </TableHead>
                  <TableHead className="text-white/50 font-medium">
                    Contact Phone
                  </TableHead>
                  <TableHead className="text-white/50 font-medium">
                    Admin Principal
                  </TableHead>
                  <TableHead className="text-white/50 font-medium">
                    Signup Date
                  </TableHead>
                  <TableHead className="text-white/50 font-medium">
                    Payment Status
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody data-ocid="devportal.table">
                {companies.map((company, idx) => (
                  <TableRow
                    key={company.adminPrincipal}
                    className="border-white/10 hover:bg-white/5"
                    data-ocid={`devportal.item.${idx + 1}`}
                  >
                    <TableCell className="font-medium text-white">
                      {company.companyName}
                    </TableCell>
                    <TableCell className="text-white/60">
                      {company.industry}
                    </TableCell>
                    <TableCell className="text-white/60">
                      {company.fleetSize}
                    </TableCell>
                    <TableCell className="text-white/60">
                      {company.contactPhone || "—"}
                    </TableCell>
                    <TableCell className="text-white/50 font-mono text-xs">
                      {truncatePrincipal(company.adminPrincipal)}
                    </TableCell>
                    <TableCell className="text-white/60">
                      {company.createdAt ? formatDate(company.createdAt) : "—"}
                    </TableCell>
                    <TableCell>
                      <Badge className="bg-amber-500/20 text-amber-400 border-amber-400/30 hover:bg-amber-500/20 text-xs whitespace-nowrap">
                        Pending — subscription coming soon
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>
      </main>
    </div>
  );
}
