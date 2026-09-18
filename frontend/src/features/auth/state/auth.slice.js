import { createSlice } from "@reduxjs/toolkit";

const authSlice = createSlice({
  name: "auth",
  initialState: {
    user: null,
    isAuthenticated: false,
    loading: false,
    // Tracks the one-time "is there already a session on page load?" check,
    // separate from `loading` (which covers individual login/register calls)
    // so the app can show a splash state instead of flashing the login page.
    isInitializing: true,
    error: null,
  },
  reducers: {
    setUser(state, action) {
      state.user = action.payload;
      state.isAuthenticated = true;
      state.error = null;
    },
    clearUser(state) {
      state.user = null;
      state.isAuthenticated = false;
    },
    setLoading(state, action) {
      state.loading = action.payload;
    },
    setInitializing(state, action) {
      state.isInitializing = action.payload;
    },
    setError(state, action) {
      state.error = action.payload;
    },
    clearError(state) {
      state.error = null;
    },
  },
});

export const { setUser, clearUser, setLoading, setInitializing, setError, clearError } =
  authSlice.actions;
export default authSlice.reducer;
