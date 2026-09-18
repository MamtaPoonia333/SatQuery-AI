import { useDispatch, useSelector } from "react-redux";
import { registerUser, loginUser, logoutUser, getCurrentUser } from "../services/auth.api.js";
import {
  setUser,
  clearUser,
  setError,
  setLoading,
  setInitializing,
  clearError,
} from "../state/auth.slice.js";

export const useAuth = () => {
  const dispatch = useDispatch();
  const { user, isAuthenticated, loading, isInitializing, error } = useSelector(
    (state) => state.auth
  );

  /**
   * @description Registers a new account, stores the session, and updates
   * Redux state. Throws on failure so the calling form can show a message.
   */
  async function handleRegister({ email, password, name, organisation }) {
    dispatch(setLoading(true));
    dispatch(clearError());
    try {
      const { user } = await registerUser({ email, password, name, organisation });
      dispatch(setUser(user));
      return user;
    } catch (err) {
      dispatch(setError(err.message || "Registration failed"));
      throw err;
    } finally {
      dispatch(setLoading(false));
    }
  }

  /**
   * @description Logs in with email + password, stores the session, and
   * updates Redux state.
   */
  async function handleLogin({ email, password }) {
    dispatch(setLoading(true));
    dispatch(clearError());
    try {
      await loginUser({ email, password });
      const user = await getCurrentUser();
      dispatch(setUser(user));
      return user;
    } catch (err) {
      dispatch(setError(err.message || "Login failed"));
      throw err;
    } finally {
      dispatch(setLoading(false));
    }
  }

  /**
   * @description Logs out — always clears local session state even if the
   * server call fails, so the user is never stuck "logged in" client-side.
   */
  async function handleLogout() {
    dispatch(setLoading(true));
    try {
      await logoutUser();
    } catch {
      // Already logged out locally regardless — nothing else to do here.
    } finally {
      dispatch(clearUser());
      dispatch(setLoading(false));
    }
  }

  /**
   * @description Called once when the app first loads: if a token exists in
   * localStorage, verifies it's still valid by fetching the current user and
   * restores the session. Called from App.jsx / a top-level effect, not
   * automatically here, so it only ever runs once per app load.
   */
  async function initializeAuth() {
    try {
      const user = await getCurrentUser();
      dispatch(setUser(user));
    } catch {
      dispatch(clearUser());
    } finally {
      dispatch(setInitializing(false));
    }
  }

  return {
    user,
    isAuthenticated,
    loading,
    isInitializing,
    error,
    handleRegister,
    handleLogin,
    handleLogout,
    initializeAuth,
  };
};
