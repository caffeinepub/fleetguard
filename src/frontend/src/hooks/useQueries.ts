import { Principal } from "@icp-sdk/core/principal";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type {
  CompanySettings,
  CompanyUserInfo,
  FleetRole,
  InviteToken,
  MaintenanceRecordFull,
  PartFull as Part,
  UserProfile,
  Vehicle,
} from "../backend";
import type { UserRole } from "../backend";
import { useActor } from "./useActor";

// SubscriptionRecord is not yet in backend.d.ts — declare locally
export interface SubscriptionRecord {
  companyName: string;
  status: string;
  startDate: [] | [bigint];
  updatedAt: bigint;
}

export function useDashboardStats() {
  const { actor, isFetching } = useActor();
  return useQuery({
    queryKey: ["dashboardStats"],
    queryFn: async () => {
      if (!actor) return null;
      return actor.getDashboardStats();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useAllVehicles() {
  const { actor, isFetching } = useActor();
  return useQuery({
    queryKey: ["vehicles"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getAllVehicles();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useVehicle(id: bigint) {
  const { actor, isFetching } = useActor();
  return useQuery({
    queryKey: ["vehicle", id.toString()],
    queryFn: async () => {
      if (!actor) return null;
      return actor.getVehicle(id);
    },
    enabled: !!actor && !isFetching && id >= 0n,
  });
}

export function useAllMaintenanceRecords() {
  const { actor, isFetching } = useActor();
  return useQuery({
    queryKey: ["maintenanceRecords"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getAllMaintenanceRecords();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useMaintenanceByVehicle(vehicleId: bigint) {
  const { actor, isFetching } = useActor();
  return useQuery({
    queryKey: ["maintenanceByVehicle", vehicleId.toString()],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getMaintenanceRecordsByVehicle(vehicleId);
    },
    enabled: !!actor && !isFetching && vehicleId >= 0n,
  });
}

export function useUpcomingMaintenance() {
  const { actor, isFetching } = useActor();
  return useQuery({
    queryKey: ["upcomingMaintenance"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getUpcomingMaintenance();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useOverdueMaintenance() {
  const { actor, isFetching } = useActor();
  return useQuery({
    queryKey: ["overdueMaintenance"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getOverdueMaintenance();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useCallerProfile() {
  const { actor, isFetching } = useActor();
  return useQuery({
    queryKey: ["callerProfile"],
    queryFn: async () => {
      if (!actor) return null;
      return actor.getCallerUserProfile();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useIsAdmin() {
  const { actor, isFetching } = useActor();
  return useQuery({
    queryKey: ["isAdmin"],
    queryFn: async () => {
      if (!actor) return false;
      return actor.isCallerAdmin();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useCallerUserRole() {
  const { actor, isFetching } = useActor();
  return useQuery({
    queryKey: ["callerUserRole"],
    queryFn: async () => {
      if (!actor) return null;
      return actor.getCallerUserRole();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useCallerFleetRole() {
  const { actor, isFetching } = useActor();
  return useQuery({
    queryKey: ["callerFleetRole"],
    queryFn: async () => {
      if (!actor) return null;
      return actor.getCallerFleetRole();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useInviteTokens() {
  const { actor, isFetching } = useActor();
  return useQuery<InviteToken[]>({
    queryKey: ["inviteTokens"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getInviteTokens();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useCreateInviteToken() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ email, role }: { email: string; role: FleetRole }) => {
      if (!actor) throw new Error("Not connected");
      return actor.createInviteToken(email, role);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["inviteTokens"] }),
  });
}

export function useRedeemInviteToken() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (token: string) => {
      if (!actor) throw new Error("Not connected");
      return actor.redeemInviteToken(token);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["callerFleetRole"] });
      qc.invalidateQueries({ queryKey: ["callerUserRole"] });
    },
  });
}

export function useAllCompanyRegistrations() {
  const { actor, isFetching } = useActor();
  return useQuery<CompanySettings[]>({
    queryKey: ["allCompanyRegistrations"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getAllCompanyRegistrations();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useSaveProfile() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (profile: UserProfile) => {
      if (!actor) throw new Error("Not connected");
      return actor.saveCallerUserProfile(profile);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["callerProfile"] }),
  });
}

export function useAssignUserRole() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      principal,
      role,
    }: { principal: string; role: UserRole }) => {
      if (!actor) throw new Error("Not connected");
      return actor.assignCallerUserRole(Principal.fromText(principal), role);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["callerUserRole"] }),
  });
}

export function useCreateVehicle() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (v: Vehicle) => {
      if (!actor) throw new Error("Not connected");
      return actor.createVehicle(v);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["vehicles"] });
      qc.invalidateQueries({ queryKey: ["dashboardStats"] });
    },
  });
}

export function useUpdateVehicle() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, vehicle }: { id: bigint; vehicle: Vehicle }) => {
      if (!actor) throw new Error("Not connected");
      return actor.updateVehicle(id, vehicle);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["vehicles"] });
      qc.invalidateQueries({ queryKey: ["dashboardStats"] });
    },
  });
}

export function useDeleteVehicle() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: bigint) => {
      if (!actor) throw new Error("Not connected");
      return actor.deleteVehicle(id);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["vehicles"] });
      qc.invalidateQueries({ queryKey: ["dashboardStats"] });
      qc.invalidateQueries({ queryKey: ["maintenanceRecords"] });
    },
  });
}

export function useBulkCreateVehicles() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (vehicles: Vehicle[]) => {
      if (!actor) throw new Error("Not connected");
      return actor.bulkCreateVehicles(vehicles);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["vehicles"] });
      qc.invalidateQueries({ queryKey: ["dashboardStats"] });
    },
  });
}

