import React from "react";

export default function LoadingSpinner({ size = 8, className = "" }) {
  const px = `${size}h-${size}`; // not used - keep tailwind simple
  return (
    <div className={`inline-block animate-spin border-2 border-gray-200 rounded-full ${className}`} style={{ width: 18 + size * 2, height: 18 + size * 2, borderTopColor: "rgba(99,102,241,1)" }} />
  );
}
