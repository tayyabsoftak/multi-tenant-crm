import { create } from "zustand";

export interface OrgUser {
  id: string;
  name: string;
  email: string;
  role: string;
  createdAt: string;
  assignedCustomerCount?: number;
}

interface UserStoreState {
  users: OrgUser[];
  loading: boolean;
  setUsers: (users: OrgUser[]) => void;
  setLoading: (v: boolean) => void;
}

export const useUserStore = create<UserStoreState>((set) => ({
  users: [],
  loading: false,
  setUsers: (users) => set({ users }),
  setLoading: (loading) => set({ loading }),
}));
