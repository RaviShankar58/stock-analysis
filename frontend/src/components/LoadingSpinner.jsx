import React from "react";

export default function LoadingSpinner({ size = 8, className = "" }) {
  const dimension = 18 + size * 2;

  return (
    <div
      role="status"
      className={`
        inline-block animate-spin rounded-full 
        bg-gradient-to-br from-purple-600 to-blue-500
        p-0.5
        ${className}
      `}
      style={{
        width: dimension,
        height: dimension,
      }}
    >
      <div
        className="rounded-full border-2 border-slate-900 border-t-indigo-400"
        style={{
          width: dimension - 6,
          height: dimension - 6,
        }}
      >
        <span className="sr-only">Loading...</span>
      </div>
    </div>
  );
}