export function useCreateMaintenance() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (r: MaintenanceRecordFull) => {
      if (!actor) throw new Error("Not connected");
      // Decrement inventory for each part used
      const partsUsed = r.partsUsed ?? [];
      if (partsUsed.length > 0) {
        const allParts = await actor.getAllParts();
        const partQuantities: Record<string, number> = {};
        if ((r as any).partQuantities && (r as any).partQuantities.length > 0) {
          for (const pq of (r as any).partQuantities) {
            partQuantities[pq.partId.toString()] = Number(pq.quantity);
          }
        }
        for (const partId of partsUsed) {
          const part = allParts.find((p) => p.id === partId);
          if (part && part.quantityInStock > 0n) {
            const decrementQty = BigInt(partQuantities[partId.toString()] ?? 1);
            const newQty =
              part.quantityInStock >= decrementQty
                ? part.quantityInStock - decrementQty
                : 0n;
            await actor.updatePart(partId, {
              ...part,
              quantityInStock: newQty,
            });
          }
        }
      }
      return actor.createMaintenanceRecord(r);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["maintenanceRecords"] });
      qc.invalidateQueries({ queryKey: ["maintenanceByVehicle"] });
      qc.invalidateQueries({ queryKey: ["upcomingMaintenance"] });
      qc.invalidateQueries({ queryKey: ["overdueMaintenance"] });
      qc.invalidateQueries({ queryKey: ["dashboardStats"] });
      qc.invalidateQueries({ queryKey: ["parts"] });
      qc.invalidateQueries({ queryKey: ["lowStockParts"] });
    },
  });
}

