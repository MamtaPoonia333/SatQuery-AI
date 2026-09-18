import app from "./src/app.js";
import connectDB from "./src/config/db.config.js";
import config from "./src/config/config.js";

/**
 * @description Entry point of the backend. Connects to MongoDB first, and only
 * starts the Express server once that connection succeeds, so the app never
 * accepts requests while the database is unreachable.
 * @access Public
 */
const startServer = async () => {
  await connectDB();

  app.listen(config.port, () => {
    console.log(`Server is running on port ${config.port} [${config.nodeEnv}]`);
  });
};

startServer();
