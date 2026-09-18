import apiClient from "../../../shared/api/axiosClient.js";

export async function listWatchedRegions() {
  try {
    const response = await apiClient.get("/alerts");
    return response.data.data.regions;
  } catch (error) {
    throw error.response?.data || { message: "Network error — is the backend running?" };
  }
}

export async function createWatchedRegion(payload) {
  try {
    const response = await apiClient.post("/alerts", payload);
    return response.data.data.region;
  } catch (error) {
    throw error.response?.data || { message: "Network error — is the backend running?" };
  }
}

export async function updateWatchedRegion(id, payload) {
  try {
    const response = await apiClient.patch(`/alerts/${id}`, payload);
    return response.data.data.region;
  } catch (error) {
    throw error.response?.data || { message: "Network error — is the backend running?" };
  }
}

export async function deleteWatchedRegion(id) {
  try {
    const response = await apiClient.delete(`/alerts/${id}`);
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: "Network error — is the backend running?" };
  }
}
