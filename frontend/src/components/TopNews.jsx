// src/components/TopNews.jsx
import React, { useEffect, useState, useRef } from "react";
import { fetchTopNews, clearNewsCacheFor } from "../lib/gnewsApi";
import LoadingSpinner from "./LoadingSpinner";

const COUNTRY_OPTIONS = [
  { code: "in", label: "India" },
  { code: "us", label: "United States" },
  { code: "gb", label: "United Kingdom" },
  { code: "sg", label: "Singapore" },
  { code: "au", label: "Australia" },
  { code: "ca", label: "Canada" },
  { code: "de", label: "Germany" },
  { code: "fr", label: "France" },
  { code: "",   label: "Global" },
];

export default function TopNews({
  defaultCountry = "in",
  maxResults = 10,
  autoRefreshIntervalMs = 3 * 60 * 60 * 1000, // 3 hours
}) {
  const [country, setCountry] = useState(defaultCountry);
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [lastUpdated, setLastUpdated] = useState(null);
  const mounted = useRef(true);
  const timerRef = useRef(null);

  const load = async ({ force = false } = {}) => {
    setError("");
    setLoading(true);
    try {
      const data = await fetchTopNews(country || "global", maxResults, force);
      if (!mounted.current) return;
      setArticles(data || []);
      setLastUpdated(Date.now());
    } catch (err) {
      if (!mounted.current) return;
      setError(err?.message || "Failed to fetch news");
    } finally {
      if (mounted.current) setLoading(false);
    }
  };

  useEffect(() => {
    mounted.current = true;
    load({ force: false });

    timerRef.current = setInterval(() => {
      load({ force: true });
    }, autoRefreshIntervalMs);

    return () => {
      mounted.current = false;
      if (timerRef.current) clearInterval(timerRef.current);
    };
    // eslint-disable-next-line
  }, [country, maxResults]);

  return (
    <div className="w-full max-w-2xl mx-auto  p-4 rounded-xl border border-white/10 shadow-sm text-white bg-black/60 backdrop-blur-sm">
      <div className="flex items-center justify-between mb-3">
        <div>
          <h2 className="text-xl font-bold">Today's highlights</h2>
          <div className="text-xs text-gray-400">Latest market headlines</div>
        </div>

        <div className="flex items-center gap-2">
          <select
            value={country}
            onChange={(e) => {
              const newCountry = e.target.value;
              setCountry(newCountry);
              clearNewsCacheFor(newCountry || null, maxResults);
              // immediate fetch for new country
              load({ force: true });
            }}
            className="bg-black/60 text-sm text-neutral-100 px-3 py-2 rounded border border-white/10"
          >
            {COUNTRY_OPTIONS.map((c) => (
              <option key={c.code} value={c.code}>
                {c.label}
              </option>
            ))}
          </select>

          <button
            onClick={() => { clearNewsCacheFor(country || null, maxResults); load({ force: true }); }}
            className="text-xs px-3 py-2 rounded bg-indigo-600 hover:bg-indigo-500 transition"
          >
            Refresh
          </button>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-6 text-neutral-300">
          <LoadingSpinner className="inline-block mr-2" /> Loading...
        </div>
      ) : error ? (
        <div className="text-sm text-red-400 py-4">{error}</div>
      ) : !articles || articles.length === 0 ? (
        <div className="text-sm text-neutral-400 py-4">No news available right now.</div>
      ) : (
        <ul className="space-y-3">
          {articles.map((a, i) => (
            <li key={a.url || a.title || i} className="p-3 rounded-md bg-white/5 hover:bg-white/10 transition">
              <a
                href={a.url || "#"}
                target="_blank"
                rel="noreferrer"
                className="text-sm font-medium text-indigo-200 hover:underline"
              >
                {a.title}
              </a>
              <div className="text-xs text-gray-400 mt-1 flex items-center justify-between">
                <div>
                  <span>{(a.source && a.source.name) || a.source || a.provider || ""}</span>
                  {a.publishedAt ? <span className="mx-2">•</span> : null}
                  {a.publishedAt ? new Date(a.publishedAt).toLocaleString() : null}
                </div>
                <div className="text-xs text-gray-400 italic">{country ? country.toUpperCase() : "GLOBAL"}</div>
              </div>
              {a.description ? (
                <p className="text-sm text-gray-300 mt-2 line-clamp-3">{a.description}</p>
              ) : null}
            </li>
          ))}
        </ul>
      )}

      <div className="mt-4 text-xs text-gray-400 flex items-center justify-between">
        <div>{lastUpdated ? `Last updated: ${new Date(lastUpdated).toLocaleString()}` : "Not updated yet"}</div>
        <div>
          <button
            onClick={() => { clearNewsCacheFor(country || null, maxResults); load({ force: true }); }}
            className="text-xs underline"
          >
            Force fetch
          </button>
        </div>
      </div>
    </div>
  );
}
