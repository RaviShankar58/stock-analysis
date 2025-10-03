// providers/aiSummerize.js
import { JSDOM } from "jsdom";
import { Readability } from "@mozilla/readability";
import dotenv from "dotenv";
dotenv.config();

const HF_API_KEY = process.env.HUGGINGFACE_API_KEY || process.env.HF_API_KEY;
if (!HF_API_KEY) console.error("Missing HUGGINGFACE_API_KEY/HF_API_KEY in .env (providers/aiSummerize)");

const HF_MODEL_PRIORITY = (process.env.HF_MODEL_PRIORITY || "facebook/bart-large-cnn,sshleifer/distilbart-cnn-12-6")
  .split(",").map(s => s.trim()).filter(Boolean);

const SLEEP_MS = parseInt(process.env.SLEEP_MS || "600", 10);
const MAX_CHUNKS = parseInt(process.env.MAX_CHUNKS || "4", 10);

const MODEL_WORD_LIMIT = parseInt(process.env.MODEL_WORD_LIMIT || process.env.MODEL_TOKEN_LIMIT || "600", 10);

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }


export async function fetchHtml(url) {
  const res = await fetch(url, { headers: { "User-Agent": "aiSummerize/1.0" }, redirect: "follow" });
  if (!res.ok) throw new Error(`Fetch failed: ${res.status} ${res.statusText}`);
  return await res.text();
}

export function extractArticle(html, baseUrl = "") {
  const dom = new JSDOM(html, { url: baseUrl, contentType: "text/html" });
  const r = new Readability(dom.window.document).parse();
  if (!r || !r.textContent) throw new Error("Readability failed to extract article text");
  return { title: r.title || "", byline: r.byline || "", excerpt: r.excerpt || "", text: r.textContent.trim() };
}

export function splitIntoSentences(text) {
  if (!text) return [];
  const norm = text.replace(/\r\n/g, "\n").replace(/\n+/g, "\n").trim();
  const sents = norm.split(/(?<=[.?!])\s+(?=[A-Z0-9"“‘])/g).map(s => s.trim()).filter(Boolean);
  return sents.length ? sents : norm.split("\n").map(s => s.trim()).filter(Boolean);
}

export function splitIntoNChunks(text, n = MAX_CHUNKS) {
  if (!text) return [];
  const sents = splitIntoSentences(text);
  if (sents.length === 0) return [text];

  const totalChars = sents.reduce((a, s) => a + s.length, 0);
  const target = Math.ceil(totalChars / n);
  const chunks = [];
  let cur = [], curLen = 0;

  for (let i = 0; i < sents.length; i++) {
    const s = sents[i];
    if (curLen === 0) { cur.push(s); curLen += s.length; continue; }
    if (curLen + s.length <= target || curLen < target * 0.4) { cur.push(s); curLen += s.length; }
    else { chunks.push(cur.join(" ")); cur = [s]; curLen = s.length; }
  }
  if (cur.length) chunks.push(cur.join(" "));
  while (chunks.length > n) {
    const last = chunks.pop();
    chunks[chunks.length - 1] += "\n\n" + last;
  }
  return chunks;
}

async function hfCallModelRaw(model, input, params = {}) {
  if (!HF_API_KEY) throw new Error("HF_API_KEY not configured");
  const url = `https://api-inference.huggingface.co/models/${model}`;
  const payload = { inputs: input, parameters: params };
  const res = await fetch(url, {
    method: "POST",
    headers: { Authorization: `Bearer ${HF_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });
  const body = await res.text();
  if (!res.ok) {
    const e = new Error(`HF ${model} ${res.status}: ${body.slice(0, 2000)}`);
    e.status = res.status; e.body = body; e.model = model;
    throw e;
  }
  return body;
}

function tryExtractSummaryFromHFResponse(raw) {
  if (!raw) return "";
  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed[0]) {
      if (parsed[0].summary_text) return parsed[0].summary_text;
      if (typeof parsed[0] === "string") return parsed[0];
    }
    if (typeof parsed === "object" && parsed.summary_text) return parsed.summary_text;
    if (typeof parsed === "string") return parsed;
  } catch (e) {
    const cleaned = raw.toString().replace(/\n+/g, " ").trim();
    return cleaned;
  }
  return raw.toString().replace(/\n+/g, " ").trim();
}


export async function summarizeChunkWithFallback(chunkText, modelList = HF_MODEL_PRIORITY) {
  if (!chunkText || !chunkText.trim()) return { output: "", model_used: null, raw_response: null };

  const approxMin = Math.max(30, Math.min(140, Math.floor(chunkText.length / 8)));
  const params = {
    max_new_tokens: 250,
    min_length: approxMin,
    do_sample: false,
    clean_up_tokenization_spaces: true
  };

  for (let i = 0; i < modelList.length; i++) {
    const model = modelList[i];
    try {
      const raw = await hfCallModelRaw(model, chunkText, params);
      const out = tryExtractSummaryFromHFResponse(raw);
      if (out && out.length > 5) {
        return { output: out.trim(), model_used: model, raw_response: raw };
      } else {
        return { output: (out || "").trim(), model_used: model, raw_response: raw };
      }
    } catch (err) {
      if (i < modelList.length - 1) await sleep(SLEEP_MS);
      else return { output: "", model_used: null, error: err.message };
    }
  }
  return { output: "", model_used: null };
}

export async function summarizeArticle({ url = null, rawText = null, title = null, maxChunks = MAX_CHUNKS } = {}) {
  let extractedText = "";
  let usedTitle = title || "";

  if (url) {
    const html = await fetchHtml(url);
    const article = extractArticle(html, url);
    usedTitle = usedTitle || article.title;
    extractedText = `TITLE: ${article.title}\n\n${article.text}`;
  } else if (rawText && rawText.trim().length > 0) {
    extractedText = typeof rawText === "string" ? rawText : String(rawText);
  } else {
    throw new Error("summarizeArticle requires either url or rawText");
  }

  console.log("=== EXTRACTED TEXT (first 1200 chars) ===");
  console.log(extractedText.slice(0, 1200));
  console.log("=== END EXTRACTED TEXT PREVIEW ===");

  const words = extractedText.split(/\s+/).filter(Boolean);
  const limit = Math.max(10, MODEL_WORD_LIMIT); // safe lower bound
  const chosenWords = words.slice(0, limit);
  const chunkText = chosenWords.join(" ");

  console.log(`=== USING FIRST ${chosenWords.length} WORDS AS SINGLE CHUNK (word limit=${limit}) ===`);
  console.log(chunkText.slice(0, 1200));
  console.log("=== END CHUNK PREVIEW ===");

  const res = await summarizeChunkWithFallback(chunkText, HF_MODEL_PRIORITY);
  const out = res.output || "";


  console.log(`--- OUT 1 (model: ${res.model_used || "none"}) ---`);
  console.log(out.slice(0, 2000));
  console.log(`--- END OUT 1 ---`);

  const finalSummary = out;

  console.log("=== FINAL SUMMARY PREVIEW ===");
  console.log(finalSummary.slice(0, 2000));
  console.log("=== END FINAL SUMMARY PREVIEW ===");

  return {
    finalSummary,
    chunkOutputs: [out],
    perChunkMeta: [{ index: 1, model_used: res.model_used, chars: chunkText.length }],
    extractedText,
    usedTitle
  };
}
