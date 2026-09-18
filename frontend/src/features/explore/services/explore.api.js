import apiClient from "../../../shared/api/axiosClient.js";

/**
 * @description Submits a natural-language query, runs it through the backend
 * AI pipeline, and returns the saved result plus a `meta` block showing
 * which AI layers actually fired (real satellite data vs. fallback, etc.).
 */
export async function submitQuery(rawQueryText) {
  try {
    const response = await apiClient.post("/query", { rawQueryText });
    return response.data.data; // { query, meta }
  } catch (error) {
    throw error.response?.data || { message: "Network error — is the backend running?" };
  }
}

/**
 * @description Fetches the current user's query history.
 */
export async function listQueries({ page = 1, limit = 20 } = {}) {
  try {
    const response = await apiClient.get("/query", { params: { page, limit } });
    return response.data.data; // { queries, total, page, pages }
  } catch (error) {
    throw error.response?.data || { message: "Network error — is the backend running?" };
  }
}
