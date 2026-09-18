import axios from "axios";
import config from "../config/config.js";

const TOKEN_URL =
  "https://services.sentinel-hub.com/auth/realms/main/protocol/openid-connect/token";

const STATISTICAL_URL =
  "https://services.sentinel-hub.com/api/v1/statistics";

let cachedToken = null;
let cachedTokenExpiry = 0;

/**
 * Get and cache Sentinel Hub OAuth token.
 */
const getAccessToken = async () => {
  const now = Date.now();

  if (cachedToken && now < cachedTokenExpiry) {
    return cachedToken;
  }

  const response = await axios.post(
    TOKEN_URL,
    new URLSearchParams({
      grant_type: "client_credentials",
      client_id: config.sentinelHubClientId,
      client_secret: config.sentinelHubClientSecret,
    }),
    {
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      timeout: 8000,
    }
  );

  cachedToken = response.data.access_token;

  cachedTokenExpiry =
    Date.now() + (response.data.expires_in - 60) * 1000;

  return cachedToken;
};

/**
 * Build NDWI / NDVI evalscript.
 */
const buildEvalscript = (index) => {
  if (index === "NDWI") {
    return `//VERSION=3

function setup() {
  return {
    input: [{
      bands: ["B03", "B08", "SCL", "dataMask"]
    }],
    output: [
      {
        id: "index",
        bands: 1,
        sampleType: "FLOAT32"
      },
      {
        id: "dataMask",
        bands: 1
      }
    ]
  };
}

function evaluatePixel(s) {
  // Exclude invalid pixels, cloud shadow,
  // medium/high probability clouds, cirrus and snow.
  const invalid =
    s.dataMask === 0 ||
    [3, 8, 9, 10, 11].includes(s.SCL);

  if (invalid) {
    return {
      index: [0],
      dataMask: [0]
    };
  }

  const denominator = s.B03 + s.B08;

  if (denominator === 0) {
    return {
      index: [0],
      dataMask: [0]
    };
  }

  const ndwi = (s.B03 - s.B08) / denominator;

  return {
    index: [ndwi],
    dataMask: [1]
  };
}`;
  }

  return `//VERSION=3

function setup() {
  return {
    input: [{
      bands: ["B04", "B08", "SCL", "dataMask"]
    }],
    output: [
      {
        id: "index",
        bands: 1,
        sampleType: "FLOAT32"
      },
      {
        id: "dataMask",
        bands: 1
      }
    ]
  };
}

function evaluatePixel(s) {
  const invalid =
    s.dataMask === 0 ||
    [3, 8, 9, 10, 11].includes(s.SCL);

  if (invalid) {
    return {
      index: [0],
      dataMask: [0]
    };
  }

  const denominator = s.B08 + s.B04;

  if (denominator === 0) {
    return {
      index: [0],
      dataMask: [0]
    };
  }

  const ndvi = (s.B08 - s.B04) / denominator;

  return {
    index: [ndvi],
    dataMask: [1]
  };
}`;
};

/**
 * Fetch real Sentinel-2 L2A statistics.
 *
 * NOTE:
 * This returns an aggregate mean over the requested
 * time range, not a guaranteed latest single satellite pass.
 */
export const getSatelliteIndex = async (
  { lat, lng },
  index = "NDVI"
) => {
  if (
    !config.sentinelHubClientId ||
    !config.sentinelHubClientSecret
  ) {
    return null;
  }

  try {
    const token = await getAccessToken();

    const delta = 0.03;

    const bbox = [
      lng - delta,
      lat - delta,
      lng + delta,
      lat + delta,
    ];

    const to = new Date();

    const from = new Date(
      to.getTime() - 30 * 24 * 60 * 60 * 1000
    );

    const body = {
      input: {
        bounds: {
          bbox,
          properties: {
            crs: "http://www.opengis.net/def/crs/OGC/1.3/CRS84",
          },
        },
        data: [
          {
            type: "sentinel-2-l2a",
            dataFilter: {
              maxCloudCoverage: 40,
              mosaickingOrder: "leastCC",
            },
          },
        ],
      },

      aggregation: {
        timeRange: {
          from: from.toISOString(),
          to: to.toISOString(),
        },

        aggregationInterval: {
          of: "P30D",
        },

        evalscript: buildEvalscript(index),

        resx: 0.0001,
        resy: 0.0001,
      },
    };

    const response = await axios.post(
      STATISTICAL_URL,
      body,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        timeout: 15000,
      }
    );

    const interval = response.data?.data?.[0];

    const stats =
      interval?.outputs?.index?.bands?.B0?.stats;

    if (!stats) {
      console.warn(
        "No statistics returned:",
        response.data
      );

      return null;
    }

    return {
      source: "Sentinel-2 L2A",
      metric: index,

      meanValue: stats.mean ?? null,
      min: stats.min ?? null,
      max: stats.max ?? null,
      standardDeviation: stats.stDev ?? null,

      sampleCount: stats.sampleCount ?? null,
      noDataCount: stats.noDataCount ?? null,

      // This is the requested interval,
      // NOT the actual acquisition/pass timestamp.
      timeRange: {
        from: interval.interval?.from ?? from.toISOString(),
        to: interval.interval?.to ?? to.toISOString(),
      },

      bbox,
    };
  } catch (err) {
    console.warn(
      "Sentinel Hub call failed:",
      err.response?.data || err.message
    );

    return null;
  }
};