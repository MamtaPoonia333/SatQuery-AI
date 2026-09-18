import apiClient from "../../../shared/api/axiosClient.js";

export async function listReports() {
  try {
    const response = await apiClient.get("/reports");
    return response.data.data.reports;
  } catch (error) {
    throw error.response?.data || { message: "Network error — is the backend running?" };
  }
}

export async function generateReport({ regionName, type = "csv", periodStart, periodEnd }) {
  try {
    const response = await apiClient.post("/reports/generate", {
      regionName,
      type,
      periodStart,
      periodEnd,
    });
    return response.data.data.report;
  } catch (error) {
    throw error.response?.data || { message: "Network error — is the backend running?" };
  }
}

/**
 * @description Builds the full downloadable URL for a report's fileUrl
 * (which the backend returns as a relative path like "/uploads/reports/x.csv").
 */
export function getReportDownloadUrl(fileUrl) {
  const base = (import.meta.env.VITE_API_BASE_URL || "http://localhost:3000/api").replace(
    "/api",
    ""
  );
  return `${base}${fileUrl}`;
}
