import apiClient from "../../../shared/api/axiosClient.js";

/**
 * @description Registers a new account. On success, stores the returned
 * access + refresh tokens so subsequent requests are authenticated.
 */
export async function registerUser({ email, password, name, organisation }) {
  try {
    const response = await apiClient.post("/auth/register", {
      email,
      password,
      name,
      organisation,
    });
    return response.data.data;
  } catch (error) {
    throw error.response?.data || { message: "Network error — is the backend running?" };
  }
}

/**
 * @description Logs in with email + password, stores the returned tokens.
 */
export async function loginUser({ email, password }) {
  try {
    const response = await apiClient.post("/auth/login", { email, password });
    return response.data.data;
  } catch (error) {
    throw error.response?.data || { message: "Network error — is the backend running?" };
  }
}

/**
 * @description Logs out on the server (blocklists the current access token /
 * clears the refresh token), then clears local tokens regardless of whether
 * the server call succeeds — the user should always end up logged out
 * client-side even if the network request fails.
 */
export async function logoutUser() {
  try {
    const response = await apiClient.post("/auth/logout");
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: "Network error — is the backend running?" };
  }
}

/**
 * @description Fetches the current authenticated user's profile — used on
 * app load to restore a session from a stored token.
 */
export async function getCurrentUser() {
  try {
    const response = await apiClient.get("/auth/me");
    return response.data.data.user;
  } catch (error) {
    throw error.response?.data || { message: "Network error — is the backend running?" };
  }
}