export function useUpdateMaintenance() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      record,
      previousPartIds = [] as bigint[],
    }: {
      id: bigint;
      record: MaintenanceRecordFull;
      previousPartIds?: bigint[];
    }) => {
      if (!actor) throw new Error("Not connected");
      // Find newly added parts (in record.partsUsed but not in previousPartIds)
      const newParts = (record.partsUsed ?? []).filter(
        (pid) => !previousPartIds.some((prev) => prev === pid),
      );
      // Decrement each new part in inventory
      if (newParts.length > 0) {
        const allParts = await actor.getAllParts();
        const partQuantities: Record<string, number> = {};
        if (
          (record as any).partQuantities &&
          (record as any).partQuantities.length > 0
        ) {
          for (const pq of (record as any).partQuantities) {
            partQuantities[pq.partId.toString()] = Number(pq.quantity);
          }
        }
        for (const partId of newParts) {
          const part = allParts.find((p) => p.id === partId);
          if (part && part.quantityInStock > 0n) {
            const decrementQty = BigInt(partQuantities[partId.toString()] ?? 1);
            const newQty =
              part.quantityInStock >= decrementQty
                ? part.quantityInStock - decrementQty
                : 0n;
            await actor.updatePart(partId, {
              ...part,
              quantityInStock: newQty,
            });
          }
        }
      }
      return actor.updateMaintenanceRecord(id, record);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["maintenanceRecords"] });
      qc.invalidateQueries({ queryKey: ["maintenanceByVehicle"] });
      qc.invalidateQueries({ queryKey: ["upcomingMaintenance"] });
      qc.invalidateQueries({ queryKey: ["overdueMaintenance"] });
      qc.invalidateQueries({ queryKey: ["parts"] });
      qc.invalidateQueries({ queryKey: ["lowStockParts"] });
    },
  });
}

// Parts
export function useAllParts() {
  const { actor, isFetching } = useActor();
  return useQuery<Part[]>({
    queryKey: ["parts"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getAllParts();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useGetLowStockParts() {
  const { actor, isFetching } = useActor();
  return useQuery<Part[]>({
    queryKey: ["lowStockParts"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getLowStockParts();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useCreatePart() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (part: Part) => {
      if (!actor) throw new Error("Not connected");
      return actor.createPart(part);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["parts"] });
      qc.invalidateQueries({ queryKey: ["lowStockParts"] });
      qc.invalidateQueries({ queryKey: ["dashboardStats"] });
    },
  });
}

export function useUpdatePart() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, part }: { id: bigint; part: Part }) => {
      if (!actor) throw new Error("Not connected");
      return actor.updatePart(id, part);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["parts"] });
      qc.invalidateQueries({ queryKey: ["lowStockParts"] });
      qc.invalidateQueries({ queryKey: ["dashboardStats"] });
    },
  });
}

export function useDeletePart() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: bigint) => {
      if (!actor) throw new Error("Not connected");
      return actor.deletePart(id);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["parts"] });
      qc.invalidateQueries({ queryKey: ["lowStockParts"] });
      qc.invalidateQueries({ queryKey: ["dashboardStats"] });
    },
  });
}

// Company Settings
export function useGetCompanySettings() {
  const { actor, isFetching } = useActor();
  return useQuery<CompanySettings | null>({
    queryKey: ["companySettings"],
    queryFn: async () => {
      if (!actor) return null;
      return actor.getCompanySettings();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useSaveCompanySettings() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (settings: CompanySettings) => {
      if (!actor) throw new Error("Not connected");
      return actor.saveCompanySettings(settings);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["companySettings"] }),
  });
}

// Subscription
export function useUpdateSubscriptionStatus() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      companyName,
      status,
      startDate,
    }: { companyName: string; status: string; startDate?: bigint }) => {
      if (!actor) throw new Error("Not connected");
      return (actor as any).updateSubscriptionStatus(
        companyName,
        status,
        startDate ? [startDate] : [],
      );
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["allSubscriptions"] });
      qc.invalidateQueries({ queryKey: ["subscriptionStatus"] });
    },
  });
}

export function useGetSubscriptionStatus(companyName: string | undefined) {
  const { actor, isFetching } = useActor();
  return useQuery<SubscriptionRecord | null>({
    queryKey: ["subscriptionStatus", companyName],
    enabled: !!actor && !isFetching && !!companyName,
    queryFn: async (): Promise<SubscriptionRecord | null> => {
      if (!actor || !companyName) return null;
      const result = (await (actor as any).getSubscriptionStatus(
        companyName,
      )) as [] | [SubscriptionRecord];
      return result.length > 0 ? (result[0] as SubscriptionRecord) : null;
    },
  });
}

