import { create } from "zustand";

interface CustomerStoreState {
  search: string;
  status: "all" | "active" | "unassigned" | "deleted";
  page: number;
  pageSize: number;
  setSearch: (v: string) => void;
  setStatus: (v: CustomerStoreState["status"]) => void;
  setPage: (p: number) => void;
  setPageSize: (n: number) => void;
  resetFilters: () => void;
}

export const useCustomerStore = create<CustomerStoreState>((set) => ({
  search: "",
  status: "all",
  page: 1,
  pageSize: 10,
  setSearch: (search) => set({ search, page: 1 }),
  setStatus: (status) => set({ status, page: 1 }),
  setPage: (page) => set({ page }),
  setPageSize: (pageSize) => set({ pageSize, page: 1 }),
  resetFilters: () => set({ search: "", status: "all", page: 1, pageSize: 10 }),
}));
