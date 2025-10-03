// providers/analyzeArticle.js
import dotenv from "dotenv";
dotenv.config();

const AWAN_API_KEY = process.env.AWAN_API_KEY;
const AWAN_API_BASE = process.env.AWAN_API_BASE || "https://api.awanllm.com";
const PRIMARY_MODEL = process.env.AWAN_MODEL_PRIMARY || "llama3.1:70b";
const FALLBACK_MODELS = (process.env.AWAN_MODEL_FALLBACK || "")
  .split(",").map(s => s.trim()).filter(Boolean);
const TIMEOUT_MS = parseInt(process.env.AWAN_TIMEOUT_MS || "80000", 10);

if (!AWAN_API_KEY) console.warn("AWAN_API_KEY not set — analyzeArticle will fail without it.");


function safeFetch(url, opts) {
  return fetch(url, opts);
}

// Extract first balanced JSON object from text
function extractJsonBlock(text) {
  if (!text || typeof text !== "string") return null;
  const start = text.indexOf("{");
  if (start === -1) return null;
  let depth = 0;
  for (let i = start; i < text.length; i++) {
    const ch = text[i];
    if (ch === "{") depth++;
    else if (ch === "}") {
      depth--;
      if (depth === 0) {
        const candidate = text.slice(start, i + 1);
        try { return JSON.parse(candidate); }
        catch (e) {
          const cleaned = candidate.replace(/,\s*}/g, "}").replace(/,\s*]/g, "]");
          try { return JSON.parse(cleaned); } catch (e2) { return null; }
        }
      }
    }
  }
  return null;
}

function validateAndNormalize(obj) {
  if (!obj || typeof obj !== "object") return null;
  const label = (obj.impact_label || obj.impact || "").toString().toLowerCase();
  const allowedLabels = ["positive", "neutral", "negative"];
  const impact_label = allowedLabels.includes(label) ? label : null;

  let impact_confidence = null;
  if (obj.impact_confidence !== undefined) {
    const n = Number(obj.impact_confidence);
    if (!isNaN(n)) impact_confidence = Math.max(0, Math.min(100, Math.round(n)));
  }

  const actionRaw = (obj.action || obj.recommendation || "").toString().toLowerCase();
  const action = ["buy", "hold", "sell"].includes(actionRaw) ? actionRaw : null;

  const rationale = (obj.rationale || obj.explanation || "").toString().trim();

  if (!impact_label && impact_confidence === null && !action && !rationale) return null;
  return { impact_label, impact_confidence, action, rationale };
}

function fallbackFromImpact(impact_label, confidence) {
  const conf = typeof confidence === "number" ? confidence : 0;
  if (impact_label === "positive") {
    return conf >= 70 ? "buy" : "hold";
  } else if (impact_label === "negative") {
    return conf >= 70 ? "sell" : "hold";
  }
  return "hold";
}

