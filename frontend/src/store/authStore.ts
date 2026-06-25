import { create } from "zustand";
import { User, UserStats } from "../types";
import apiClient from "../api/apiClient";

interface AuthState {
  user: User | null;
  stats: UserStats | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  setToken: (token: string | null) => void;
  setUser: (user: User | null) => void;
  setStats: (stats: UserStats | null) => void;
  login: (token: string, user: User) => void;
  logout: () => void;
  checkAuth: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  stats: null,
  token: localStorage.getItem("forge_sprint_token"),
  isAuthenticated: !!localStorage.getItem("forge_sprint_token"),
  isLoading: false,

  setToken: (token) => {
    if (token) {
      localStorage.setItem("forge_sprint_token", token);
    } else {
      localStorage.removeItem("forge_sprint_token");
    }
    set({ token, isAuthenticated: !!token });
  },

  setUser: (user) => set({ user }),
  setStats: (stats) => set({ stats }),

  login: (token, user) => {
    localStorage.setItem("forge_sprint_token", token);
    set({ token, user, isAuthenticated: true });
    get().checkAuth();
  },

  logout: () => {
    localStorage.removeItem("forge_sprint_token");
    set({ token: null, user: null, stats: null, isAuthenticated: false });
  },

  checkAuth: async () => {
    const token = get().token;
    if (!token) {
      set({ isAuthenticated: false, isLoading: false });
      return;
    }

    set({ isLoading: true });
    try {
      const response = await apiClient.get("/auth/me");
      set({
        user: response.data.user,
        stats: response.data.stats,
        isAuthenticated: true,
        isLoading: false,
      });
    } catch (error) {
      console.error("Auth check failed", error);
      get().logout();
      set({ isLoading: false });
    }
  },
}));
