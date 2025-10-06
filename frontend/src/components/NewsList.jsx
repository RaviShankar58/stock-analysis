// src/components/NewsList.jsx
import React, { useEffect, useState, useRef } from "react";
import API from "../api/axios";
import NewsCard from "./NewsCard";
import ArticleModal from "./ArticleModal";
import LoadingSpinner from "./LoadingSpinner";
import SummaryViewer from "./SummaryViewer";

export default function NewsList() {
  const [portfolio, setPortfolio] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState({});
  const [selected, setSelected] = useState(null);
  const [viewer, setViewer] = useState({
    visible: false,
    type: null,
    data: null,
    title: "",
    articleId: null,
  });

  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    fetchPortfolio();
    const onUpdate = () => fetchPortfolio();
    window.addEventListener("portfolio-updated", onUpdate);

    const onOpenForStock = (ev) => {
      const stock = ev?.detail;
      if (stock) toggle(stock);
    };
    window.addEventListener("open-news-for-stock", onOpenForStock);

    return () => {
      mountedRef.current = false;
      window.removeEventListener("portfolio-updated", onUpdate);
      window.removeEventListener("open-news-for-stock", onOpenForStock);
    };
    // eslint-disable-next-line
  }, []);

  const fetchPortfolio = async () => {
    if (!mountedRef.current) return;
    setLoading(true);
    try {
      const res = await API.get("/user/portfolio");
      const items = res?.data?.portfolio ?? res?.data ?? [];
      if (mountedRef.current) setPortfolio(items || []);
    } catch (err) {
      console.error("fetchPortfolio error", err);
      if (mountedRef.current) setPortfolio([]);
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  };

  const toggle = async (stock) => {
    const stockName = (stock.stockName || stock.symbol || "").toString();
    const country = (stock.country || "IN").toString().toUpperCase();
    const key = `${stockName}||${country}`;
    const entry = expanded[key] || {};
    if (entry.expanded) {
      setExpanded((p) => ({ ...p, [key]: { ...entry, expanded: false } }));
      return;
    }
    if (entry.news && entry.news.length) {
      setExpanded((p) => ({ ...p, [key]: { ...entry, expanded: true } }));
      return;
    }

    setExpanded((p) => ({
      ...p,
      [key]: { ...(p[key] || {}), loading: true, expanded: true, error: "" },
    }));

    try {
      const limit = 10;
      const res = await API.get(
        `/user/news?stock=${encodeURIComponent(stockName)}&limit=${limit}`
      );
      const raw = res?.data?.items ?? res?.data ?? [];
      const news = (Array.isArray(raw) ? raw : []).map((a) => {
        if (!a) return a;
        return { ...a, _id: a._id ?? a.id ?? a._id };
      });

      setExpanded((p) => ({
        ...p,
        [key]: { ...p[key], news: news || [], loading: false, expanded: true },
      }));
    } catch (err) {
      console.error("Error fetching news for", stockName, err);
      const msg =
        err?.response?.data?.error ||
        err?.response?.data?.message ||
        err?.message ||
        "Failed to fetch news";
      setExpanded((p) => ({
        ...p,
        [key]: { ...p[key], loading: false, error: msg, news: [] },
      }));
    }
  };

  const handleCardOpen = (article) => {
    setSelected(article);
  };

  const updateArticleInState = (article) => {
    const copy = { ...expanded };
    Object.keys(copy).forEach((key) => {
      const e = copy[key];
      if (!e || !Array.isArray(e.news)) return;
      const idx = e.news.findIndex(
        (n) => n._id === article._id || n.url === article.url
      );
      if (idx >= 0) {
        e.news = [
          ...e.news.slice(0, idx),
          article,
          ...e.news.slice(idx + 1),
        ];
      }
    });
    setExpanded(copy);

    if (
      selected &&
      (selected._id === article._id || selected.url === article.url)
    ) {
      setSelected(article);
    }
  };

  const handleShowResult = (type, data, article) => {
    const title = article?.title || `${article?.stockName || ""} news`;
    setViewer({
      visible: true,
      type,
      data: data || {},
      title,
      articleId: article?._id ?? null,
    });
  };
  const handleCloseViewer = () =>
    setViewer({ visible: false, type: null, data: null, title: "", articleId: null });

  if (loading)
    return (
      <div className="p-4 text-center text-neutral-200">
        <LoadingSpinner className="inline-block mr-2" /> Loading portfolio for news...
      </div>
    );
  if (!portfolio.length)
    return (
      <div className="p-4 text-neutral-400">
        No stocks in portfolio — add one.
      </div>
    );

  return (
    <div className="space-y-6">
      {portfolio.map((s) => {
        const stockName = s.stockName || s.symbol || "";
        const country = s.country || "IN";
        const key = `${stockName}||${country}`;
        const entry = expanded[key] || {};
        return (
          <div
            key={key}
            className="rounded-xl bg-slate-800/60 backdrop-blur p-4 border border-white/10 shadow-md"
          >
            <div className="flex items-center justify-between">
              <div>
                <div className="text-lg font-semibold text-indigo-200">
                  {stockName}{" "}
                  <span className="text-sm text-gray-400">• {country}</span>
                </div>
                <div className="text-xs text-gray-300">
                  Qty: {s.quantity ?? "-"}
                </div>
              </div>
              <div>
  <button
    onClick={() => toggle(s)}
    className="relative inline-flex items-center justify-center p-0.5 rounded-lg group bg-gradient-to-br from-purple-600 to-blue-500 hover:from-purple-700 hover:to-blue-600 text-neutral-200 text-sm transition"
  >
    <span className="relative px-4 py-1.5 bg-black/70 rounded-md">
      {entry.expanded ? "Collapse ▲" : "Show news ▼"}
    </span>
  </button>
</div>

            </div>

            {entry.expanded && (
              <div className="mt-3 space-y-3">
                {entry.loading && (
                  <div className="text-sm text-neutral-300">
                    <LoadingSpinner className="inline-block mr-2" /> Loading news...
                  </div>
                )}
                {entry.error && (
                  <div className="text-sm text-red-400">{entry.error}</div>
                )}
                {!entry.loading &&
                  !entry.error &&
                  (!entry.news || entry.news.length === 0) && (
                    <div className="text-sm text-neutral-400">
                      No recent top news.
                    </div>
                  )}
                {!entry.loading &&
                  entry.news &&
                  entry.news.length > 0 && (
                    <div className="grid grid-cols-1 gap-4">
                      {entry.news.map((a) => (
                        <NewsCard
                          key={a._id || a.url}
                          article={a}
                          onOpen={handleCardOpen}
                          onUpdated={updateArticleInState}
                          onShowResult={handleShowResult}
                        />
                      ))}
                    </div>
                  )}
              </div>
            )}
          </div>
        );
      })}

      {selected && (
        <ArticleModal article={selected} onClose={() => setSelected(null)} />
      )}

      {viewer.visible && (
        <SummaryViewer
          visible={viewer.visible}
          type={viewer.type}
          data={viewer.data}
          title={viewer.title}
          onClose={handleCloseViewer}
        />
      )}
    </div>
  );
}
