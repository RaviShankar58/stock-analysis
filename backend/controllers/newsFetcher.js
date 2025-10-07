import axios from "axios";
import { Portfolio } from "../models/Portfolio.js";
import { Article } from "../models/Article.js";
import dotenv from "dotenv";
dotenv.config();

// provider adapters
import * as marketauxProvider from "../providers/marketauxProvider.js";
// future providers: import * as newsdataProvider from "../providers/newsdataProvider.js";

const PROVIDERS = [
  { name: "marketaux", module: marketauxProvider, enabled: !!process.env.MARKETAUX_API_KEY },
  // add more providers here with flags:
  // { name: "newsdata", module: newsdataProvider, enabled: !!process.env.NEWSDATA_API_KEY },
];

const TOP_N = parseInt(process.env.FETCH_TOP_N_PER_TICKER || "10", 10);

// ---------------------------------------------------------------------------------------------
// prune helper: keep only the newest `keepN` articles for a stockName
async function pruneArticles(stockName, keepN = 5) {
  try {
    if (!stockName) return { deletedCount: 0 };

    // 1) find ids to delete: skip the first keepN newest, then get the rest ids
    const docsToDelete = await Article.find({ stockName })
      .sort({ publishedAt: -1, _id: -1 })
      .skip(keepN)
      .select({ _id: 1 })
      .lean();

    if (!docsToDelete || docsToDelete.length === 0) {
      return { deletedCount: 0 };
    }

    const ids = docsToDelete.map(d => d._id);
    const res = await Article.deleteMany({ _id: { $in: ids } });
    // console.log(`Pruned ${res.deletedCount || 0} old articles for ${stockName} (kept ${keepN}).`);
    return { deletedCount: res.deletedCount || 0 };
  } catch (err) {
    console.error("pruneArticles error for", stockName, err?.message || err);
    return { deletedCount: 0, error: err?.message || String(err) };
  }
}

// default keep per stock, configurable via env
const KEEP_PER_STOCK = parseInt(process.env.KEEP_PER_STOCK || "5", 10);
// ---------------------------------------------------------------------------------------------


// helper: upsert single normalized article doc
async function upsertArticle(stockName, normalized) {
  const doc = {
    stockName,
    title: normalized.title,
    url: normalized.url || null,
    source: normalized.source,
    provider: normalized.provider,
    providerId: normalized.providerId || null,
    publishedAt: normalized.publishedAt || new Date(),
    fetchedAt: new Date(),
    summary: "",
    key_facts: [],
    rationale: "",
    impact_label: null,
    impact_confidence: 0,
    raw_text: normalized.raw_text || "",
    entities: normalized.entities || [],
    raw_payload: normalized.raw_payload || {},
    country: (normalized.country || "").toString().toUpperCase(),
    language: normalized.language || ""
  };
    // dedupe order: provider+providerId -> url -> stockName+title+publishedAt
  let filter = null;
  if (doc.provider && doc.providerId) filter = { provider: doc.provider, providerId: doc.providerId };
  else if (doc.url) filter = { url: doc.url };
  else filter = { stockName: doc.stockName, title: doc.title, publishedAt: doc.publishedAt };

// --------------------------------------------------------------------------------------------------
  // const up = await Article.updateOne(filter, { $setOnInsert: doc }, { upsert: true });
  // const inserted = (up.upsertedId || up.upsertedCount || up.nUpserted) ? true : false;
  // return { inserted, doc };
// --------------------------------------------------------------------------------------------------
  const existing = await Article.findOne(filter).lean();

  if (!existing) {
    // No existing doc — insert
    const res = await Article.updateOne(filter, { $setOnInsert: doc }, { upsert: true });
    const inserted = (res.upsertedId || res.upsertedCount || res.nUpserted) ? true : false;
    return { inserted, doc };
  } else {
    // existing doc found — only update if incoming publishedAt is newer
    const incomingPublished = doc.publishedAt instanceof Date ? doc.publishedAt : new Date(doc.publishedAt);
    const existingPublished = existing.publishedAt ? new Date(existing.publishedAt) : null;

    const incomingIsNewer = !existingPublished || (incomingPublished && incomingPublished > existingPublished);

    if (incomingIsNewer) {
      const fieldsToUpdate = {
        publishedAt: incomingPublished,
        fetchedAt: new Date(),
        // update metadata fields (but intentionally do NOT overwrite summary/key_facts)
        ...(doc.raw_text ? { raw_text: doc.raw_text } : {}),
        ...(Array.isArray(doc.entities) && doc.entities.length ? { entities: doc.entities } : {}),
        source: doc.source,
        provider: doc.provider,
        providerId: doc.providerId || null
      };
      await Article.updateOne(filter, { $set: fieldsToUpdate });
      return { inserted: false, updated: true, doc: fieldsToUpdate };
    } else {
      return { inserted: false, updated: false, doc: existing };
    }
  }
// ----------------------------------------------------------------------------------------------
}

