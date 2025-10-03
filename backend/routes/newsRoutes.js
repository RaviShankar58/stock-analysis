// routes/newsRoutes.js
import express from "express";
import { fetchNow } from "../controllers/newsController.js";
import { Article } from "../models/Article.js";
// import { analyzeArticle } from "../controllers/newsAnalysisController.js";
import { authMiddleware } from "../middleware/auth.js";
import { summerizeArticle } from "../controllers/newsAnalysisController.js";
import { analyzeArticleController } from "../controllers/newsAnalysisController.js";



const router = express.Router();

// GET /api/news?stock=RELIANCE&limit=10
router.get("/", async (req, res) => {
  try {
    const stock = (req.query.stock || "").toUpperCase();
    const limit = Math.max(1, Math.min(50, parseInt(req.query.limit || "10", 10)));
    if (!stock) return res.status(400).json({ error: "stock (query) required" });

    const docs = await Article.find({ stockName: stock }).sort({ publishedAt: -1 }).limit(limit).lean();
    // Only expose headline data for the list view
    const list = docs.map(d => ({
      id: d._id,
      title: d.title,
      source: d.source,
      url: d.url,
      publishedAt: d.publishedAt,
      provider: d.provider
    }));
    return res.json({ ok: true, items: list });
  } catch (err) {
    console.error("GET /api/news error:", err);
    return res.status(500).json({ error: err.message || "Server error" });
  }
});

// POST /api/news/fetch-now  -> manual trigger (calls controller)
router.post("/fetch-now", fetchNow);

// POST /api/news/:articleId/summerize  (auth required)
router.post("/:articleId/summerize", authMiddleware, summerizeArticle);

// POST /api/news/:articleId/analyze  (auth required)
router.post("/:articleId/analyze", authMiddleware, analyzeArticleController);


export default router;
