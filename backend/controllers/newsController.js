import { runNewsFetch } from "./newsFetcher.js";

export const fetchNow = async (req, res) => {
  try {
    const opts = req.body || {};
    await runNewsFetch(opts);
    return res.json({ ok: true, message: "News fetch started/completed" });
  } catch (err) {
    console.error("fetchNow error:", err);
    return res.status(500).json({ ok: false, error: err.message || "Fetch failed" });
  }
};