async function callModel(model, prompt) {
  const url = `${AWAN_API_BASE.replace(/\/$/, "")}/v1/chat/completions`;
  const body = {
    model,
    messages: [
      { role: "system", content: "You are a concise financial analyst. Use only facts provided and return STRICT JSON only." },
      { role: "user", content: prompt }
    ],
    max_tokens: 600,
    temperature: 0.0
  };

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const res = await safeFetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${AWAN_API_KEY}`
      },
      body: JSON.stringify(body),
      signal: controller.signal
    });
    clearTimeout(timer);
    const text = await res.text();
    if (!res.ok) {
      const e = new Error(`Model ${model} error ${res.status}`);
      e.status = res.status; e.body = text;
      throw e;
    }
    // parse wrapper: many providers return choices[0].message.content
    try {
      const parsed = JSON.parse(text);
      const content = parsed?.choices?.[0]?.message?.content ?? parsed?.choices?.[0]?.text ?? parsed?.data?.[0]?.text ?? text;
      return { ok: true, model, content, raw: text };
    } catch (e) {
      return { ok: true, model, content: text, raw: text };
    }
  } catch (err) {
    clearTimeout(timer);
    return { ok: false, model, error: err.message || String(err), raw: err?.body || null };
  }
}

/* ---------- main exported function ---------- */

export async function analyzeArticle({ title = "", summary = "", raw_text = "" } = {}) {
  const prompt = `You are a concise market analyst. Using ONLY the facts below, RETURN STRICT JSON ONLY (no extra text).

Input:
TITLE:
"""${title || ""}"""

SUMMARY:
"""${summary || ""}"""

RAW_TEXT:
"""${raw_text || ""}"""

Return JSON:
{
  "impact_label": "positive|neutral|negative",
  "impact_confidence": 0-100,
  "action": "buy|hold|sell",
  "rationale": "2-4 short sentences explaining the main evidence why action was taken"
}
`;

  const candidates = [PRIMARY_MODEL, ...FALLBACK_MODELS];
  let lastError = null;
  for (let i = 0; i < candidates.length; i++) {
    const model = candidates[i];
    if (!model) continue;
    const res = await callModel(model, prompt);
    if (!res.ok) {
      lastError = res.error || res.raw;
      continue; // try next
    }

    const content = typeof res.content === "string" ? res.content : JSON.stringify(res.content);

    let parsed = extractJsonBlock(content);
    if (!parsed) {
      try {
        parsed = JSON.parse(content);
      } catch (e) {
        parsed = null;
      }
    }

    const normalized = validateAndNormalize(parsed);
    if (normalized) {
      const action = normalized.action || fallbackFromImpact(normalized.impact_label, normalized.impact_confidence);
      return {
        impact_label: normalized.impact_label || "neutral",
        impact_confidence: normalized.impact_confidence ?? 50,
        action,
        rationale: normalized.rationale || "",
        model_used: model,
        raw_response: res.raw
      };
    }

    // If parsing failed, but content contains some text: attempt lightweight regex extraction for keywords or simple label guesses
    lastError = res.raw || content;
    // Try a simple fallback parse by searching for keywords in content
    const txt = content.toLowerCase();
    if (txt.includes('"impact_label"') || txt.includes('impact_label')) {
      // attempt to extract approximate values by regex
      const matchLabel = txt.match(/impact_label["']?\s*[:=]\s*["']?([a-z]+)["']?/i);
      const matchConf = txt.match(/impact_confidence["']?\s*[:=]\s*(\d{1,3})/i);
      const matchAction = txt.match(/"action"[:=]\s*["']?([a-z]+)["']?/i) || txt.match(/action[:=]\s*["']?([a-z]+)["']?/i);
      const approx = {
        impact_label: matchLabel ? matchLabel[1].toLowerCase() : null,
        impact_confidence: matchConf ? Math.max(0, Math.min(100, Number(matchConf[1]))) : null,
        action: matchAction ? matchAction[1].toLowerCase() : null,
        rationale: null
      };
      const normalized2 = validateAndNormalize(approx);
      if (normalized2) {
        const action = normalized2.action || fallbackFromImpact(normalized2.impact_label, normalized2.impact_confidence);
        return {
          impact_label: normalized2.impact_label || "neutral",
          impact_confidence: normalized2.impact_confidence ?? 50,
          action,
          rationale: normalized2.rationale || "",
          model_used: model,
          raw_response: res.raw
        };
      }
    }

  }


  const textLower = `${title}\n${summary}\n${raw_text}`.toLowerCase();
  let impact_label = "neutral";
  let confidence = 50;
  if (/(lower circuit|hit the lower circuit|plunge|plunged|slump|default|fraud|barred|penal|fine|penalty|sued|diversion of funds)/i.test(textLower)) {
    impact_label = "negative"; confidence = 80;
  } else if (/(acquire|acquisition|partnership|boost|surge|growth|record profit|beat expectations|upgrade)/i.test(textLower)) {
    impact_label = "positive"; confidence = 75;
  }
  const action = fallbackFromImpact(impact_label, confidence);

  return {
    impact_label,
    impact_confidence: confidence,
    action,
    rationale: `Fallback heuristic decision derived from keywords.`,
    model_used: null,
    raw_response: lastError
  };
}
