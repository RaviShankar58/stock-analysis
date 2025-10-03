// controllers/articleExtractor.js
import axios from "axios";
import { JSDOM } from "jsdom";
import Readability from "@mozilla/readability";
import { chromium } from "playwright";

/**
 * Fetch a URL and extract cleaned article text using Playwright to render JS.
 * Falls back to axios+Readability if Playwright fails.
 *
 * @param {string} url
 * @param {object} opts - { timeoutMs, usePlaywright (default true) }
 */
export async function fetchArticleFromUrl(url, opts = {}) {
  if (!url) throw new Error("url required");
  const timeout = opts.timeoutMs || 30000;
  const usePlaywright = opts.usePlaywright !== false;

  // helper to parse HTML with Readability
  const parseWithReadability = (html, baseUrl) => {
    const dom = new JSDOM(html, { url: baseUrl });
    const doc = dom.window.document;
    try {
      const parsed = new Readability(doc).parse();
      if (parsed && parsed.textContent && parsed.textContent.trim().length > 50) {
        return {
          title: parsed.title || "",
          byline: parsed.byline || "",
          text: parsed.textContent || "",
          contentHtml: parsed.content || "",
          excerpt: parsed.excerpt || ""
        };
      }
    } catch (e) {
      // ignore
    }
    // fallback: gather paragraphs
    const paras = Array.from(doc.querySelectorAll("article p, main p, .article-body p, p"))
      .map(p => p.textContent.trim()).filter(Boolean);
    return {
      title: doc.querySelector('meta[property="og:title"]')?.getAttribute("content") || doc.title || "",
      byline: doc.querySelector('meta[name="author"]')?.getAttribute("content") || "",
      text: paras.join("\n\n"),
      contentHtml: "",
      excerpt: doc.querySelector('meta[name="description"]')?.getAttribute("content") || ""
    };
  };

  // Try Playwright render first
  if (usePlaywright) {
    let browser;
    try {
      browser = await chromium.launch({ args: ["--no-sandbox"] });
      const page = await browser.newPage();
      await page.setUserAgent("Mozilla/5.0 (compatible; StockBot/1.0)");
      await page.goto(url, { timeout, waitUntil: "networkidle" });
      // optional: wait extra for dynamic content
      await page.waitForTimeout(500); 
      const html = await page.content();
      const parsed = parseWithReadability(html, url);
      await browser.close();

      // If parsed.text is small, fall back to axios parse
      if (parsed.text && parsed.text.length > 100) {
        return { url, title: parsed.title, byline: parsed.byline, text: parsed.text, contentHtml: parsed.contentHtml, excerpt: parsed.excerpt, publishedAt: null };
      }
      // else fall through to axios fetch
    } catch (err) {
      if (browser) await browser.close().catch(()=>{});
      // continue to axios fallback
    }
  }

  // Fallback to axios fetch + Readability
  try {
    const resp = await axios.get(url, { timeout, headers: { "User-Agent": "Mozilla/5.0 (compatible; StockBot/1.0)" } });
    const html = resp.data;
    const parsed = parseWithReadability(html, url);
    return { url, title: parsed.title, byline: parsed.byline, text: parsed.text, contentHtml: parsed.contentHtml, excerpt: parsed.excerpt, publishedAt: null };
  } catch (err) {
    throw new Error(`fetchArticleFromUrl failed: ${err.message}`);
  }
}
