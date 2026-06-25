import apiClient from "../api/apiClient";
import { JobApplication } from "../types";

export interface CreateApplicationData {
  resume_id?: number | null;
  job_title: string;
  company_name?: string | null;
  job_description?: string | null;
  status?: string;
  score?: number | null;
}

export const applicationService = {
  async getApplications(): Promise<JobApplication[]> {
    const response = await apiClient.get("/applications");
    return response.data.data;
  },

  async createApplication(data: CreateApplicationData): Promise<JobApplication> {
    const response = await apiClient.post("/applications", data);
    return response.data.data;
  },

  async updateApplication(id: number, data: Partial<CreateApplicationData>): Promise<JobApplication> {
    const response = await apiClient.put(`/applications/${id}`, data);
    return response.data.data;
  },

  async deleteApplication(id: number): Promise<void> {
    await apiClient.delete(`/applications/${id}`);
  },
};
