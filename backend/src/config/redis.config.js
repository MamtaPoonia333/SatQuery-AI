import Redis from "ioredis";
import config from "./config.js";

let client = null;
let connectionAttempted = false;

/**
 * @description Lazily creates and caches the Redis client. Redis is OPTIONAL
 * for this app — if REDIS_URL isn't set, or the connection fails, every
 * caller degrades gracefully (see tokenBlocklist.service.js) instead of
 * crashing the app. This mirrors the same "optional AI layer" pattern used
 * for Mistral/Pinecone/Sentinel Hub.
 * @returns {import("ioredis").Redis | null}
 * @access Private
 */
export const getRedisClient = () => {
  if (!config.redisUrl) return null;
  if (client) return client;
  if (connectionAttempted) return null; // already failed once, don't retry every call

  try {
    connectionAttempted = true;
    client = new Redis(config.redisUrl, {
      maxRetriesPerRequest: 1,
      retryStrategy: () => null, // don't keep retrying forever if Redis is down
      lazyConnect: false,
    });

    client.on("error", (err) => {
      console.warn("Redis connection error (token blocklisting will be skipped):", err.message);
    });

    return client;
  } catch (err) {
    console.warn("Failed to initialise Redis client:", err.message);
    client = null;
    return null;
  }
};

/**
 * @description Whether Redis is configured at all (doesn't guarantee the
 * connection is actually healthy — individual calls still handle failures).
 * @access Private
 */
export const isRedisConfigured = () => Boolean(config.redisUrl);
