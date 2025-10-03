// controllers/newsAnalysisController.js
import { Article } from "../models/Article.js";
import { summarizeArticle } from "../providers/aiSummerize.js";
import { analyzeArticle } from "../providers/analyzeArticle.js";

export async function summerizeArticle(req, res) {
  try {
    const { articleId } = req.params;
    if (!articleId) return res.status(400).json({ error: "Missing articleId in params" });

    const article = await Article.findById(articleId);
    if (!article) return res.status(404).json({ error: "Article not found" });

    const hasUrl = article.url && String(article.url).trim().length > 5;
    const hasRawText = article.raw_text && String(article.raw_text).trim().length > 50;
    const inputSource = hasUrl ? "url" : (hasRawText ? "raw_text" : null);
    if (!inputSource) {
      return res.status(422).json({ error: "No usable article content (url or raw_text required)" });
    }

    const providerInput = {};
    if (hasUrl) providerInput.url = article.url;
    else providerInput.rawText = article.raw_text;
    if (article.title) providerInput.title = article.title;

    const result = await summarizeArticle(providerInput);

    if (!result || typeof result.finalSummary !== "string") {
      return res.status(500).json({ error: "Summarization failed (no result)" });
    }

    article.summary = result.finalSummary;
    
    article.rationale = result.chunkOutputs ? result.chunkOutputs.join("\n\n") : "";
    article.key_facts = article.key_facts && Array.isArray(article.key_facts) ? article.key_facts : [];

    article.fetchedAt = new Date();
    await article.save();

    return res.json({
      success: true,
      articleId: article._id,
      summary: article.summary,
      key_facts: article.key_facts,
      models_used: result.perChunkMeta ? result.perChunkMeta.map(m => m.model_used) : [],
      note: `Used ${inputSource} as input`
    });
  } catch (err) {
    console.error("summerizeArticle error:", err);
    return res.status(500).json({ error: "Internal server error", detail: err.message });
  }
}



export async function analyzeArticleController(req, res) {
  try {
    const { articleId } = req.params;
    if (!articleId) return res.status(400).json({ error: "Missing articleId in params" });

    const article = await Article.findById(articleId);
    if (!article) return res.status(404).json({ error: "Article not found" });

    // Build input: prefer summary; if missing, use title + raw_text
    const inputSummary = article.summary && article.summary.trim().length > 20 ? article.summary : "";
    const inputTitle = article.title || "";
    const inputRaw = article.raw_text || "";

    const result = await analyzeArticle({ title: inputTitle, summary: inputSummary, raw_text: inputRaw });

    if (result.error) {
      console.error("analyzeArticle provider error:", result.error);
      return res.status(500).json({ error: "Analysis failed", detail: result.error });
    }

    // Save rationale in article.rationale (as requested) and impact fields
    article.rationale = result.rationale || article.rationale || (`Decision: ${result.action}`);
    article.impact_label = result.impact_label || article.impact_label;
    article.impact_confidence = result.impact_confidence ?? article.impact_confidence ?? 0;
    await article.save();

    return res.json({
      success: true,
      articleId: article._id,
      impact_label: article.impact_label,
      impact_confidence: article.impact_confidence,
      rationale: article.rationale,
      action: result.action,
      model_used: result.model_used
    });
  } catch (err) {
    console.error("analyzeArticleController error:", err);
    return res.status(500).json({ error: "Internal server error", detail: err.message });
  }
}
