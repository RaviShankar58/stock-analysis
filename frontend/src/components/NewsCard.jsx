import React, { useState } from "react";
import API from "../api/axios";
import LoadingSpinner from "./LoadingSpinner";
import { toast } from "react-hot-toast";

export default function NewsCard({
  article,
  onOpen,
  compact = false,
  onUpdated,
  onShowResult,
}) {
  const [running, setRunning] = useState({ summarize: false, analyze: false });

  const doSummarize = async () => {
    if (!article?._id) return toast.error("No article id to summarize");
    setRunning((r) => ({ ...r, summarize: true }));
    const loadingId = toast.loading("Summarizing...");
    try {
      const res = await API.post(
        `/user/news/${encodeURIComponent(article._id)}/summerize`,
        {},
        { timeout: 120000 }
      );

      const updated = res?.data?.article ?? res?.data ?? null;
      if (updated) onUpdated && onUpdated(updated);
      onShowResult && onShowResult("summary", res?.data ?? updated ?? {}, article);

      toast.dismiss(loadingId);
      toast.success("Summary ready");
    } catch (err) {
      console.error("summarize error", err);
      toast.dismiss(loadingId);
      const msg =
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        "Summarize failed";
      toast.error(msg);
    } finally {
      setRunning((r) => ({ ...r, summarize: false }));
    }
  };

  const doAnalyze = async () => {
    if (!article?._id) return toast.error("No article id to analyze");
    setRunning((r) => ({ ...r, analyze: true }));
    const loadingId = toast.loading("Analyzing...");
    try {
      const res = await API.post(
        `/user/news/${encodeURIComponent(article._id)}/analyze`,
        {},
        { timeout: 120000 }
      );

      const updated = res?.data?.article ?? res?.data ?? null;
      if (updated) onUpdated && onUpdated(updated);
      onShowResult && onShowResult("analysis", res?.data ?? updated ?? {}, article);

      toast.dismiss(loadingId);
      toast.success("Analysis ready");
    } catch (err) {
      console.error("analyze error", err);
      toast.dismiss(loadingId);
      const msg =
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        "Analyze failed";
      toast.error(msg);
    } finally {
      setRunning((r) => ({ ...r, analyze: false }));
    }
  };

  const title = article?.title || "Untitled";
  const source = article?.provider || article?.source || "unknown";
  const published = article?.publishedAt
    ? new Date(article.publishedAt).toLocaleString()
    : "";

  // Compact version: smaller, inline, dark-themed
  if (compact) {
    return (
      <div
        className="flex items-center justify-between p-2 rounded cursor-pointer bg-white/5 hover:bg-white/10 transition"
        onClick={() => onOpen && onOpen(article)}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") onOpen && onOpen(article);
        }}
      >
        <div className="min-w-0 pr-3 text-neutral-200">
          <div className="text-sm font-medium truncate">{title}</div>
          <div className="text-xs text-gray-400">
            {source} • {published}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            disabled={running.summarize}
            onClick={(e) => {
              e.stopPropagation();
              doSummarize();
            }}
            className="text-xs px-2 py-1 bg-indigo-600/20 text-indigo-300 hover:bg-indigo-600/30 rounded transition"
          >
            {running.summarize ? <LoadingSpinner size={3} /> : "Summarize"}
          </button>
          <button
            disabled={running.analyze}
            onClick={(e) => {
              e.stopPropagation();
              doAnalyze();
            }}
            className="text-xs px-2 py-1 bg-green-600/20 text-green-300 hover:bg-green-600/30 rounded transition"
          >
            {running.analyze ? <LoadingSpinner size={3} /> : "Analyze"}
          </button>
        </div>
      </div>
    );
  }

  // Full version: card with summary preview
  return (
    <div className="rounded-lg p-4 bg-white/5 backdrop-blur-sm hover:bg-white/10 transition shadow-sm text-neutral-200">
      <div className="flex items-start justify-between">
        <div
          className="pr-3 min-w-0 cursor-pointer"
          onClick={() => onOpen && onOpen(article)}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") onOpen && onOpen(article);
          }}
        >
          <div className="font-medium text-indigo-200 truncate">{title}</div>
          <div className="text-xs text-gray-400 mt-1">
            {source} • {published}
          </div>
          {article?.summary && (
            <div className="text-sm text-gray-300 mt-2 line-clamp-3">
              {article.summary}
            </div>
          )}
        </div>

        <div className="flex flex-col items-end gap-2">
          <a
            href={article?.url || "#"}
            onClick={(e) => {
              if (!article?.url) e.preventDefault();
            }}
            target="_blank"
            rel="noreferrer"
            className="text-xs text-blue-400 hover:underline"
          >
            Open News
          </a>

          <div className="flex gap-2 py-2">
            <button
              onClick={doSummarize}
              disabled={running.summarize}
              className="px-3 py-1 rounded bg-indigo-600 text-white text-sm hover:bg-indigo-500 transition"
            >
              {running.summarize ? "Running..." : "Summarize"}
            </button>
            <button
              onClick={doAnalyze}
              disabled={running.analyze}
              className="px-3 py-1 rounded bg-green-600 text-white text-sm hover:bg-green-500 transition"
            >
              {running.analyze ? "Running..." : "Analyze"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
