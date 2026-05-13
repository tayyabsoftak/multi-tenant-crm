import { create } from "zustand";

interface NoteState {
  customerId: string | null;
  setCustomerId: (id: string | null) => void;
}

export const useNoteStore = create<NoteState>((set) => ({
  customerId: null,
  setCustomerId: (id) => set({ customerId: id }),
}));
