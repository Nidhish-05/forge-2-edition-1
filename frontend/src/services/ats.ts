import apiClient from "../api/apiClient";
import { AtsScore } from "../types";

export interface ScanData {
  resume_id: number;
  job_title: string;
  company_name?: string;
  job_description: string;
}

export const atsService = {
  async scan(data: ScanData): Promise<AtsScore> {
    const response = await apiClient.post("/ats/scan", data);
    return response.data.data;
  },

  async getHistory(): Promise<AtsScore[]> {
    const response = await apiClient.get("/ats/history");
    return response.data.data;
  },

  async getScan(id: number): Promise<AtsScore> {
    const response = await apiClient.get(`/ats/${id}`);
    return response.data.data;
  },
};
