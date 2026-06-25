import apiClient from "../api/apiClient";
import { Resume } from "../types";

export const resumeService = {
  async getResumes(): Promise<Resume[]> {
    const response = await apiClient.get("/resumes");
    return response.data.data;
  },

  async uploadResume(file: File): Promise<Resume> {
    const formData = new FormData();
    formData.append("resume", file);
    const response = await apiClient.post("/resumes/upload", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return response.data.data;
  },

  async getResume(id: number): Promise<Resume> {
    const response = await apiClient.get(`/resumes/${id}`);
    return response.data.data;
  },

  async deleteResume(id: number): Promise<void> {
    await apiClient.delete(`/resumes/${id}`);
  },
};