export function useGetAllSubscriptions() {
  const { actor, isFetching } = useActor();
  return useQuery<SubscriptionRecord[]>({
    queryKey: ["allSubscriptions"],
    enabled: !!actor && !isFetching,
    queryFn: async () => {
      if (!actor) return [];
      return (actor as any).getAllSubscriptions() as Promise<
        SubscriptionRecord[]
      >;
    },
  });
}

export function useGetDefaultCurrency() {
  const { actor, isFetching } = useActor();
  return useQuery<string>({
    queryKey: ["defaultCurrency"],
    enabled: !!actor && !isFetching,
    queryFn: async () => {
      if (!actor) return "CAD";
      return (actor as any).getDefaultCurrency() as Promise<string>;
    },
  });
}

export function useSaveDefaultCurrency() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (currency: string) => {
      if (!actor) throw new Error("Not connected");
      return (actor as any).saveDefaultCurrency(currency);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["defaultCurrency"] }),
  });
}

// Work Orders
export function useAllWorkOrders() {
  const { actor, isFetching } = useActor();
  return useQuery({
    queryKey: ["workOrders"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getAllWorkOrders();
    },
    enabled: !!actor && !isFetching,
  });
}

// Vendors
export function useAllVendors() {
  const { actor, isFetching } = useActor();
  return useQuery({
    queryKey: ["vendors"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getAllVendors();
    },
    enabled: !!actor && !isFetching,
  });
}

// Warranties
export function useAllWarranties() {
  const { actor, isFetching } = useActor();
  return useQuery({
    queryKey: ["warranties"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getAllWarranties();
    },
    enabled: !!actor && !isFetching,
  });
}

// Dev portal — devKey authenticated hooks
export function useAllCompanyRegistrationsWithKey(devKey: string) {
  const { actor, isFetching } = useActor();
  return useQuery<CompanySettings[]>({
    queryKey: ["allCompanyRegistrations", devKey],
    queryFn: async () => {
      if (!actor || !devKey) return [];
      return (actor as any).getAllCompanyRegistrationsWithKey(devKey);
    },
    enabled: !!actor && !isFetching && !!devKey,
  });
}

export function useAllSubscriptionsWithKey(devKey: string) {
  const { actor, isFetching } = useActor();
  return useQuery<SubscriptionRecord[]>({
    queryKey: ["allSubscriptions", devKey],
    queryFn: async () => {
      if (!actor || !devKey) return [];
      return (actor as any).getAllSubscriptionsWithKey(devKey);
    },
    enabled: !!actor && !isFetching && !!devKey,
  });
}

export function useUpdateSubscriptionStatusWithKey() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation<
    unknown,
    Error,
    { devKey: string; companyName: string; status: string; startDate?: bigint }
  >({
    mutationFn: ({ devKey, companyName, status, startDate }) => {
      if (!actor) throw new Error("Not connected");
      return (actor as any).updateSubscriptionStatusWithKey(
        devKey,
        companyName,
        status,
        startDate ? [startDate] : [],
      );
    },
    onSuccess: (_: unknown, { devKey }: { devKey: string }) => {
      qc.invalidateQueries({ queryKey: ["allSubscriptions", devKey] });
      qc.invalidateQueries({ queryKey: ["allCompanyRegistrations", devKey] });
    },
  });
}

export function useAllCompanyApprovalsWithKey(devKey: string) {
  const { actor, isFetching } = useActor();
  return useQuery<Array<[string, string]>>({
    queryKey: ["companyApprovals", devKey],
    queryFn: async () => {
      if (!actor || !devKey) return [];
      return (actor as any).getAllCompanyApprovalsWithKey(devKey);
    },
    enabled: !!actor && !isFetching && !!devKey,
  });
}

