import mongoose from "mongoose";

const { Schema } = mongoose;

const articleSchema = new Schema({
  stockName: { type: String, index: true },

  title: { type: String },
  url: { type: String },                
  source: { type: String },              
  

  provider: { type: String, default: "unknown" },   // e.g., "marketaux", "moneycontrol", "custom-scraper"
  providerId: { type: String },                  

  publishedAt: { type: Date },
  fetchedAt: { type: Date, default: Date.now },

  summary: { type: String, default: "" },
  key_facts: { type: [String], default: [] },
  rationale: { type: String, default: "" },

  impact_label: { type: String, enum: ["positive", "neutral", "negative"], default: null },
  impact_confidence: { type: Number, default: 0 },

  raw_text: { type: String },                    // snippet/description returned by provider
  entities: { type: [String], default: [] },     // optional: named entities / tags
  raw_payload: { type: Schema.Types.Mixed },     // store original provider response for reprocessing

  country: { type: String },                     // e.g., "in", "us"
  language: { type: String }                     // e.g., "en"

}, { timestamps: true });



articleSchema.index({ url: 1 }, { unique: true, sparse: true });
articleSchema.index({ provider: 1, providerId: 1 }, { unique: true, sparse: true });
articleSchema.index({ provider: 1, country: 1 });
articleSchema.index({ stockName: 1, publishedAt: -1 });
// Unique per (provider, providerId) to dedupe provider-specific items reliably
articleSchema.index({ title: "text", raw_text: "text" }, { default_language: "english" });

export const Article = mongoose.model("Article", articleSchema);
