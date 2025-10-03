import axios from "axios";
import dotenv from "dotenv";
dotenv.config();

const MARKET_TOKEN = process.env.MARKETAUX_API_KEY;
const MARKET_BASE = "https://api.marketaux.com/v1";
const DEFAULT_LIMIT = parseInt(process.env.FETCH_TOP_N_PER_TICKER || "10", 10);

if (!MARKET_TOKEN) {
  console.warn("MARKETAUX_API_KEY not set in .env|| Please set it");
}

async function rawSearch(q, limit = DEFAULT_LIMIT, countries = "in") {
  const url = `${MARKET_BASE}/news/all`;
  const params = {
    api_token: MARKET_TOKEN,
    search: q,
    limit,
    countries,
    filter_entities: false,
    group_similar: true,
  };
  const res = await axios.get(url, { params, timeout: 15000 });
  return res.data?.data ?? res.data ?? [];
}

/**
 * Normalize Marketaux article object to our internal shape:
 * {
 *  title, url, source, provider: "marketaux", providerId, publishedAt,
 *  raw_text, entities, raw_payload, country, language
 * }
 */
export async function search(stockName, country = "IN", limit = DEFAULT_LIMIT) {
  if (!MARKET_TOKEN) return [];
  const countryParam = (country || "IN").toLowerCase();
  const raw = await rawSearch(stockName, limit, countryParam);
  return raw.map(a => {
    const providerId = a.uuid || a.id || a.uid || null;
    return {
      title: a.title || a.description || a.headline || "untitled",
      url: a.url || null,
      source: a.source || a.source_name || "marketaux",
      provider: "marketaux",
      providerId,
      publishedAt: a.published_at ? new Date(a.published_at) : null,
      raw_text: a.description || a.snippet || "",
      entities: Array.isArray(a.entities) ? a.entities.map(e => (e.name || e)).filter(Boolean) : [],
      raw_payload: a,
      country: (a.country || country || "").toString().toUpperCase(),
      language: a.language || ""
    };
  });
}