export function useApproveCompanyWithKey() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation<unknown, Error, { devKey: string; companyName: string }>({
    mutationFn: (vars) => {
      if (!actor) throw new Error("Not connected");
      return (actor as any).approveCompanyWithKey(
        vars.devKey,
        vars.companyName,
      );
    },
    onSuccess: (_: unknown, vars) => {
      qc.invalidateQueries({ queryKey: ["companyApprovals", vars.devKey] });
    },
  });
}

export function useRejectCompanyWithKey() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation<unknown, Error, { devKey: string; companyName: string }>({
    mutationFn: (vars) => {
      if (!actor) throw new Error("Not connected");
      return (actor as any).rejectCompanyWithKey(vars.devKey, vars.companyName);
    },
    onSuccess: (_: unknown, vars) => {
      qc.invalidateQueries({ queryKey: ["companyApprovals", vars.devKey] });
    },
  });
}

// Discount codes
export interface DiscountCodeRecord {
  id: bigint;
  code: string;
  discountType: string; // "percent" | "months_free"
  value: bigint;
  description: string;
  createdAt: bigint;
  usedCount: bigint;
}

export function useAllDiscountCodesWithKey(devKey: string) {
  const { actor, isFetching } = useActor();
  return useQuery<DiscountCodeRecord[]>({
    queryKey: ["discountCodes", devKey],
    queryFn: async () => {
      if (!actor || !devKey) return [];
      return (actor as any).getAllDiscountCodesWithKey(devKey);
    },
    enabled: !!actor && !isFetching && !!devKey,
  });
}

export function useCreateDiscountCodeWithKey() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation<
    bigint,
    Error,
    {
      devKey: string;
      discount: Omit<DiscountCodeRecord, "id" | "createdAt" | "usedCount">;
    }
  >({
    mutationFn: ({ devKey, discount }) => {
      if (!actor) throw new Error("Not connected");
      return (actor as any).createDiscountCodeWithKey(devKey, {
        id: 0n,
        createdAt: BigInt(Date.now()) * 1_000_000n,
        usedCount: 0n,
        ...discount,
      });
    },
    onSuccess: (_: unknown, { devKey }: { devKey: string }) => {
      qc.invalidateQueries({ queryKey: ["discountCodes", devKey] });
    },
  });
}

export function useDeleteDiscountCodeWithKey() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation<unknown, Error, { devKey: string; id: bigint }>({
    mutationFn: ({ devKey, id }) => {
      if (!actor) throw new Error("Not connected");
      return (actor as any).deleteDiscountCodeWithKey(devKey, id);
    },
    onSuccess: (_: unknown, { devKey }: { devKey: string }) => {
      qc.invalidateQueries({ queryKey: ["discountCodes", devKey] });
    },
  });
}

export function useStartTrialWithKey() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation<
    unknown,
    Error,
    { devKey: string; companyName: string; trialDays?: bigint }
  >({
    mutationFn: ({ devKey, companyName, trialDays = 7n }) => {
      if (!actor) throw new Error("Not connected");
      return (actor as any).startTrialWithKey(devKey, companyName, trialDays);
    },
    onSuccess: (_: unknown, { devKey }: { devKey: string }) => {
      qc.invalidateQueries({ queryKey: ["allSubscriptions", devKey] });
    },
  });
}

// Company Users — fetch all users in the caller's company with their profiles + fleet roles
export function useCompanyUsers() {
  const { actor, isFetching } = useActor();
  return useQuery<CompanyUserInfo[]>({
    queryKey: ["companyUsers"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getCompanyUsers();
    },
    enabled: !!actor && !isFetching,
  });
}

// Set a user's fleet role — admin only
export function useSetUserFleetRole() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ user, role }: { user: Principal; role: FleetRole }) => {
      if (!actor) throw new Error("Not connected");
      return actor.setUserFleetRole(user, role);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["companyUsers"] }),
  });
}
