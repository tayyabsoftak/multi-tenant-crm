import { create } from "zustand";
import type { SessionUser } from "@/types";

interface AuthStoreState {
  user: SessionUser | null;
  setUser: (user: SessionUser | null) => void;
}

export const useAuthStore = create<AuthStoreState>((set) => ({
  user: null,
  setUser: (user) => set({ user }),
}));
