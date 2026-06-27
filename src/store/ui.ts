import { create } from 'zustand'

interface UIState {
  modalOpen: boolean
  openModal: () => void
  closeModal: () => void
}

export const useUIStore = create<UIState>((set) => ({
  modalOpen: false,
  openModal: () => set({ modalOpen: true }),
  closeModal: () => set({ modalOpen: false }),
}))
