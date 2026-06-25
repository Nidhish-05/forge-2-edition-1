import apiClient from "../api/apiClient";
import { Interview, InterviewAnswer } from "../types";

export interface GenerateInterviewData {
  resume_id: number;
  job_title: string;
  company_name?: string;
  job_description?: string;
}

export const interviewService = {
  async getInterviews(): Promise<Interview[]> {
    const response = await apiClient.get("/interviews");
    return response.data.data;
  },

  async generate(data: GenerateInterviewData): Promise<Interview> {
    const response = await apiClient.post("/interviews/generate", data);
    return response.data.data;
  },

  async getInterview(id: string): Promise<Interview> {
    const response = await apiClient.get(`/interviews/${id}`);
    return response.data.data;
  },

  async submitAnswers(id: string, answers: InterviewAnswer[]): Promise<Interview> {
    const response = await apiClient.post(`/interviews/${id}/submit`, { answers });
    return response.data.data;
  },

  async deleteInterview(id: string): Promise<void> {
    await apiClient.delete(`/interviews/${id}`);
  },
};
