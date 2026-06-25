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
  },

  logout: () => {
    localStorage.removeItem("forge_sprint_token");
    set({ token: null, user: null, stats: null, isAuthenticated: false });
  },

  checkAuth: async () => {
    set({ isLoading: true });
    
    const performMeCall = async () => {
      const response = await apiClient.get("/auth/me");
      set({
        user: response.data.user,
        stats: response.data.stats,
        isAuthenticated: true,
        isLoading: false,
      });
    };

    // 1. If we have a token, try to load profile
    if (get().token) {
      try {
        await performMeCall();
        return;
      } catch (error) {
        console.warn("Token expired, attempting silent login...");
        get().logout();
      }
    }

    // 2. Try to log in with seed credentials silently
    try {
      const loginResponse = await apiClient.post("/auth/login", {
        email: "test@example.com",
        password: "password",
      });
      const { token, user } = loginResponse.data;
      localStorage.setItem("forge_sprint_token", token);
      set({ token, user, isAuthenticated: true });
      await performMeCall();
    } catch (loginError) {
      console.warn("Silent login failed, attempting silent registration...");
      
      // 3. Try to register default user silently
      try {
        const registerResponse = await apiClient.post("/auth/register", {
          name: "Demo User",
          email: "test@example.com",
          password: "password",
          password_confirmation: "password",
        });
        const { token, user } = registerResponse.data;
        localStorage.setItem("forge_sprint_token", token);
        set({ token, user, isAuthenticated: true });
        await performMeCall();
      } catch (registerError) {
        console.error("Silent authentication/registration failed", registerError);
        set({ isLoading: false, isAuthenticated: false });
      }
    }
  },
}));
