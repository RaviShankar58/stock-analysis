// routes/dailyNews.js
import express from "express";
import axios from "axios";

const router = express.Router();
const GNEWS_API_KEY = process.env.GNEWS_API_KEY;
const TTL = 6 * 60 * 60 * 1000; // 6 hours

const cache = {};

function makeKey(country, max) {
  return `${country || "global"}::${max}`;
}

// GET /api/dailyNews?country=in&max=10&topic=business
router.get("/", async (req, res) => {
  const country = req.query.country || "in";
  const max = Math.max(1, Math.min(50, Number(req.query.max || 10)));

  if (!GNEWS_API_KEY) {
    return res.status(500).json({ error: "GNews API key not configured on server ." });
  }

  try {
    const key = makeKey(country, max);
    const cached = cache[key];
    if (cached && (Date.now() - cached.ts) < TTL) {
      return res.json({ articles: cached.articles, source: "cache", fetchedAt: new Date(cached.ts) });
    }

    const params = new URLSearchParams({
      max: String(max),
      lang: "en",
      token: GNEWS_API_KEY,
    });
    if (country) params.set("country", country);

    const url = `https://gnews.io/api/v4/top-headlines?${params.toString()}`;
    const response = await axios.get(url);

    const articles = response.data?.articles || [];
    cache[key] = { ts: Date.now(), articles };
    return res.json({ articles, source: "GNews", fetchedAt: new Date() });
  } catch (err) {
    const detail = err?.response?.data || err.message;
    return res.status(500).json({ error: "GNews fetch failed", detail });
  }
});

export default router;
