// import axios from "axios";
// import dotenv from "dotenv";
// dotenv.config();

// const MARKET_TOKEN = process.env.MARKETAUX_API_KEY;
// const MARKET_BASE = "https://api.marketaux.com/v1";
// const DEFAULT_LIMIT = parseInt(process.env.FETCH_TOP_N_PER_TICKER || "10", 10);

// if (!MARKET_TOKEN) {
//   console.warn("MARKETAUX_API_KEY not set in .env|| Please set it");
// }

// async function rawSearch(q, limit = DEFAULT_LIMIT, countries = "in") {
//   const url = `${MARKET_BASE}/news/all`;
//   const params = {
//     api_token: MARKET_TOKEN,
//     search: q,
//     limit,
//     countries,
//     filter_entities: false,
//     group_similar: true,
//   };
//   const res = await axios.get(url, { params, timeout: 15000 });
//   return res.data?.data ?? res.data ?? [];
// }


// export async function search(stockName, country = "IN", limit = DEFAULT_LIMIT) {
//   if (!MARKET_TOKEN) return [];
//   const countryParam = (country || "IN").toLowerCase();
//   const raw = await rawSearch(stockName, limit, countryParam);
//   return raw.map(a => {
//     const providerId = a.uuid || a.id || a.uid || null;
//     return {
//       title: a.title || a.description || a.headline || "untitled",
//       url: a.url || null,
//       source: a.source || a.source_name || "marketaux",
//       provider: "marketaux",
//       providerId,
//       publishedAt: a.published_at ? new Date(a.published_at) : null,
//       raw_text: a.description || a.snippet || "",
//       entities: Array.isArray(a.entities) ? a.entities.map(e => (e.name || e)).filter(Boolean) : [],
//       raw_payload: a,
//       country: (a.country || country || "").toString().toUpperCase(),
//       language: a.language || ""
//     };
//   });
// }


// providers/marketauxProvider.js
import axios from "axios";
import dotenv from "dotenv";
dotenv.config();

const MARKET_TOKEN = process.env.MARKETAUX_API_KEY;
const MARKET_BASE = "https://api.marketaux.com/v1";
const DEFAULT_LIMIT = parseInt(process.env.FETCH_TOP_N_PER_TICKER || "10", 10);

if (!MARKET_TOKEN) {
  console.warn("MARKETAUX_API_KEY not set in .env || Please set it");
}

// rawSearch now accepts an optional publishedAfter (ISO string) to pass to Marketaux
async function rawSearch(q, limit = DEFAULT_LIMIT, countries = "in", publishedAfter = null) {
  const url = `${MARKET_BASE}/news/all`;
  const params = {
    api_token: MARKET_TOKEN,
    search: q,
    limit,
    countries,
    filter_entities: false,
    group_similar: true,
  };

  // add published_after only if provided (Marketaux expects ISO-ish string / timestamp)
  if (publishedAfter) {
    // params.published_after = publishedAfter;
    try {
      let pa = publishedAfter;
      // If a Date object was passed in, convert to ISO first
      if (pa instanceof Date) pa = pa.toISOString();
      // If the string contains milliseconds and 'Z', strip them:
      // e.g. "2025-10-02T12:34:56.789Z" -> "2025-10-02T12:34:56"
      // If string is already in a supported form, keep it.
      const m = pa.match(/^(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2})/);
      if (m) params.published_after = m[1];
      else {
        // fallback: if it's a plain date like '2025-10-02', keep it
        params.published_after = pa;
      }
    } catch (e) {
      // don't let formatting errors break the whole request; log and skip the param
      console.warn("marketauxProvider: failed to normalize publishedAfter:", publishedAfter, e);
    }
  }
// ---------------------------------------------------------------------------------
  // const res = await axios.get(url, { params, timeout: 20000 });
  // return res.data?.data ?? res.data ?? [];
// ---------------------------------------------------------------------------------
  try {
    const res = await axios.get(url, { params, timeout: 15000 });
    return res.data?.data ?? res.data ?? [];
  } catch (err) {
    // Improve error logging so we can see why Marketaux responded 400
    if (err.response && err.response.data) {
      console.error("marketaux rawSearch error response:", err.response.status, err.response.data);
    } else {
      console.error("marketaux rawSearch error:", err.message || err);
    }
    // rethrow so caller can handle/log
    throw err;
  }
}


export async function search(stockName, country = "IN", limit = DEFAULT_LIMIT, publishedAfter = null) {
  if (!MARKET_TOKEN) return [];

  const countryParam = (country || "IN").toLowerCase();
  const raw = await rawSearch(stockName, limit, countryParam, publishedAfter);

  return (Array.isArray(raw) ? raw : []).map(a => {
    const providerId = a.uuid || a.id || a.uid || null;
    return {
      title: a.title || a.description || a.headline || "untitled",
      url: a.url || null,
      source: a.source || a.source_name || "marketaux",
      provider: "marketaux",
      providerId,
      // keep publishedAt as a Date when present (upstream uses `published_at`)
      publishedAt: a.published_at ? new Date(a.published_at) : null,
      raw_text: a.description || a.snippet || "",
      entities: Array.isArray(a.entities) ? a.entities.map(e => (e.name || e)).filter(Boolean) : [],
      raw_payload: a,
      country: (a.country || country || "").toString().toUpperCase(),
      language: a.language || ""
    };
  });
}
