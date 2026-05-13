import { create } from "zustand";

interface ActivityFilters {
  entityType: string;
  action: string;
  actorId: string;
  dateFrom: string;
  dateTo: string;
}

interface ActivityStoreState {
  filters: ActivityFilters;
  setFilters: (p: Partial<ActivityFilters>) => void;
  resetFilters: () => void;
}

const initial: ActivityFilters = {
  entityType: "all",
  action: "all",
  actorId: "all",
  dateFrom: "",
  dateTo: "",
};

export const useActivityStore = create<ActivityStoreState>((set) => ({
  filters: initial,
  setFilters: (p) => set((s) => ({ filters: { ...s.filters, ...p } })),
  resetFilters: () => set({ filters: initial }),
}));
