import { create } from "zustand";

type ModalKey = "none" | "createCustomer" | "editCustomer" | "assignCustomer" | "inviteUser";

interface UiStoreState {
  sidebarMobileOpen: boolean;
  activeModal: ModalKey;
  modalPayload: Record<string, unknown> | null;
  setSidebarMobileOpen: (v: boolean) => void;
  openModal: (key: ModalKey, payload?: Record<string, unknown>) => void;
  closeModal: () => void;
}

export const useUIStore = create<UiStoreState>((set) => ({
  sidebarMobileOpen: false,
  activeModal: "none",
  modalPayload: null,
  setSidebarMobileOpen: (sidebarMobileOpen) => set({ sidebarMobileOpen }),
  openModal: (activeModal, modalPayload) => set({ activeModal, modalPayload: modalPayload ?? null }),
  closeModal: () => set({ activeModal: "none", modalPayload: null }),
}));
