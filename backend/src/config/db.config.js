import mongoose from "mongoose";
import config from "./config.js";

/**
 * @description Establishes the connection to MongoDB using the URI from config,
 * and attaches listeners so connection errors/disconnects are logged instead
 * of failing silently. Exits the process if the initial connection fails,
 * since the app cannot function without a database.
 * @access Public
 */
const connectDB = async () => {
  try {
    mongoose.set("strictQuery", true);

    const conn = await mongoose.connect(config.mongoUri);

    console.log(`MongoDB connected: ${conn.connection.host}`);

    mongoose.connection.on("error", (err) => {
      console.error("MongoDB connection error:", err.message);
    });

    mongoose.connection.on("disconnected", () => {
      console.warn("MongoDB disconnected");
    });
  } catch (err) {
    console.error(`Failed to connect to MongoDB: ${err.message}`);
    process.exit(1);
  }
};

export default connectDB;
