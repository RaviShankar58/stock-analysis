import React from "react";

function formatDate(iso) {
  if (!iso) return "";
  try {
    return new Date(iso).toLocaleString();
  } catch {
    return iso;
  }
}

export default function ArticleModal({ article, onClose }) {
  if (!article) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40 p-4">
      <div className="bg-slate-900 text-gray-100 rounded-xl w-full max-w-3xl p-6 shadow-lg overflow-auto max-h-[80vh]">
        <div className="flex justify-between items-start">
          <div className="max-w-[75%]">
            {article.stockName && (
              <div className="text-xs text-indigo-400 font-medium mb-1">
                {article.stockName}
              </div>
            )}
            <h3 className="text-lg font-semibold leading-tight">{article.title}</h3>

            <div className="text-xs text-gray-400 mt-1">
              {(article.provider || article.source) && (
                <span className="mr-2 px-2 py-0.5 rounded bg-slate-700 text-gray-200 text-xs">
                  {article.provider || article.source}
                </span>
              )}
              {formatDate(article.publishedAt)}
            </div>
          </div>

          <button
  onClick={onClose}
  className="relative inline-flex items-center justify-center p-0.5 overflow-hidden text-xs font-medium text-neutral-200 rounded-lg group bg-gradient-to-br from-purple-600 to-blue-500 hover:from-purple-700 hover:to-blue-600 transition"
>
  <span className="relative text-xs px-4 py-1.5 transition-all ease-in duration-75 bg-black/70 rounded-md">
    ✕
  </span>
</button>

        </div>

        <div className="mt-4 text-sm text-gray-200">
          {article.summary ? (
            <div>
              <p className="mb-3">{article.summary}</p>
              {Array.isArray(article.key_facts) && article.key_facts.length > 0 && (
                <div className="mb-3">
                  <h4 className="font-medium text-gray-100">Key facts</h4>
                  <ul className="list-disc list-inside text-sm mt-1 text-gray-300">
                    {article.key_facts.map((f, i) => (
                      <li key={i}>{f}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ) : article.raw_text ? (
            <p className="mb-3">{article.raw_text}</p>
          ) : (
            <p className="mb-3 text-gray-500">No summary available yet for this article.</p>
          )}

          {Array.isArray(article.entities) && article.entities.length > 0 && (
            <div className="mb-3">
              <h4 className="text-sm font-medium text-gray-100">Entities</h4>
              <div className="flex flex-wrap gap-2 mt-2">
                {article.entities.map((e, i) => (
                  <span
                    key={i}
                    className="text-xs px-2 py-1 bg-slate-700 text-gray-200 rounded"
                  >
                    {e}
                  </span>
                ))}
              </div>
            </div>
          )}

          {article.impact_label ? (
            <div className="mt-2">
              <span
                className={`px-2 py-1 rounded text-xs font-semibold ${
                  article.impact_label === "positive"
                    ? "bg-green-700 text-green-100"
                    : article.impact_label === "negative"
                    ? "bg-red-700 text-red-100"
                    : "bg-slate-700 text-gray-200"
                }`}
              >
                {article.impact_label.toUpperCase()}
              </span>
              <div className="text-xs text-gray-400 mt-2">
                {article.impact_confidence
                  ? `Confidence: ${(Number(article.impact_confidence) * 100).toFixed(0)}%`
                  : ""}
              </div>
              {article.rationale && (
                <div className="mt-2 text-sm text-gray-300">{article.rationale}</div>
              )}
            </div>
          ) : (
            <div className="mt-2 text-xs text-gray-500">
              Impact prediction not available yet.
            </div>
          )}
        </div>

        <div className="mt-6 flex items-center justify-between">
          {article.url ? (
            <a
              href={article.url}
              target="_blank"
              rel="noreferrer"
              className="text-sm text-indigo-400 hover:underline"
            >
              Open original article
            </a>
          ) : (
            <span className="text-sm text-gray-500">Original article URL not available</span>
          )}

          <div>
            <button
  onClick={onClose}
  className="relative inline-flex items-center justify-center p-0.5 overflow-hidden text-sm font-medium text-neutral-200 rounded-lg group bg-gradient-to-br from-purple-600 to-blue-500 hover:from-purple-700 hover:to-blue-600 transition"
>
  <span className="relative text-sm px-5 py-2 transition-all ease-in duration-75 bg-black/70 rounded-md">
    Close
  </span>
</button>

          </div>
        </div>
      </div>
    </div>
  );
}
