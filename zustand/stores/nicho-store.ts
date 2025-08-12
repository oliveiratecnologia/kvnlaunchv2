import { create } from 'zustand'

// Definir o tipo para o estado do nicho
interface NichoState {
  nicho: string
  setNicho: (nicho: string) => void
}

// Criar o store com a API do Zustand
export const useNichoStore = create<NichoState>((set) => ({
  nicho: '',
  setNicho: (nicho: string) => set({ nicho }),
})) 