export async function runNewsFetch({ limitPerTicker = TOP_N } = {}) {
  // console.log("Starting orchestrated news fetcher...");
  const stats = { itemsChecked: 0, groupsChecked: 0, totalFetched: 0, totalSaved: 0, errors: [] };

  // 1) Read portfolio items (stockName + country)
  let portfolioItems = [];
  try {
    portfolioItems = await Portfolio.find({}, { stockName: 1, country: 1 }).lean();
  } catch (e) {
    const msg = `Failed to read Portfolio items: ${e.message}`;
    console.error(msg);
    stats.errors.push({ stage: "read_portfolio", error: msg });
    return stats;
  }

  if (!Array.isArray(portfolioItems) || portfolioItems.length === 0) {
    // console.log("No portfolio items found.");
    return stats;
  }
  stats.itemsChecked = portfolioItems.length;

  // Group unique (stockName, country)
  const grouped = {};
  for (const it of portfolioItems) {
    const name = (it.stockName || "").trim();
    const country = (it.country || "IN").toString().trim().toUpperCase() || "IN";
    const key = `${name}||${country}`;
    if (!grouped[key]) grouped[key] = { stockName: name, country };
  }
  const groups = Object.values(grouped);
  stats.groupsChecked = groups.length;

  // For each stockName+country, call providers in order (stop early if enough results)
  for (const g of groups) {
    const stockName = g.stockName;
    const country = g.country;
    if (!stockName) continue;

    // console.log(`\nFetching for "${stockName}" (${country})`);
    const seenUrls = new Set();        // to dedupe across providers in this run
    const seenProviderIds = new Set(); // provider|id pairs
    let fetchedCountForGroup = 0;

    for (const p of PROVIDERS) {
      if (!p.enabled) {
        // console.log(`Provider ${p.name} disabled (no API key) — skipping`);
        continue;
      }
      try {
// ----------------------------------------------------------------------------------------------------
        // module.search returns normalized list
        // const list = await p.module.search(stockName, country, limitPerTicker);
        // stats.totalFetched += list.length;
// ----------------------------------------------------------------------------------------------------
        // --- compute the optional since cutoff (only if FETCH_RECENT_DAYS > 0) ---
        const lookbackDays = parseInt(process.env.FETCH_RECENT_DAYS || "90", 10);
        const sinceDate = lookbackDays > 0 ? new Date(Date.now() - lookbackDays * 24 * 60 * 60 * 1000) : null;
        const publishedAfterParam = sinceDate ? sinceDate.toISOString() : null;

        // module.search now accepts (stockName, country, limit, publishedAfter)
        let list = await p.module.search(stockName, country, limitPerTicker, publishedAfterParam);
        // defensive: ensure list is an array
        if (!Array.isArray(list)) list = [];

        const originalCount = list.length;
        if (sinceDate) {
          list = list.filter(it => {
            try {
              const date = it && it.publishedAt ? new Date(it.publishedAt) : null;
              return date instanceof Date && !isNaN(date) && date >= sinceDate;
            } catch (e) {
              return false;
            }
          });
          if (originalCount !== list.length) {
            // console.log(`Provider ${p.name} returned ${originalCount} items, ${originalCount - list.length} dropped (older than ${sinceDate.toISOString()})`);
          }
        }

        stats.totalFetched += list.length;
// ----------------------------------------------------------------------------------------------------
        for (const item of list) {
          // global dedupe in group
          if (item.provider && item.providerId) {
            const pid = `${item.provider}||${item.providerId}`;
            if (seenProviderIds.has(pid)) continue;
            seenProviderIds.add(pid);
          } else if (item.url && seenUrls.has(item.url)) {
            continue;
          } else if (item.url) {
            seenUrls.add(item.url);
          }

          // save
          const { inserted } = await upsertArticle(stockName, item);
          if (inserted) {
            stats.totalSaved += 1;
          }

          fetchedCountForGroup += 1;
          if (fetchedCountForGroup >= limitPerTicker) break;
        }
      } catch (err) {
        console.error(`Provider ${p.name} failed for ${stockName}:`, err?.message || err);
        stats.errors.push({ provider: p.name, stockName, error: err?.message || String(err) });
        // continue to next provider
      }

      if (fetchedCountForGroup >= limitPerTicker) break;
    } // providers loop
// ------------------------------------------------------------------------------------
    try {
      const pruneRes = await pruneArticles(stockName, KEEP_PER_STOCK);
      stats.totalPruned = (stats.totalPruned || 0) + (pruneRes.deletedCount || 0);
    } catch (e) {
      console.error("Prune failed for", stockName, e);
    }
// ------------------------------------------------------------------------------------
  } // groups loop

  // console.log("Orchestrated news fetcher finished. stats:", stats);
  return stats;
}
