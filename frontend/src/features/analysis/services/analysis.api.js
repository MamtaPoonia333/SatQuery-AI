import apiClient from "../../../shared/api/axiosClient.js";

export async function runRemoteAnalysis({ mode, task, files, roles }) {
  const formData = new FormData();
  formData.append("mode", mode);
  formData.append("task", task);
  formData.append("roles", JSON.stringify(roles || []));
  files.forEach((file) => formData.append("images", file));

  try {
    const response = await apiClient.post("/remote-sensing/run", formData);
    return response.data.data;
  } catch (error) {
    throw error.response?.data || { message: "Remote-sensing analysis failed" };
  }
}

export async function listRemoteAnalyses() {
  try {
    const response = await apiClient.get("/remote-sensing/history");
    return response.data.data.analyses;
  } catch (error) {
    throw error.response?.data || { message: "Analysis history could not be loaded" };
  }
}