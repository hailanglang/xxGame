import { create } from "zustand"
import { persist, createJSONStorage } from "zustand/middleware"
import { TokenUsage } from "@/lib/deepseek-usage"

interface GameState {
  // 2048 API Key
  apiKey: string
  setApiKey: (key: string) => void
  // 斗地主 API Key
  doudizhuApiKey: string
  setDoudizhuApiKey: (key: string) => void
  // 斗地主 Token 用量 (累计)
  doudizhuTokenUsage: TokenUsage | null
  setDoudizhuTokenUsage: (usage: TokenUsage | null) => void
}

export const useGameStore = create<GameState>()(
  persist(
    (set) => ({
      apiKey: "",
      setApiKey: (apiKey) => set({ apiKey }),
      doudizhuApiKey: "",
      setDoudizhuApiKey: (doudizhuApiKey) => set({ doudizhuApiKey }),
      doudizhuTokenUsage: null,
      setDoudizhuTokenUsage: (doudizhuTokenUsage) => set({ doudizhuTokenUsage }),
    }),
    {
      name: "2048_deepseek_api_key",
      storage: createJSONStorage(() => localStorage),
    },
  ),
)
