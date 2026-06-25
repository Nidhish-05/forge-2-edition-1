import apiClient from "../api/apiClient";
import { AuthResponse, UserResponse } from "../types";

export const authService = {
  async register(data: any): Promise<AuthResponse> {
    const response = await apiClient.post("/auth/register", data);
    return response.data;
  },

  async login(data: any): Promise<AuthResponse> {
    const response = await apiClient.post("/auth/login", data);
    return response.data;
  },

  async logout(): Promise<void> {
    await apiClient.post("/auth/logout");
  },

  async me(): Promise<UserResponse> {
    const response = await apiClient.get("/auth/me");
    return response.data;
  },

  async updateProfile(data: any): Promise<any> {
    const response = await apiClient.put("/profile", data);
    return response.data;
  },
};
