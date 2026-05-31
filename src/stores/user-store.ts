import { UserInfo } from "@/types/api"
import { create } from "zustand"


interface UserState {
  token: string | null
  user: UserInfo | null
  setAuth: (token: string, user: UserInfo) => void
  clearAuth: () => void
}

export const useUserStore = create<UserState>((set) => ({
  token: typeof window !== "undefined" ? localStorage.getItem("token") : null,
  user:
    typeof window !== "undefined"
      ? JSON.parse(localStorage.getItem("user") || "null")
      : null,

  setAuth: (token, user) => {
    localStorage.setItem("token", token)
    localStorage.setItem("user", JSON.stringify(user))
    set({ token, user })
  },

  clearAuth: () => {
    localStorage.removeItem("token")
    localStorage.removeItem("user")
    set({ token: null, user: null })
  },
}))
