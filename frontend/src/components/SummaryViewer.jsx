import React from "react";

export default function SummaryViewer({ visible, type, data = {}, title = "", onClose }) {
  if (!visible) return null;

  // Renders the summary content
  const renderSummary = () => (
    <div>
      <h3 className="text-lg font-semibold mb-2 text-white">Summary</h3>
      <div className="text-sm text-gray-300 whitespace-pre-wrap">
        {data.summary || "No summary available."}
      </div>

      {Array.isArray(data.key_facts) && data.key_facts.length > 0 && (
        <div className="mt-4">
          <h4 className="font-medium text-white">Key facts</h4>
          <ul className="list-disc list-inside mt-2 text-sm text-gray-300">
            {data.key_facts.map((fact, index) => (
              <li key={index}>{fact}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );

  // Renders the analysis content
  const renderAnalysis = () => (
    <div>
      <h3 className="text-lg font-semibold mb-2 text-white">Analysis</h3>

      {data.impact_label ? (
        <div className="mb-3">
          <span
            className={`px-2 py-1 rounded text-xs font-semibold ${
              data.impact_label === "positive"
                ? "bg-green-800 text-green-200"
                : data.impact_label === "negative"
                ? "bg-red-800 text-red-200"
                : "bg-gray-700 text-gray-300"
            }`}
          >
            {String(data.impact_label).toUpperCase()}
          </span>
          <div className="text-xs text-gray-400 mt-1">
            {data.impact_confidence != null
              ? `Confidence: ${Number(data.impact_confidence).toFixed(0)}%`
              : ""}
          </div>
        </div>
      ) : null}

      {data.rationale && (
        <div className="text-sm text-gray-300 whitespace-pre-wrap">
          <h4 className="font-medium mb-1 text-white">Rationale</h4>
          <div>{data.rationale}</div>
        </div>
      )}

      {data.action && (
        <div className="mt-3 text-sm text-gray-300">
          <h4 className="font-medium mb-1 text-white">Suggested action</h4>
          <div>{data.action}</div>
        </div>
      )}
    </div>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-70 p-4">
      <div className="bg-gray-900 rounded-xl w-full max-w-3xl p-6 shadow-lg overflow-auto max-h-[85vh] relative border border-gray-700">
        {/* Close icon button */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-gray-400 hover:text-gray-200 transition"
          aria-label="Close"
        >
          ✕
        </button>

        {/* Optional title */}
        <div className="mb-2 text-sm text-gray-400">{title}</div>

        {/* Conditionally render summary or analysis */}
        <div className="mt-2">
          {type === "summary" && renderSummary()}
          {type === "analysis" && renderAnalysis()}
        </div>

        {/* Footer close button */}
        <div className="mt-6 flex justify-end">
          <button
            onClick={onClose}
            className="px-3 py-1 rounded bg-gray-700 hover:bg-gray-600 text-sm text-gray-200 transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
