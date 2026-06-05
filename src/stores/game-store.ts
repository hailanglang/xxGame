import { create } from "zustand"
import { persist, createJSONStorage } from "zustand/middleware"

interface GameState {
  /** DeepSeek API Key */
  apiKey: string
  setApiKey: (key: string) => void
}

export const useGameStore = create<GameState>()(
  persist(
    (set) => ({
      apiKey: "",
      setApiKey: (apiKey) => set({ apiKey }),
    }),
    {
      name: "2048_deepseek_api_key",
      storage: createJSONStorage(() => localStorage),
    },
  ),
)
