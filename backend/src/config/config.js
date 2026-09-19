import dotenv from "dotenv";
dotenv.config();

/**
 * @description Fails fast at startup if the environment variables the app
 * cannot safely run without (MONGO_URI, JWT_SECRET) are missing. Better to
 * crash immediately with a clear message than to run in a broken state.
 * @access Public
 */
if (!process.env.MONGO_URI || !process.env.JWT_SECRET) {
  throw new Error("Missing required environment variables: MONGO_URI and JWT_SECRET");
}

if (!process.env.PORT) {
  throw new Error("Missing required environment variable: PORT");
}

if (!process.env.NODE_ENV) {
  throw new Error("Missing required environment variable: NODE_ENV");
}

/**
 * @description Centralised, typed access point for all environment-derived
 * configuration. Import this instead of reading process.env directly
 * elsewhere in the codebase, so every config value has one source of truth.
 * @access Public
 */
const config = {
  port: process.env.PORT || 3000,
  nodeEnv: process.env.NODE_ENV,
  mongoUri: process.env.MONGO_URI,
  jwtSecret: process.env.JWT_SECRET,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || "1d",
  jwtRefreshSecret: process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET,
  jwtRefreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || "7d",

  // ===== AI layer (all OPTIONAL — the app falls back gracefully when any of
  // these are missing; see src/services/aiPipeline.service.js) =====
  mistralApiKey: process.env.MISTRAL_API_KEY || null,
  groqApiKey: process.env.GROQ_API_KEY || null,
  groqChatModel: process.env.GROQ_CHAT_MODEL || "meta-llama/llama-4-scout-17b-16e-instruct",
  mistralChatModel: process.env.MISTRAL_CHAT_MODEL || "mistral-large-latest",
  mistralEmbeddingModel: process.env.MISTRAL_EMBEDDING_MODEL || "mistral-embed",

  pineconeApiKey: process.env.PINECONE_API_KEY || null,
  pineconeIndex: process.env.PINECONE_INDEX || "satquery-ai",

  sentinelHubClientId: process.env.SENTINEL_HUB_CLIENT_ID || null,
  sentinelHubClientSecret: process.env.SENTINEL_HUB_CLIENT_SECRET || null,

  // ===== Redis (OPTIONAL) — used for access-token blocklisting on logout.
  // Without it, logout still invalidates the refresh token (via MongoDB,
  // unchanged) but the access token remains valid until it naturally
  // expires. See src/services/tokenBlocklist.service.js.
  redisUrl: process.env.REDIS_URL || null,
};

export default config;
