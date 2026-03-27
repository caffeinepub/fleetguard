import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { MaintenanceRecord, UserProfile, Vehicle } from "../backend";
import { useActor } from "./useActor";

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

export function useCreateMaintenance() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (r: MaintenanceRecord) => {
      if (!actor) throw new Error("Not connected");
      return actor.createMaintenanceRecord(r);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["maintenanceRecords"] });
      qc.invalidateQueries({ queryKey: ["maintenanceByVehicle"] });
      qc.invalidateQueries({ queryKey: ["upcomingMaintenance"] });
      qc.invalidateQueries({ queryKey: ["overdueMaintenance"] });
      qc.invalidateQueries({ queryKey: ["dashboardStats"] });
    },
  });
}

export function useUpdateMaintenance() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, record }: { id: bigint; record: MaintenanceRecord }) => {
      if (!actor) throw new Error("Not connected");
      return actor.updateMaintenanceRecord(id, record);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["maintenanceRecords"] });
      qc.invalidateQueries({ queryKey: ["maintenanceByVehicle"] });
      qc.invalidateQueries({ queryKey: ["upcomingMaintenance"] });
      qc.invalidateQueries({ queryKey: ["overdueMaintenance"] });
    },
  });
}
