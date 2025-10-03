import React from "react";

export default function SummaryViewer({ visible, type, data = {}, title = "", onClose }) {
  if (!visible) return null;

  const renderSummary = () => (
    <div>
      <h3 className="text-lg font-semibold mb-2">Summary</h3>
      <div className="text-sm text-gray-800 whitespace-pre-wrap">{data.summary || "No summary available."}</div>

      {Array.isArray(data.key_facts) && data.key_facts.length > 0 && (
        <div className="mt-4">
          <h4 className="font-medium">Key facts</h4>
          <ul className="list-disc list-inside mt-2 text-sm">
            {data.key_facts.map((f, i) => <li key={i}>{f}</li>)}
          </ul>
        </div>
      )}
    </div>
  );

  const renderAnalysis = () => (
    <div>
      <h3 className="text-lg font-semibold mb-2">Analysis</h3>

      {data.impact_label ? (
        <div className="mb-3">
          <span className={`px-2 py-1 rounded text-xs font-semibold ${data.impact_label === "positive" ? "bg-green-100 text-green-800" : data.impact_label === "negative" ? "bg-red-100 text-red-800" : "bg-gray-100 text-gray-700"}`}>
            {String(data.impact_label).toUpperCase()}
          </span>
          <div className="text-xs text-gray-500 mt-1">
            {data.impact_confidence != null ? `Confidence: ${(Number(data.impact_confidence)).toFixed(0)}%` : ""}
          </div>
        </div>
      ) : null}

      {data.rationale && (
        <div className="text-sm text-gray-800 whitespace-pre-wrap">
          <h4 className="font-medium mb-1">Rationale</h4>
          <div>{data.rationale}</div>
        </div>
      )}

      {data.action && (
        <div className="mt-3 text-sm">
          <h4 className="font-medium mb-1">Suggested action</h4>
          <div>{data.action}</div>
        </div>
      )}
    </div>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40 p-4">
      <div className="bg-white rounded-xl w-full max-w-3xl p-6 shadow-lg overflow-auto max-h-[85vh] relative">
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-gray-600 hover:text-gray-900"
          aria-label="Close"
        >
          ✕
        </button>

        <div className="mb-2 text-sm text-gray-500">{title}</div>

        <div className="mt-2">
          {type === "summary" && renderSummary()}
          {type === "analysis" && renderAnalysis()}
        </div>

        <div className="mt-6 flex justify-end">
          <button onClick={onClose} className="px-3 py-1 rounded bg-gray-100 hover:bg-gray-200 text-sm">Close</button>
        </div>
      </div>
    </div>
  );
}
