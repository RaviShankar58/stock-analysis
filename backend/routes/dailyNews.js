// routes/dailyNews.js
import express from "express";
import axios from "axios";
import rateLimit from "express-rate-limit";

const router = express.Router();
const GNEWS_API_KEY = process.env.GNEWS_API_KEY;
const TTL = 6 * 60 * 60 * 1000; // 6 hours
const AXIOS_TIMEOUT_MS = 10000; // 10s

// Bounded cache configuration
const MAX_CACHE_ENTRIES = 10;         // keep up to 10 distinct country/max keys
const MAX_ARTICLES_PER_ENTRY = 10;    // store up to 10 articles per entry

const cacheMap = new Map(); // key -> { ts, articles }

function makeKey(country, max) {
  return `${country || "global"}::${max}`;
}

function getCached(key) {
  const item = cacheMap.get(key);
  if (!item) return null;
  if ((Date.now() - item.ts) >= TTL) {
    cacheMap.delete(key);
    return null;
  }
  // refresh order (treat as recently used)
  cacheMap.delete(key);
  cacheMap.set(key, item);
  return item.articles;
}

function setCache(key, articles) {
  const trimmed = Array.isArray(articles) ? articles.slice(0, MAX_ARTICLES_PER_ENTRY) : [];
  if (cacheMap.has(key)) cacheMap.delete(key);
  cacheMap.set(key, { ts: Date.now(), articles: trimmed });
  while (cacheMap.size > MAX_CACHE_ENTRIES) {
    const oldestKey = cacheMap.keys().next().value;
    cacheMap.delete(oldestKey);
  }
}

// basic rate limiter for this endpoint (adjust window/max as needed)
const limiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 60, // limit each IP to 60 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many requests to /api/dailyNews — please try again later." },
});

router.use(limiter);

// GET /api/dailyNews?country=in&max=10
router.get("/", async (req, res) => {
  const country = String(req.query.country || "in").trim();
  const max = Math.max(1, Math.min(50, Number(req.query.max || 10)));

  if (!GNEWS_API_KEY) {
    return res.status(500).json({ error: "GNews API key not configured on server." });
  }

  try {
    const key = makeKey(country, max);
    const cached = getCached(key);
    if (cached) {
      return res.json({ articles: cached, source: "cache", fetchedAt: new Date() });
    }

    const params = new URLSearchParams({
      topic: "business", 
      max: String(max),
      lang: "en",
      token: GNEWS_API_KEY,
    });
    if (country) params.set("country", country);

    const url = `https://gnews.io/api/v4/top-headlines?${params.toString()}`;
    const response = await axios.get(url, { timeout: AXIOS_TIMEOUT_MS });

    const articles = response.data?.articles || [];
    setCache(key, articles);

    return res.json({ articles: articles.slice(0, MAX_ARTICLES_PER_ENTRY), source: "GNews", fetchedAt: new Date() });
  } catch (err) {
    const status = err?.response?.status || 502;
    const detail = err?.response?.data || err.message || "Unknown error";
    return res.status(502).json({ error: "Failed to fetch from GNews", status, detail });
  }
});

export default router;
