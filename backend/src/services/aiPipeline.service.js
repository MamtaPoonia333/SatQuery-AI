import crypto from "crypto";
import { extractIntent, composeAnswer, isLLMConfigured } from "./llm.service.js";
import {
  extractRegionName,
  geocodePlace,
  parseCoordinates,
} from "./geocoding.service.js";
import { getSatelliteIndex } from "./sentinelHub.service.js";
import {
  upsertQueryRecord,
  querySimilarRecords,
  isPineconeConfigured,
} from "./pinecone.service.js";
import { analyzeQuery as ruleBasedAnalyze, getFallbackForPhenomenon } from "./satelliteAnalysis.service.js";

/**
 * @description Maps a phenomenon category to the satellite index formula
 * that actually measures it: water-related phenomena use NDWI, vegetation-
 * related ones use NDVI.
 * @param {string} phenomenon
 * @access Private
 */
const indexTypeFor = (phenomenon) =>
  phenomenon === "flood" || phenomenon === "glacial_lake" ? "NDWI" : "NDVI";

/**
 * @description The real, layered analysis pipeline for a user's query:
 *
 *   1. LLM intent extraction (region + phenomenon) — falls back to the
 *      rule-based keyword matcher entirely if MISTRAL_API_KEY isn't set.
 *   2. Geocode the extracted region via free Nominatim.
 *   3. If geocoded AND Sentinel Hub is configured, fetch a REAL NDWI/NDVI
 *      statistic for that location's last 30 days. Otherwise fall back to
 *      fixed demo numbers for that phenomenon category.
 *   4. If Pinecone is configured, embed the query, retrieve similar past
 *      queries as RAG context, then store this query's embedding for future
 *      retrieval.
 *   5. Compose the final answer with the LLM, grounded in whatever real or
 *      fallback numbers we have. Falls back to a templated sentence if the
 *      LLM call fails.
 *
 * Every external call is wrapped so a missing API key or a failed request
 * degrades gracefully to the next fallback layer instead of throwing — the
 * function always returns a usable result.
 *
 * @param {string} rawQueryText
 * @returns {Promise<{
 *   matched: boolean,
 *   parsedIntent: object,
 *   satelliteResult: object,
 *   responseText: string,
 *   status: "resolved"|"low_confidence"|"failed",
 *   vectorId: string|null,
 *   usedRealSatelliteData: boolean,
 *   usedRAGContext: boolean
 * }>}
 * @access Public
 */
export const analyzeQuery = async (rawQueryText) => {

  console.log("\n========== NEW QUERY ==========");
  console.log("Raw Query:", rawQueryText);
  console.log("LLM Configured:", isLLMConfigured());

  // ---- Layer 1: intent extraction ----
  if (!isLLMConfigured()) {
    // No Mistral AI key at all — use the fully rule-based path, unchanged.
    const fallback = ruleBasedAnalyze(rawQueryText);
    return { ...fallback, vectorId: null, usedRealSatelliteData: false, usedRAGContext: false };
  }

  const intent = await extractIntent(rawQueryText);
  console.log("Extracted Intent:", intent);

  if (!intent || intent.phenomenon === "unknown") {
    // LLM configured but couldn't identify anything useful — still better
    // to try the rule-based matcher than to give up outright.
    const fallback = ruleBasedAnalyze(rawQueryText);
    return { ...fallback, vectorId: null, usedRealSatelliteData: false, usedRAGContext: false };
  }

  const region = extractRegionName(rawQueryText) || intent.region;

  // ---- Layer 2: geocode the region ----
  const coords =
    parseCoordinates(rawQueryText) ||
    (region ? await geocodePlace(region) : null);
  console.log("Geocoded Coordinates:", coords);

  // ---- Layer 3: real satellite index, or demo fallback ----
  let usedRealSatelliteData = false;
  let indexValue = null;
  let source = "Sentinel-2 L2A (simulated)";
  let confidence;
  let areaAffectedKm2 = null;
  let changeVsBaselinePct = null;

  const demoFallback = getFallbackForPhenomenon(intent.phenomenon);

  if (coords) {


  console.log("Calling Sentinel Hub with:", {
    coords,
      indexType: indexTypeFor(intent.phenomenon),
  });

    const real = await getSatelliteIndex(coords, indexTypeFor(intent.phenomenon));

     console.log("Sentinel Hub Result:", real);


    if (real) {
      usedRealSatelliteData = true;
      indexValue = real.meanValue;
      source = "Sentinel-2 L2A (live Statistical API)";
      confidence = 90; // real data — reasonable default; refine once you validate against ground truth
    }
  }

if (!usedRealSatelliteData) {
  return {
    matched: true,
    parsedIntent: {
      region,
      phenomenon: intent.phenomenon,
      coordinates: coords
        ? {
            lat: coords.lat,
            lng: coords.lng,
          }
        : null,
    },
    satelliteResult: {
      passTimestamp: new Date(),
      source: "Sentinel Hub unavailable",
      metric: indexTypeFor(intent.phenomenon),
      value: null,
      areaAffectedKm2: null,
      changeVsBaselinePct: null,
      confidence: 0,
    },
    responseText:
      "I identified the query, but live satellite data could not be retrieved for this location.",
    status: "failed",
    vectorId: null,
    usedRealSatelliteData: false,
    usedRAGContext: false,
  };
} else if (!usedRealSatelliteData) {
    confidence = 0;
  }

  // ---- Layer 4: RAG via Pinecone (optional) ----
  let usedRAGContext = false;
  let ragContext = [];
  let vectorId = null;
  let pineconeStored = false;

  if (isPineconeConfigured()) {
    const matches = await querySimilarRecords(rawQueryText, 3);
    ragContext = matches.map((match) => match.fields || match.metadata || match);
    usedRAGContext = ragContext.length > 0;

    vectorId = crypto.randomUUID();
    pineconeStored = await upsertQueryRecord(vectorId, rawQueryText, {
      rawQueryText,
      region,
      phenomenon: intent.phenomenon,
    });
  }

  // ---- Layer 5: compose the final answer ----
  const llmAnswer = await composeAnswer({
    query: rawQueryText,
    region,
    phenomenon: intent.phenomenon,
    indexValue,
    source,
    context: ragContext,
  });

  const responseText =
    llmAnswer ||
    demoFallback?.responseText ||
    `I identified this as a ${intent.phenomenon.replace("_", " ")} query${region ? ` for ${region}` : ""}, but couldn't retrieve a confident reading right now.`;

  return {
    matched: true,
    parsedIntent: {
      region,
      phenomenon: intent.phenomenon,
      coordinates: coords ? { lat: coords.lat, lng: coords.lng } : null,
    },
    satelliteResult: {
      passTimestamp: new Date(),
      source,
      metric: indexTypeFor(intent.phenomenon),
      value: indexValue,
      areaAffectedKm2,
      changeVsBaselinePct,
      confidence,
    },
    responseText,
    status: confidence >= 85 ? "resolved" : confidence > 0 ? "low_confidence" : "failed",
    vectorId,
    usedRealSatelliteData,
    usedRAGContext,
    pineconeStored,
  };
};

