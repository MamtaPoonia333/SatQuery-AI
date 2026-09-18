/**
 * @description THIS IS A PLACEHOLDER, NOT A REAL SATELLITE DATA PIPELINE.
 *
 * This service currently does simple keyword matching against a fixed set of
 * demo scenarios, so the rest of the app (Query routes, frontend) has a real,
 * working endpoint to call while the actual AI/data layer is being built.
 *
 * When ready, replace the body of `analyzeQuery` below with the real
 * pipeline:
 *   1. Embed the query text (LangChain + an embedding model)
 *   2. Similarity search in Pinecone for relevant past context
 *   3. Fetch the actual Sentinel Hub satellite pass for the parsed region
 *   4. Run the real NDWI/NDVI pixel calculation on that imagery
 *   5. Use an LLM (via LangChain) to compose `responseText` from the real
 *      numbers, grounded in the retrieved context
 *
 * Nothing in this file should be presented to users or judges as live
 * satellite data — it is fixed demo data keyed off simple keyword matches.
 * @access Private
 */

const SCENARIOS = {
  flood: {
    region: "Kosi Basin, Bihar",
    coordinates: { lat: 26.1263, lng: 86.6014 }, // Supaul, approx.
    matchWords: ["flood", "kosi", "supaul"],
    metric: "NDWI",
    value: 0.42,
    areaAffectedKm2: 2500,
    changeVsBaselinePct: 34,
    confidence: 94,
    responseText:
      "Pulled the latest Sentinel-2 pass and ran it against the water index (NDWI). Water extent is well above the seasonal baseline for this stretch of the basin — consistent with upstream rainfall over the past 48 hours.",
  },
  crop_stress: {
    region: "Malwa Belt, Punjab",
    coordinates: { lat: 30.2110, lng: 74.9455 }, // Bathinda, approx.
    matchWords: ["crop", "punjab", "vegetation"],
    metric: "NDVI",
    value: -0.21,
    areaAffectedKm2: 8200,
    changeVsBaselinePct: -21,
    confidence: 89,
    responseText:
      "Vegetation index shows stress clusters across three districts, consistent with reduced soil moisture this growing cycle.",
  },
  deforestation: {
    region: "Eastern Ghats, Odisha",
    coordinates: { lat: 18.8135, lng: 82.7115 }, // Koraput, approx.
    matchWords: ["forest", "odisha", "deforest", "koraput"],
    metric: "NDVI (canopy)",
    value: -0.31,
    areaAffectedKm2: 340,
    changeVsBaselinePct: -12,
    confidence: 91,
    responseText:
      "Comparing this pass against the six-month baseline, canopy cover has thinned along the eastern forest edge.",
  },
  glacial_lake: {
    region: "Rishiganga Basin, Uttarakhand",
    coordinates: { lat: 30.5501, lng: 79.5651 }, // Chamoli, approx.
    matchWords: ["glacier", "glacial", "chamoli", "lake"],
    metric: "Surface area change",
    value: 18,
    areaAffectedKm2: null,
    changeVsBaselinePct: 18,
    confidence: 87,
    responseText:
      "Lake surface area has expanded compared to the previous month's pass — within historical range but worth flagging for continued monitoring.",
  },
};

/**
 * @description Picks the best-matching demo scenario for a raw query string
 * using simple keyword matching. Returns null if nothing matches.
 * @param {string} rawQueryText
 * @access Private
 */
const matchScenario = (rawQueryText) => {
  const lower = rawQueryText.toLowerCase();
  for (const [phenomenon, scenario] of Object.entries(SCENARIOS)) {
    if (scenario.matchWords.some((w) => lower.includes(w))) {
      return { phenomenon, ...scenario };
    }
  }
  return null;
};

/**
 * @description Looks up fallback demo numbers for a known phenomenon
 * category, regardless of the original query text. Used by
 * aiPipeline.service.js when the LLM successfully identifies a phenomenon
 * (e.g. via real intent extraction) but Sentinel Hub isn't configured/
 * reachable, so we still have *something* plausible to show rather than
 * nulls everywhere.
 * @param {string} phenomenon - one of the SCENARIOS keys
 * @returns {object|null}
 * @access Private
 */
export const getFallbackForPhenomenon = (phenomenon) => SCENARIOS[phenomenon] || null;

/**
 * @description Main entry point the Query controller calls. Given a raw query
 * string, returns a structured analysis result shaped exactly like what a
 * real satellite-analysis pipeline would eventually return, so the
 * controller/routes/frontend don't need to change when this is replaced.
 * @param {string} rawQueryText - The user's natural-language query.
 * @returns {{
 *   matched: boolean,
 *   parsedIntent: object,
 *   satelliteResult: object,
 *   responseText: string,
 *   status: "resolved"|"low_confidence"|"failed"
 * }}
 * @access Private
 */
export const analyzeQuery = (rawQueryText) => {
  const match = matchScenario(rawQueryText);

  if (!match) {
    return {
      matched: false,
      parsedIntent: { region: null, phenomenon: "unknown", coordinates: null },
      satelliteResult: {
        passTimestamp: new Date(),
        source: "Sentinel-2 L2A (simulated)",
        metric: null,
        value: null,
        areaAffectedKm2: null,
        changeVsBaselinePct: null,
        confidence: 0,
      },
      responseText:
        "This is a demo build — I don't have a scripted scenario for that query yet. Try mentioning a flood, crop stress, deforestation, or glacial lake region.",
      status: "failed",
    };
  }

  return {
    matched: true,
    parsedIntent: {
      region: match.region,
      phenomenon: match.phenomenon,
      coordinates: match.coordinates,
    },
    satelliteResult: {
      passTimestamp: new Date(),
      source: "Sentinel-2 L2A (simulated)",
      metric: match.metric,
      value: match.value,
      areaAffectedKm2: match.areaAffectedKm2,
      changeVsBaselinePct: match.changeVsBaselinePct,
      confidence: match.confidence,
    },
    responseText: match.responseText,
    status: match.confidence >= 85 ? "resolved" : "low_confidence",
  };
};
