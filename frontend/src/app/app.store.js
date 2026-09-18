import { configureStore } from "@reduxjs/toolkit";
import authReducer from '../features/auth/state/auth.slice'


/**
 * @description The app's single Redux store. Currently only auth state lives
 * in Redux — feature pages (Overview, Explore, Alerts, Reports) manage their
 * own data with local component state via hooks, since that data isn't
 * shared across the app the way the logged-in user is. Add more reducers
 * here if that changes later.
 */
const store = configureStore({
  reducer: {
    auth: authReducer,
  },
});

export default store;
