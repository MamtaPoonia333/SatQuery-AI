import apiClient from "../../../shared/api/axiosClient.js";

/**
 * @description Fetches the live-computed Overview stats + recent activity.
 */
export async function getOverview() {
  try {
    const response = await apiClient.get("/dashboard/overview");
    return response.data.data;
  } catch (error) {
    throw error.response?.data || { message: "Network error — is the backend running?" };
  }
}
