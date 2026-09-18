import React, { useEffect } from "react";
import { RouterProvider } from "react-router";
import { MainRouter } from "./routes/MainRouter.jsx";
import { useAuth } from "../features/auth/hooks/useAuth.js";


/**
 * @description Root component. Runs the one-time "is there already a valid
 * session?" check on first load (via useAuth's initializeAuth), so a page
 * refresh doesn't bounce a logged-in user back to /login before their token
 * has actually been verified — see ProtectedRoute.jsx and auth.slice.js's
 * `isInitializing` flag for the other half of this.
 */
const App = () => {
  const { initializeAuth } = useAuth();

  useEffect(() => {
    initializeAuth();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return <RouterProvider router={MainRouter} />;
};

export default App;
