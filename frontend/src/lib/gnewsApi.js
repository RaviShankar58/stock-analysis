import axios from "axios";

const GNEWS_API_KEY = import.meta.env.VITE_GNEWS_API_KEY;

function makeCacheKey(country = "global", max = 10, topic = "business") {
  return `gnews_top_market_v1::${country || "global"}::${max}::${topic}`;
}

const TTL = 6 * 60 * 60 * 1000; // 6 hours

async function fetchFromGNews(apiKey, { max = 10, topic = "business", country = null } = {}) {
  if (!apiKey) throw new Error("GNews API key required");
  const params = [
    `topic=${encodeURIComponent(topic)}`,
    `max=${Number(max) || 10}`,
    `lang=en`,
    `token=${encodeURIComponent(apiKey)}`,
  ];
  if (country) params.push(`country=${encodeURIComponent(country)}`);
  const url = `https://gnews.io/api/v4/top-headlines?${params.join("&")}`;

  try {
    const res = await axios.get(url);
    if (res.status < 200 || res.status >= 300) {
      throw new Error(`GNews fetch failed: ${res.status} ${res.statusText || ""}`);
    }
    const data = res.data || {};
    return data.articles || [];
  } catch (err) {
    // normalize error message
    const msg = err?.response?.data ? JSON.stringify(err.response.data) : err.message;
    throw new Error(`GNews fetch failed: ${msg}`);
  }
}

function readCache(key) {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || !parsed.ts || !Array.isArray(parsed.articles)) return null;
    return parsed;
  } catch {
    return null;
  }
}

function writeCache(key, articles) {
  try {
    localStorage.setItem(key, JSON.stringify({ ts: Date.now(), articles }));
  } catch { /* ignore */ }
}

export async function getTopMarketNews({ apiKey, max = 10, country = null, force = false } = {}) {
  if (!apiKey) throw new Error("apiKey is required");
  const cacheKey = makeCacheKey(country || "global", max, "business");
  if (!force) {
    const cached = readCache(cacheKey);
    if (cached && (Date.now() - cached.ts) < TTL) {
      return { articles: cached.articles, timestamp: cached.ts, fromCache: true, cacheKey };
    }
  }

  const articles = await fetchFromGNews(apiKey, { max, topic: "business", country });
  writeCache(cacheKey, articles);
  return { articles, timestamp: Date.now(), fromCache: false, cacheKey };
}

// simple wrapper for older usage: fetchTopNews(country)
export async function fetchTopNews(country = "in", max = 10, force = false) {
  if (!GNEWS_API_KEY) throw new Error("VITE_GNEWS_API_KEY is not set in environment");
  const res = await getTopMarketNews({ apiKey: GNEWS_API_KEY, max, country: country || null, force });
  return res.articles || [];
}

export function clearNewsCacheFor(country = null, max = 10) {
  try {
    const key = makeCacheKey(country || "global", max, "business");
    localStorage.removeItem(key);
  } catch { }
}
